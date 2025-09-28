import express from 'express';
import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs/promises';
import path from 'path';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Persistent session store
let sessions = new Set();

// Dynamic slug database
let slugExceptions = {
  269: { slug: "bleach", name: "Bleach", hasAnilistId: true },
  41467: { slug: "bleach-thousand-year-blood-war", name: "Bleach: Thousand-Year Blood War", hasAnilistId: true },
  101922: { slug: "demon-slayer", name: "Demon Slayer", hasAnilistId: true },
  142329: { slug: "demon-slayer", name: "Demon Slayer Season 2", hasAnilistId: true }, 
  145139: { slug: "demon-slayer", name: "Demon Slayer Season 3", hasAnilistId: true }, 
  166240: { slug: "demon-slayer", name: "Demon Slayer Season 4", hasAnilistId: true },
  20: { slug: "naruto", name: "Naruto", hasAnilistId: true },
  1735: { slug: "naruto-shippuden", name: "Naruto Shippuden", hasAnilistId: true },
  21: { slug: "one-piece", name: "One Piece", hasAnilistId: true },
  16498: { slug: "attack-on-titan", name: "Attack on Titan", hasAnilistId: true },
  25777: { slug: "attack-on-titan", name: "Attack on Titan Season 2", hasAnilistId: true },
  35760: { slug: "attack-on-titan", name: "Attack on Titan Season 3", hasAnilistId: true }, 
  139630: { slug: "attack-on-titan", name: "Attack on Titan Final Season", hasAnilistId: true },
  113415: { slug: "jujutsu-kaisen", name: "Jujutsu Kaisen", hasAnilistId: true },
  145134: { slug: "jujutsu-kaisen", name: "Jujutsu Kaisen Season 2", hasAnilistId: true },
  97940: { slug: "black-clover", name: "Black Clover", hasAnilistId: true },
  21087: { slug: "one-punch-man", name: "One Punch Man", hasAnilistId: true },
  11061: { slug: "hunter-x-hunter-2011", name: "Hunter x Hunter (2011)", hasAnilistId: true },
  1535: { slug: "death-note", name: "Death Note", hasAnilistId: true },
  127230: { slug: "chainsaw-man", name: "Chainsaw Man", hasAnilistId: true }
};

// Random anime pool
let randomAnimePool = [20, 113415, 127230, 97940, 21087, 16498];

// API statistics
let apiStats = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  lastUpdated: new Date().toISOString()
};

// Load/Save database functions
async function loadDatabase() {
  try {
    const data = await fs.readFile('anime_database.json', 'utf8');
    const savedData = JSON.parse(data);
    slugExceptions = { ...slugExceptions, ...savedData.slugExceptions };
    randomAnimePool = savedData.randomAnimePool || randomAnimePool;
    apiStats = savedData.apiStats || apiStats;
    console.log(`📊 Loaded ${Object.keys(slugExceptions).length} entries from database`);
  } catch (error) {
    console.log('📊 Using default database (file not found)');
    await saveDatabase();
  }
}

async function saveDatabase() {
  try {
    const dataToSave = {
      slugExceptions,
      randomAnimePool,
      apiStats,
      lastSaved: new Date().toISOString()
    };
    await fs.writeFile('anime_database.json', JSON.stringify(dataToSave, null, 2));
    console.log('💾 Database saved successfully');
  } catch (error) {
    console.error('❌ Failed to save database:', error.message);
  }
}

// Load/Save sessions
async function loadSessions() {
  try {
    const data = await fs.readFile('sessions.json', 'utf8');
    const savedSessions = JSON.parse(data);
    sessions = new Set(savedSessions);
    console.log(`🔑 Loaded ${sessions.size} active sessions`);
  } catch (error) {
    console.log('🔑 No saved sessions found');
  }
}

async function saveSessions() {
  try {
    await fs.writeFile('sessions.json', JSON.stringify([...sessions], null, 2));
  } catch (error) {
    console.error('❌ Failed to save sessions:', error.message);
  }
}

// Track API usage
function trackAPIUsage(success = true) {
  apiStats.totalRequests++;
  if (success) {
    apiStats.successfulRequests++;
  } else {
    apiStats.failedRequests++;
  }
  apiStats.lastUpdated = new Date().toISOString();
}

// Authentication middleware
function requireAuth(req, res, next) {
  const sessionId = req.headers.authorization;
  if (sessions.has(sessionId)) {
    next();
  } else {
    res.status(401).json({ error: 'Authentication required' });
  }
}

// Get anime info from AniList API
async function getAnimeInfo(anilistId) {
  try {
    console.log(`🔍 Fetching AniList info for ID: ${anilistId}`);
    const query = `
      query ($id: Int) {
        Media (id: $id, type: ANIME) {
          id
          title {
            romaji
            english
            native
          }
          synonyms
          season
          seasonYear
          format
          type
          episodes
          status
        }
      }
    `;

    const response = await axios.post('https://graphql.anilist.co', {
      query,
      variables: { id: parseInt(anilistId) }
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      timeout: 10000
    });

    if (response.data.data && response.data.data.Media) {
      const media = response.data.data.Media;
      const info = {
        id: media.id,
        english: media.title.english,
        romaji: media.title.romaji,
        native: media.title.native,
        synonyms: media.synonyms || [],
        season: media.season,
        year: media.seasonYear,
        format: media.format,
        type: media.type,
        episodes: media.episodes,
        status: media.status
      };
      console.log(`✅ Found: ${info.english || info.romaji}`);
      return info;
    }
    console.log(`❌ No data found for ID: ${anilistId}`);
    return null;
  } catch (error) {
    console.log(`❌ AniList API failed for ID ${anilistId}: ${error.message}`);
    return null;
  }
}

