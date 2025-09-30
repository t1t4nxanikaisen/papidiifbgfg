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

// Enhanced anime database with proper slugs
let animeDatabase = {
  // Popular Anime
  20: { slug: "naruto", name: "Naruto", hasAnilistId: true },
  21: { slug: "one-piece", name: "One Piece", hasAnilistId: true },
  16498: { slug: "attack-on-titan", name: "Attack on Titan", hasAnilistId: true },
  113415: { slug: "jujutsu-kaisen", name: "Jujutsu Kaisen", hasAnilistId: true },
  101922: { slug: "demon-slayer", name: "Demon Slayer", hasAnilistId: true },
  127230: { slug: "chainsaw-man", name: "Chainsaw Man", hasAnilistId: true },
  31964: { slug: "my-hero-academia", name: "My Hero Academia", hasAnilistId: true },
  21087: { slug: "one-punch-man", name: "One Punch Man", hasAnilistId: true },
  
  // Cartoons
  998001: { slug: "ben-10", name: "Ben 10", hasAnilistId: false },
  998101: { slug: "shinchan", name: "Shinchan", hasAnilistId: false },
  998201: { slug: "doraemon", name: "Doraemon", hasAnilistId: false }
};

// Random anime pool
let randomAnimePool = [20, 113415, 127230, 101922, 16498, 998001];

// API statistics
let apiStats = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  lastUpdated: new Date().toISOString()
};

// File paths
const DB_FILE = path.join(process.env.VERCEL ? '/tmp' : __dirname, 'anime_database.json');

// Load database
async function loadDatabase() {
  try {
    const data = await fs.readFile(DB_FILE, 'utf8');
    const savedData = JSON.parse(data);
    animeDatabase = { ...animeDatabase, ...savedData.animeDatabase };
    randomAnimePool = savedData.randomAnimePool || randomAnimePool;
    apiStats = savedData.apiStats || apiStats;
    console.log(`📊 Loaded ${Object.keys(animeDatabase).length} anime from database`);
  } catch (error) {
    console.log('📊 Using default database');
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
    console.log('💾 Database saved');
  } catch (error) {
    console.error('❌ Failed to save database:', error.message);
  }
}

// AniList API endpoint
const ANILIST_API = 'https://graphql.anilist.co';

// ==================== MAIN API ROUTES ====================

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: '🎬 Ultimate AnimeWorld API',
    version: '7.0.0',
    endpoints: {
      '/api/anime/:id/:season/:episode': 'Stream anime episode',
      '/api/movie/:id': 'Stream anime movie',
      '/api/random': 'Random anime episode', 
      '/api/iframe?url=URL': 'Clean iframe player',
      '/admin': 'Admin panel'
    }
  });
});

