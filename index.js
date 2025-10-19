import express from 'express';
import axios from 'axios';
import { load } from 'cheerio';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Fix for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Enhanced anime database
let animeDatabase = {
  20: { slug: "naruto", name: "Naruto", hasAnilistId: true },
  21: { slug: "one-piece", name: "One Piece", hasAnilistId: true },
  16498: { slug: "attack-on-titan", name: "Attack on Titan", hasAnilistId: true },
  113415: { slug: "jujutsu-kaisen", name: "Jujutsu Kaisen", hasAnilistId: true },
  101922: { slug: "demon-slayer", name: "Demon Slayer", hasAnilistId: true },
  127230: { slug: "chainsaw-man", name: "Chainsaw Man", hasAnilistId: true },
  31964: { slug: "my-hero-academia", name: "My Hero Academia", hasAnilistId: true },
  21087: { slug: "one-punch-man", name: "One Punch Man", hasAnilistId: true },
  269: { slug: "bleach", name: "Bleach", hasAnilistId: true },
  1535: { slug: "death-note", name: "Death Note", hasAnilistId: true },
  1735: { slug: "naruto-shippuden", name: "Naruto Shippuden", hasAnilistId: true },
  140960: { slug: "spy-x-family", name: "Spy x Family", hasAnilistId: true },
  11757: { slug: "sword-art-online", name: "Sword Art Online", hasAnilistId: true },
  223: { slug: "dragon-ball", name: "Dragon Ball", hasAnilistId: true },
  20755: { slug: "assassination-classroom", name: "Assassination Classroom", hasAnilistId: true },
  108465: { slug: "mushoku-tensei-jobless-reincarnation", name: "Mushoku Tensei: Jobless Reincarnation", hasAnilistId: true },
  998001: { slug: "ben-10", name: "Ben 10", hasAnilistId: false },
  998101: { slug: "shinchan", name: "Shinchan", hasAnilistId: false },
  998201: { slug: "doraemon", name: "Doraemon", hasAnilistId: false }
};

let randomAnimePool = [20, 21, 113415, 127230, 101922, 16498, 269, 1535, 1735, 140960];

let apiStats = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  lastUpdated: new Date().toISOString()
};

const DB_FILE = path.join(process.env.VERCEL ? '/tmp' : __dirname, 'anime_database.json');

// Load database
async function loadDatabase() {
  try {
    const data = await fs.readFile(DB_FILE, 'utf8');
    const savedData = JSON.parse(data);
    animeDatabase = { ...animeDatabase, ...savedData.animeDatabase };
    randomAnimePool = savedData.randomAnimePool || randomAnimePool;
    apiStats = savedData.apiStats || apiStats;
    console.log(`Loaded ${Object.keys(animeDatabase).length} anime from database`);
  } catch (error) {
    console.log('Using default database');
    await saveDatabase();
  }
}

// Save database
async function saveDatabase() {
  try {
    const dataToSave = {
      animeDatabase,
      randomAnimePool,
      apiStats,
      lastSaved: new Date().toISOString()
    };
    await fs.writeFile(DB_FILE, JSON.stringify(dataToSave, null, 2));
  } catch (error) {
    console.error('Failed to save database');
  }
}

// ==================== CORE FUNCTIONS ====================

/**
 * Simple search function
 */
async function searchAnime(query) {
  try {
    console.log(`Searching for: ${query}`);
    const searchUrl = `https://watchanimeworld.in/?s=${encodeURIComponent(query)}`;
    
    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
      },
      timeout: 5000
    });

    const $ = load(response.data);
    const results = [];

    $('a').each((i, el) => {
      const $el = $(el);
      const href = $el.attr('href');
      const title = $el.text().trim();
      
      if (href && href.includes('/anime/') && title.length > 2) {
        const slugMatch = href.match(/\/(anime|series)\/([^\/]+)/);
        if (slugMatch) {
          results.push({
            title: title,
            slug: slugMatch[2]
          });
        }
      }
    });

    return results;

  } catch (error) {
    console.log(`Search failed: ${error.message}`);
    return [];
  }
}

/**
 * Find best match from search results
 */
function findBestMatch(results, query) {
  if (results.length === 0) return null;
  
  const queryLower = query.toLowerCase();
  let bestMatch = null;
  let bestScore = 0;

  results.forEach(result => {
    let score = 0;
    const titleLower = result.title.toLowerCase();
    
    if (titleLower === queryLower) score = 100;
    else if (titleLower.includes(queryLower)) score = 50;
    else if (queryLower.includes(titleLower)) score = 30;
    
    if (score > bestScore) {
      bestScore = score;
      bestMatch = result;
    }
  });

  return bestMatch;
}

/**
 * Enhanced episode finder
 */
