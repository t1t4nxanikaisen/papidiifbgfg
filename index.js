const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const app = express();

// Root docs endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Anime API Endpoints',
    version: '1.0',
    status: 'active',
    endpoints: [
      {
        name: 'AniList TV Episode',
        method: 'GET',
        url: '/anime/api/{anilist}/{season}/{episode}',
        example: '/api/anime/20/1/21',
        description: 'Get specific TV episode from AniList',
        parameters: { anilist: 'AniList ID', season: 'Season number', episode: 'Episode number' }
      },
      {
        name: 'Random Anime',
        method: 'GET',
        url: '/api/anime/random',
        example: '/api/anime/random',
        description: 'Returns a random anime entry (anilistId, slug, title) for testing'
      },
      {
        name: 'Cartoons',
        method: 'GET',
        url: '/cartoons',
        example: '/cartoons',
        description: 'List cartoons with assigned custom IDs (after merge)'
      }
    ]
  });
});

// ensure data directory
const DATA_DIR = path.join(__dirname, 'data');
try { if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR); } catch(e) {}
const CARTOON_FILE = path.join(DATA_DIR, 'cartoons.json');

// Anime database with Anilist mappings
const animeDatabase = [
  { slug: "ghost-in-the-shell-arise", anilistId: 15887, normalizedTitle: "ghost-in-the-shell-arise" },
  // ... (your existing anime database remains the same)
];

// Persistence file for the merged anime DB
const ANIME_DB_FILE = path.join(DATA_DIR, 'anime_db.json');

function loadJsonSafe(filePath, fallback = null) {
  try { return JSON.parse(fs.readFileSync(filePath, 'utf8')); } catch (e) { return fallback; }
}

function saveJsonSafe(filePath, data) {
  try { fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8'); return true; } catch (e) { console.error('save error', e.message); return false; }
}

// HTML error templates with gradient text
const errorHtmlTemplate = (title, message, type) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        .error-container {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 40px;
            text-align: center;
            max-width: 500px;
            width: 100%;
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        }
        
        .error-icon {
            font-size: 4rem;
            margin-bottom: 20px;
        }
        
        .error-title {
            background: linear-gradient(45deg, #ff6b6b, #ffa726, #ff6b6b);
            background-size: 200% 200%;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 15px;
            animation: gradientShift 3s ease infinite;
        }
        
        .error-message {
            color: #b0b0b0;
            font-size: 1.1rem;
            line-height: 1.6;
            margin-bottom: 30px;
        }
        
        .error-details {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            padding: 15px;
            margin: 20px 0;
            border-left: 4px solid #ff6b6b;
        }
        
        .suggestion {
            color: #888;
            font-size: 0.9rem;
            margin-top: 10px;
        }
        
        .home-button {
            background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 12px 30px;
            border-radius: 25px;
            font-size: 1rem;
            cursor: pointer;
            transition: transform 0.3s ease;
            text-decoration: none;
            display: inline-block;
        }
        
        .home-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
        }
        
        @keyframes gradientShift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
        
        .pulse {
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }
    </style>
</head>
<body>
    <div class="error-container">
        <div class="error-icon pulse">${type === 'anime' ? '🎬' : '📺'}</div>
        <h1 class="error-title">${title}</h1>
        <p class="error-message">${message}</p>
        
        ${type === 'anime' ? `
        <div class="error-details">
            <strong>Possible reasons:</strong>
            <ul style="text-align: left; margin: 10px 0; padding-left: 20px;">
                <li>The anime might not be available in our database yet</li>
                <li>There might be a spelling error in the anime title</li>
                <li>The anime might be under maintenance</li>
            </ul>
        </div>
        <p class="suggestion">Try checking the spelling or browse our available anime collection.</p>
        ` : `
        <div class="error-details">
            <strong>Possible reasons:</strong>
            <ul style="text-align: left; margin: 10px 0; padding-left: 20px;">
                <li>The episode might not have been released yet</li>
                <li>There might be a temporary server issue</li>
                <li>The episode number might be incorrect</li>
            </ul>
        </div>
        <p class="suggestion">Try checking the episode number or wait for the release.</p>
        `}
        
        <a href="/" class="home-button">Back to Home</a>
    </div>
</body>
</html>
`;

// Function to fetch from toonstream.love
async function fetchFromToonstream(animeSlug, season, episodeNum) {
    try {
        // Construct URL for toonstream.love
        const url = `https://toonstream.love/anime/${animeSlug}/season-${season}/episode-${episodeNum}`;
        
        console.log('Fetching from Toonstream:', url);
        
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Referer': 'https://toonstream.love/',
            },
            timeout: 10000
        });

        const $ = cheerio.load(response.data);
        
        // Extract video sources from toonstream.love
        const videoSources = [];
        
        // Look for direct video elements
        $('video source').each((i, el) => {
            const src = $(el).attr('src');
            const type = $(el).attr('type');
            if (src) {
                videoSources.push({
                    quality: $(el).attr('data-quality') || 'auto',
                    url: src.startsWith('http') ? src : new URL(src, url).href,
                    type: type || 'video/mp4'
                });
            }
        });

        // Look for iframe embeds
        const iframeSources = [];
        $('iframe').each((i, el) => {
            const src = $(el).attr('src');
            if (src) {
                iframeSources.push({
                    name: `Toonstream Server ${i + 1}`,
                    iframe_url: src,
                    type: 'embed'
                });
            }
        });

        // Extract from scripts
        $('script').each((i, el) => {
            const scriptContent = $(el).html();
            if (scriptContent) {
                // Look for video URLs in scripts
                const videoRegex = /(https?:\/\/[^\s"']+\.(mp4|m3u8|webm)[^\s"']*)/gi;
                const matches = scriptContent.match(videoRegex);
                if (matches) {
                    matches.forEach(match => {
                        videoSources.push({
                            quality: 'auto',
                            url: match,
                            type: match.includes('.m3u8') ? 'hls' : 'direct'
                        });
                    });
                }
            }
        });

        return {
            success: true,
            sources: {
                direct: videoSources,
                embeds: iframeSources,
                primary_url: videoSources[0]?.url || iframeSources[0]?.iframe_url
            },
            source: 'toonstream'
        };
    } catch (error) {
        console.error('Toonstream fetch error:', error.message);
        return {
            success: false,
            error: error.message,
            source: 'toonstream'
        };
    }
}