// Enhanced slug generation
function generateSlugs(animeInfo, anilistId) {
  // Check exception database first
  if (slugExceptions[anilistId]) {
    const dbEntry = slugExceptions[anilistId];
    const slug = dbEntry.slug;
    console.log(`🎯 Using database mapping: ${slug}`);
    return [slug];
  }

  // Generate natural slugs from anime info
  const titles = [];
  if (animeInfo.english) titles.push(animeInfo.english);
  if (animeInfo.romaji) titles.push(animeInfo.romaji);
  animeInfo.synonyms.slice(0, 2).forEach(syn => titles.push(syn));
  
  const slugs = [];
  
  titles.forEach(title => {
    // Aggressive title cleaning
    let cleanTitle = title
      .replace(/Season \d+/gi, '') 
      .replace(/Part \d+/gi, '')   
      .replace(/\d+(st|nd|rd|th) Season/gi, '') 
      .replace(/: Season \d+/gi, '') 
      .replace(/- Season \d+/gi, '') 
      .replace(/\(TV\)/gi, '')       
      .replace(/\(OVA\)/gi, '')      
      .replace(/\(Movie\)/gi, '')    
      .replace(/\(\d{4}\)/gi, '')
      .replace(/: [^:]*$/gi, '')
      .trim();

    // Generate clean slug
    const slug = cleanTitle
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') 
      .replace(/\s+/g, '-')         
      .replace(/-+/g, '-')          
      .replace(/^-+|-+$/g, '')      
      .substring(0, 50);

    if (slug && slug.length > 2 && !slugs.includes(slug)) {
      slugs.push(slug);
    }
  });

  return slugs;
}

// Enhanced episode finder
async function findEpisode(slugs, season, episode, animeInfo) {
  const baseUrl = 'https://watchanimeworld.in';
  
  for (const slug of slugs) {
    console.log(`🎯 Trying slug: ${slug}`);
    
    const pathConfigs = [
      {
        type: 'episode',
        patterns: [
          `/episode/${slug}-${season}x${episode}/`,
          `/episode/${slug}-season-${season}-episode-${episode}/`,
          `/episode/${slug}-s${season}e${episode}/`,
          `/episode/${slug}-ep-${episode}/`,
          `/episode/${slug}-${season}-${episode}/`
        ]
      },
      {
        type: 'series',
        patterns: [
          `/series/${slug}/`,
          `/series/${slug}/season-${season}/episode-${episode}/`,
          `/series/${slug}/episode-${episode}/`,
          `/series/${slug}/${season}/${episode}/`,
          `/series/${slug}/${episode}/`
        ]
      }
    ];

    for (const config of pathConfigs) {
      for (const pattern of config.patterns) {
        const episodeUrl = baseUrl + pattern;
        
        try {
          const response = await axios.get(episodeUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              'Accept': 'text/html,application/xhtml+xml',
              'Referer': 'https://watchanimeworld.in/'
            },
            timeout: 8000,
            validateStatus: (status) => status < 500
          });

          if (response.status === 200) {
            const $ = cheerio.load(response.data);
            
            const pageTitle = $('title').text().toLowerCase();
            const hasVideo = $('iframe').length > 0 || $('video').length > 0;
            const notErrorPage = !pageTitle.includes('404') && !pageTitle.includes('not found');
            
            if (notErrorPage && hasVideo) {
              console.log(`✅ Valid page found: ${config.type}`);
              
              const sources = extractVideoSources($, baseUrl);
              
              return {
                url: episodeUrl,
                slug: slug,
                pathType: config.type,
                sources: sources
              };
            }
          }
        } catch (error) {
          // Silent fail for 404s
          continue;
        }
      }
    }
  }

  return null;
}

// Extract video sources
function extractVideoSources($, baseUrl) {
  const sources = [];

  $('iframe').each((i, el) => {
    const src = $(el).attr('src');
    if (src && !src.includes('about:blank') && src.includes('//')) {
      let fullUrl = src;
      if (src.startsWith('//')) {
        fullUrl = 'https:' + src;
      } else if (!src.startsWith('http') && src.startsWith('/')) {
        fullUrl = baseUrl + src;
      }
      
      if (fullUrl.includes('http')) {
        sources.push({
          url: fullUrl,
          type: 'iframe',
          server: detectServer(fullUrl),
          quality: 'HD'
        });
      }
    }
  });

  return sources.filter((source, index, self) => 
    index === self.findIndex(s => s.url === source.url)
  );
}

function detectServer(url) {
  const serverMap = {
    'streamtape': 'StreamTape',
    'dood': 'DoodStream',
    'filemoon': 'FileMoon',
    'mixdrop': 'MixDrop',
    'mp4upload': 'Mp4Upload'
  };

  const urlLower = url.toLowerCase();
  for (const [key, name] of Object.entries(serverMap)) {
    if (urlLower.includes(key)) return name;
  }
  return 'Unknown Server';
}

