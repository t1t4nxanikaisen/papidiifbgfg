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
      hasAnilistId: entry.hasAnilistId,
      hasMultipleSeasons: entry.hasMultipleSeasons || false,
      totalSeasons: entry.totalSeasons || 1
    }))
  });
});

// Add anime to database
app.post('/admin/anime', async (req, res) => {
  const { id, name, slug, hasAnilistId, hasMultipleSeasons, totalSeasons } = req.body;

  if (!id || !name || !slug) {
    return res.status(400).json({ error: 'ID, name, and slug are required' });
  }

  // Add to database
  animeDatabase[id] = {
    slug: slug,
    name: name,
    hasAnilistId: hasAnilistId || false,
    hasMultipleSeasons: hasMultipleSeasons || false,
    totalSeasons: totalSeasons || 1
  };

  // Add to random pool if it has AniList ID
  if (hasAnilistId && !randomAnimePool.includes(parseInt(id))) {
    randomAnimePool.push(parseInt(id));
  }

  await saveDatabase();

  res.json({ 
    success: true, 
    message: 'Anime added to database',
    anime: { id, name, slug, hasAnilistId, hasMultipleSeasons, totalSeasons }
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

// Test anime URL endpoint - ENHANCED FOR MULTI-SEASON
app.post('/admin/test-anime', async (req, res) => {
  const { slug, season, episode, hasMultipleSeasons } = req.body;

  if (!slug) {
    return res.status(400).json({ error: 'Slug is required' });
  }

  try {
    const testData = await findEpisodeEnhanced(slug, season || 1, episode || 1, 'Test Anime', hasMultipleSeasons);
    
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

// ==================== ENHANCED CORE FUNCTIONS ====================

// ENHANCED: Better episode finder with multi-season support
async function findEpisodeEnhanced(slug, season, episode, animeTitle = "", hasMultipleSeasons = false) {
  const baseUrl = 'https://watchanimeworld.in';
  
  console.log(`🔍 Enhanced search for: ${slug} S${season}E${episode} (Multi-season: ${hasMultipleSeasons})`);

  // Enhanced URL patterns with multi-season support
  const patterns = [
    // Primary pattern for multi-season: /episode/slug-seasonxepisode/
    {
      url: `${baseUrl}/episode/${slug}-${season}x${episode}/`,
      name: 'episode-seasonxepisode',
      priority: hasMultipleSeasons ? 10 : 5
    },
    // Alternative pattern: /episode/slug-sXXeXX/
    {
      url: `${baseUrl}/episode/${slug}-s${season.toString().padStart(2, '0')}e${episode.toString().padStart(2, '0')}/`,
      name: 'episode-sXXeXX',
      priority: 8
    },
    // Simple episode pattern (for single season)
    {
      url: `${baseUrl}/episode/${slug}-episode-${episode}/`,
      name: 'episode-simple',
      priority: hasMultipleSeasons ? 3 : 7
    },
    // Full format pattern
    {
      url: `${baseUrl}/episode/${slug}-season-${season}-episode-${episode}/`,
      name: 'episode-full',
      priority: 6
    },
    // Series format
    {
      url: `${baseUrl}/series/${slug}/season-${season}/episode-${episode}/`,
      name: 'series-season-episode',
      priority: 4
    },
    // Anime format
    {
      url: `${baseUrl}/anime/${slug}/episode-${episode}/`,
      name: 'anime-episode',
      priority: hasMultipleSeasons ? 2 : 5
    },
    // TV format
    {
      url: `${baseUrl}/tv/${slug}/episode-${episode}/`,
      name: 'tv-episode',
      priority: 3
    },
    // Watch format
    {
      url: `${baseUrl}/watch/${slug}/episode-${episode}/`,
      name: 'watch-episode',
      priority: 2
    }
  ];

  // Sort patterns by priority (higher priority first)
  patterns.sort((a, b) => b.priority - a.priority);

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
        validateStatus: (status) => status < 500
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

      if (servers.length > 0) {
        console.log(`🎉 Success with pattern ${pattern.name}! Found ${servers.length} servers`);
        await saveDatabase();
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

// ==================== PROFESSIONAL ADMIN PANEL ====================

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
            --sidebar-width: 280px;
            --header-height: 70px;
            --primary: #0f1419;
            --secondary: #1a1f2e;
            --accent: #5865f2;
            --accent-hover: #4752c4;
            --success: #23a55a;
            --danger: #f23f43;
            --warning: #f0b232;
            --text: #ffffff;
            --text-muted: #8b949e;
            --border: #30363d;
            --sidebar-bg: #0d1117;
            --card-bg: #161b22;
        }
        
        * { 
            margin: 0; 
            padding: 0; 
            box-sizing: border-box; 
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }
        
        body { 
            background: var(--primary);
            min-height: 100vh;
            color: var(--text);
            line-height: 1.6;
            display: flex;
            font-size: 14px;
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
            padding: 24px;
            border-bottom: 1px solid var(--border);
            text-align: center;
        }
        
        .sidebar-logo {
            font-size: 1.4em;
            font-weight: 700;
            color: var(--accent);
            margin-bottom: 4px;
            letter-spacing: -0.5px;
        }
        
        .sidebar-version {
            font-size: 0.75em;
            color: var(--text-muted);
            font-weight: 500;
        }
        
        .nav-section {
            padding: 20px 0;
            border-bottom: 1px solid var(--border);
        }
        
        .nav-title {
            padding: 0 24px 12px 24px;
            font-size: 0.75em;
            color: var(--text-muted);
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-weight: 600;
        }
        
        .nav-item {
            display: flex;
            align-items: center;
            padding: 12px 24px;
            color: var(--text);
            text-decoration: none;
            transition: all 0.2s ease;
            cursor: pointer;
            border-left: 3px solid transparent;
            font-weight: 500;
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
            margin-right: 12px;
            width: 18px;
            text-align: center;
            font-size: 1.1em;
        }
        
        /* Main Content Styles */
        .main-content {
            flex: 1;
            margin-left: var(--sidebar-width);
            min-height: 100vh;
            background: var(--primary);
        }
        
        .header {
            height: var(--header-height);
            background: var(--card-bg);
            border-bottom: 1px solid var(--border);
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 32px;
            position: sticky;
            top: 0;
            z-index: 100;
        }
        
        .header-title {
            font-size: 1.4em;
            font-weight: 700;
            color: var(--text);
        }
        
        .header-actions {
            display: flex;
            gap: 12px;
        }
        
        .content {
            padding: 32px;
            max-width: 1200px;
            margin: 0 auto;
        }
        
        /* Stats Grid */
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 24px;
            margin-bottom: 32px;
        }
        
        .stat-card {
            background: var(--card-bg);
            padding: 28px;
            border-radius: 12px;
            border: 1px solid var(--border);
            text-align: center;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        }
        
        .stat-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 3px;
            background: var(--accent);
        }
        
        .stat-card:hover {
            transform: translateY(-4px);
            border-color: var(--accent);
        }
        
        .stat-number {
            font-size: 2.8em;
            font-weight: 800;
            color: var(--accent);
            margin-bottom: 8px;
            line-height: 1;
        }
        
        .stat-label {
            color: var(--text-muted);
            font-size: 0.9em;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        /* Form Styles */
        .form-section {
            background: var(--card-bg);
            padding: 28px;
            border-radius: 12px;
            border: 1px solid var(--border);
            margin-bottom: 28px;
        }
        
        .form-section h3 {
            margin-bottom: 24px;
            color: var(--text);
            font-size: 1.3em;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 12px;
        }
        
        .form-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 24px;
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 8px;
            color: var(--text);
            font-weight: 600;
            font-size: 0.9em;
        }
        
        input, select, button, textarea {
            width: 100%;
            padding: 14px 16px;
            border: 1px solid var(--border);
            border-radius: 8px;
            font-size: 14px;
            background: var(--primary);
            color: var(--text);
            transition: all 0.2s ease;
            font-weight: 500;
        }
        
        input:focus, select:focus, textarea:focus {
            border-color: var(--accent);
            outline: none;
            box-shadow: 0 0 0 3px rgba(88, 101, 242, 0.1);
        }
        
        input::placeholder, textarea::placeholder {
            color: var(--text-muted);
        }
        
        button {
            background: var(--accent);
            border: none;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.2s ease;
            padding: 14px 24px;
        }
        
        button:hover {
            background: var(--accent-hover);
            transform: translateY(-1px);
        }
        
        button.success {
            background: var(--success);
        }
        
        button.success:hover {
            background: #1e954c;
        }
        
        button.danger {
            background: var(--danger);
        }
        
        button.danger:hover {
            background: #d6373b;
        }
        
        button.warning {
            background: var(--warning);
        }
        
        button.warning:hover {
            background: #d89d2a;
        }
        
        /* Database Table */
        .database-table {
            background: var(--card-bg);
            border-radius: 12px;
            border: 1px solid var(--border);
            overflow: hidden;
        }
        
        .table-header {
            padding: 24px;
            border-bottom: 1px solid var(--border);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .table-container {
            max-height: 600px;
            overflow-y: auto;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
        }
        
        th {
            background: var(--primary);
            padding: 16px;
            text-align: left;
            font-weight: 600;
            font-size: 0.85em;
            color: var(--text-muted);
            border-bottom: 1px solid var(--border);
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        td {
            padding: 16px;
            border-bottom: 1px solid var(--border);
            font-weight: 500;
        }
        
        tr:hover {
            background: rgba(88, 101, 242, 0.05);
        }
        
        .anime-actions {
            display: flex;
            gap: 8px;
        }
        
        .btn-sm {
            padding: 8px 16px;
            font-size: 12px;
            width: auto;
            border-radius: 6px;
        }
        
        /* Messages */
        .message {
            padding: 16px;
            border-radius: 8px;
            margin: 16px 0;
            font-weight: 600;
            border: 1px solid;
        }
        
        .message.success {
            background: rgba(35, 165, 90, 0.1);
            border-color: var(--success);
            color: var(--success);
        }
        
        .message.error {
            background: rgba(242, 63, 67, 0.1);
            border-color: var(--danger);
            color: var(--danger);
        }
        
        .message.info {
            background: rgba(88, 101, 242, 0.1);
            border-color: var(--accent);
            color: var(--accent);
        }
        
        /* Test Results */
        .test-results {
            background: var(--primary);
            border-radius: 8px;
            border: 1px solid var(--border);
            padding: 24px;
            margin-top: 20px;
        }
        
        .server-list {
            margin-top: 16px;
        }
        
        .server-item {
            background: var(--secondary);
            padding: 16px;
            margin: 12px 0;
            border-radius: 8px;
            border-left: 4px solid var(--accent);
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
            background: var(--card-bg);
            padding: 48px;
            border-radius: 16px;
            border: 1px solid var(--border);
            width: 100%;
            max-width: 420px;
            text-align: center;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        }
        
        .login-logo {
            font-size: 2.2em;
            margin-bottom: 12px;
            color: var(--accent);
            font-weight: 800;
        }
        
        .login-subtitle {
            color: var(--text-muted);
            margin-bottom: 32px;
            font-weight: 500;
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
            border-radius: 12px;
            margin: 16px 0;
            overflow: hidden;
        }
        
        .player-header {
            background: var(--accent);
            color: #fff;
            padding: 16px;
            font-weight: 600;
        }
        
        .player-frame {
            width: 100%;
            height: 320px;
            border: none;
        }
        
        /* Checkbox Styles */
        .checkbox-group {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 16px;
        }
        
        .checkbox-group input[type="checkbox"] {
            width: 18px;
            height: 18px;
        }
        
        .checkbox-group label {
            margin-bottom: 0;
            font-weight: 600;
        }
        
        /* Season Input */
        .season-input {
            display: none;
            margin-top: 16px;
        }
        
        .season-input.active {
            display: block;
        }
        
        /* URL Preview */
        .url-preview {
            background: var(--primary);
            padding: 16px;
            border-radius: 8px;
            border: 1px solid var(--border);
            margin: 16px 0;
            font-family: 'Monaco', 'Consolas', monospace;
            font-size: 13px;
        }
        
        /* Responsive */
        @media (max-width: 1024px) {
            .form-grid {
                grid-template-columns: 1fr;
            }
            
            .sidebar {
                width: 240px;
            }
            
            .main-content {
                margin-left: 240px;
            }
        }
        
        @media (max-width: 768px) {
            .sidebar {
                transform: translateX(-100%);
                transition: transform 0.3s ease;
            }
            
            .sidebar.active {
                transform: translateX(0);
            }
            
            .main-content {
                margin-left: 0;
            }
            
            .stats-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div id="loginPage" class="login-container">
        <div class="login-box">
            <div class="login-logo">ANIMEWORLD</div>
            <div class="login-subtitle">Administration Panel</div>
            <input type="password" id="password" placeholder="Enter administrator password" style="margin-bottom: 20px;">
            <button onclick="login()" style="width: 100%;">Authenticate</button>
            <div id="loginMessage" style="margin-top: 20px;"></div>
        </div>
    </div>

    <div id="adminPanel" style="display: none;">
        <!-- Sidebar -->
        <div class="sidebar">
            <div class="sidebar-header">
                <div class="sidebar-logo">ANIMEWORLD</div>
                <div class="sidebar-version">ADMIN PANEL</div>
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
                <div class="header-title" id="pageTitle">Dashboard Overview</div>
                <div class="header-actions">
                    <button class="btn-sm" onclick="refreshStats()">Refresh</button>
                    <button class="btn-sm warning" onclick="logout()">Logout</button>
                </div>
            </div>

            <div class="content">
                <!-- Dashboard Tab -->
                <div id="dashboard" class="tab-content active">
                    <h2>Dashboard Overview</h2>
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
                        <h3>Quick Actions</h3>
                        <div class="form-grid">
                            <div>
                                <button onclick="switchTab('addAnime')" class="success">Add New Anime</button>
                            </div>
                            <div>
                                <button onclick="switchTab('testPlayers')" class="warning">Test Players</button>
                            </div>
                        </div>
                    </div>

                    <div class="form-section">
                        <h3>Recent Activity</h3>
                        <div id="recentActivity">
                            Loading activity data...
                        </div>
                    </div>
                </div>

                <!-- Database Manager Tab -->
                <div id="database" class="tab-content">
                    <h2>Database Manager</h2>
                    <div class="form-section">
                        <h3>Anime Database</h3>
                        <div class="table-header">
                            <span>Total Entries: <span id="dbCount">0</span> anime</span>
                            <button onclick="refreshDatabase()" class="btn-sm">Refresh</button>
                        </div>
                        <div class="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Name</th>
                                        <th>Slug</th>
                                        <th>Type</th>
                                        <th>Seasons</th>
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
                    <h2>Add Anime</h2>
                    <div class="form-section">
                        <h3>Add Single Anime</h3>
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
                                <div class="form-group">
                                    <label>URL Slug</label>
                                    <input type="text" id="animeSlug" placeholder="URL-friendly slug">
                                    <div class="url-preview" style="margin-top: 8px; font-size: 12px;">
                                        URL Pattern: <span id="urlPatternPreview">/episode/slug-1x1/</span>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <div class="checkbox-group">
                                    <input type="checkbox" id="hasAnilistId" checked>
                                    <label for="hasAnilistId">Has AniList ID</label>
                                </div>
                                
                                <div class="checkbox-group">
                                    <input type="checkbox" id="hasMultipleSeasons" onchange="toggleSeasonInput()">
                                    <label for="hasMultipleSeasons">Multiple Seasons</label>
                                </div>
                                
                                <div class="form-group season-input" id="seasonInputGroup">
                                    <label>Total Seasons</label>
                                    <input type="number" id="totalSeasons" placeholder="Number of seasons" value="1" min="1" max="10">
                                </div>
                                
                                <button onclick="addAnime()" class="success" style="margin-top: 20px;">Add to Database</button>
                            </div>
                        </div>
                        <div id="addMessage"></div>
                    </div>

                    <div class="form-section">
                        <h3>Fetch from AniList</h3>
                        <div class="form-grid">
                            <div>
                                <input type="number" id="fetchAnilistId" placeholder="AniList ID (e.g., 101922)">
                            </div>
                            <div>
                                <button onclick="fetchAnimeInfo()">Fetch Information</button>
                            </div>
                        </div>
                        <div id="fetchMessage"></div>
                    </div>
                </div>

                <!-- Test Players Tab -->
                <div id="testPlayers" class="tab-content">
                    <h2>Test Players</h2>
                    <div class="form-section">
                        <h3>Test Anime URLs</h3>
                        <div class="form-grid">
                            <div>
                                <div class="form-group">
                                    <label>Anime Slug</label>
                                    <input type="text" id="testSlug" placeholder="e.g., bleach-thousand-year-blood-war" value="bleach-thousand-year-blood-war">
                                </div>
                                <div class="checkbox-group">
                                    <input type="checkbox" id="testMultipleSeasons" onchange="updateTestUrl()">
                                    <label for="testMultipleSeasons">Multiple Seasons</label>
                                </div>
                                <div class="form-group">
                                    <label>Season</label>
                                    <input type="number" id="testSeason" value="2" oninput="updateTestUrl()">
                                </div>
                                <div class="form-group">
                                    <label>Episode</label>
                                    <input type="number" id="testEpisode" value="1" oninput="updateTestUrl()">
                                </div>
                            </div>
                            <div>
                                <div class="url-preview">
                                    <strong>Testing URL Pattern:</strong><br>
                                    <span id="testUrlPreview">https://watchanimeworld.in/episode/bleach-thousand-year-blood-war-2x1/</span>
                                </div>
                                <button onclick="testAnimeUrl()" class="warning" style="margin-top: 20px;">Test All Patterns</button>
                            </div>
                        </div>
                        <div id="testResults"></div>
                        <div id="playerPreviews"></div>
                    </div>
                </div>

                <!-- Analytics Tab -->
                <div id="analytics" class="tab-content">
                    <h2>Analytics</h2>
                    <div class="form-section">
                        <h3>Performance Metrics</h3>
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
                'dashboard': 'Dashboard Overview',
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

        function toggleSeasonInput() {
            const hasMultipleSeasons = document.getElementById('hasMultipleSeasons').checked;
            const seasonInputGroup = document.getElementById('seasonInputGroup');
            
            if (hasMultipleSeasons) {
                seasonInputGroup.classList.add('active');
            } else {
                seasonInputGroup.classList.remove('active');
            }
            updateUrlPreview();
        }

        function updateUrlPreview() {
            const slug = document.getElementById('animeSlug').value || 'slug';
            const hasMultipleSeasons = document.getElementById('hasMultipleSeasons').checked;
            const totalSeasons = document.getElementById('totalSeasons').value || '1';
            
            let pattern = '/episode/' + slug + '-';
            if (hasMultipleSeasons) {
                pattern += totalSeasons + 'x1/';
            } else {
                pattern += 'episode-1/';
            }
            
            document.getElementById('urlPatternPreview').textContent = pattern;
        }

        function updateTestUrl() {
            const slug = document.getElementById('testSlug').value || 'bleach-thousand-year-blood-war';
            const season = document.getElementById('testSeason').value || '2';
            const episode = document.getElementById('testEpisode').value || '1';
            const hasMultipleSeasons = document.getElementById('testMultipleSeasons').checked;
            
            let url = 'https://watchanimeworld.in/episode/' + slug + '-';
            if (hasMultipleSeasons) {
                url += season + 'x' + episode + '/';
            } else {
                url += 'episode-' + episode + '/';
            }
            
            document.getElementById('testUrlPreview').textContent = url;
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
                '<div style="padding: 12px; border-bottom: 1px solid var(--border);">' +
                    '<strong>' + anime.name + '</strong> (ID: ' + anime.id + ')' +
                    '<div style="font-size: 0.8em; color: var(--text-muted); margin-top: 4px;">' +
                    'Slug: ' + anime.slug + 
                    (anime.hasMultipleSeasons ? ' | Seasons: ' + anime.totalSeasons : '') +
                    '</div>' +
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
                    '<td>' + (anime.hasMultipleSeasons ? anime.totalSeasons : '1') + '</td>' +
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
            const hasMultipleSeasons = document.getElementById('hasMultipleSeasons').checked;
            const totalSeasons = document.getElementById('totalSeasons').value || 1;

            if (!id || !name || !slug) {
                showMessage('addMessage', 'Please fill all required fields', 'error');
                return;
            }

            const response = await fetch('/admin/anime', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    id, 
                    name, 
                    slug, 
                    hasAnilistId, 
                    hasMultipleSeasons, 
                    totalSeasons: parseInt(totalSeasons) 
                })
            });

            const data = await response.json();
            if (data.success) {
                showMessage('addMessage', 'Anime added successfully to database', 'success');
                document.getElementById('animeId').value = '';
                document.getElementById('animeName').value = '';
                document.getElementById('animeSlug').value = '';
                document.getElementById('hasMultipleSeasons').checked = false;
                document.getElementById('totalSeasons').value = '1';
                toggleSeasonInput();
                loadDashboard();
            } else {
                showMessage('addMessage', 'Error: ' + data.error, 'error');
            }
        }

        async function fetchAnimeInfo() {
            const id = document.getElementById('fetchAnilistId').value;
            if (!id) return alert('Please enter AniList ID');

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
                showMessage('fetchMessage', 'Anime information fetched successfully', 'success');
                updateUrlPreview();
            } else {
                showMessage('fetchMessage', 'Error: ' + data.error, 'error');
            }
        }

        async function deleteAnime(id) {
            if (!confirm('Are you sure you want to delete this anime from the database?')) return;

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
            const hasMultipleSeasons = document.getElementById('testMultipleSeasons').checked;

            if (!slug) return alert('Please enter anime slug to test');

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
                    episode: parseInt(episode),
                    hasMultipleSeasons: hasMultipleSeasons
                })
            });

            const data = await response.json();
            if (data.success) {
                let serversHtml = '';
                let playersHtml = '';
                
                if (data.servers && data.servers.length > 0) {
                    serversHtml = '<div class="server-list"><strong>Found ' + data.servers.length + ' servers:</strong>';
                    playersHtml = '<h3 style="margin: 24px 0 16px 0;">Player Previews</h3>';
                    
                    data.servers.forEach((server, index) => {
                        serversHtml += '<div class="server-item">' +
                            '<strong>Server ' + (index + 1) + ':</strong> ' + (server.server || 'Unknown') + '<br>' +
                            '<small style="color: var(--text-muted);">URL: ' + server.url + '</small>' +
                            '</div>';
                            
                        playersHtml += '<div class="player-preview">' +
                            '<div class="player-header">Server ' + (index + 1) + ' - ' + (server.server || 'Unknown') + '</div>' +
                            '<iframe class="player-frame" src="/api/iframe?url=' + encodeURIComponent(server.url) + '"></iframe>' +
                            '</div>';
                    });
                    serversHtml += '</div>';
                }

                resultsDiv.innerHTML = '<div class="message success">' +
                    '<strong>Success!</strong><br>' +
                    'Used Pattern: ' + (data.usedPattern || 'Unknown') + '<br>' +
                    'URL: ' + data.url + '<br>' +
                    'Servers Found: ' + data.serverCount +
                    serversHtml +
                    '</div>';
                    
                playersDiv.innerHTML = playersHtml;
            } else {
                resultsDiv.innerHTML = '<div class="message error">' +
                    '<strong>Failed!</strong><br>' +
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
                document.getElementById('testMultipleSeasons').checked = anime.hasMultipleSeasons || false;
                if (anime.hasMultipleSeasons) {
                    document.getElementById('testSeason').value = anime.totalSeasons || 2;
                }
                switchTab('testPlayers');
                updateTestUrl();
                setTimeout(() => testAnimeUrl(), 100);
            }
        }

        function quickTest() {
            switchTab('testPlayers');
            document.getElementById('testSlug').value = 'bleach-thousand-year-blood-war';
            document.getElementById('testMultipleSeasons').checked = true;
            document.getElementById('testSeason').value = '2';
            document.getElementById('testEpisode').value = '1';
            updateTestUrl();
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
        document.getElementById('animeSlug').addEventListener('input', updateUrlPreview);
        document.getElementById('totalSeasons').addEventListener('input', updateUrlPreview);
        document.getElementById('hasMultipleSeasons').addEventListener('change', updateUrlPreview);
        
        document.getElementById('testSlug').addEventListener('input', updateTestUrl);
        document.getElementById('testSeason').addEventListener('input', updateTestUrl);
        document.getElementById('testEpisode').addEventListener('input', updateTestUrl);
        document.getElementById('testMultipleSeasons').addEventListener('change', updateTestUrl);
        
        updateUrlPreview();
        updateTestUrl();
        toggleSeasonInput();
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