// Function to fetch from animeworld (your existing source)
async function fetchFromAnimeWorld(animeSlug, season, episodeNum) {
    try {
        const url = `https://watchanimeworld.in/episode/${animeSlug}-${season}x${episodeNum}/`;

        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Referer': 'https://watchanimeworld.in/',
            },
            timeout: 10000
        });

        const $ = cheerio.load(response.data);

        // Extract episode details
        const title = $('h1.entry-title').first().text().trim() || `Episode ${episodeNum}`;
        const description = $('div.entry-content p').first().text().trim() || '';
        const thumbnail = $('div.post-thumbnail img').attr('src') || '';

        // Extract embed servers
        const embedServers = [];
        const iframePromises = [];

        $('iframe').each((i, el) => {
            const src = $(el).attr('src');
            if (src) {
                iframePromises.push(
                    extractVideoUrls(src).then(videoSources => {
                        embedServers.push({
                            name: `Server ${i + 1}`,
                            iframe_url: src,
                            video_sources: videoSources,
                            type: detectServerType(src)
                        });
                    })
                );
            }
        });

        await Promise.all(iframePromises);

        // Alternative: check for direct video sources
        if (embedServers.length === 0) {
            $('script').each((i, el) => {
                const scriptContent = $(el).html();
                if (scriptContent) {
                    const mp4Matches = scriptContent.match(/(https?:\/\/[^\s"']+\.mp4[^\s"']*)/gi);
                    if (mp4Matches) {
                        mp4Matches.forEach((url, index) => {
                            embedServers.push({
                                name: `Direct MP4 ${index + 1}`,
                                iframe_url: url,
                                video_sources: [{ quality: 'direct', url }],
                                type: 'direct'
                            });
                        });
                    }
                }
            });
        }

        return {
            success: embedServers.length > 0,
            data: {
                title,
                description,
                thumbnail,
                servers: embedServers,
                primary_url: embedServers[0]?.iframe_url || (embedServers[0]?.video_sources && embedServers[0]?.video_sources[0]?.url)
            },
            source: 'animeworld'
        };
    } catch (error) {
        console.error('AnimeWorld fetch error:', error.message);
        return {
            success: false,
            error: error.message,
            source: 'animeworld'
        };
    }
}

// Main anime endpoint with multiple sources
app.get('/api/anime/:anilistId/:season/:episodeNum', async (req, res) => {
    const { anilistId, season, episodeNum } = req.params;
    const wantJson = req.query.json === '1' || (req.headers.accept && req.headers.accept.includes('application/json'));

    try {
        // Find anime by Anilist ID
        const anime = findAnimeByAnilistId(anilistId);
        
        if (!anime) {
            if (wantJson) {
                return res.status(404).json({ 
                    error: 'Anime not found in database',
                    message: 'The requested anime is not available in our database'
                });
            }
            return res.send(errorHtmlTemplate(
                'Anime Not Found',
                'The anime you are looking for is not available in our database.',
                'anime'
            ));
        }

        const animeSlug = anime.slug;

        // Try multiple sources in sequence
        const sources = [
            () => fetchFromAnimeWorld(animeSlug, season, episodeNum),
            () => fetchFromToonstream(animeSlug, season, episodeNum)
        ];

        let result = null;
        let successfulSource = null;

        for (const sourceFetch of sources) {
            try {
                const sourceResult = await sourceFetch();
                if (sourceResult.success) {
                    result = sourceResult;
                    successfulSource = sourceResult.source;
                    console.log(`✅ Successfully fetched from ${successfulSource}`);
                    break;
                }
            } catch (error) {
                console.log(`❌ Failed from ${sourceFetch.name || 'source'}:`, error.message);
                continue;
            }
        }

        if (!result || !result.success) {
            if (wantJson) {
                return res.status(404).json({ 
                    error: 'Episode not found',
                    message: 'The requested episode might not be available yet'
                });
            }
            return res.send(errorHtmlTemplate(
                'Episode Not Available',
                'This episode is not available in our database yet.',
                'episode'
            ));
        }

        // Construct response payload
        const payload = {
            anilist_id: parseInt(anilistId),
            anime_slug: animeSlug,
            title: anime.normalizedTitle,
            season: parseInt(season),
            episode: parseInt(episodeNum),
            source: successfulSource,
            ...result.data
        };

        // Return HTML iframe or JSON based on request
        if (!wantJson && payload.primary_url) {
            const html = `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${anime.normalizedTitle} - S${season}E${episodeNum}</title>
<style>html,body{height:100%;margin:0;background:#000}iframe{position:fixed;inset:0;border:0;width:100%;height:100%}</style>
</head><body>
<iframe src="${payload.primary_url}" allowfullscreen allow="autoplay; fullscreen"></iframe>
</body></html>`;
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            return res.send(html);
        }

        return res.json(payload);

    } catch (err) {
        console.error('Error fetching episode:', err.message);
        
        if (wantJson) {
            return res.status(500).json({ 
                error: 'Failed to fetch episode details',
                details: err.message 
            });
        }
        
        return res.send(errorHtmlTemplate(
            'Server Error',
            'An unexpected error occurred while fetching the episode.',
            'episode'
        ));
    }
});

// Your existing helper functions remain the same...
function findAnimeByAnilistId(anilistId) {
    return animeDatabase.find(anime => anime.anilistId === parseInt(anilistId));
}

function findAnimeBySlug(slug) {
    return animeDatabase.find(anime => anime.slug === slug);
}

// Your existing extractor functions remain the same...
async function extractVideoUrls(iframeUrl) {
    try {
        console.log('Extracting from:', iframeUrl);
        
        if (iframeUrl.includes('streamtape')) {
            return await extractStreamtape(iframeUrl);
        } else if (iframeUrl.includes('dood')) {
            return await extractDoodstream(iframeUrl);
        } else if (iframeUrl.includes('filemoon') || iframeUrl.includes('moon')) {
            return await extractFilemoon(iframeUrl);
        } else if (iframeUrl.includes('mp4upload')) {
            return await extractMp4Upload(iframeUrl);
        } else if (iframeUrl.includes('vidstream')) {
            return await extractVidstream(iframeUrl);
        } else {
            const response = await axios.get(iframeUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Referer': 'https://watchanimeworld.in/',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
                }
            });
            
            const $ = cheerio.load(response.data);
            const videoSources = [];
            
            $('source').each((i, el) => {
                const src = $(el).attr('src');
                if (src && (src.includes('.mp4') || src.includes('.m3u8'))) {
                    videoSources.push({
                        quality: $(el).attr('size') || 'unknown',
                        url: src.startsWith('http') ? src : new URL(src, iframeUrl).href
                    });
                }
            });
            
            $('script').each((i, el) => {
                const scriptContent = $(el).html();
                if (scriptContent) {
                    const mp4Matches = scriptContent.match(/(https?:\/\/[^\s"']+\.mp4[^\s"']*)/gi);
                    if (mp4Matches) {
                        mp4Matches.forEach(url => {
                            videoSources.push({ quality: 'auto', url });
                        });
                    }
                    
                    const m3u8Matches = scriptContent.match(/(https?:\/\/[^\s"']+\.m3u8[^\s"']*)/gi);
                    if (m3u8Matches) {
                        m3u8Matches.forEach(url => {
                            videoSources.push({ quality: 'hls', url });
                        });
                    }
                    
                    if (scriptContent.includes('file:')) {
                        const fileMatch = scriptContent.match(/file:\s*["']([^"']+)["']/);
                        if (fileMatch) {
                            videoSources.push({ quality: 'jwplayer', url: fileMatch[1] });
                        }
                    }
                }
            });
            
            return videoSources.length > 0 ? videoSources : [{ quality: 'direct', url: iframeUrl }];
        }
    } catch (error) {
        console.error('Error extracting video URLs:', error.message);
        return [{ quality: 'fallback', url: iframeUrl }];
    }
}

// Your existing platform-specific extractors remain the same...
async function extractStreamtape(url) {
    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': 'https://watchanimeworld.in/'
            }
        });
        
        const $ = cheerio.load(response.data);
        const scriptContent = $('script:contains("ideoo")').html();
        
        if (scriptContent) {
            const match = scriptContent.match(/document\.getElementById\(['"]?ideoo['"]?\)\.innerHTML\s*=\s*['"]([^'"]+)['"]/);
            if (match) {
                const encodedUrl = match[1].replace(/\\/g, '');
                const videoUrl = `https:${encodedUrl}`;
                return [{ quality: 'streamtape', url: videoUrl }];
            }
        }
    } catch (error) {
        console.error('Streamtape extraction error:', error);
    }
    return [{ quality: 'streamtape', url }];
}

async function extractDoodstream(url) {
    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': 'https://watchanimeworld.in/'
            }
        });
        
        const $ = cheerio.load(response.data);
        const scriptContent = $('script:contains("pass_md5")').html();
        
        if (scriptContent) {
            const passMd5Match = scriptContent.match(/pass_md5\s*=\s*['"]([^'"]+)['"]/);
            const tokenMatch = scriptContent.match(/\?token=([^'"]+)/);
            
            if (passMd5Match && tokenMatch) {
                const videoUrl = `https://dood.pm/e/${passMd5Match[1]}${tokenMatch[0]}`;
                return [{ quality: 'doodstream', url: videoUrl }];
            }
        }
    } catch (error) {
        console.error('Doodstream extraction error:', error);
    }
    return [{ quality: 'doodstream', url }];
}

async function extractFilemoon(url) {
    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': 'https://watchanimeworld.in/'
            }
        });
        
        const $ = cheerio.load(response.data);
        const scriptContent = $('script:contains("sources")').html();
        
        if (scriptContent) {
            const sourceMatch = scriptContent.match(/sources:\s*\[{\s*file:\s*['"]([^'"]+)['"]/);
            if (sourceMatch) {
                return [{ quality: 'filemoon', url: sourceMatch[1] }];
            }
        }
    } catch (error) {
        console.error('Filemoon extraction error:', error);
    }
    return [{ quality: 'filemoon', url }];
}

async function extractMp4Upload(url) {
    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': 'https://watchanimeworld.in/'
            }
        });
        
        const $ = cheerio.load(response.data);
        const scriptContent = $('script:contains("src")').html();
        
        if (scriptContent) {
            const srcMatch = scriptContent.match(/src:\s*['"]([^'"]+)['"]/);
            if (srcMatch) {
                return [{ quality: 'mp4upload', url: srcMatch[1] }];
            }
        }
    } catch (error) {
        console.error('Mp4Upload extraction error:', error);
    }
    return [{ quality: 'mp4upload', url }];
}