// Main streaming endpoint - UPDATED to always use clean iframe
app.get('/api/anime/:anilistId/:season/:episode', async (req, res) => {
  const { anilistId, season, episode } = req.params;
  const jsonMode = req.query.json === '1';

  console.log(`\n🎬 STREAMING: ID ${anilistId} - S${season}E${episode}`);
  
  try {
    // Check if this ID exists in our database first
    const isInDatabase = slugExceptions[anilistId];
    let animeInfo = null;
    let primaryTitle = 'Unknown Anime';

    if (isInDatabase) {
      const dbEntry = slugExceptions[anilistId];
      const dbSlug = dbEntry.slug;
      const dbName = dbEntry.name;
      
      console.log(`🎯 Found in database: ${dbSlug}`);
      
      // Try to get AniList info only if it has AniList ID
      if (dbEntry.hasAnilistId) {
        animeInfo = await getAnimeInfo(anilistId);
      }
      
      if (animeInfo) {
        primaryTitle = animeInfo.english || animeInfo.romaji;
        console.log(`📺 AniList info found: ${primaryTitle}`);
      } else {
        // Use stored name for custom entries
        primaryTitle = dbName;
        console.log(`📺 Custom entry: ${primaryTitle}`);
        
        // Create mock anime info for custom entries
        animeInfo = {
          english: primaryTitle,
          romaji: primaryTitle,
          format: 'TV'
        };
      }

      // Use database slug directly
      const slugs = [dbSlug];
      console.log(`🧠 Using database slug: ${slugs}`);

      // Find episode
      console.log('🎯 Searching for content...');
      const result = await findEpisode(slugs, season, episode, animeInfo);

      if (!result) {
        trackAPIUsage(false);
        return res.status(404).json({ 
          error: 'Content not found',
          anime_title: primaryTitle,
          tried_slugs: slugs
        });
      }

      console.log(`🎉 SUCCESS! Found on ${result.pathType} with ${result.sources.length} sources`);
      trackAPIUsage(true);

      const responseData = {
        success: true,
        id: parseInt(anilistId),
        anime_title: primaryTitle,
        season: parseInt(season),
        episode: parseInt(episode),
        slug: result.slug,
        content_url: result.url,
        sources: result.sources,
        from_database: true,
        has_anilist_id: dbEntry.hasAnilistId
      };

      if (jsonMode) {
        return res.json(responseData);
      }
// ALWAYS redirect to clean iframe when sources are found
if (result.sources.length > 0) {
  const primarySource = result.sources[0];
  return res.redirect(`/api/iframe?url=${encodeURIComponent(primarySource.url)}`);
}

      // Fallback to simple message if no sources but content found
      return res.send(`Content found at: ${result.url}`);

    } else {
      // Not in database, try AniList approach
      console.log('📡 Not in database, fetching from AniList...');
      animeInfo = await getAnimeInfo(anilistId);
      
      if (!animeInfo) {
        trackAPIUsage(false);
        return res.status(404).json({ 
          error: 'Anime not found on AniList and not in custom database',
          suggestion: 'Add this anime to the database via admin panel'
        });
      }

      primaryTitle = animeInfo.english || animeInfo.romaji;
      console.log(`📺 AniList Anime: ${primaryTitle}`);

      // Generate slugs naturally
      const slugs = generateSlugs(animeInfo, parseInt(anilistId));
      console.log(`🧠 Generated slugs: ${slugs}`);

      // Find episode
      console.log('🎯 Searching for content...');
      const result = await findEpisode(slugs, season, episode, animeInfo);

      if (!result) {
        trackAPIUsage(false);
        return res.status(404).json({ 
          error: 'Content not found',
          anime_title: primaryTitle,
          tried_slugs: slugs
        });
      }

      console.log(`🎉 SUCCESS! Found on ${result.pathType} with ${result.sources.length} sources`);
      trackAPIUsage(true);

      const responseData = {
        success: true,
        anilist_id: parseInt(anilistId),
        anime_title: primaryTitle,
        season: parseInt(season),
        episode: parseInt(episode),
        slug: result.slug,
        content_url: result.url,
        sources: result.sources,
        from_database: false
      };

      if (jsonMode) {
        return res.json(responseData);
      }

      // ALWAYS redirect to clean iframe when sources are found
      if (result.sources.length > 0) {
        const primarySource = result.sources[0];
        return res.redirect(`/api/iframe?url=${encodeURIComponent(primarySource.url)}`);
      }

      // Fallback to simple message if no sources but content found
      return res.send(`Content found at: ${result.url}`);
    }

  } catch (error) {
    console.error('💥 Error:', error.message);
    trackAPIUsage(false);
    res.status(500).json({ 
      error: 'Server error', 
      details: error.message
    });
  }
});

