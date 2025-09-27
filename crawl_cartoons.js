const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

// Simple CLI: node crawl_cartoons.js [startUrl] [outFile] [maxPages] [delayMs]
const args = process.argv.slice(2);
const START_URL = args[0] || 'https://watchanimeworld.in/category/cartoon/';
const OUT_FILE = args[1] || path.join(__dirname, 'data', 'cartoons.json');
const MAX_PAGES = parseInt(args[2], 10) || 200;
const DELAY_MS = parseInt(args[3], 10) || 500;

async function fetchHtml(url) {
    const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 15000 });
    return res.data;
}

function extractTitlesFromHtml(html) {
    const $ = cheerio.load(html);
    const titles = [];

    // Common patterns across themes
    const selectors = [
        'article h2.entry-title a',
        'article h2.entry-title',
        'article h3.entry-title a',
        '.post-title a',
        '.entry-title a',
        '.card-body .card-title a',
        '.post .title a',
        '.title a',
        '.post .entry-title a'
    ];

    selectors.forEach(sel => {
        $(sel).each((i, el) => {
            const text = $(el).text().trim();
            if (text) titles.push(text);
        });
    });

    // Fallback: any article title text
    $('article').each((i, el) => {
        const t = $(el).find('h1, h2, h3').first().text().trim();
        if (t) titles.push(t);
    });

    // Normalize and filter
    return titles.map(t => t.replace(/\s+/g, ' ').trim()).filter(Boolean);
}

function ensureDir(filePath) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function crawl(startUrl, outFile, maxPages = 200, delayMs = 500) {
    console.log(`Starting crawl from: ${startUrl}`);
    ensureDir(outFile);

    const seen = new Set();
    const results = [];
    const visited = new Set();

    let page = 1;
    let url = startUrl;
    let consecutiveEmpty = 0;

    while (url && page <= maxPages) {
        if (visited.has(url)) break;
        visited.add(url);

        console.log(`Crawling page ${page}: ${url}`);
        try {
            const html = await fetchHtml(url);
            const titles = extractTitlesFromHtml(html);

            let newThisPage = 0;
            for (const t of titles) {
                if (!seen.has(t)) {
                    seen.add(t);
                    results.push(t);
                    newThisPage++;
                }
            }

            console.log(`  found ${titles.length} titles, ${newThisPage} new, total ${results.length}`);

            if (newThisPage === 0) consecutiveEmpty++; else consecutiveEmpty = 0;
            if (consecutiveEmpty >= 3) {
                console.log('No new items for 3 consecutive pages — stopping.');
                break;
            }

            // find next link
            const $ = cheerio.load(html);
            let next = $('a.next, a[rel="next"]').attr('href') || $('a:contains("Next")').attr('href');
            if (next && !next.startsWith('http')) {
                try { next = new URL(next, url).href; } catch (e) { next = null; }
            }

            if (!next) {
                // build page/X candidate
                page += 1;
                if (/page\/[0-9]+\/?$/.test(startUrl)) {
                    url = startUrl.replace(/page\/[0-9]+\/?$/, `page/${page}/`);
                } else {
                    url = startUrl.endsWith('/') ? `${startUrl}page/${page}/` : `${startUrl}/page/${page}/`;
                }
            } else {
                url = next;
                page += 1;
            }

            // polite delay
            await new Promise(r => setTimeout(r, delayMs));
        } catch (err) {
            console.error('Request failed:', err.message);
            break;
        }
    }

    // save
    try {
        const payload = { total: results.length, items: results };
        fs.writeFileSync(outFile, JSON.stringify(payload, null, 2), 'utf8');
        console.log(`Saved ${results.length} cartoons to ${outFile}`);
    } catch (e) {
        console.error('Save failed:', e.message);
    }

    return results;
}

if (require.main === module) {
    (async () => {
        try {
            await crawl(START_URL, OUT_FILE, MAX_PAGES, DELAY_MS);
            console.log('Crawl finished.');
        } catch (e) {
            console.error('Crawl error:', e);
            process.exit(1);
        }
    })();
}

module.exports = { crawl };