async function extractVidstream(url) {
    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': 'https://watchanimeworld.in/'
            }
        });
        
        const $ = cheerio.load(response.data);
        const scriptContent = $('script:contains("sources")').html();
        
        if (scriptContent) {
            const sourcesMatch = scriptContent.match(/sources:\s*\[([^\]]+)\]/);
            if (sourcesMatch) {
                const urlMatch = sourcesMatch[1].match(/file:\s*['"]([^'"]+)['"]/);
                if (urlMatch) {
                    return [{ quality: 'vidstream', url: urlMatch[1] }];
                }
            }
        }
    } catch (error) {
        console.error('Vidstream extraction error:', error);
    }
    return [{ quality: 'vidstream', url }];
}

function detectServerType(url) {
    if (url.includes('streamtape')) return 'streamtape';
    if (url.includes('dood')) return 'doodstream';
    if (url.includes('filemoon')) return 'filemoon';
    if (url.includes('mp4upload')) return 'mp4upload';
    if (url.includes('vidstream')) return 'vidstream';
    if (url.includes('.mp4')) return 'direct';
    if (url.includes('.m3u8')) return 'hls';
    return 'embed';
}

// Your existing endpoints remain the same...
app.get('/api/search', async (req, res) => {
    const { query } = req.query;
    
    if (!query) {
        return res.status(400).json({ error: 'Query parameter is required' });
    }

    try {
        const searchTerm = query.toLowerCase();
        const results = animeDatabase.filter(anime => 
            anime.slug.toLowerCase().includes(searchTerm) ||
            anime.normalizedTitle.toLowerCase().includes(searchTerm)
        ).map(anime => ({
            slug: anime.slug,
            anilistId: anime.anilistId,
            title: anime.normalizedTitle
        }));

        res.json({
            query,
            results,
            total: results.length
        });
    } catch (err) {
        console.error('Search error:', err.message);
        res.status(500).json({ error: 'Search failed' });
    }
});