async function findEpisodeEnhanced(slug, season, episode) {
  const baseUrls = [
    'https://watchanimeworld.in',
    'https://animeworld-india.me'
  ];

  const patterns = [
    `episode/${slug}-${season}x${episode}/`,
    `episode/${slug}-s${season}e${episode}/`,
    `episode/${slug}-episode-${episode}/`,
    `series/${slug}/season-${season}/episode-${episode}/`,
    `anime/${slug}/episode-${episode}/`
  ];

  for (const baseUrl of baseUrls) {
    for (const pattern of patterns) {
      const url = `${baseUrl}/${pattern}`;
      
      try {
        const response = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
          },
          timeout: 5000
        });

        if (response.status === 200 && !response.data.includes('404')) {
          const $ = load(response.data);
          const servers = extractServers($, baseUrl);
          
          if (servers.length > 0) {
            return { 
              url: url, 
              servers,
              source: baseUrl
            };
          }
        }
      } catch (error) {
        continue;
      }
    }
  }

  return null;
}

/**
 * Extract servers from page
 */
function extractServers($, baseUrl) {
  const servers = [];
  
  $('iframe').each((i, el) => {
    let src = $(el).attr('src') || $(el).attr('data-src');
    if (src) {
      if (src.startsWith('//')) src = 'https:' + src;
      else if (src.startsWith('/')) src = baseUrl + src;
      
      if (src.startsWith('http')) {
        servers.push({
          name: `Server ${servers.length + 1}`,
          url: src,
          type: 'iframe'
        });
      }
    }
  });

  return servers;
}

// ==================== API ROUTES ====================

app.get('/', (req, res) => {
  res.json({
    message: 'AnimeWorld API - Stable Version',
    version: '2.0.0',
    endpoints: {
      '/api/anime/:id/:season/:episode': 'Stream anime episode',
      '/api/random': 'Random anime episode', 
      '/api/iframe?url=URL': 'Clean iframe player',
      '/health': 'Health check'
    }
  });
});

// Main streaming endpoint with auto-search fallback
app.get('/api/anime/:id/:season/:episode', async (req, res) => {
  try {
    const { id, season, episode } = req.params;
    const { server, json, clean } = req.query;

    console.log(`Request: ${id} S${season}E${episode}`);
    apiStats.totalRequests++;

    // Check database first
    let dbEntry = animeDatabase[id];
    let usedAutoSearch = false;

    // If not in database, try auto-search
    if (!dbEntry) {
      console.log(`Auto-searching for: ${id}`);
      const searchResults = await searchAnime(id);
      const bestMatch = findBestMatch(searchResults, id);
      
      if (bestMatch) {
        dbEntry = {
          slug: bestMatch.slug,
          name: bestMatch.title,
          hasAnilistId: false
        };
        usedAutoSearch = true;
        console.log(`Found: ${bestMatch.title}`);
      }
    }

    if (!dbEntry) {
      apiStats.failedRequests++;
      return res.status(404).json({ 
        error: 'Anime not found',
        suggestion: 'Check the anime name or ID'
      });
    }

    const slug = dbEntry.slug;
    const animeTitle = dbEntry.name;

    // Find episode
    const episodeData = await findEpisodeEnhanced(slug, season, episode);
    if (!episodeData || episodeData.servers.length === 0) {
      apiStats.failedRequests++;
      return res.status(404).json({ 
        error: 'Episode not found',
        anime: animeTitle
      });
    }

    // Handle server selection
    if (server) {
      const serverIdx = parseInt(server) - 1;
      if (episodeData.servers[serverIdx]) {
        apiStats.successfulRequests++;
        return clean ? sendCleanIframe(res, episodeData.servers[serverIdx].url) 
                     : sendPlayer(res, animeTitle, season, episode, episodeData.servers[serverIdx].url, episodeData.servers);
      }
    }

    // JSON response
    if (json) {
      apiStats.successfulRequests++;
      return res.json({
        success: true,
        title: animeTitle,
        season: parseInt(season),
        episode: parseInt(episode),
        slug: slug,
        servers: episodeData.servers,
        source: episodeData.source,
        auto_searched: usedAutoSearch
      });
    }

    // Default player
    apiStats.successfulRequests++;
    return clean ? sendCleanIframe(res, episodeData.servers[0].url)
                 : sendPlayer(res, animeTitle, season, episode, episodeData.servers[0].url, episodeData.servers);

  } catch (error) {
    console.error('Error:', error.message);
    apiStats.failedRequests++;
    res.status(500).json({ error: 'Server error' });
  }
});