// Main streaming endpoint - ENHANCED ACCURACY
app.get('/api/anime/:id/:season/:episode', async (req, res) => {
  try {
    const { id, season, episode } = req.params;
    const { server, json, clean } = req.query;

    console.log(`🎬 Streaming: ${id} S${season}E${episode}`);
    apiStats.totalRequests++;

    // Check if anime exists in database
    const dbEntry = animeDatabase[id];
    if (!dbEntry) {
      apiStats.failedRequests++;
      return res.status(404).json({ 
        error: 'Anime not found in database',
        suggestion: 'Add this anime via /admin panel'
      });
    }

    // Use database slug directly
    const slug = dbEntry.slug;
    const animeTitle = dbEntry.name;

    console.log(`🎯 Using database slug: ${slug} (${animeTitle})`);

    // Find episode with enhanced URL patterns
    const episodeData = await findEpisodeEnhanced(slug, season, episode, animeTitle);
    if (!episodeData || episodeData.servers.length === 0) {
      apiStats.failedRequests++;
      return res.status(404).json({ 
        error: 'Episode not found',
        anime_title: animeTitle,
        tried_slug: slug,
        season: season,
        episode: episode
      });
    }

    // Handle server selection
    if (server) {
      const serverIdx = parseInt(server) - 1;
      if (episodeData.servers[serverIdx]) {
        apiStats.successfulRequests++;
        return clean ? sendCleanIframe(res, episodeData.servers[serverIdx].url) 
                     : sendPlayer(res, animeTitle, season, episode, episodeData.servers[serverIdx].url);
      }
      apiStats.failedRequests++;
      return res.status(404).send('Server not found');
    }

    // JSON response
    if (json) {
      apiStats.successfulRequests++;
      return res.json({
        success: true,
        id: parseInt(id),
        title: animeTitle,
        season: parseInt(season),
        episode: parseInt(episode),
        slug: slug,
        from_database: true,
        episodeUrl: episodeData.url,
        servers: episodeData.servers,
        used_pattern: episodeData.usedPattern
      });
    }

    // Default: send player
    apiStats.successfulRequests++;
    return clean ? sendCleanIframe(res, episodeData.servers[0].url)
                 : sendPlayer(res, animeTitle, season, episode, episodeData.servers[0].url);

  } catch (error) {
    console.error('💥 Error:', error.message);
    apiStats.failedRequests++;
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Random anime endpoint
app.get('/api/random', async (req, res) => {
  try {
    const { server, json, clean } = req.query;

    const randomId = randomAnimePool[Math.floor(Math.random() * randomAnimePool.length)];
    const season = 1, episode = 1;
    
    console.log(`🎲 Random: ${randomId} S${season}E${episode}`);
    apiStats.totalRequests++;

    const dbEntry = animeDatabase[randomId];
    if (!dbEntry) {
      apiStats.failedRequests++;
      return res.status(404).json({ error: 'Random anime not found in database' });
    }

    const animeTitle = dbEntry.name;
    const slug = dbEntry.slug;

    const episodeData = await findEpisodeEnhanced(slug, season, episode, animeTitle);
    if (!episodeData || episodeData.servers.length === 0) {
      apiStats.failedRequests++;
      return res.status(404).json({ error: 'Random episode not found' });
    }

    if (server) {
      const serverIdx = parseInt(server) - 1;
      if (episodeData.servers[serverIdx]) {
        apiStats.successfulRequests++;
        return clean ? sendCleanIframe(res, episodeData.servers[serverIdx].url)
                     : sendPlayer(res, animeTitle, season, episode, episodeData.servers[serverIdx].url);
      }
      apiStats.failedRequests++;
      return res.status(404).send('Server not found');
    }

    if (json) {
      apiStats.successfulRequests++;
      return res.json({
        success: true,
        id: randomId,
        title: animeTitle,
        season: season,
        episode: episode,
        slug: slug,
        from_database: true,
        episodeUrl: episodeData.url,
        servers: episodeData.servers,
        is_random: true,
        used_pattern: episodeData.usedPattern
      });
    }

    apiStats.successfulRequests++;
    return clean ? sendCleanIframe(res, episodeData.servers[0].url)
                 : sendPlayer(res, animeTitle, season, episode, episodeData.servers[0].url);

  } catch (error) {
    console.error('💥 Random error:', error.message);
    apiStats.failedRequests++;
    res.status(500).json({ error: 'Server error' });
  }
});

// Clean iframe endpoint
app.get('/api/iframe', (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'URL parameter required' });
  console.log(`🎬 Clean iframe: ${url}`);
  sendCleanIframe(res, url);
});

// Health check
app.get('/health', (req, res) => {
  const successRate = apiStats.totalRequests > 0 ? 
    Math.round((apiStats.successfulRequests / apiStats.totalRequests) * 100) : 0;
    
  res.json({ 
    status: 'active', 
    version: '7.0.0',
    database_entries: Object.keys(animeDatabase).length,
    random_pool: randomAnimePool.length,
    total_requests: apiStats.totalRequests,
    successful_requests: apiStats.successfulRequests,
    failed_requests: apiStats.failedRequests,
    success_rate: successRate
  });
});

// ==================== ENHANCED CORE FUNCTIONS ====================

// ENHANCED: Better episode finder with improved patterns
async function findEpisodeEnhanced(slug, season, episode, animeTitle = "") {
  const baseUrl = 'https://watchanimeworld.in';
  
  console.log(`🔍 Enhanced search for: ${slug} S${season}E${episode}`);

  // Enhanced URL patterns based on actual website analysis
  const patterns = [
    // Primary pattern: /episode/slug-seasonxepisode/
    {
      url: `${baseUrl}/episode/${slug}-${season}x${episode}/`,
      name: 'episode-seasonxepisode'
    },
    // Alternative pattern: /episode/slug-sXXeXX/
    {
      url: `${baseUrl}/episode/${slug}-s${season.toString().padStart(2, '0')}e${episode.toString().padStart(2, '0')}/`,
      name: 'episode-sXXeXX'
    },
    // Simple episode pattern
    {
      url: `${baseUrl}/episode/${slug}-episode-${episode}/`,
      name: 'episode-simple'
    },
    // Full format pattern
    {
      url: `${baseUrl}/episode/${slug}-season-${season}-episode-${episode}/`,
      name: 'episode-full'
    },
    // Series format
    {
      url: `${baseUrl}/series/${slug}/season-${season}/episode-${episode}/`,
      name: 'series-season-episode'
    },
    // Anime format
    {
      url: `${baseUrl}/anime/${slug}/episode-${episode}/`,
      name: 'anime-episode'
    },
    // TV format
    {
      url: `${baseUrl}/tv/${slug}/episode-${episode}/`,
      name: 'tv-episode'
    },
    // Watch format
    {
      url: `${baseUrl}/watch/${slug}/episode-${episode}/`,
      name: 'watch-episode'
    }
  ];

  for (const pattern of patterns) {
    console.log(`🔍 Trying pattern: ${pattern.name} - ${pattern.url}`);
    
    try {
      const response = await axios.get(pattern.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Referer': 'https://watchanimeworld.in/'
        },
        timeout: 10000,
        validateStatus: (status) => status < 500 // Don't retry server errors
      });

      console.log(`📊 Response status: ${response.status} for ${pattern.name}`);

      // Check if page actually exists (not 404)
      if (response.status === 404 || 
          response.data.includes('404') || 
          response.data.includes('Not Found') ||
          response.data.includes('Page Not Found')) {
        console.log(`❌ 404 for: ${pattern.name}`);
        continue;
      }

      if (response.status !== 200) {
        console.log(`⚠️ Status ${response.status} for: ${pattern.name}`);
        continue;
      }

      const $ = load(response.data);
      const servers = [];

      // Enhanced iframe extraction with multiple attributes
      $('iframe').each((i, el) => {
        let src = $(el).attr('src') || $(el).attr('data-src') || $(el).attr('data-url');
        if (src) {
          // Handle protocol-relative URLs
          if (src.startsWith('//')) {
            src = 'https:' + src;
          }
          // Handle relative URLs
          else if (src.startsWith('/')) {
            src = baseUrl + src;
          }
          
          // Only add valid URLs
          if (src.startsWith('http')) {
            servers.push({
              name: `Server ${servers.length + 1}`,
              url: src,
              type: 'iframe',
              server: detectServer(src)
            });
            console.log(`✅ Found iframe: ${src}`);
          }
        }
      });

      // Look for video players with data attributes
      $('[data-player], [data-video], [data-src], [data-url]').each((i, el) => {
        const src = $(el).attr('data-player') || $(el).attr('data-video') || $(el).attr('data-src') || $(el).attr('data-url');
        if (src && src.includes('http')) {
          let fullUrl = src.startsWith('//') ? 'https:' + src : src;
          servers.push({
            name: `Embed Server ${servers.length + 1}`,
            url: fullUrl,
            type: 'embed',
            server: detectServer(fullUrl)
          });
          console.log(`✅ Found embed: ${fullUrl}`);
        }
      });

      // Look for video elements with sources
      $('video').each((i, el) => {
        const $video = $(el);
        const src = $video.attr('src');
        if (src && src.startsWith('http')) {
          servers.push({
            name: `Direct Video ${servers.length + 1}`,
            url: src,
            type: 'direct',
            server: 'Direct'
          });
        }
        
        // Check video sources
        $video.find('source').each((j, source) => {
          const sourceSrc = $(source).attr('src');
          if (sourceSrc && sourceSrc.startsWith('http')) {
            servers.push({
              name: `Video Source ${servers.length + 1}`,
              url: sourceSrc,
              type: 'direct',
              server: 'Direct'
            });
          }
        });
      });

      // Look for script variables containing video URLs
      const scriptText = $('script').text();
      const videoUrlMatches = scriptText.match(/(https?:\/\/[^"'\s]*\.(mp4|m3u8|webm)[^"'\s]*)/gi);
      if (videoUrlMatches) {
        videoUrlMatches.forEach(url => {
          if (url.includes('video') || url.includes('stream')) {
            servers.push({
              name: `Script Video ${servers.length + 1}`,
              url: url,
              type: 'direct',
              server: 'Direct'
            });
          }
        });
      }

      if (servers.length > 0) {
        console.log(`🎉 Success with pattern ${pattern.name}! Found ${servers.length} servers`);
        await saveDatabase(); // Save stats
        return { 
          url: pattern.url, 
          servers,
          usedPattern: pattern.name
        };
      } else {
        console.log(`❌ No video sources found with pattern: ${pattern.name}`);
      }

    } catch (error) {
      console.log(`🚫 Error with pattern ${pattern.name}: ${error.message}`);
      continue;
    }
  }

  console.log(`💥 All patterns failed for: ${slug}`);
  return null;
}

// Detect server from URL
function detectServer(url) {
  const serverMap = {
    'streamtape': 'StreamTape',
    'dood': 'DoodStream',
    'filemoon': 'FileMoon',
    'mixdrop': 'MixDrop',
    'mp4upload': 'Mp4Upload',
    'vidstream': 'VidStream',
    'gogostream': 'GogoStream',
    'play.zephyrflick': 'ZephyrFlick',
    'vidsrc': 'VidSrc',
    'vidsrc.pro': 'VidSrc Pro',
    '2embed': '2Embed'
  };

  const urlLower = url.toLowerCase();
  for (const [key, name] of Object.entries(serverMap)) {
    if (urlLower.includes(key)) return name;
  }
  return 'Unknown Server';
}

// ULTRA-FAST IFRAME PLAYER
function sendCleanIframe(res, url) {
  const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Player</title>
    <style>
        body,html {
            margin:0;
            padding:0;
            overflow:hidden;
            background:#000;
            width:100vw;
            height:100vh;
        }
        iframe {
            width:100%;
            height:100%;
            border:none;
            position:fixed;
            top:0;
            left:0;
        }
    </style>
</head>
<body>
    <iframe src="${url}" allow="autoplay; fullscreen; encrypted-media" allowfullscreen></iframe>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
}

// Enhanced player with navigation
function sendPlayer(res, title, season, episode, videoUrl) {
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
            font-family: 'Segoe UI', sans-serif;
            width: 100vw;
            height: 100vh;
        }
        .player-container {
            width: 100%;
            height: 100%;
            position: fixed;
            top: 0;
            left: 0;
        }
        iframe {
            width: 100%;
            height: 100%;
            border: none;
            background: #000;
        }
        .player-info {
            position: fixed;
            top: 10px;
            left: 10px;
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 8px 12px;
            border-radius: 5px;
            z-index: 1000;
            font-family: Arial, sans-serif;
            font-size: 12px;
            backdrop-filter: blur(10px);
        }
    </style>
</head>
<body>
    <div class="player-info">${title} - S${season}E${episode}</div>
    <div class="player-container">
        <iframe src="${videoUrl}" allow="autoplay; fullscreen; encrypted-media" allowfullscreen></iframe>
    </div>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
}

// ==================== ENHANCED ADMIN PANEL ROUTES ====================

// Admin login
app.post('/admin/login', async (req, res) => {
  const { password } = req.body;

  if (password === 'admin123') {
    res.json({ 
      success: true, 
      message: 'Logged in successfully',
      token: 'admin_' + Date.now()
    });
  } else {
    res.status(401).json({ error: 'Invalid password' });
  }
});

// Get database stats
app.get('/admin/stats', (req, res) => {
  const successRate = apiStats.totalRequests > 0 
    ? Math.round((apiStats.successfulRequests / apiStats.totalRequests) * 100)
    : 0;

  res.json({
    totalAnime: Object.keys(animeDatabase).length,
    randomPool: randomAnimePool.length,
    totalRequests: apiStats.totalRequests,
    successfulRequests: apiStats.successfulRequests,
    failedRequests: apiStats.failedRequests,
    successRate: successRate,
    database: Object.entries(animeDatabase).map(([id, entry]) => ({
      id: parseInt(id),
      name: entry.name,
      slug: entry.slug,
      hasAnilistId: entry.hasAnilistId
    }))
  });
});

// Add anime to database
app.post('/admin/anime', async (req, res) => {
  const { id, name, slug, hasAnilistId } = req.body;

  if (!id || !name || !slug) {
    return res.status(400).json({ error: 'ID, name, and slug are required' });
  }

  // Add to database
  animeDatabase[id] = {
    slug: slug,
    name: name,
    hasAnilistId: hasAnilistId || false
  };

  // Add to random pool if it has AniList ID
  if (hasAnilistId && !randomAnimePool.includes(parseInt(id))) {
    randomAnimePool.push(parseInt(id));
  }

  await saveDatabase();

  res.json({ 
    success: true, 
    message: 'Anime added to database',
    anime: { id, name, slug, hasAnilistId }
  });
});

// Fetch anime info from AniList
app.post('/admin/fetch-info', async (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'ID is required' });
  }

  try {
    const animeInfo = await getAnimeInfo(id);
    if (animeInfo) {
      const slug = slugify(animeInfo.title);
      res.json({
        success: true,
        id: id,
        name: animeInfo.title,
        slug: slug,
        hasAnilistId: true,
        format: animeInfo.format,
        episodes: animeInfo.episodes,
        status: animeInfo.status
      });
    } else {
      res.status(404).json({ error: 'Anime not found on AniList' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch anime info' });
  }
});

// Delete anime from database
app.delete('/admin/anime/:id', async (req, res) => {
  const { id } = req.params;

  if (animeDatabase[id]) {
    delete animeDatabase[id];

    // Remove from random pool
    const index = randomAnimePool.indexOf(parseInt(id));
    if (index > -1) {
      randomAnimePool.splice(index, 1);
    }

    await saveDatabase();
    res.json({ success: true, message: 'Anime removed from database' });
  } else {
    res.status(404).json({ error: 'Anime not found' });
  }
});

// Test anime URL endpoint
app.post('/admin/test-anime', async (req, res) => {
  const { slug, season, episode } = req.body;

  if (!slug) {
    return res.status(400).json({ error: 'Slug is required' });
  }

  try {
    const testData = await findEpisodeEnhanced(slug, season || 1, episode || 1, 'Test Anime');
    
    if (testData && testData.servers.length > 0) {
      res.json({
        success: true,
        url: testData.url,
        servers: testData.servers,
        serverCount: testData.servers.length,
        usedPattern: testData.usedPattern
      });
    } else {
      res.status(404).json({ 
        success: false, 
        error: `No episode found for slug: ${slug}`
      });
    }
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Test failed: ' + error.message 
    });
  }
});