app.get('/api/extract', async (req, res) => {
    const { url } = req.query;
    
    if (!url) {
        return res.status(400).json({ error: 'URL parameter is required' });
    }

    try {
        const videoSources = await extractVideoUrls(url);
        res.json({
            source_url: url,
            video_sources: videoSources,
            total_sources: videoSources.length
        });
    } catch (err) {
        console.error('Extraction error:', err.message);
        res.status(500).json({ error: 'Failed to extract video URLs' });
    }
});

// Your existing server setup remains the same...
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🔥 Anime API server running on port ${PORT}`);
    console.log(`📺 Total anime in database: ${animeDatabase.length}`);
    console.log(`🚀 Endpoints:`);
    console.log(`   GET /api/anime/:anilistId/:season/:episodeNum`);
    console.log(`   GET /api/extract?url=EMBED_URL`);
    console.log(`   GET /api/search?query=name`);
    console.log(`   GET /health`);
});

app.get('/health', (req, res) => {
  res.json({ ok: true, uptime: process.uptime(), timestamp: Date.now(), animeCount: animeDatabase.length });
});

app.get('/api/anime/random', (req, res) => {
  const persisted = loadJsonSafe(ANIME_DB_FILE, null);
  const source = Array.isArray(persisted) ? persisted : (persisted && persisted.items) ? persisted.items : animeDatabase;
  if (!Array.isArray(source) || source.length === 0) return res.status(500).json({ error: 'no anime available' });

  const candidates = source.filter(item => item && item.anilistId != null);
  if (!Array.isArray(candidates) || candidates.length === 0) return res.status(500).json({ error: 'no anime with anilistId available' });

  const idx = Math.floor(Math.random() * candidates.length);
  const a = candidates[idx];
  res.json({ anilistId: a.anilistId, slug: a.slug, title: a.normalizedTitle || a.slug });
});

app.get('/api/anime/auto/:title/:season/:episode', (req, res) => {
  const raw = req.params.title || '';
  const title = decodeURIComponent(raw).toLowerCase();
  const found = animeDatabase.find(a => ((a.normalizedTitle || '')).toLowerCase() === title || (a.slug || '').toLowerCase() === title);
  if (!found || !found.anilistId) return res.status(404).json({ error: 'not found' });
  return res.redirect(`/api/anime/${found.anilistId}/${req.params.season}/${req.params.episode}`);
});
