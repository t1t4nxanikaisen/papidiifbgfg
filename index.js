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

// Enhanced anime database with custom mappings
let animeDatabase = {
  // Bleach Series
  269: { slug: "bleach", name: "Bleach", hasAnilistId: true },
  41467: { slug: "bleach-thousand-year-blood-war", name: "Bleach: Thousand-Year Blood War", hasAnilistId: true },

  // Demon Slayer Series
  101922: { slug: "demon-slayer", name: "Demon Slayer", hasAnilistId: true },
  142329: { slug: "demon-slayer", name: "Demon Slayer Season 2", hasAnilistId: true }, 

  // Ben10 - Added with proper configuration
  998001: { slug: "ben-10", name: "Ben 10", hasAnilistId: false },

  // Popular anime for random pool
  20: { slug: "naruto", name: "Naruto", hasAnilistId: true },
  21: { slug: "one-piece", name: "One Piece", hasAnilistId: true },
  16498: { slug: "attack-on-titan", name: "Attack on Titan", hasAnilistId: true },
  113415: { slug: "jujutsu-kaisen", name: "Jujutsu Kaisen", hasAnilistId: true },
  127230: { slug: "chainsaw-man", name: "Chainsaw Man", hasAnilistId: true }
};

// Random anime pool
let randomAnimePool = [20, 113415, 127230, 101922, 16498, 998001];

// File paths for database
const DB_FILE = path.join(process.env.VERCEL ? '/tmp' : __dirname, 'anime_database.json');

// Load database
async function loadDatabase() {
  try {
    const data = await fs.readFile(DB_FILE, 'utf8');
    const savedData = JSON.parse(data);
    animeDatabase = { ...animeDatabase, ...savedData.animeDatabase };
    randomAnimePool = savedData.randomAnimePool || randomAnimePool;
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
    message: '🎬 Ultimate AnimeWorld API with Admin Panel',
    version: '5.0.0',
    endpoints: {
      '/api/anime/:id/:season/:episode': 'Stream anime episode',
      '/api/movie/:id': 'Stream anime movie',
      '/api/random': 'Random anime episode', 
      '/api/iframe?url=URL': 'Clean iframe player',
      '/admin': 'Admin panel (password: admin123)',
      '/health': 'Health check'
    }
  });
});