// Original player (for non-clean mode)
function generatePlayer(title, season, episode, sources, contentUrl) {
  if (sources.length === 0) {
    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${title} - S${season}E${episode}</title>
    <style>
        body { background: #0f0f23; color: white; font-family: Arial; padding: 20px; text-align: center; }
        .redirect { background: #1a1a2e; padding: 40px; border-radius: 10px; margin: 50px auto; max-width: 600px; }
        .btn { display: inline-block; padding: 15px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 10px; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="redirect">
        <h1>${title}</h1>
        <p>Season ${season} • Episode ${episode}</p>
        <p>Content found but requires manual navigation</p>
        <a href="${contentUrl}" class="btn" target="_blank">Open Content Page</a>
    </div>
</body>
</html>`;
  }

  const primarySource = sources[0];
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - S${season}E${episode}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            background: linear-gradient(135deg, #0c0c0c, #1a1a2e);
            color: white; 
            font-family: 'Segoe UI', sans-serif;
            min-height: 100vh;
        }
        .container { max-width: 1400px; margin: 0 auto; padding: 20px; }
        .header {
            text-align: center;
            margin-bottom: 20px;
            padding: 20px;
            background: rgba(255,255,255,0.1);
            border-radius: 15px;
        }
        .player-container { 
            width: 100%; 
            height: 75vh; 
            margin-bottom: 20px;
            border-radius: 15px;
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(0,0,0,0.4);
        }
        iframe { 
            width: 100%; 
            height: 100%; 
            border: none; 
            background: #000;
        }
        .servers {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 10px;
            margin-top: 20px;
        }
        .server-btn {
            padding: 12px 16px;
            background: linear-gradient(45deg, #667eea, #764ba2);
            border: none;
            border-radius: 8px;
            color: white;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.3s ease;
            text-align: center;
        }
        .server-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
        }
        .server-btn.active {
            background: linear-gradient(45deg, #f093fb, #f5576c);
        }
        .clean-mode-btn {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 10px 20px;
            background: linear-gradient(45deg, #11998e, #38ef7d);
            border: none;
            border-radius: 25px;
            color: white;
            text-decoration: none;
            font-weight: bold;
            transition: all 0.3s ease;
            z-index: 1000;
        }
        .clean-mode-btn:hover {
            transform: scale(1.05);
            box-shadow: 0 5px 15px rgba(17, 153, 142, 0.4);
        }
        .random-btn {
            position: fixed;
            top: 70px;
            right: 20px;
            padding: 10px 20px;
            background: linear-gradient(45deg, #667eea, #764ba2);
            border: none;
            border-radius: 25px;
            color: white;
            text-decoration: none;
            font-weight: bold;
            transition: all 0.3s ease;
            z-index: 1000;
        }
        .random-btn:hover {
            transform: scale(1.05);
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }
    </style>
</head>
<body>
    <a href="/api/anime/${primarySource.url.split('/').pop()}?clean=1" class="clean-mode-btn">🎬 Clean Mode</a>
    <a href="/api/random" class="random-btn">🎲 Random Anime</a>
    
    <div class="container">
        <div class="header">
            <h1>${title}</h1>
            <p>Season ${season} • Episode ${episode} • ${sources.length} Server(s)</p>
        </div>
        
        <div class="player-container">
            <iframe id="player" src="${primarySource.url}" allowfullscreen 
                    allow="autoplay; fullscreen; picture-in-picture"></iframe>
        </div>
        
        ${sources.length > 1 ? `
        <div class="servers">
            ${sources.map((source, i) => `
                <button class="server-btn ${i === 0 ? 'active' : ''}" 
                        onclick="switchServer('${source.url}', this)">
                    ${source.server}
                </button>
            `).join('')}
        </div>
        ` : ''}
    </div>

    <script>
        function switchServer(url, button) {
            document.getElementById('player').src = url;
            document.querySelectorAll('.server-btn').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
        }
    </script>
</body>
</html>`;
}

// ==================== ADMIN PANEL ROUTES ====================

// Admin login endpoint
app.post('/admin/login', async (req, res) => {
  const { password } = req.body;
  
  if (password === '123Admin09') {
    const sessionId = 'session_' + Date.now().toString() + Math.random().toString(36).substr(2, 9);
    sessions.add(sessionId);
    
    // Clean old sessions (keep last 20)
    if (sessions.size > 20) {
      const sessionsArray = [...sessions];
      sessions = new Set(sessionsArray.slice(-20));
    }
    
    await saveSessions();
    
    res.json({ success: true, token: sessionId });
  } else {
    res.status(401).json({ error: 'Invalid password' });
  }
});

// Check session endpoint
app.get('/admin/check-session', requireAuth, (req, res) => {
  res.json({ valid: true });
});

// Admin API endpoints
app.get('/admin/stats', requireAuth, (req, res) => {
  const successRate = apiStats.totalRequests > 0 
    ? Math.round((apiStats.successfulRequests / apiStats.totalRequests) * 100)
    : 85;
    
  res.json({
    totalAnime: Object.keys(slugExceptions).length,
    successRate: successRate,
    randomPool: randomAnimePool.length,
    totalRequests: apiStats.totalRequests,
    successfulRequests: apiStats.successfulRequests,
    failedRequests: apiStats.failedRequests
  });
});

app.get('/admin/database', requireAuth, (req, res) => {
  // Convert to array for easier handling in frontend
  const databaseArray = Object.entries(slugExceptions).map(([id, entry]) => ({
    id: parseInt(id),
    name: entry.name,
    slug: entry.slug,
    hasAnilistId: entry.hasAnilistId
  }));
  
  res.json({ database: databaseArray });
});

app.post('/admin/anime', requireAuth, async (req, res) => {
  const { id, name, slug, hasAnilistId } = req.body;
  
  if (!id || !slug || !name) {
    return res.status(400).json({ error: 'ID, name, and slug are required' });
  }
  
  // Store both slug and name for better handling
  slugExceptions[id] = {
    slug: slug,
    name: name,
    hasAnilistId: hasAnilistId || false
  };
  
  // Add to random pool if it's a new entry and has AniList ID
  if (!randomAnimePool.includes(parseInt(id)) && hasAnilistId) {
    randomAnimePool.push(parseInt(id));
  }
  
  await saveDatabase();
  
  res.json({ success: true, message: 'Anime added to database' });
});

// Bulk add anime endpoint
app.post('/admin/bulk-add', requireAuth, async (req, res) => {
  const { animeList } = req.body;
  
  if (!animeList || !Array.isArray(animeList)) {
    return res.status(400).json({ error: 'Anime list is required' });
  }
  
  const results = {
    added: [],
    failed: [],
    skipped: []
  };
  
  for (const anime of animeList) {
    try {
      // Skip if already exists
      if (slugExceptions[anime.id]) {
        results.skipped.push({
          id: anime.id,
          title: anime.name,
          reason: 'Already exists in database'
        });
        continue;
      }
      
      // Add to database
      slugExceptions[anime.id] = {
        slug: anime.slug,
        name: anime.name,
        hasAnilistId: anime.hasAnilistId || false
      };
      
      // Add to random pool if it has AniList ID
      if (anime.hasAnilistId && !randomAnimePool.includes(parseInt(anime.id))) {
        randomAnimePool.push(parseInt(anime.id));
      }
      
      results.added.push({
        id: anime.id,
        title: anime.name,
        slug: anime.slug
      });
      
    } catch (error) {
      results.failed.push({
        id: anime.id,
        title: anime.name,
        reason: error.message
      });
    }
  }
  
  await saveDatabase();
  
  res.json({ 
    success: true, 
    message: `Bulk add completed: ${results.added.length} added, ${results.failed.length} failed, ${results.skipped.length} skipped`,
    results 
  });
});

// Fetch anime info for bulk IDs
app.post('/admin/fetch-anime-info', requireAuth, async (req, res) => {
  const { ids } = req.body;
  
  if (!ids || !Array.isArray(ids)) {
    return res.status(400).json({ error: 'Array of IDs is required' });
  }
  
  const results = [];
  
  for (const id of ids) {
    try {
      const animeInfo = await getAnimeInfo(id);
      if (animeInfo) {
        // Generate slug from title
        const slug = (animeInfo.english || animeInfo.romaji)
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-+|-+$/g, '');
          
        results.push({
          id: id,
          name: animeInfo.english || animeInfo.romaji,
          slug: slug,
          hasAnilistId: true,
          success: true
        });
      } else {
        results.push({
          id: id,
          name: 'Unknown',
          slug: 'unknown',
          hasAnilistId: true,
          success: false,
          error: 'Not found on AniList'
        });
      }
    } catch (error) {
      results.push({
        id: id,
        name: 'Unknown',
        slug: 'unknown',
        hasAnilistId: true,
        success: false,
        error: error.message
      });
    }
  }
  
  res.json({ success: true, results });
});

app.delete('/admin/anime/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  
  if (slugExceptions[id]) {
    delete slugExceptions[id];
    
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

// ==================== MAIN API ROUTES ====================

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: '🎬 AnimeWorld API with Admin Panel',
    version: '2.1.0',
    status: 'active',
    endpoints: [
      {
        method: 'GET',
        url: '/api/anime/{anilist_id}/{season}/{episode}',
        example: '/api/anime/101922/1/1',
        description: 'Stream anime episode'
      },
      {
        method: 'GET', 
        url: '/api/random',
        example: '/api/random',
        description: 'Random anime episode'
      },
      {
        method: 'GET',
        url: '/admin',
        description: 'Admin panel (password: 123Admin09)'
      }
    ]
  });
});

// Clean iframe endpoint - FIXED ROUTE
app.get('/api/iframe', (req, res) => {
  const url = req.query.url;
  
  if (!url) {
    return res.status(400).json({ error: 'URL parameter is required' });
  }
  
  console.log(`🎬 CLEAN IFRAME: ${url}`);
  
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Player</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        html, body {
            background: #000;
            overflow: hidden;
            height: 100vh;
            width: 100vw;
        }
        iframe {
            width: 100vw;
            height: 100vh;
            border: none;
            position: fixed;
            top: 0;
            left: 0;
        }
    </style>
</head>
<body>
    <iframe 
        src="${url}" 
        allowfullscreen 
        allow="autoplay; fullscreen; picture-in-picture"
        scrolling="no"
        frameborder="0">
    </iframe>
</body>
</html>`;
  
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
});

// Main streaming endpoint
app.get('/api/anime/:anilistId/:season/:episode', async (req, res) => {
  const { anilistId, season, episode } = req.params;
  const jsonMode = req.query.json === '1';
  const cleanMode = req.query.clean === '1';

  console.log(`\n🎬 STREAMING: ID ${anilistId} - S${season}E${episode}`);
  
  try {
    // Check if this ID exists in our database first
    const isInDatabase = slugExceptions[anilistId];
    let animeInfo = null;
    let primaryTitle = 'Unknown Anime';

    if (isInDatabase) {
      const dbEntry = slugExceptions[anilistId];
      const dbSlug = dbEntry.slug;
      const dbName = dbEntry.name;
      
      console.log(`🎯 Found in database: ${dbSlug}`);
      
      // Try to get AniList info only if it has AniList ID
      if (dbEntry.hasAnilistId) {
        animeInfo = await getAnimeInfo(anilistId);
      }
      
      if (animeInfo) {
        primaryTitle = animeInfo.english || animeInfo.romaji;
        console.log(`📺 AniList info found: ${primaryTitle}`);
      } else {
        // Use stored name for custom entries
        primaryTitle = dbName;
        console.log(`📺 Custom entry: ${primaryTitle}`);
        
        // Create mock anime info for custom entries
        animeInfo = {
          english: primaryTitle,
          romaji: primaryTitle,
          format: 'TV'
        };
      }

      // Use database slug directly
      const slugs = [dbSlug];
      console.log(`🧠 Using database slug: ${slugs}`);

      // Find episode
      console.log('🎯 Searching for content...');
      const result = await findEpisode(slugs, season, episode, animeInfo);

      if (!result) {
        trackAPIUsage(false);
        return res.status(404).json({ 
          error: 'Content not found',
          anime_title: primaryTitle,
          tried_slugs: slugs
        });
      }

      console.log(`🎉 SUCCESS! Found on ${result.pathType} with ${result.sources.length} sources`);
      trackAPIUsage(true);

      const responseData = {
        success: true,
        id: parseInt(anilistId),
        anime_title: primaryTitle,
        season: parseInt(season),
        episode: parseInt(episode),
        slug: result.slug,
        content_url: result.url,
        sources: result.sources,
        from_database: true,
        has_anilist_id: dbEntry.hasAnilistId
      };

      if (jsonMode) {
        return res.json(responseData);
      }

      if (cleanMode && result.sources.length > 0) {
        const primarySource = result.sources[0];
        const html = generateCleanIframePlayer(primarySource.url);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.send(html);
      }

      const html = generatePlayer(primaryTitle, season, episode, result.sources, result.url);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(html);

    } else {
      // Not in database, try AniList approach
      console.log('📡 Not in database, fetching from AniList...');
      animeInfo = await getAnimeInfo(anilistId);
      
      if (!animeInfo) {
        trackAPIUsage(false);
        return res.status(404).json({ 
          error: 'Anime not found on AniList and not in custom database',
          suggestion: 'Add this anime to the database via admin panel'
        });
      }

      primaryTitle = animeInfo.english || animeInfo.romaji;
      console.log(`📺 AniList Anime: ${primaryTitle}`);

      // Generate slugs naturally
      const slugs = generateSlugs(animeInfo, parseInt(anilistId));
      console.log(`🧠 Generated slugs: ${slugs}`);

      // Find episode
      console.log('🎯 Searching for content...');
      const result = await findEpisode(slugs, season, episode, animeInfo);

      if (!result) {
        trackAPIUsage(false);
        return res.status(404).json({ 
          error: 'Content not found',
          anime_title: primaryTitle,
          tried_slugs: slugs
        });
      }

      console.log(`🎉 SUCCESS! Found on ${result.pathType} with ${result.sources.length} sources`);
      trackAPIUsage(true);

      const responseData = {
        success: true,
        anilist_id: parseInt(anilistId),
        anime_title: primaryTitle,
        season: parseInt(season),
        episode: parseInt(episode),
        slug: result.slug,
        content_url: result.url,
        sources: result.sources,
        from_database: false
      };

      if (jsonMode) {
        return res.json(responseData);
      }

      if (cleanMode && result.sources.length > 0) {
        const primarySource = result.sources[0];
        const html = generateCleanIframePlayer(primarySource.url);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.send(html);
      }

      const html = generatePlayer(primaryTitle, season, episode, result.sources, result.url);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(html);
    }

  } catch (error) {
    console.error('💥 Error:', error.message);
    trackAPIUsage(false);
    res.status(500).json({ 
      error: 'Server error', 
      details: error.message
    });
  }
});

// Random endpoint
app.get('/api/random', async (req, res) => {
  const jsonMode = req.query.json === '1';
  const cleanMode = req.query.clean === '1';
  
  try {
    const randomId = randomAnimePool[Math.floor(Math.random() * randomAnimePool.length)];
    const season = 1;
    const episode = 1;
    
    console.log(`\n🎲 RANDOM ANIME: AniList ${randomId} - S${season}E${episode}`);
    
    const animeInfo = await getAnimeInfo(randomId);
    if (!animeInfo) {
      trackAPIUsage(false);
      return res.status(404).json({ error: 'Random anime info not found' });
    }

    const primaryTitle = animeInfo.english || animeInfo.romaji;
    const slugs = generateSlugs(animeInfo, parseInt(randomId));
    const result = await findEpisode(slugs, season, episode, animeInfo);

    if (!result) {
      trackAPIUsage(false);
      return res.status(404).json({ 
        error: 'Random content not found',
        tried_id: randomId
      });
    }

    trackAPIUsage(true);
    const responseData = {
      success: true,
      anilist_id: parseInt(randomId),
      anime_title: primaryTitle,
      season: season,
      episode: episode,
      slug: result.slug,
      content_url: result.url,
      sources: result.sources,
      is_random: true
    };

    if (jsonMode) {
      return res.json(responseData);
    }

    if (cleanMode && result.sources.length > 0) {
      const primarySource = result.sources[0];
      const html = generateCleanIframePlayer(primarySource.url);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(html);
    }

    const html = generatePlayer(primaryTitle, season, episode, result.sources, result.url);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(html);

  } catch (error) {
    console.error('💥 Random error:', error.message);
    trackAPIUsage(false);
    res.status(500).json({ 
      error: 'Server error', 
      details: error.message
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'active',
    version: '2.1.0',
    database_entries: Object.keys(slugExceptions).length,
    random_pool: randomAnimePool.length,
    total_requests: apiStats.totalRequests,
    active_sessions: sessions.size
  });
});

// ==================== ADMIN PANEL HTML ====================

app.get('/admin', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AnimeWorld API - Admin Panel</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            background: linear-gradient(135deg, #0e1532, #07144c);
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            min-height: 100vh;
            color: #fff;
        }
        .login-container {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
        }
        .login-box, .admin-panel {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(255, 255, 255, 0.2);
            max-width: 1400px;
            width: 95%;
        }
        .login-box {
            max-width: 400px;
            text-align: center;
        }
        .logo {
            font-size: 2.5em;
            margin-bottom: 10px;
            font-weight: bold;
            background: linear-gradient(45deg, #667eea, #764ba2);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .subtitle {
            color: rgba(255, 255, 255, 0.8);
            margin-bottom: 30px;
            font-size: 1.1em;
        }
        input, select, button, textarea {
            width: 100%;
            padding: 15px;
            margin: 10px 0;
            border: none;
            border-radius: 10px;
            font-size: 16px;
            background: rgba(255, 255, 255, 0.1);
            color: white;
            border: 1px solid rgba(255, 255, 255, 0.2);
            transition: all 0.3s ease;
        }
        input::placeholder, textarea::placeholder { color: rgba(255, 255, 255, 0.6); }
        button {
            background: linear-gradient(45deg, #667eea, #764ba2);
            cursor: pointer;
            font-weight: bold;
            text-transform: uppercase;
        }
        button:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4); }
        button.secondary { background: linear-gradient(45deg, #11998e, #38ef7d); }
        button.warning { background: linear-gradient(45deg, #f093fb, #f5576c); }
        .admin-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .stat-card {
            background: rgba(255, 255, 255, 0.1);
            padding: 20px;
            border-radius: 15px;
            text-align: center;
        }
        .stat-number { font-size: 2em; font-weight: bold; color: #667eea; }
        .tabs {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.2);
            padding-bottom: 10px;
        }
        .tab {
            padding: 10px 20px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        .tab.active {
            background: linear-gradient(45deg, #667eea, #764ba2);
        }
        .tab-content {
            display: none;
        }
        .tab-content.active {
            display: block;
        }
        .sections {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
        }
        .section {
            background: rgba(255, 255, 255, 0.05);
            padding: 25px;
            border-radius: 15px;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .section h3 {
            margin-bottom: 20px;
            color: #667eea;
            font-size: 1.3em;
        }
        .form-group {
            margin-bottom: 15px;
        }
        .form-group label {
            display: block;
            margin-bottom: 5px;
            color: rgba(255, 255, 255, 0.9);
        }
        .checkbox-group {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .checkbox-group input[type="checkbox"] {
            width: auto;
        }
        .anime-list {
            max-height: 400px;
            overflow-y: auto;
            background: rgba(0, 0, 0, 0.2);
            border-radius: 10px;
            padding: 15px;
        }
        .anime-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px;
            margin: 5px 0;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 8px;
        }
        .anime-info { flex: 1; }
        .anime-id { color: #667eea; font-weight: bold; }
        .anime-slug { color: rgba(255, 255, 255, 0.8); font-size: 0.9em; }
        .anime-type { 
            background: rgba(102, 126, 234, 0.3); 
            padding: 2px 6px; 
            border-radius: 4px; 
            font-size: 0.8em; 
            margin-left: 5px; 
        }
        .delete-btn {
            background: linear-gradient(45deg, #ff6b6b, #ee5a24);
            color: white;
            border: none;
            padding: 8px 15px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 12px;
            width: auto;
            margin: 0;
        }
        .success { background: linear-gradient(45deg, #11998e, #38ef7d); }
        .error { background: linear-gradient(45deg, #ff6b6b, #ee5a24); }
        .warning { background: linear-gradient(45deg, #f093fb, #f5576c); }
        .message {
            padding: 15px;
            border-radius: 10px;
            margin: 15px 0;
            text-align: center;
            font-weight: bold;
        }
        .bulk-results {
            max-height: 300px;
            overflow-y: auto;
            margin: 15px 0;
            background: rgba(0, 0, 0, 0.2);
            border-radius: 10px;
            padding: 15px;
        }
        .bulk-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px;
            margin: 5px 0;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 8px;
        }
        @media (max-width: 768px) {
            .sections { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <!-- Login Form -->
    <div id="login" class="login-container">
        <div class="login-box">
            <div class="logo">🎬 AnimeWorld API</div>
            <div class="subtitle">Admin Panel Access</div>
            <form id="loginForm">
                <input type="password" id="password" placeholder="Admin Password" required>
                <button type="submit">Login to Admin Panel</button>
            </form>
            <div id="loginMessage"></div>
        </div>
    </div>

    <!-- Admin Panel -->
    <div id="adminPanel" class="login-container" style="display: none;">
        <div class="admin-panel">
            <div class="admin-header">
                <div>
                    <h1>🎬 AnimeWorld API Admin Panel</h1>
                    <p>Manage anime database with custom IDs and bulk operations</p>
                </div>
                <button onclick="logout()" style="width: auto; padding: 10px 20px;">Logout</button>
            </div>

            <div class="stats">
                <div class="stat-card">
                    <div class="stat-number" id="totalAnime">0</div>
                    <div>Total Anime</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number" id="successRate">0%</div>
                    <div>Success Rate</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number" id="randomPool">0</div>
                    <div>Random Pool</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number" id="totalRequests">0</div>
                    <div>Total Requests</div>
                </div>
            </div>

            <div class="tabs">
                <div class="tab active" onclick="switchTab('single')">📝 Single Add</div>
                <div class="tab" onclick="switchTab('bulk')">📦 Bulk Add</div>
                <div class="tab" onclick="switchTab('database')">📊 Database</div>
            </div>

            <!-- Single Add Tab -->
            <div id="singleTab" class="tab-content active">
                <div class="sections">
                    <div class="section">
                        <h3>📝 Add Single Anime</h3>
                        <form id="addAnimeForm">
                            <div class="form-group">
                                <label>Anime Name</label>
                                <input type="text" id="animeName" placeholder="e.g., Bleach: Thousand Year Blood War" required>
                            </div>
                            
                            <div class="form-group">
                                <div class="checkbox-group">
                                    <input type="checkbox" id="hasAnilistId" checked onchange="toggleIdInput()">
                                    <label for="hasAnilistId">Use AniList ID</label>
                                </div>
                            </div>
                            
                            <div class="form-group" id="anilistGroup">
                                <label>AniList ID</label>
                                <input type="number" id="anilistId" placeholder="e.g., 41467">
                            </div>
                            
                            <div class="form-group" id="customIdGroup" style="display: none;">
                                <label>Custom ID (for internal use)</label>
                                <input type="number" id="customId" placeholder="e.g., 999001">
                            </div>
                            
                            <div class="form-group">
                                <label>Anime URL Slug</label>
                                <input type="text" id="animeSlug" placeholder="e.g., bleach-thousand-year-blood-war" required>
                            </div>
                            
                            <button type="submit">Add to Database</button>
                        </form>
                        <div id="addMessage"></div>
                    </div>

                    <div class="section">
                        <h3>💡 Quick Actions</h3>
                        <button onclick="testRandomAnime()" class="secondary">🎲 Test Random Anime</button>
                        <button onclick="refreshStats()" class="secondary">📈 Refresh Stats</button>
                    </div>
                </div>
            </div>

            <!-- Bulk Add Tab -->
            <div id="bulkTab" class="tab-content">
                <div class="sections">
                    <div class="section">
                        <h3>📦 Bulk Add Anime</h3>
                        <div class="form-group">
                            <label>AniList IDs (one per line)</label>
                            <textarea id="bulkIds" placeholder="Enter AniList IDs, one per line:
20
21
16498
113415" rows="10"></textarea>
                        </div>
                        <button onclick="fetchBulkAnimeInfo()" class="secondary">🔍 Fetch Anime Info</button>
                        
                        <div id="bulkResults" class="bulk-results" style="display: none;">
                            <h4>Fetched Anime:</h4>
                            <div id="bulkAnimeList"></div>
                            <button onclick="addBulkAnime()" class="secondary" style="margin-top: 15px;">✅ Add All to Database</button>
                        </div>
                    </div>

                    <div class="section">
                        <h3>⚡ Quick Bulk Actions</h3>
                        <button onclick="addPopularAnime()" class="secondary">Add Popular Anime</button>
                        <button onclick="clearBulkForm()" class="warning">Clear Form</button>
                        
                        <div style="margin-top: 20px;">
                            <h4>Popular Anime IDs:</h4>
                            <div style="font-size: 0.9em; color: rgba(255,255,255,0.7);">
                                <div>20 - Naruto</div>
                                <div>21 - One Piece</div>
                                <div>16498 - Attack on Titan</div>
                                <div>113415 - Jujutsu Kaisen</div>
                                <div>101922 - Demon Slayer</div>
                                <div>11061 - Hunter x Hunter</div>
                                <div>1535 - Death Note</div>
                                <div>21087 - One Punch Man</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Database Tab -->
            <div id="databaseTab" class="tab-content">
                <div class="section">
                    <h3>📊 Current Database (<span id="dbCount">0</span> entries)</h3>
                    <div class="anime-list" id="animeList">
                        Loading...
                    </div>
                    <button onclick="refreshDatabase()" style="margin-top: 15px;">🔄 Refresh List</button>
                </div>
            </div>
        </div>
    </div>

    <script>
        let authToken = localStorage.getItem('adminToken') || '';
        let bulkAnimeData = [];

        // Check if already logged in
        if (authToken) {
            checkSession();
        }

        // Check session validity
        async function checkSession() {
            try {
                const response = await fetch('/admin/check-session', {
                    headers: { 'Authorization': authToken }
                });
                
                if (response.ok) {
                    showAdminPanel();
                } else {
                    localStorage.removeItem('adminToken');
                    authToken = '';
                }
            } catch (error) {
                localStorage.removeItem('adminToken');
                authToken = '';
            }
        }

        function showAdminPanel() {
            document.getElementById('login').style.display = 'none';
            document.getElementById('adminPanel').style.display = 'flex';
            loadStats();
            refreshDatabase();
        }

        // Tab management
        function switchTab(tabName) {
            document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
            document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
            
            document.getElementById(tabName + 'Tab').classList.add('active');
            event.target.classList.add('active');
        }

        // Toggle between AniList ID and Custom ID
        function toggleIdInput() {
            const hasAnilistId = document.getElementById('hasAnilistId').checked;
            document.getElementById('anilistGroup').style.display = hasAnilistId ? 'block' : 'none';
            document.getElementById('customIdGroup').style.display = hasAnilistId ? 'none' : 'block';
        }

        // Login functionality
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const password = document.getElementById('password').value;
            
            try {
                const response = await fetch('/admin/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ password })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    authToken = data.token;
                    localStorage.setItem('adminToken', authToken);
                    showAdminPanel();
                } else {
                    showMessage('loginMessage', data.error, 'error');
                }
            } catch (error) {
                showMessage('loginMessage', 'Login failed', 'error');
            }
        });

        // Add single anime functionality
        document.getElementById('addAnimeForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('animeName').value;
            const hasAnilistId = document.getElementById('hasAnilistId').checked;
            const anilistId = hasAnilistId ? parseInt(document.getElementById('anilistId').value) : null;
            const customId = !hasAnilistId ? parseInt(document.getElementById('customId').value) : null;
            const slug = document.getElementById('animeSlug').value;
            
            const finalId = hasAnilistId ? anilistId : customId;
            
            try {
                const response = await fetch('/admin/anime', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': authToken
                    },
                    body: JSON.stringify({
                        id: finalId,
                        name,
                        slug,
                        hasAnilistId
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    showMessage('addMessage', 'Anime added successfully!', 'success');
                    document.getElementById('addAnimeForm').reset();
                    refreshDatabase();
                    loadStats();
                } else {
                    showMessage('addMessage', data.error, 'error');
                }
            } catch (error) {
                showMessage('addMessage', 'Failed to add anime', 'error');
            }
        });

        // Bulk anime functionality
        async function fetchBulkAnimeInfo() {
            const idsText = document.getElementById('bulkIds').value;
            if (!idsText.trim()) {
                alert('Please enter some AniList IDs');
                return;
            }
            
            const ids = idsText.split('\\n')
                .map(id => id.trim())
                .filter(id => id && !isNaN(parseInt(id)))
                .map(id => parseInt(id));
            
            if (ids.length === 0) {
                alert('No valid IDs found');
                return;
            }
            
            try {
                const response = await fetch('/admin/fetch-anime-info', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': authToken
                    },
                    body: JSON.stringify({ ids })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    bulkAnimeData = data.results;
                    displayBulkResults(data.results);
                } else {
                    alert('Failed to fetch anime info');
                }
            } catch (error) {
                alert('Error fetching anime info: ' + error.message);
            }
        }

        function displayBulkResults(results) {
            const container = document.getElementById('bulkAnimeList');
            const resultsDiv = document.getElementById('bulkResults');
            
            container.innerHTML = results.map(anime => \`
                <div class="bulk-item">
                    <div>
                        <strong>\${anime.name}</strong>
                        <div style="font-size: 0.9em; color: rgba(255,255,255,0.7);">
                            ID: \${anime.id} • Slug: \${anime.slug}
                            \${anime.success ? '<span style="color: #38ef7d;">✓</span>' : '<span style="color: #ff6b6b;">✗ ' + anime.error + '</span>'}
                        </div>
                    </div>
                </div>
            \`).join('');
            
            resultsDiv.style.display = 'block';
        }

        async function addBulkAnime() {
            const validAnime = bulkAnimeData.filter(anime => anime.success);
            
            if (validAnime.length === 0) {
                alert('No valid anime to add');
                return;
            }
            
            try {
                const response = await fetch('/admin/bulk-add', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': authToken
                    },
                    body: JSON.stringify({ 
                        animeList: validAnime.map(anime => ({
                            id: anime.id,
                            name: anime.name,
                            slug: anime.slug,
                            hasAnilistId: anime.hasAnilistId
                        }))
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    alert(\`Successfully added \${data.results.added.length} anime to database!\`);
                    document.getElementById('bulkResults').style.display = 'none';
                    document.getElementById('bulkIds').value = '';
                    refreshDatabase();
                    loadStats();
                } else {
                    alert('Failed to add anime: ' + data.error);
                }
            } catch (error) {
                alert('Error adding anime: ' + error.message);
            }
        }

        function addPopularAnime() {
            const popularIds = [20, 21, 16498, 113415, 101922, 11061, 1535, 21087];
            document.getElementById('bulkIds').value = popularIds.join('\\n');
        }

        function clearBulkForm() {
            document.getElementById('bulkIds').value = '';
            document.getElementById('bulkResults').style.display = 'none';
            bulkAnimeData = [];
        }

        async function loadStats() {
            try {
                const response = await fetch('/admin/stats', {
                    headers: { 'Authorization': authToken }
                });
                const data = await response.json();
                
                document.getElementById('totalAnime').textContent = data.totalAnime;
                document.getElementById('successRate').textContent = data.successRate + '%';
                document.getElementById('randomPool').textContent = data.randomPool;
                document.getElementById('totalRequests').textContent = data.totalRequests;
            } catch (error) {
                console.error('Failed to load stats:', error);
            }
        }

        async function refreshDatabase() {
            try {
                const response = await fetch('/admin/database', {
                    headers: { 'Authorization': authToken }
                });
                const data = await response.json();
                
                const list = document.getElementById('animeList');
                const count = document.getElementById('dbCount');
                
                list.innerHTML = '';
                count.textContent = data.database.length;
                
                data.database.forEach(entry => {
                    const item = document.createElement('div');
                    item.className = 'anime-item';
                    
                    const displayName = entry.name;
                    const slug = entry.slug;
                    const type = entry.hasAnilistId ? 'AniList' : 'Custom';
                    
                    item.innerHTML = \`
                        <div class="anime-info">
                            <div class="anime-id">ID: \${entry.id}</div>
                            <div style="color: #38ef7d; font-weight: bold;">
                                \${displayName}
                                <span class="anime-type">\${type}</span>
                            </div>
                            <div class="anime-slug">\${slug}</div>
                        </div>
                        <button class="delete-btn" onclick="deleteAnime(\${entry.id})">Delete</button>
                    \`;
                    list.appendChild(item);
                });
            } catch (error) {
                document.getElementById('animeList').innerHTML = 'Failed to load database';
            }
        }

        async function deleteAnime(id) {
            if (!confirm('Delete this anime from database?')) return;
            
            try {
                const response = await fetch(\`/admin/anime/\${id}\`, {
                    method: 'DELETE',
                    headers: { 'Authorization': authToken }
                });
                
                const data = await response.json();
                
                if (data.success) {
                    refreshDatabase();
                    loadStats();
                }
            } catch (error) {
                console.error('Failed to delete anime:', error);
            }
        }

        async function testRandomAnime() {
            try {
                const response = await fetch('/api/random?json=1');
                const data = await response.json();
                
                if (data.success) {
                    showMessage('addMessage', \`Random test: \${data.anime_title} - Success!\`, 'success');
                } else {
                    showMessage('addMessage', 'Random test failed', 'error');
                }
            } catch (error) {
                showMessage('addMessage', 'Random test error', 'error');
            }
        }

        async function refreshStats() {
            await loadStats();
            showMessage('addMessage', 'Stats updated!', 'success');
        }

        function showMessage(elementId, message, type) {
            const element = document.getElementById(elementId);
            element.innerHTML = \`<div class="message \${type}">\${message}</div>\`;
            setTimeout(() => element.innerHTML = '', 5000);
        }

        function logout() {
            authToken = '';
            localStorage.removeItem('adminToken');
            document.getElementById('login').style.display = 'flex';
            document.getElementById('adminPanel').style.display = 'none';
            document.getElementById('password').value = '';
        }

        // Initialize
        toggleIdInput();
    </script>
</body>
</html>`);
});

// Initialize and start server
async function startServer() {
  try {
    await loadDatabase();
    await loadSessions();
    
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`
🚀 ANIMEWORLD API WITH ENHANCED ADMIN PANEL
───────────────────────────────────────────
📍 Port: ${PORT}
📊 Database: ${Object.keys(slugExceptions).length} anime
🎲 Random Pool: ${randomAnimePool.length} anime
🔑 Active Sessions: ${sessions.size}
🔗 Admin: http://localhost:${PORT}/admin
───────────────────────────────────────────
      `);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
});

startServer();