// Random endpoint
app.get('/api/random', async (req, res) => {
  try {
    const { server, json, clean } = req.query;

    const randomId = randomAnimePool[Math.floor(Math.random() * randomAnimePool.length)];
    const season = 1, episode = 1;
    
    apiStats.totalRequests++;

    const dbEntry = animeDatabase[randomId];
    if (!dbEntry) {
      return res.status(404).json({ error: 'Random anime not found' });
    }

    const animeTitle = dbEntry.name;
    const slug = dbEntry.slug;

    const episodeData = await findEpisodeEnhanced(slug, season, episode);
    if (!episodeData || episodeData.servers.length === 0) {
      return res.status(404).json({ error: 'Random episode not found' });
    }

    if (server) {
      const serverIdx = parseInt(server) - 1;
      if (episodeData.servers[serverIdx]) {
        apiStats.successfulRequests++;
        return clean ? sendCleanIframe(res, episodeData.servers[serverIdx].url)
                     : sendPlayer(res, animeTitle, season, episode, episodeData.servers[serverIdx].url, episodeData.servers);
      }
    }

    if (json) {
      apiStats.successfulRequests++;
      return res.json({
        success: true,
        title: animeTitle,
        season: season,
        episode: episode,
        slug: slug,
        servers: episodeData.servers
      });
    }

    apiStats.successfulRequests++;
    return clean ? sendCleanIframe(res, episodeData.servers[0].url)
                 : sendPlayer(res, animeTitle, season, episode, episodeData.servers[0].url, episodeData.servers);

  } catch (error) {
    console.error('Random error:', error.message);
    apiStats.failedRequests++;
    res.status(500).json({ error: 'Server error' });
  }
});

// Clean iframe endpoint
app.get('/api/iframe', (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'URL parameter required' });
  sendCleanIframe(res, url);
});

// Health check
app.get('/health', (req, res) => {
  const successRate = apiStats.totalRequests > 0 ? 
    Math.round((apiStats.successfulRequests / apiStats.totalRequests) * 100) : 0;
    
  res.json({ 
    status: 'active', 
    database_entries: Object.keys(animeDatabase).length,
    total_requests: apiStats.totalRequests,
    successful_requests: apiStats.successfulRequests,
    failed_requests: apiStats.failedRequests,
    success_rate: successRate + '%'
  });
});

// ==================== PLAYER FUNCTIONS ====================

function sendPlayer(res, title, season, episode, videoUrl, servers = []) {
  const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - S${season}E${episode}</title>
    <style>
        body, html {
            margin: 0;
            padding: 0;
            overflow: hidden;
            background: #000;
            color: white;
            font-family: Arial, sans-serif;
        }
        .player-container {
            width: 100vw;
            height: 100vh;
            position: fixed;
            top: 0;
            left: 0;
            display: flex;
            flex-direction: column;
        }
        .player-header {
            background: rgba(0,0,0,0.8);
            padding: 10px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .anime-info {
            flex: 1;
        }
        .anime-title {
            font-weight: bold;
            margin-bottom: 5px;
        }
        .server-controls {
            display: flex;
            gap: 10px;
        }
        .server-btn {
            background: #5865f2;
            border: none;
            color: white;
            padding: 5px 10px;
            border-radius: 3px;
            cursor: pointer;
        }
        .video-container {
            flex: 1;
            background: #000;
        }
        iframe {
            width: 100%;
            height: 100%;
            border: none;
        }
    </style>
</head>
<body>
    <div class="player-container">
        <div class="player-header">
            <div class="anime-info">
                <div class="anime-title">${title}</div>
                <div>Season ${season} • Episode ${episode}</div>
            </div>
            ${servers.length > 1 ? `
            <div class="server-controls">
                ${servers.map((server, index) => 
                  `<button class="server-btn" onclick="switchServer(${index})">Server ${index + 1}</button>`
                ).join('')}
            </div>
            ` : ''}
        </div>
        <div class="video-container">
            <iframe src="${videoUrl}" allow="autoplay; fullscreen" allowfullscreen id="videoFrame"></iframe>
        </div>
    </div>
    
    <script>
        const servers = ${JSON.stringify(servers)};
        
        function switchServer(serverIndex) {
            if (servers[serverIndex]) {
                document.getElementById('videoFrame').src = servers[serverIndex].url;
            }
        }
    </script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
}

function sendCleanIframe(res, url) {
  const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Player</title>
    <style>
        body,html { margin:0; padding:0; overflow:hidden; background:#000; width:100vw; height:100vh; }
        iframe { width:100%; height:100%; border:none; }
    </style>
</head>
<body>
    <iframe src="${url}" allow="autoplay; fullscreen" allowfullscreen></iframe>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
}

// ==================== SERVER START ====================

const PORT = process.env.PORT || 3000;

async function startServer() {
  await loadDatabase();
  app.listen(PORT, () => {
    console.log(`
🎯 ANIMEWORLD API - STABLE VERSION
───────────────────────────────────
Port: ${PORT}
Database: ${Object.keys(animeDatabase).length} anime
API: http://localhost:${PORT}

📊 ENDPOINTS:
• /api/anime/:id/:season/:episode
• /api/random
• /api/iframe?url=URL
• /health

🚀 FEATURES:
• Auto-search fallback
• Multiple sources
• Simple & stable
───────────────────────────────────
    `);
  });
}

startServer();

// Error handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