// Main streaming endpoint - Enhanced to handle any anime
app.get('/api/anime/:id/:season/:episode', async (req, res) => {
  try {
    const { id, season, episode } = req.params;
    const { server, json, clean } = req.query;

    console.log(`🎬 Streaming: ${id} S${season}E${episode}`);

    // Check if anime exists in database
    const dbEntry = animeDatabase[id];
    let animeInfo, slug, animeTitle;

    if (dbEntry) {
      // Use database entry
      slug = dbEntry.slug;
      animeTitle = dbEntry.name;

      if (dbEntry.hasAnilistId) {
        // Get updated info from AniList
        const anilistInfo = await getAnimeInfo(id);
        if (anilistInfo) {
          animeTitle = anilistInfo.title;
          // Update slug with latest title if different
          const newSlug = slugify(animeTitle);
          if (newSlug !== slug) {
            slug = newSlug;
            console.log(`🔄 Updated slug from AniList: ${slug}`);
          }
        }
      }

      console.log(`🎯 Using database: ${slug} (${animeTitle})`);
    } else {
      // Try to fetch from AniList
      animeInfo = await getAnimeInfo(id);
      if (!animeInfo) {
        return res.status(404).json({ 
          error: 'Anime not found. Add it to the database via /admin',
          suggestion: 'Use admin panel to add custom mapping'
        });
      }

      animeTitle = animeInfo.title;
      slug = slugify(animeTitle);
      console.log(`📡 Using AniList: ${slug}`);
    }

    // Find episode with multiple URL patterns
    const episodeData = await findEpisodeUniversal(slug, season, episode, animeTitle);
    if (!episodeData) {
      return res.status(404).json({ 
        error: 'Episode not found',
        anime_title: animeTitle,
        tried_slug: slug,
        season: season,
        episode: episode,
        suggestion: 'Try adding custom slug via admin panel'
      });
    }

    // Handle server selection
    if (server) {
      const serverIdx = parseInt(server) - 1;
      if (episodeData.servers[serverIdx]) {
        return clean ? sendCleanIframe(res, episodeData.servers[serverIdx].url) 
                     : sendPlayer(res, animeTitle, season, episode, episodeData.servers[serverIdx].url);
      }
      return res.status(404).send('Server not found');
    }

    // JSON response
    if (json) {
      return res.json({
        success: true,
        id: parseInt(id),
        title: animeTitle,
        season: parseInt(season),
        episode: parseInt(episode),
        slug: slug,
        from_database: !!dbEntry,
        episodeUrl: episodeData.url,
        servers: episodeData.servers,
        used_pattern: episodeData.usedPattern
      });
    }

    // Default: send player
    return clean ? sendCleanIframe(res, episodeData.servers[0].url)
                 : sendPlayer(res, animeTitle, season, episode, episodeData.servers[0].url);

  } catch (error) {
    console.error('💥 Error:', error.message);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Movie streaming endpoint
app.get('/api/movie/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { server, json, clean } = req.query;

    console.log(`🎬 Streaming Movie: ${id}`);

    // Check if anime exists in database
    const dbEntry = animeDatabase[id];
    let animeInfo, slug, animeTitle;

    if (dbEntry) {
      slug = dbEntry.slug;
      animeTitle = dbEntry.name;

      if (dbEntry.hasAnilistId) {
        const anilistInfo = await getAnimeInfo(id);
        if (anilistInfo) {
          animeTitle = anilistInfo.title;
          const newSlug = slugify(animeTitle);
          if (newSlug !== slug) {
            slug = newSlug;
          }
        }
      }
    } else {
      animeInfo = await getAnimeInfo(id);
      if (!animeInfo) {
        return res.status(404).json({ 
          error: 'Movie not found. Add it to the database via /admin'
        });
      }
      animeTitle = animeInfo.title;
      slug = slugify(animeTitle);
    }

    // Find movie with multiple URL patterns
    const movieData = await findMovieUniversal(slug, animeTitle);
    if (!movieData) {
      return res.status(404).json({ 
        error: 'Movie not found',
        movie_title: animeTitle,
        tried_slug: slug
      });
    }

    // Handle server selection
    if (server) {
      const serverIdx = parseInt(server) - 1;
      if (movieData.servers[serverIdx]) {
        return clean ? sendCleanIframe(res, movieData.servers[serverIdx].url) 
                     : sendPlayer(res, animeTitle, 'Movie', 'Full', movieData.servers[serverIdx].url);
      }
      return res.status(404).send('Server not found');
    }

    // JSON response
    if (json) {
      return res.json({
        success: true,
        id: parseInt(id),
        title: animeTitle,
        type: 'movie',
        slug: slug,
        from_database: !!dbEntry,
        movieUrl: movieData.url,
        servers: movieData.servers,
        used_pattern: movieData.usedPattern
      });
    }

    // Default: send player
    return clean ? sendCleanIframe(res, movieData.servers[0].url)
                 : sendPlayer(res, animeTitle, 'Movie', 'Full', movieData.servers[0].url);

  } catch (error) {
    console.error('💥 Movie Error:', error.message);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Random anime endpoint
app.get('/api/random', async (req, res) => {
  try {
    const { server, json, clean, type } = req.query;

    const randomId = randomAnimePool[Math.floor(Math.random() * randomAnimePool.length)];
    
    if (type === 'movie') {
      // Redirect to movie endpoint for random movie
      return res.redirect(`/api/movie/${randomId}?${new URLSearchParams(req.query).toString()}`);
    }

    const season = 1, episode = 1;
    console.log(`🎲 Random: ${randomId} S${season}E${episode}`);

    // Reuse main endpoint logic
    const dbEntry = animeDatabase[randomId];
    let animeTitle, slug;

    if (dbEntry) {
      slug = dbEntry.slug;
      animeTitle = dbEntry.name;

      if (dbEntry.hasAnilistId) {
        const anilistInfo = await getAnimeInfo(randomId);
        if (anilistInfo) animeTitle = anilistInfo.title;
      }
    } else {
      const animeInfo = await getAnimeInfo(randomId);
      if (!animeInfo) {
        return res.status(404).json({ error: 'Random anime not found' });
      }
      animeTitle = animeInfo.title;
      slug = slugify(animeTitle);
    }

    const episodeData = await findEpisodeUniversal(slug, season, episode, animeTitle);
    if (!episodeData) {
      return res.status(404).json({ error: 'Random episode not found' });
    }

    if (server) {
      const serverIdx = parseInt(server) - 1;
      if (episodeData.servers[serverIdx]) {
        return clean ? sendCleanIframe(res, episodeData.servers[serverIdx].url)
                     : sendPlayer(res, animeTitle, season, episode, episodeData.servers[serverIdx].url);
      }
      return res.status(404).send('Server not found');
    }

    if (json) {
      return res.json({
        success: true,
        id: randomId,
        title: animeTitle,
        season: season,
        episode: episode,
        slug: slug,
        from_database: !!dbEntry,
        episodeUrl: episodeData.url,
        servers: episodeData.servers,
        is_random: true,
        used_pattern: episodeData.usedPattern
      });
    }

    return clean ? sendCleanIframe(res, episodeData.servers[0].url)
                 : sendPlayer(res, animeTitle, season, episode, episodeData.servers[0].url);

  } catch (error) {
    console.error('💥 Random error:', error.message);
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
  res.json({ 
    status: 'active', 
    version: '5.0.0',
    database_entries: Object.keys(animeDatabase).length,
    random_pool: randomAnimePool.length
  });
});

// ==================== ADMIN PANEL ROUTES ====================

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
  res.json({
    totalAnime: Object.keys(animeDatabase).length,
    randomPool: randomAnimePool.length,
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

// Bulk add anime to database
app.post('/admin/bulk-anime', async (req, res) => {
  const { animeList } = req.body;

  if (!animeList || !Array.isArray(animeList)) {
    return res.status(400).json({ error: 'animeList array is required' });
  }

  const results = {
    added: 0,
    skipped: 0,
    errors: []
  };

  for (const anime of animeList) {
    try {
      const { id, name, slug, hasAnilistId } = anime;
      
      if (!id || !name || !slug) {
        results.errors.push(`Missing fields for anime: ${JSON.stringify(anime)}`);
        results.skipped++;
        continue;
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

      results.added++;
    } catch (error) {
      results.errors.push(`Error adding anime ${anime.id}: ${error.message}`);
      results.skipped++;
    }
  }

  await saveDatabase();

  res.json({ 
    success: true, 
    message: `Bulk add completed: ${results.added} added, ${results.skipped} skipped`,
    results
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

// Test anime URL endpoint - Enhanced
app.post('/admin/test-anime', async (req, res) => {
  const { slug, season, episode, type } = req.body;

  if (!slug) {
    return res.status(400).json({ error: 'Slug is required' });
  }

  try {
    let testData;
    if (type === 'movie') {
      testData = await findMovieUniversal(slug, 'Test Movie');
    } else {
      testData = await findEpisodeUniversal(slug, season || 1, episode || 1, 'Test Anime');
    }
    
    if (testData) {
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
        error: `No ${type === 'movie' ? 'movie' : 'episode'} found for slug: ${slug}`
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

// Get anime info from AniList
async function getAnimeInfo(anilistId) {
  try {
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

// Slugify title
function slugify(title) {
  return title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50);
}

// Universal episode finder with multiple patterns
async function findEpisodeUniversal(slug, season, episode, animeTitle = "") {
  const baseUrl = 'https://watchanimeworld.in';
  
  console.log(`🔍 Universal search for: ${slug} S${season}E${episode}`);

  // Multiple URL patterns to try
  const patterns = [
    // Pattern 1: /episode/slug-seasonxepisode/ (Primary)
    {
      url: `${baseUrl}/episode/${slug}-${season}x${episode}/`,
      name: 'episode-seasonxepisode'
    },
    // Pattern 2: /episode/slug-sXXeXX/ (Alternative format)
    {
      url: `${baseUrl}/episode/${slug}-s${season.toString().padStart(2, '0')}e${episode.toString().padStart(2, '0')}/`,
      name: 'episode-sXXeXX'
    },
    // Pattern 3: /episode/slug-episode-XX/ (Simple episode)
    {
      url: `${baseUrl}/episode/${slug}-episode-${episode}/`,
      name: 'episode-simple'
    },
    // Pattern 4: /episode/slug-season-XX-episode-XX/ (Full format)
    {
      url: `${baseUrl}/episode/${slug}-season-${season}-episode-${episode}/`,
      name: 'episode-full'
    },
    // Pattern 5: /series/slug/season-XX/episode-XX/ (Series format)
    {
      url: `${baseUrl}/series/${slug}/season-${season}/episode-${episode}/`,
      name: 'series-season-episode'
    },
    // Pattern 6: /anime/slug/episode-XX/ (Anime format)
    {
      url: `${baseUrl}/anime/${slug}/episode-${episode}/`,
      name: 'anime-episode'
    }
  ];

  for (const pattern of patterns) {
    console.log(`🔍 Trying pattern: ${pattern.name} - ${pattern.url}`);
    
    try {
      const { data, status } = await axios.get(pattern.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        },
        timeout: 8000,
        validateStatus: () => true
      });

      if (status === 404 || data.includes('404') || data.includes('Not Found')) {
        console.log(`❌ 404 for: ${pattern.name}`);
        continue;
      }

      if (status !== 200) {
        console.log(`⚠️ Status ${status} for: ${pattern.name}`);
        continue;
      }

      const $ = load(data);
      const servers = [];

      // Extract iframes
      $('iframe').each((i, el) => {
        const src = $(el).attr('src') || $(el).attr('data-src');
        if (src && src.includes('//')) {
          const fullUrl = src.startsWith('//') ? 'https:' + src : 
                         src.startsWith('/') ? baseUrl + src : src;
          servers.push({
            name: `Server ${servers.length + 1}`,
            url: fullUrl,
            type: 'iframe'
          });
          console.log(`✅ Found iframe: ${fullUrl}`);
        }
      });

      // Also look for video elements
      $('video source').each((i, el) => {
        const src = $(el).attr('src');
        if (src && src.includes('//')) {
          const fullUrl = src.startsWith('//') ? 'https:' + src : 
                         src.startsWith('/') ? baseUrl + src : src;
          servers.push({
            name: `Direct Video ${servers.length + 1}`,
            url: fullUrl,
            type: 'direct'
          });
        }
      });

      if (servers.length > 0) {
        console.log(`🎉 Success with pattern ${pattern.name}! Found ${servers.length} servers`);
        return { 
          url: pattern.url, 
          servers,
          usedPattern: pattern.name
        };
      } else {
        console.log(`❌ No iframes found with pattern: ${pattern.name}`);
      }

    } catch (error) {
      console.log(`🚫 Error with pattern ${pattern.name}: ${error.message}`);
      continue;
    }
  }

  console.log(`💥 All patterns failed for: ${slug}`);
  return null;
}

// Universal movie finder
async function findMovieUniversal(slug, movieTitle = "") {
  const baseUrl = 'https://watchanimeworld.in';
  
  console.log(`🎬 Universal movie search for: ${slug}`);

  // Multiple movie URL patterns to try
  const patterns = [
    // Pattern 1: /movies/slug/ (Primary)
    {
      url: `${baseUrl}/movies/${slug}/`,
      name: 'movies-slug'
    },
    // Pattern 2: /movie/slug/ (Alternative)
    {
      url: `${baseUrl}/movie/${slug}/`,
      name: 'movie-slug'
    },
    // Pattern 3: /anime/slug/ (Anime format)
    {
      url: `${baseUrl}/anime/${slug}/`,
      name: 'anime-slug'
    },
    // Pattern 4: /watch/slug/ (Watch format)
    {
      url: `${baseUrl}/watch/${slug}/`,
      name: 'watch-slug'
    }
  ];

  for (const pattern of patterns) {
    console.log(`🎬 Trying movie pattern: ${pattern.name} - ${pattern.url}`);
    
    try {
      const { data, status } = await axios.get(pattern.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        },
        timeout: 8000,
        validateStatus: () => true
      });

      if (status === 404 || data.includes('404') || data.includes('Not Found')) {
        console.log(`❌ 404 for movie pattern: ${pattern.name}`);
        continue;
      }

      if (status !== 200) {
        console.log(`⚠️ Status ${status} for movie pattern: ${pattern.name}`);
        continue;
      }

      const $ = load(data);
      const servers = [];

      // Extract iframes
      $('iframe').each((i, el) => {
        const src = $(el).attr('src') || $(el).attr('data-src');
        if (src && src.includes('//')) {
          const fullUrl = src.startsWith('//') ? 'https:' + src : 
                         src.startsWith('/') ? baseUrl + src : src;
          servers.push({
            name: `Server ${servers.length + 1}`,
            url: fullUrl,
            type: 'iframe'
          });
          console.log(`✅ Found movie iframe: ${fullUrl}`);
        }
      });

      if (servers.length > 0) {
        console.log(`🎉 Movie success with pattern ${pattern.name}! Found ${servers.length} servers`);
        return { 
          url: pattern.url, 
          servers,
          usedPattern: pattern.name
        };
      } else {
        console.log(`❌ No iframes found with movie pattern: ${pattern.name}`);
      }

    } catch (error) {
      console.log(`🚫 Error with movie pattern ${pattern.name}: ${error.message}`);
      continue;
    }
  }

  console.log(`💥 All movie patterns failed for: ${slug}`);
  return null;
}

// Send player
function sendPlayer(res, title, season, episode, videoUrl) {
  const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - S${season}E${episode}</title>
    <style>
        body,html{margin:0;padding:0;overflow:hidden;background:#000}
        iframe{width:100vw;height:100vh;border:none}
        .player-info{position:fixed;top:10px;left:10px;background:rgba(0,0,0,0.7);color:white;padding:10px;border-radius:5px;z-index:1000;font-family:Arial,sans-serif}
    </style>
</head>
<body>
    <div class="player-info">${title} - ${season === 'Movie' ? 'Movie' : `S${season}E${episode}`}</div>
    <iframe src="${videoUrl}" allow="autoplay;fullscreen" allowfullscreen loading="eager"></iframe>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
}

// Send clean iframe
function sendCleanIframe(res, url) {
  const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Player</title>
    <style>body,html{margin:0;padding:0;overflow:hidden;background:#000}iframe{width:100vw;height:100vh;border:none}</style>
</head>
<body>
    <iframe src="${url}" allow="autoplay;fullscreen" allowfullscreen loading="eager"></iframe>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
}

// ==================== ENHANCED ADMIN PANEL ====================

app.get('/admin', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AnimeWorld Admin</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial; background: #1a1a2e; color: white; padding: 20px; }
        .container { max-width: 1400px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 30px; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .stat-card { background: #16213e; padding: 20px; border-radius: 10px; text-align: center; }
        .stat-number { font-size: 2em; color: #4cc9f0; }
        .tabs { display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; }
        .tab { padding: 10px 20px; background: #16213e; border-radius: 5px; cursor: pointer; }
        .tab.active { background: #4cc9f0; color: #000; }
        .tab-content { display: none; }
        .tab-content.active { display: block; }
        .form-section { background: #16213e; padding: 20px; border-radius: 10px; margin-bottom: 20px; }
        input, select, button, textarea { width: 100%; padding: 10px; margin: 5px 0; background: #0f3460; border: 1px solid #4cc9f0; color: white; border-radius: 5px; }
        button { background: #4cc9f0; color: black; cursor: pointer; font-weight: bold; }
        button:hover { background: #3aa8d8; }
        button.secondary { background: #e94560; }
        button.success { background: #2ecc71; }
        button.warning { background: #f39c12; }
        .anime-list { max-height: 400px; overflow-y: auto; }
        .anime-item { display: flex; justify-content: space-between; padding: 10px; border-bottom: 1px solid #0f3460; align-items: center; }
        .delete-btn { background: #e94560; width: auto; padding: 5px 10px; }
        .test-btn { background: #f39c12; width: auto; padding: 5px 10px; }
        .message { padding: 10px; margin: 10px 0; border-radius: 5px; }
        .success { background: #2ecc71; color: white; }
        .error { background: #e74c3c; color: white; }
        .info { background: #3498db; color: white; }
        .server-list { margin-top: 10px; }
        .server-item { background: #0f3460; padding: 8px; margin: 5px 0; border-radius: 5px; }
        .two-column { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
        .three-column { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; }
        .player-preview { background: #000; border: 2px solid #4cc9f0; border-radius: 10px; margin: 10px 0; overflow: hidden; }
        .player-header { background: #4cc9f0; color: #000; padding: 10px; font-weight: bold; }
        .player-frame { width: 100%; height: 300px; border: none; }
        .bulk-textarea { height: 200px; font-family: monospace; font-size: 12px; }
        .format-example { background: #0f3460; padding: 10px; border-radius: 5px; margin: 10px 0; font-family: monospace; font-size: 12px; }
        @media (max-width: 768px) {
            .two-column, .three-column { grid-template-columns: 1fr; }
        }
        .url-preview { background: #0f3460; padding: 10px; border-radius: 5px; margin: 10px 0; font-family: monospace; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎬 AnimeWorld API Admin Panel v5.0</h1>
            <p>Universal Anime Fetcher + Bulk Management</p>
        </div>

        <div id="login" class="form-section">
            <h3>🔐 Admin Login</h3>
            <input type="password" id="password" placeholder="Enter admin password (admin123)">
            <button onclick="login()">Login</button>
            <div id="loginMessage"></div>
        </div>

        <div id="adminPanel" style="display: none;">
            <div class="stats">
                <div class="stat-card">
                    <div class="stat-number" id="totalAnime">0</div>
                    <div>Total Anime</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number" id="randomPool">0</div>
                    <div>Random Pool</div>
                </div>
            </div>

            <div class="tabs">
                <div class="tab active" onclick="switchTab('add')">➕ Add Single</div>
                <div class="tab" onclick="switchTab('bulk')">📦 Bulk Add</div>
                <div class="tab" onclick="switchTab('database')">📊 Database</div>
                <div class="tab" onclick="switchTab('test')">🧪 Test Players</div>
            </div>

            <div id="addTab" class="tab-content active">
                <div class="form-section">
                    <h3>➕ Add Single Anime</h3>
                    <div class="two-column">
                        <div>
                            <div>
                                <input type="checkbox" id="useAnilist" checked onchange="toggleIdType()">
                                <label for="useAnilist">Use AniList ID (untick for Custom ID)</label>
                            </div>

                            <div id="anilistGroup">
                                <input type="number" id="anilistId" placeholder="AniList ID (e.g., 101922)">
                                <button onclick="fetchAnimeInfo()">🔍 Fetch from AniList</button>
                            </div>

                            <div id="customGroup" style="display: none;">
                                <input type="number" id="customId" placeholder="Custom ID (e.g., 999001)">
                            </div>

                            <input type="text" id="animeName" placeholder="Anime Name">
                            <input type="text" id="animeSlug" placeholder="URL Slug (e.g., demon-slayer)">
                        </div>
                        <div>
                            <div class="url-preview">
                                <strong>URL Patterns Supported:</strong><br>
                                • /episode/<span id="slugPreview">slug</span>-1x1/<br>
                                • /episode/<span id="slugPreview2">slug</span>-s01e01/<br>
                                • /movies/<span id="slugPreview3">slug</span>/<br>
                                • 6+ more patterns
                            </div>
                            
                            <button onclick="addAnime()" class="success">✅ Add to Database</button>
                        </div>
                    </div>
                    <div id="addMessage"></div>
                </div>
            </div>

            <div id="bulkTab" class="tab-content">
                <div class="form-section">
                    <h3>📦 Bulk Add Anime</h3>
                    <p>Add multiple anime at once using JSON format:</p>
                    
                    <div class="format-example">
                        <strong>Format Example:</strong><br>
                        [<br>
                        &nbsp;&nbsp;{<br>
                        &nbsp;&nbsp;&nbsp;&nbsp;"id": "1001",<br>
                        &nbsp;&nbsp;&nbsp;&nbsp;"name": "Naruto Shippuden",<br>
                        &nbsp;&nbsp;&nbsp;&nbsp;"slug": "naruto-shippuden",<br>
                        &nbsp;&nbsp;&nbsp;&nbsp;"hasAnilistId": true<br>
                        &nbsp;&nbsp;},<br>
                        &nbsp;&nbsp;{<br>
                        &nbsp;&nbsp;&nbsp;&nbsp;"id": "1002", <br>
                        &nbsp;&nbsp;&nbsp;&nbsp;"name": "One Punch Man",<br>
                        &nbsp;&nbsp;&nbsp;&nbsp;"slug": "one-punch-man",<br>
                        &nbsp;&nbsp;&nbsp;&nbsp;"hasAnilistId": true<br>
                        &nbsp;&nbsp;}<br>
                        ]
                    </div>

                    <textarea id="bulkAnimeData" class="bulk-textarea" placeholder="Paste your anime JSON array here..."></textarea>
                    
                    <button onclick="addBulkAnime()" class="success">📦 Add Multiple Anime</button>
                    <div id="bulkMessage"></div>
                </div>
            </div>

            <div id="databaseTab" class="tab-content">
                <div class="form-section">
                    <h3>📊 Current Database</h3>
                    <div class="anime-list" id="animeList">
                        Loading...
                    </div>
                </div>
            </div>

            <div id="testTab" class="tab-content">
                <div class="form-section">
                    <h3>🧪 Test Anime Players</h3>
                    <p>Test if your anime slug works with all URL patterns</p>
                    
                    <div class="two-column">
                        <div>
                            <input type="text" id="testSlug" placeholder="Anime Slug (e.g., shinchan)" oninput="updateTestUrl()">
                            <input type="number" id="testSeason" placeholder="Season (default: 1)" value="1" oninput="updateTestUrl()">
                            <input type="number" id="testEpisode" placeholder="Episode (default: 1)" value="1" oninput="updateTestUrl()">
                            <select id="testType" onchange="updateTestUrl()">
                                <option value="episode">Episode</option>
                                <option value="movie">Movie</option>
                            </select>
                        </div>
                        <div>
                            <div class="url-preview">
                                <strong>Testing URL Patterns:</strong><br>
                                <span id="testUrlPreview">Multiple patterns will be tested automatically</span>
                            </div>
                            <button onclick="testAnimeUrl()" class="test-btn">🧪 Test All URL Patterns</button>
                        </div>
                    </div>
                    
                    <div id="testResults"></div>
                    <div id="playerPreviews"></div>
                </div>
            </div>
        </div>
    </div>

    <script>
        function toggleIdType() {
            const useAnilist = document.getElementById('useAnilist').checked;
            document.getElementById('anilistGroup').style.display = useAnilist ? 'block' : 'none';
            document.getElementById('customGroup').style.display = useAnilist ? 'none' : 'block';
        }

        function updateSlugPreview() {
            const slug = document.getElementById('animeSlug').value || 'slug';
            document.getElementById('slugPreview').textContent = slug;
            document.getElementById('slugPreview2').textContent = slug;
            document.getElementById('slugPreview3').textContent = slug;
        }

        function updateTestUrl() {
            const slug = document.getElementById('testSlug').value || 'slug';
            const season = document.getElementById('testSeason').value || '1';
            const episode = document.getElementById('testEpisode').value || '1';
            const type = document.getElementById('testType').value;
            
            if (type === 'movie') {
                document.getElementById('testUrlPreview').textContent = 
                    'Testing: /movies/' + slug + '/, /movie/' + slug + '/, /anime/' + slug + '/';
            } else {
                document.getElementById('testUrlPreview').textContent = 
                    'Testing: /episode/' + slug + '-' + season + 'x' + episode + '/, /episode/' + slug + '-s' + season.toString().padStart(2, '0') + 'e' + episode.toString().padStart(2, '0') + '/, and 4+ more patterns';
            }
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
                document.getElementById('login').style.display = 'none';
                document.getElementById('adminPanel').style.display = 'block';
                loadStats();
            } else {
                showMessage('loginMessage', data.error, 'error');
            }
        }

        async function fetchAnimeInfo() {
            const anilistId = document.getElementById('anilistId').value;
            if (!anilistId) return alert('Enter AniList ID');

            const response = await fetch('/admin/fetch-info', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: anilistId })
            });

            const data = await response.json();
            if (data.success) {
                document.getElementById('animeName').value = data.name;
                document.getElementById('animeSlug').value = data.slug;
                showMessage('addMessage', '✅ Anime info fetched successfully!', 'success');
                updateSlugPreview();
            } else {
                showMessage('addMessage', '❌ Failed to fetch: ' + data.error, 'error');
            }
        }

        async function addAnime() {
            const useAnilist = document.getElementById('useAnilist').checked;
            const id = useAnilist ? document.getElementById('anilistId').value : document.getElementById('customId').value;
            const name = document.getElementById('animeName').value;
            const slug = document.getElementById('animeSlug').value;

            if (!id || !name || !slug) return alert('Please fill all fields');

            const response = await fetch('/admin/anime', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: id,
                    name: name,
                    slug: slug,
                    hasAnilistId: useAnilist
                })
            });

            const data = await response.json();
            if (data.success) {
                showMessage('addMessage', '✅ Anime added successfully!', 'success');
                document.getElementById('anilistId').value = '';
                document.getElementById('customId').value = '';
                document.getElementById('animeName').value = '';
                document.getElementById('animeSlug').value = '';
                loadStats();
            } else {
                showMessage('addMessage', '❌ ' + data.error, 'error');
            }
        }

        async function addBulkAnime() {
            const bulkData = document.getElementById('bulkAnimeData').value;
            if (!bulkData) return alert('Please paste anime data in JSON format');

            try {
                const animeList = JSON.parse(bulkData);
                if (!Array.isArray(animeList)) {
                    throw new Error('Data must be a JSON array');
                }

                const response = await fetch('/admin/bulk-anime', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ animeList })
                });

                const data = await response.json();
                if (data.success) {
                    showMessage('bulkMessage', '✅ ' + data.message, 'success');
                    document.getElementById('bulkAnimeData').value = '';
                    loadStats();
                    
                    // Show detailed results
                    if (data.results) {
                        const details = 'Added: ' + data.results.added + ', Skipped: ' + data.results.skipped;
                        showMessage('bulkMessage', '✅ ' + data.message + '<br>' + details, 'success');
                    }
                } else {
                    showMessage('bulkMessage', '❌ ' + data.error, 'error');
                }
            } catch (error) {
                showMessage('bulkMessage', '❌ Invalid JSON format: ' + error.message, 'error');
            }
        }

        async function testAnimeUrl() {
            const slug = document.getElementById('testSlug').value;
            const season = document.getElementById('testSeason').value || 1;
            const episode = document.getElementById('testEpisode').value || 1;
            const type = document.getElementById('testType').value;

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
                    episode: parseInt(episode),
                    type: type
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
                            '<strong>Server ' + (index + 1) + ':</strong> ' + server.name + '<br>' +
                            '<small>URL: ' + server.url + '</small>' +
                            '</div>';
                            
                        playersHtml += '<div class="player-preview">' +
                            '<div class="player-header">🎮 ' + server.name + ' - ' + server.url + '</div>' +
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

        async function loadStats() {
            const response = await fetch('/admin/stats');
            const data = await response.json();

            document.getElementById('totalAnime').textContent = data.totalAnime;
            document.getElementById('randomPool').textContent = data.randomPool;

            // Update anime list
            const list = document.getElementById('animeList');
            list.innerHTML = data.database.map(anime => 
                '<div class="anime-item">' +
                    '<div>' +
                        '<strong>' + anime.name + '</strong>' +
                        '<div>ID: ' + anime.id + ' | Slug: ' + anime.slug + '</div>' +
                        '<div>Type: ' + (anime.hasAnilistId ? 'AniList' : 'Custom') + '</div>' +
                    '</div>' +
                    '<div>' +
                        '<button class="test-btn" onclick="testExistingAnime(' + anime.id + ')">Test</button>' +
                        '<button class="delete-btn" onclick="deleteAnime(' + anime.id + ')">Delete</button>' +
                    '</div>' +
                '</div>'
            ).join('');
        }

        async function testExistingAnime(id) {
            const response = await fetch('/admin/stats');
            const data = await response.json();
            const anime = data.database.find(a => a.id === id);
            
            if (anime) {
                document.getElementById('testSlug').value = anime.slug;
                switchTab('test');
                setTimeout(() => testAnimeUrl(), 100);
            }
        }

        async function deleteAnime(id) {
            if (!confirm('Delete this anime?')) return;

            const response = await fetch('/admin/anime/' + id, { method: 'DELETE' });
            const data = await response.json();

            if (data.success) {
                loadStats();
            } else {
                alert('Failed to delete: ' + data.error);
            }
        }

        function switchTab(tabName) {
            document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
            document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));

            document.getElementById(tabName + 'Tab').classList.add('active');
            event.target.classList.add('active');

            if (tabName === 'database') loadStats();
        }

        function showMessage(elementId, message, type) {
            const element = document.getElementById(elementId);
            element.innerHTML = '<div class="message ' + type + '">' + message + '</div>';
            setTimeout(() => element.innerHTML = '', 8000);
        }

        // Initialize
        toggleIdType();
        document.getElementById('animeSlug').addEventListener('input', updateSlugPreview);
        updateSlugPreview();
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
🎬 ULTIMATE ANIMEWORLD API v5.0 - UNIVERSAL FETCH
───────────────────────────────────────────
📍 Port: ${PORT}
📊 Database: ${Object.keys(animeDatabase).length} anime
🎲 Random Pool: ${randomAnimePool.length} anime
🔗 API: http://localhost:${PORT}
🔗 Admin: http://localhost:${PORT}/admin
🔑 Password: admin123

📺 ENDPOINTS:
• /api/anime/:id/:season/:episode - Stream episodes
• /api/movie/:id - Stream movies  
• /api/random - Random content
• /api/iframe?url=URL - Clean player

🎯 PATTERNS SUPPORTED:
• /episode/slug-seasonxepisode/
• /episode/slug-sXXeXX/
• /episode/slug-episode-XX/
• /movies/slug/ (Movies)
• /movie/slug/ (Movies)
• And 6+ more patterns...
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