// Get anime info from AniList
async function getAnimeInfo(anilistId) {
  try {
    console.log(`🔍 Fetching AniList info for ID: ${anilistId}`);
    const query = `
      query ($id: Int) {
        Media (id: $id, type: ANIME) {
          title {
            romaji
            english
            native
          }
          format
          episodes
          status
        }
      }
    `;

    const response = await axios.post(ANILIST_API, {
      query,
      variables: { id: parseInt(anilistId) }
    }, { timeout: 8000 });

    if (response.data.data?.Media) {
      const media = response.data.data.Media;
      return {
        title: media.title.english || media.title.romaji || media.title.native,
        format: media.format,
        episodes: media.episodes,
        status: media.status
      };
    }
    return null;
  } catch (error) {
    console.log(`❌ AniList failed for ${anilistId}`);
    return null;
  }
}

// Simple slugify function
function slugify(title) {
  if (!title) return 'unknown';
  return title
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50);
}

// ==================== PTERODACTYL-STYLE ADMIN PANEL ====================

app.get('/admin', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AnimeWorld API - Admin Panel</title>
    <style>
        :root {
            --sidebar-width: 260px;
            --header-height: 60px;
            --primary: #151a30;
            --secondary: #1d233f;
            --accent: #5865f2;
            --accent-hover: #4752c4;
            --success: #57f287;
            --danger: #ed4245;
            --warning: #faa81a;
            --text: #ffffff;
            --text-muted: #b9bbbe;
            --border: #2f3136;
            --sidebar-bg: #0f1425;
        }
        
        * { 
            margin: 0; 
            padding: 0; 
            box-sizing: border-box; 
        }
        
        body { 
            background: var(--primary);
            font-family: 'Whitney', 'Helvetica Neue', Helvetica, Arial, sans-serif;
            min-height: 100vh;
            color: var(--text);
            line-height: 1.6;
            display: flex;
        }
        
        /* Sidebar Styles */
        .sidebar {
            width: var(--sidebar-width);
            background: var(--sidebar-bg);
            border-right: 1px solid var(--border);
            height: 100vh;
            position: fixed;
            left: 0;
            top: 0;
            overflow-y: auto;
            z-index: 1000;
        }
        
        .sidebar-header {
            padding: 20px;
            border-bottom: 1px solid var(--border);
            text-align: center;
        }
        
        .sidebar-logo {
            font-size: 1.5em;
            font-weight: bold;
            color: var(--accent);
            margin-bottom: 5px;
        }
        
        .sidebar-version {
            font-size: 0.8em;
            color: var(--text-muted);
        }
        
        .nav-section {
            padding: 15px 0;
            border-bottom: 1px solid var(--border);
        }
        
        .nav-title {
            padding: 0 20px 10px 20px;
            font-size: 0.8em;
            color: var(--text-muted);
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .nav-item {
            display: flex;
            align-items: center;
            padding: 12px 20px;
            color: var(--text);
            text-decoration: none;
            transition: all 0.2s ease;
            cursor: pointer;
            border-left: 3px solid transparent;
        }
        
        .nav-item:hover {
            background: var(--secondary);
            color: var(--accent);
        }
        
        .nav-item.active {
            background: var(--secondary);
            color: var(--accent);
            border-left-color: var(--accent);
        }
        
        .nav-icon {
            margin-right: 10px;
            width: 20px;
            text-align: center;
        }
        
        /* Main Content Styles */
        .main-content {
            flex: 1;
            margin-left: var(--sidebar-width);
            min-height: 100vh;
        }
        
        .header {
            height: var(--header-height);
            background: var(--secondary);
            border-bottom: 1px solid var(--border);
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 30px;
            position: sticky;
            top: 0;
            z-index: 100;
        }
        
        .header-title {
            font-size: 1.3em;
            font-weight: 600;
        }
        
        .header-actions {
            display: flex;
            gap: 10px;
        }
        
        .content {
            padding: 30px;
            max-width: 1200px;
        }
        
        /* Stats Grid */
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .stat-card {
            background: var(--secondary);
            padding: 25px;
            border-radius: 8px;
            border: 1px solid var(--border);
            text-align: center;
            transition: transform 0.2s ease;
        }
        
        .stat-card:hover {
            transform: translateY(-2px);
        }
        
        .stat-number {
            font-size: 2.5em;
            font-weight: bold;
            color: var(--accent);
            margin-bottom: 5px;
        }
        
        .stat-label {
            color: var(--text-muted);
            font-size: 0.9em;
        }
        
        /* Form Styles */
        .form-section {
            background: var(--secondary);
            padding: 25px;
            border-radius: 8px;
            border: 1px solid var(--border);
            margin-bottom: 25px;
        }
        
        .form-section h3 {
            margin-bottom: 20px;
            color: var(--accent);
            font-size: 1.3em;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .form-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
        }
        
        .form-group {
            margin-bottom: 15px;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 5px;
            color: var(--text);
            font-weight: 600;
            font-size: 0.9em;
        }
        
        input, select, button, textarea {
            width: 100%;
            padding: 12px 16px;
            border: 1px solid var(--border);
            border-radius: 6px;
            font-size: 14px;
            background: var(--primary);
            color: var(--text);
            transition: all 0.2s ease;
        }
        
        input:focus, select:focus, textarea:focus {
            border-color: var(--accent);
            outline: none;
            box-shadow: 0 0 0 2px rgba(88, 101, 242, 0.2);
        }
        
        input::placeholder, textarea::placeholder {
            color: var(--text-muted);
        }
        
        button {
            background: var(--accent);
            border: none;
            cursor: pointer;
            font-weight: 600;
            transition: background 0.2s ease;
        }
        
        button:hover {
            background: var(--accent-hover);
        }
        
        button.success {
            background: var(--success);
        }
        
        button.success:hover {
            background: #48d874;
        }
        
        button.danger {
            background: var(--danger);
        }
        
        button.danger:hover {
            background: #c03537;
        }
        
        button.warning {
            background: var(--warning);
        }
        
        button.warning:hover {
            background: #e5940f;
        }
        
        /* Database Table */
        .database-table {
            background: var(--secondary);
            border-radius: 8px;
            border: 1px solid var(--border);
            overflow: hidden;
        }
        
        .table-header {
            padding: 20px;
            border-bottom: 1px solid var(--border);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .table-container {
            max-height: 500px;
            overflow-y: auto;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
        }
        
        th {
            background: var(--primary);
            padding: 15px;
            text-align: left;
            font-weight: 600;
            font-size: 0.9em;
            color: var(--text-muted);
            border-bottom: 1px solid var(--border);
        }
        
        td {
            padding: 15px;
            border-bottom: 1px solid var(--border);
        }
        
        tr:hover {
            background: rgba(88, 101, 242, 0.05);
        }
        
        .anime-actions {
            display: flex;
            gap: 5px;
        }
        
        .btn-sm {
            padding: 6px 12px;
            font-size: 12px;
            width: auto;
        }
        
        /* Messages */
        .message {
            padding: 12px 16px;
            border-radius: 6px;
            margin: 15px 0;
            font-weight: 600;
        }
        
        .message.success {
            background: rgba(87, 242, 135, 0.1);
            border: 1px solid var(--success);
            color: var(--success);
        }
        
        .message.error {
            background: rgba(237, 66, 69, 0.1);
            border: 1px solid var(--danger);
            color: var(--danger);
        }
        
        .message.info {
            background: rgba(88, 101, 242, 0.1);
            border: 1px solid var(--accent);
            color: var(--accent);
        }
        
        /* Test Results */
        .test-results {
            background: var(--primary);
            border-radius: 6px;
            border: 1px solid var(--border);
            padding: 20px;
            margin-top: 20px;
        }
        
        .server-list {
            margin-top: 15px;
        }
        
        .server-item {
            background: var(--secondary);
            padding: 12px;
            margin: 8px 0;
            border-radius: 6px;
            border-left: 3px solid var(--accent);
        }
        
        /* Login Form */
        .login-container {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: var(--primary);
        }
        
        .login-box {
            background: var(--secondary);
            padding: 40px;
            border-radius: 10px;
            border: 1px solid var(--border);
            width: 100%;
            max-width: 400px;
            text-align: center;
        }
        
        .login-logo {
            font-size: 2em;
            margin-bottom: 10px;
            color: var(--accent);
        }
        
        .login-subtitle {
            color: var(--text-muted);
            margin-bottom: 30px;
        }
        
        /* Tab Content */
        .tab-content {
            display: none;
        }
        
        .tab-content.active {
            display: block;
        }
        
        /* Player Preview */
        .player-preview {
            background: #000;
            border: 2px solid var(--accent);
            border-radius: 10px;
            margin: 10px 0;
            overflow: hidden;
        }
        
        .player-header {
            background: var(--accent);
            color: #000;
            padding: 10px;
            font-weight: bold;
        }
        
        .player-frame {
            width: 100%;
            height: 300px;
            border: none;
        }
    </style>
</head>
<body>
    <div id="loginPage" class="login-container">
        <div class="login-box">
            <div class="login-logo">🎬 AnimeWorld</div>
            <div class="login-subtitle">Admin Panel v7.0</div>
            <input type="password" id="password" placeholder="Enter admin password" style="margin-bottom: 15px;">
            <button onclick="login()" style="width: 100%;">Login</button>
            <div id="loginMessage" style="margin-top: 15px;"></div>
        </div>
    </div>

    <div id="adminPanel" style="display: none;">
        <!-- Sidebar -->
        <div class="sidebar">
            <div class="sidebar-header">
                <div class="sidebar-logo">🎬 AnimeWorld</div>
                <div class="sidebar-version">v7.0 Admin</div>
            </div>
            
            <div class="nav-section">
                <div class="nav-title">Navigation</div>
                <div class="nav-item active" onclick="switchTab('dashboard')">
                    <span class="nav-icon">📊</span>
                    Dashboard
                </div>
                <div class="nav-item" onclick="switchTab('database')">
                    <span class="nav-icon">🗃️</span>
                    Database Manager
                </div>
                <div class="nav-item" onclick="switchTab('addAnime')">
                    <span class="nav-icon">➕</span>
                    Add Anime
                </div>
                <div class="nav-item" onclick="switchTab('testPlayers')">
                    <span class="nav-icon">🧪</span>
                    Test Players
                </div>
                <div class="nav-item" onclick="switchTab('analytics')">
                    <span class="nav-icon">📈</span>
                    Analytics
                </div>
            </div>
            
            <div class="nav-section">
                <div class="nav-title">Quick Actions</div>
                <div class="nav-item" onclick="quickTest()">
                    <span class="nav-icon">⚡</span>
                    Quick Test
                </div>
                <div class="nav-item" onclick="refreshStats()">
                    <span class="nav-icon">🔄</span>
                    Refresh Stats
                </div>
                <div class="nav-item" onclick="exportDatabase()">
                    <span class="nav-icon">📤</span>
                    Export DB
                </div>
            </div>
        </div>

        <!-- Main Content -->
        <div class="main-content">
            <div class="header">
                <div class="header-title" id="pageTitle">Dashboard</div>
                <div class="header-actions">
                    <button class="btn-sm" onclick="refreshStats()">🔄 Refresh</button>
                    <button class="btn-sm warning" onclick="logout()">🚪 Logout</button>
                </div>
            </div>

            <div class="content">
                <!-- Dashboard Tab -->
                <div id="dashboard" class="tab-content active">
                    <h2>📊 Dashboard Overview</h2>
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-number" id="statTotalAnime">0</div>
                            <div class="stat-label">Total Anime</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number" id="statRandomPool">0</div>
                            <div class="stat-label">Random Pool</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number" id="statTotalRequests">0</div>
                            <div class="stat-label">Total Requests</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number" id="statSuccessRate">0%</div>
                            <div class="stat-label">Success Rate</div>
                        </div>
                    </div>

                    <div class="form-section">
                        <h3>🚀 Quick Actions</h3>
                        <div class="form-grid">
                            <div>
                                <button onclick="switchTab('addAnime')" class="success">➕ Add New Anime</button>
                            </div>
                            <div>
                                <button onclick="switchTab('testPlayers')" class="warning">🧪 Test Players</button>
                            </div>
                        </div>
                    </div>

                    <div class="form-section">
                        <h3>📈 Recent Activity</h3>
                        <div id="recentActivity">
                            Loading activity...
                        </div>
                    </div>
                </div>

                <!-- Database Manager Tab -->
                <div id="database" class="tab-content">
                    <h2>🗃️ Database Manager</h2>
                    <div class="form-section">
                        <h3>📋 Anime Database</h3>
                        <div class="table-header">
                            <span>Total: <span id="dbCount">0</span> anime</span>
                            <button onclick="refreshDatabase()" class="btn-sm">🔄 Refresh</button>
                        </div>
                        <div class="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Name</th>
                                        <th>Slug</th>
                                        <th>Type</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody id="databaseTable">
                                    <!-- Database entries will be populated here -->
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- Add Anime Tab -->
                <div id="addAnime" class="tab-content">
                    <h2>➕ Add Anime</h2>
                    <div class="form-section">
                        <h3>🔍 Add Single Anime</h3>
                        <div class="form-grid">
                            <div>
                                <div class="form-group">
                                    <label>Anime ID</label>
                                    <input type="number" id="animeId" placeholder="AniList ID or Custom ID">
                                </div>
                                <div class="form-group">
                                    <label>Anime Name</label>
                                    <input type="text" id="animeName" placeholder="Full anime name">
                                </div>
                            </div>
                            <div>
                                <div class="form-group">
                                    <label>URL Slug</label>
                                    <input type="text" id="animeSlug" placeholder="URL-friendly slug">
                                </div>
                                <div class="form-group">
                                    <label>
                                        <input type="checkbox" id="hasAnilistId" checked>
                                        Has AniList ID
                                    </label>
                                </div>
                                <button onclick="addAnime()" class="success">✅ Add to Database</button>
                            </div>
                        </div>
                        <div id="addMessage"></div>
                    </div>

                    <div class="form-section">
                        <h3>🔍 Fetch from AniList</h3>
                        <div class="form-grid">
                            <div>
                                <input type="number" id="fetchAnilistId" placeholder="AniList ID (e.g., 101922)">
                            </div>
                            <div>
                                <button onclick="fetchAnimeInfo()">🔍 Fetch Info</button>
                            </div>
                        </div>
                        <div id="fetchMessage"></div>
                    </div>
                </div>

                <!-- Test Players Tab -->
                <div id="testPlayers" class="tab-content">
                    <h2>🧪 Test Players</h2>
                    <div class="form-section">
                        <h3>🎬 Test Anime URLs</h3>
                        <div class="form-grid">
                            <div>
                                <div class="form-group">
                                    <label>Anime Slug</label>
                                    <input type="text" id="testSlug" placeholder="e.g., one-piece" value="one-piece">
                                </div>
                                <div class="form-group">
                                    <label>Season</label>
                                    <input type="number" id="testSeason" value="1">
                                </div>
                                <div class="form-group">
                                    <label>Episode</label>
                                    <input type="number" id="testEpisode" value="1">
                                </div>
                            </div>
                            <div>
                                <div class="url-preview">
                                    <strong>Testing URL Patterns:</strong><br>
                                    <span id="testUrlPreview">/episode/one-piece-1x1/</span>
                                </div>
                                <button onclick="testAnimeUrl()" class="warning" style="margin-top: 15px;">🧪 Test All Patterns</button>
                            </div>
                        </div>
                        <div id="testResults"></div>
                        <div id="playerPreviews"></div>
                    </div>
                </div>

                <!-- Analytics Tab -->
                <div id="analytics" class="tab-content">
                    <h2>📈 Analytics</h2>
                    <div class="form-section">
                        <h3>📊 Performance Metrics</h3>
                        <div class="stats-grid">
                            <div class="stat-card">
                                <div class="stat-number" id="analyticsTotalRequests">0</div>
                                <div class="stat-label">Total Requests</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-number" id="analyticsSuccessful">0</div>
                                <div class="stat-label">Successful</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-number" id="analyticsFailed">0</div>
                                <div class="stat-label">Failed</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-number" id="analyticsSuccessRate">0%</div>
                                <div class="stat-label">Success Rate</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        let currentTab = 'dashboard';

        function switchTab(tabName) {
            // Update navigation
            document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
            event.target.classList.add('active');
            
            // Update content
            document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
            document.getElementById(tabName).classList.add('active');
            
            // Update page title
            const titles = {
                'dashboard': 'Dashboard',
                'database': 'Database Manager',
                'addAnime': 'Add Anime',
                'testPlayers': 'Test Players',
                'analytics': 'Analytics'
            };
            document.getElementById('pageTitle').textContent = titles[tabName];
            currentTab = tabName;
            
            // Load tab-specific data
            if (tabName === 'dashboard') loadDashboard();
            if (tabName === 'database') loadDatabaseTable();
            if (tabName === 'analytics') loadAnalytics();
        }

        async function login() {
            const password = document.getElementById('password').value;
            const response = await fetch('/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });

            const data = await response.json();
            if (data.success) {
                document.getElementById('loginPage').style.display = 'none';
                document.getElementById('adminPanel').style.display = 'flex';
                loadDashboard();
            } else {
                showMessage('loginMessage', data.error, 'error');
            }
        }

        function logout() {
            document.getElementById('loginPage').style.display = 'flex';
            document.getElementById('adminPanel').style.display = 'none';
            document.getElementById('password').value = '';
        }

        async function loadDashboard() {
            const response = await fetch('/admin/stats');
            const data = await response.json();

            document.getElementById('statTotalAnime').textContent = data.totalAnime;
            document.getElementById('statRandomPool').textContent = data.randomPool;
            document.getElementById('statTotalRequests').textContent = data.totalRequests;
            document.getElementById('statSuccessRate').textContent = data.successRate + '%';

            // Update recent activity
            const activity = data.database.slice(-5).reverse().map(anime => 
                '<div style="padding: 10px; border-bottom: 1px solid var(--border);">' +
                    '<strong>' + anime.name + '</strong> (ID: ' + anime.id + ')' +
                    '<div style="font-size: 0.8em; color: var(--text-muted);">Slug: ' + anime.slug + '</div>' +
                '</div>'
            ).join('');
            document.getElementById('recentActivity').innerHTML = activity || 'No recent activity';
        }

        async function loadDatabaseTable() {
            const response = await fetch('/admin/stats');
            const data = await response.json();

            document.getElementById('dbCount').textContent = data.totalAnime;

            const tableBody = data.database.map(anime => 
                '<tr>' +
                    '<td>' + anime.id + '</td>' +
                    '<td><strong>' + anime.name + '</strong></td>' +
                    '<td><code>' + anime.slug + '</code></td>' +
                    '<td>' + (anime.hasAnilistId ? 'AniList' : 'Custom') + '</td>' +
                    '<td class="anime-actions">' +
                        '<button class="btn-sm warning" onclick="testAnimeById(' + anime.id + ')">Test</button>' +
                        '<button class="btn-sm danger" onclick="deleteAnime(' + anime.id + ')">Delete</button>' +
                    '</td>' +
                '</tr>'
            ).join('');

            document.getElementById('databaseTable').innerHTML = tableBody;
        }

        async function loadAnalytics() {
            const response = await fetch('/admin/stats');
            const data = await response.json();

            document.getElementById('analyticsTotalRequests').textContent = data.totalRequests;
            document.getElementById('analyticsSuccessful').textContent = data.successfulRequests;
            document.getElementById('analyticsFailed').textContent = data.failedRequests;
            document.getElementById('analyticsSuccessRate').textContent = data.successRate + '%';
        }

        async function addAnime() {
            const id = document.getElementById('animeId').value;
            const name = document.getElementById('animeName').value;
            const slug = document.getElementById('animeSlug').value;
            const hasAnilistId = document.getElementById('hasAnilistId').checked;

            if (!id || !name || !slug) {
                showMessage('addMessage', 'Please fill all fields', 'error');
                return;
            }

            const response = await fetch('/admin/anime', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, name, slug, hasAnilistId })
            });

            const data = await response.json();
            if (data.success) {
                showMessage('addMessage', '✅ Anime added successfully!', 'success');
                document.getElementById('animeId').value = '';
                document.getElementById('animeName').value = '';
                document.getElementById('animeSlug').value = '';
                loadDashboard();
            } else {
                showMessage('addMessage', '❌ ' + data.error, 'error');
            }
        }

        async function fetchAnimeInfo() {
            const id = document.getElementById('fetchAnilistId').value;
            if (!id) return alert('Enter AniList ID');

            const response = await fetch('/admin/fetch-info', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });

            const data = await response.json();
            if (data.success) {
                document.getElementById('animeId').value = data.id;
                document.getElementById('animeName').value = data.name;
                document.getElementById('animeSlug').value = data.slug;
                document.getElementById('hasAnilistId').checked = true;
                showMessage('fetchMessage', '✅ Anime info fetched successfully!', 'success');
            } else {
                showMessage('fetchMessage', '❌ ' + data.error, 'error');
            }
        }

        async function deleteAnime(id) {
            if (!confirm('Are you sure you want to delete this anime?')) return;

            const response = await fetch('/admin/anime/' + id, { method: 'DELETE' });
            const data = await response.json();

            if (data.success) {
                loadDatabaseTable();
                loadDashboard();
            } else {
                alert('Failed to delete: ' + data.error);
            }
        }

        async function testAnimeUrl() {
            const slug = document.getElementById('testSlug').value;
            const season = document.getElementById('testSeason').value || 1;
            const episode = document.getElementById('testEpisode').value || 1;

            if (!slug) return alert('Enter anime slug to test');

            const resultsDiv = document.getElementById('testResults');
            const playersDiv = document.getElementById('playerPreviews');
            resultsDiv.innerHTML = '<div class="message info">Testing all URL patterns... Please wait</div>';
            playersDiv.innerHTML = '';

            const response = await fetch('/admin/test-anime', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    slug: slug,
                    season: parseInt(season),
                    episode: parseInt(episode)
                })
            });

            const data = await response.json();
            if (data.success) {
                let serversHtml = '';
                let playersHtml = '';
                
                if (data.servers && data.servers.length > 0) {
                    serversHtml = '<div class="server-list"><strong>Found ' + data.servers.length + ' servers:</strong>';
                    playersHtml = '<h3>🎬 Player Previews</h3>';
                    
                    data.servers.forEach((server, index) => {
                        serversHtml += '<div class="server-item">' +
                            '<strong>Server ' + (index + 1) + ':</strong> ' + (server.server || 'Unknown') + '<br>' +
                            '<small>URL: ' + server.url + '</small>' +
                            '</div>';
                            
                        playersHtml += '<div class="player-preview">' +
                            '<div class="player-header">🎮 Server ' + (index + 1) + ' - ' + (server.server || 'Unknown') + '</div>' +
                            '<iframe class="player-frame" src="/api/iframe?url=' + encodeURIComponent(server.url) + '"></iframe>' +
                            '</div>';
                    });
                    serversHtml += '</div>';
                }

                resultsDiv.innerHTML = '<div class="message success">' +
                    '<strong>✅ Success!</strong><br>' +
                    'Used Pattern: ' + (data.usedPattern || 'Unknown') + '<br>' +
                    'URL: ' + data.url + '<br>' +
                    'Servers Found: ' + data.serverCount +
                    serversHtml +
                    '</div>';
                    
                playersDiv.innerHTML = playersHtml;
            } else {
                resultsDiv.innerHTML = '<div class="message error">' +
                    '<strong>❌ Failed!</strong><br>' +
                    'Error: ' + data.error +
                    '</div>';
                playersDiv.innerHTML = '';
            }
        }

        async function testAnimeById(id) {
            const response = await fetch('/admin/stats');
            const data = await response.json();
            const anime = data.database.find(a => a.id === id);
            
            if (anime) {
                document.getElementById('testSlug').value = anime.slug;
                switchTab('testPlayers');
                setTimeout(() => testAnimeUrl(), 100);
            }
        }

        function quickTest() {
            switchTab('testPlayers');
            document.getElementById('testSlug').value = 'one-piece';
            document.getElementById('testSeason').value = '1';
            document.getElementById('testEpisode').value = '1';
        }

        function refreshStats() {
            if (currentTab === 'dashboard') loadDashboard();
            if (currentTab === 'database') loadDatabaseTable();
            if (currentTab === 'analytics') loadAnalytics();
        }

        function refreshDatabase() {
            loadDatabaseTable();
        }

        function exportDatabase() {
            alert('Export feature coming soon!');
        }

        function showMessage(elementId, message, type) {
            const element = document.getElementById(elementId);
            element.innerHTML = '<div class="message ' + type + '">' + message + '</div>';
            setTimeout(() => element.innerHTML = '', 5000);
        }

        // Initialize
        function updateTestUrl() {
            const slug = document.getElementById('testSlug').value || 'one-piece';
            const season = document.getElementById('testSeason').value || '1';
            const episode = document.getElementById('testEpisode').value || '1';
            
            document.getElementById('testUrlPreview').textContent = 
                'Testing: /episode/' + slug + '-' + season + 'x' + episode + '/ and 7+ more patterns';
        }

        // Set up event listeners
        document.getElementById('testSlug').addEventListener('input', updateTestUrl);
        document.getElementById('testSeason').addEventListener('input', updateTestUrl);
        document.getElementById('testEpisode').addEventListener('input', updateTestUrl);
        updateTestUrl();
    </script>
</body>
</html>`);
});

// Initialize and start server
const PORT = process.env.PORT || 3000;

async function startServer() {
  await loadDatabase();
  app.listen(PORT, () => {
    console.log(`
🎬 ULTIMATE ANIMEWORLD API v7.0 - ENHANCED ACCURACY
───────────────────────────────────────────
📍 Port: ${PORT}
📊 Database: ${Object.keys(animeDatabase).length} anime
🎲 Random Pool: ${randomAnimePool.length} anime
🔗 API: http://localhost:${PORT}
🔗 Admin: http://localhost:${PORT}/admin
🔑 Password: admin123

🎯 ENHANCED FEATURES:
• Improved URL pattern detection (8+ patterns)
• Better iframe extraction with multiple attributes
• Enhanced server detection
• Pterodactyl-style admin panel
• Real-time analytics
• Quick testing tools

📺 ENDPOINTS:
• /api/anime/:id/:season/:episode - Stream episodes
• /api/random - Random content
• /api/iframe?url=URL - Clean player
• /health - Health check
───────────────────────────────────────────
    `);
  });
}

startServer();

// Error handling
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
});
