const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs').promises;
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple in-memory session store
const sessions = new Set();

// Dynamic slug database (can be modified via admin panel)
let slugExceptions = {
  269: { slug: "bleach", name: "Bleach" },
  41467: { slug: "bleach-thousand-year-blood-war", name: "Bleach: Thousand-Year Blood War" },
  101922: { slug: "demon-slayer", name: "Demon Slayer" },
  142329: { slug: "demon-slayer", name: "Demon Slayer Season 2" }, 
  145139: { slug: "demon-slayer", name: "Demon Slayer Season 3" }, 
  166240: { slug: "demon-slayer", name: "Demon Slayer Season 4" },
  20: { slug: "naruto", name: "Naruto" },
  1735: { slug: "naruto-shippuden", name: "Naruto Shippuden" },
  21: { slug: "one-piece", name: "One Piece" },
  16498: { slug: "attack-on-titan", name: "Attack on Titan" },
  25777: { slug: "attack-on-titan", name: "Attack on Titan Season 2" },
  35760: { slug: "attack-on-titan", name: "Attack on Titan Season 3" }, 
  139630: { slug: "attack-on-titan", name: "Attack on Titan Final Season" },
  113415: { slug: "jujutsu-kaisen", name: "Jujutsu Kaisen" },
  145134: { slug: "jujutsu-kaisen", name: "Jujutsu Kaisen Season 2" },
  97940: { slug: "black-clover", name: "Black Clover" },
  21087: { slug: "one-punch-man", name: "One Punch Man" },
  11061: { slug: "hunter-x-hunter-2011", name: "Hunter x Hunter (2011)" },
  1535: { slug: "death-note", name: "Death Note" },
  127230: { slug: "chainsaw-man", name: "Chainsaw Man" }
};

// Random anime pool (verified working ones)
const randomAnimePool = [20, 113415, 127230, 97940, 21087, 16498];

// Popular anime for auto-addition
const popularAnimeList = [
  { id: 5114, name: "Fullmetal Alchemist: Brotherhood", slug: "fullmetal-alchemist-brotherhood" },
  { id: 1, name: "Cowboy Bebop", slug: "cowboy-bebop" },
  { id: 6702, name: "Fairy Tail", slug: "fairy-tail" },
  { id: 7724, name: "Shingeki no Kyojin", slug: "attack-on-titan" },
  { id: 11757, name: "Sword Art Online", slug: "sword-art-online" },
  { id: 9253, name: "Steins;Gate", slug: "steins-gate" },
  { id: 28977, name: "Gintama", slug: "gintama" },
  { id: 30276, name: "One Punch Man", slug: "one-punch-man" },
  { id: 38000, name: "Kimetsu no Yaiba", slug: "demon-slayer" },
  { id: 40748, name: "Jujutsu Kaisen", slug: "jujutsu-kaisen" },
  { id: 44511, name: "Chainsaw Man", slug: "chainsaw-man" },
  { id: 48583, name: "Shingeki no Kyojin Final Season", slug: "attack-on-titan" },
  { id: 51009, name: "Jujutsu Kaisen 2nd Season", slug: "jujutsu-kaisen" },
  { id: 52991, name: "Sousou no Frieren", slug: "frieren-beyond-journeys-end" },
  { id: 21, name: "One Piece", slug: "one-piece" },
  { id: 31964, name: "Boku no Hero Academia", slug: "my-hero-academia" },
  { id: 33486, name: "Boku no Hero Academia 2nd Season", slug: "my-hero-academia" },
  { id: 36456, name: "Boku no Hero Academia 3rd Season", slug: "my-hero-academia" },
  { id: 38408, name: "Boku no Hero Academia 4th Season", slug: "my-hero-academia" },
  { id: 41587, name: "Boku no Hero Academia 5th Season", slug: "my-hero-academia" },
  { id: 50602, name: "Boku no Hero Academia 6th Season", slug: "my-hero-academia" },
  { id: 55790, name: "Boku no Hero Academia 7th Season", slug: "my-hero-academia" },
  { id: 32281, name: "Kimi no Na wa", slug: "your-name" },
  { id: 28851, name: "Koe no Katachi", slug: "a-silent-voice" },
  { id: 40028, name: "Kaguya-sama wa Kokurasetai", slug: "kaguya-sama-love-is-war" },
  { id: 43608, name: "Kaguya-sama wa Kokurasetai Season 2", slug: "kaguya-sama-love-is-war" },
  { id: 51161, name: "Kaguya-sama wa Kokurasetai Season 3", slug: "kaguya-sama-love-is-war" },
  { id: 37450, name: "Seishun Buta Yarou", slug: "rascal-does-not-dream-of-bunny-girl-senpai" },
  { id: 42938, name: "Fruits Basket 1st Season", slug: "fruits-basket" },
  { id: 43439, name: "Fruits Basket 2nd Season", slug: "fruits-basket" },
  { id: 49738, name: "Fruits Basket Final Season", slug: "fruits-basket" },
  { id: 37991, name: "JoJo no Kimyou na Bouken Part 5", slug: "jojos-bizarre-adventure" },
  { id: 48561, name: "JoJo no Kimyou na Bouken Part 6", slug: "jojos-bizarre-adventure" },
  { id: 37510, name: "Mob Psycho 100 II", slug: "mob-psycho-100" },
  { id: 50172, name: "Mob Psycho 100 III", slug: "mob-psycho-100" }
];

// Load/Save database functions
async function loadDatabase() {
  try {
    const data = await fs.readFile('anime_database.json', 'utf8');
    const loadedData = JSON.parse(data);
    slugExceptions = { ...slugExceptions, ...loadedData };
    console.log(`📊 Loaded ${Object.keys(slugExceptions).length} entries from database`);
  } catch (error) {
    console.log('📊 Using default database (file not found)');
    await saveDatabase();
  }
}

async function saveDatabase() {
  try {
    await fs.writeFile('anime_database.json', JSON.stringify(slugExceptions, null, 2));
    console.log('💾 Database saved successfully');
  } catch (error) {
    console.error('❌ Failed to save database:', error.message);
  }
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

// Generate HTML player
function generatePlayer(title, season, episode, sources, contentUrl) {
  const serverOptions = sources.map((source, index) => 
    `<option value="${index}">${source.server} (${source.quality})</option>`
  ).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🎬 ${title} - S${season}E${episode}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            background: #000;
            color: white;
            font-family: Arial, sans-serif;
            overflow: hidden;
        }
        .player-container {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            display: flex;
            flex-direction: column;
        }
        .header {
            background: rgba(0,0,0,0.8);
            padding: 10px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            z-index: 100;
            transition: opacity 0.3s;
        }
        .header.hidden {
            opacity: 0;
        }
        .title {
            font-size: 16px;
            font-weight: bold;
        }
        .controls {
            display: flex;
            gap: 10px;
            align-items: center;
        }
        select, button {
            background: rgba(255,255,255,0.1);
            color: white;
            border: 1px solid rgba(255,255,255,0.3);
            padding: 5px 10px;
            border-radius: 5px;
        }
        .iframe-container {
            flex: 1;
            position: relative;
        }
        iframe {
            width: 100%;
            height: 100%;
            border: none;
        }
        .fullscreen-btn {
            cursor: pointer;
            font-size: 20px;
        }
    </style>
</head>
<body>
    <div class="player-container">
        <div class="header" id="header">
            <div class="title">🎬 ${title} - Season ${season} Episode ${episode}</div>
            <div class="controls">
                <select id="serverSelect" onchange="switchServer()">
                    ${serverOptions}
                </select>
                <button onclick="toggleFullscreen()" class="fullscreen-btn">⛶</button>
            </div>
        </div>
        <div class="iframe-container">
            <iframe id="videoFrame" src="${sources[0]?.url || ''}" allowfullscreen></iframe>
        </div>
    </div>

    <script>
        const sources = ${JSON.stringify(sources)};
        let hideHeaderTimeout;
        
        function switchServer() {
            const select = document.getElementById('serverSelect');
            const frame = document.getElementById('videoFrame');
            frame.src = sources[select.value].url;
            resetHideTimeout();
        }
        
        function toggleFullscreen() {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen();
            } else {
                document.exitFullscreen();
            }
            resetHideTimeout();
        }
        
        function resetHideTimeout() {
            const header = document.getElementById('header');
            header.classList.remove('hidden');
            clearTimeout(hideHeaderTimeout);
            hideHeaderTimeout = setTimeout(() => {
                header.classList.add('hidden');
            }, 3000);
        }
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key >= '1' && e.key <= '9') {
                const serverIndex = parseInt(e.key) - 1;
                if (serverIndex < sources.length) {
                    document.getElementById('serverSelect').value = serverIndex;
                    switchServer();
                }
            }
            resetHideTimeout();
        });
        
        // Mouse movement detection
        document.addEventListener('mousemove', resetHideTimeout);
        
        // Initial hide timeout
        resetHideTimeout();
    </script>
</body>
</html>`;
}

// Admin login endpoint
app.post('/admin/login', (req, res) => {
  const { password } = req.body;
  
  if (password === '123Admin09') {
    const sessionId = Date.now().toString() + Math.random().toString(36);
    sessions.add(sessionId);
    
    // Clean old sessions (simple cleanup)
    if (sessions.size > 10) {
      const oldSession = sessions.values().next().value;
      sessions.delete(oldSession);
    }
    
    res.json({ success: true, token: sessionId });
  } else {
    res.status(401).json({ error: 'Invalid password' });
  }
});

// Auto-add popular anime endpoint
app.post('/admin/auto-add', requireAuth, async (req, res) => {
  let addedCount = 0;
  const results = [];

  for (const anime of popularAnimeList) {
    if (!slugExceptions[anime.id]) {
      slugExceptions[anime.id] = {
        slug: anime.slug,
        name: anime.name,
        hasAnilistId: true,
        autoAdded: true
      };
      addedCount++;
      results.push({ id: anime.id, name: anime.name, status: 'added' });
    } else {
      results.push({ id: anime.id, name: anime.name, status: 'exists' });
    }
  }

  if (addedCount > 0) {
    await saveDatabase();
  }

  res.json({ 
    success: true, 
    added: addedCount, 
    total: popularAnimeList.length,
    results: results
  });
});

// Bulk operations endpoint
app.post('/admin/bulk-operation', requireAuth, async (req, res) => {
  const { operation, ids } = req.body;

  if (operation === 'delete') {
    let deletedCount = 0;
    for (const id of ids) {
      if (slugExceptions[id]) {
        delete slugExceptions[id];
        deletedCount++;
      }
    }
    
    if (deletedCount > 0) {
      await saveDatabase();
    }
    
    res.json({ success: true, deleted: deletedCount });
  } else if (operation === 'validate') {
    const validationResults = [];
    
    for (const id of ids.slice(0, 10)) {
      try {
        const animeInfo = await getAnimeInfo(id);
        if (animeInfo) {
          validationResults.push({ id, status: 'valid', title: animeInfo.english || animeInfo.romaji });
        } else {
          validationResults.push({ id, status: 'not_found' });
        }
      } catch (error) {
        validationResults.push({ id, status: 'error', error: error.message });
      }
    }
    
    res.json({ success: true, results: validationResults });
  } else {
    res.status(400).json({ error: 'Invalid operation' });
  }
});

// Export/Import database
app.get('/admin/export', requireAuth, (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="anime_database_backup.json"');
  res.json(slugExceptions);
});

app.post('/admin/import', requireAuth, async (req, res) => {
  try {
    const { data, merge } = req.body;
    
    if (merge) {
      slugExceptions = { ...slugExceptions, ...data };
    } else {
      slugExceptions = data;
    }
    
    await saveDatabase();
    
    res.json({ 
      success: true, 
      message: `Database ${merge ? 'merged' : 'replaced'} successfully`,
      totalEntries: Object.keys(slugExceptions).length
    });
  } catch (error) {
    res.status(400).json({ error: 'Invalid import data' });
  }
});

// Search AniList for anime
app.post('/admin/search-anilist', requireAuth, async (req, res) => {
  const { query } = req.body;
  
  try {
    const searchQuery = `
      query ($search: String) {
        Page(page: 1, perPage: 10) {
          media(search: $search, type: ANIME, sort: POPULARITY_DESC) {
            id
            title {
              romaji
              english
              native
            }
            format
            status
            episodes
            season
            seasonYear
            popularity
          }
        }
      }
    `;

    const response = await axios.post('https://graphql.anilist.co', {
      query: searchQuery,
      variables: { search: query }
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      timeout: 10000
    });

    if (response.data.data && response.data.data.Page) {
      const results = response.data.data.Page.media.map(anime => ({
        id: anime.id,
        title: anime.title.english || anime.title.romaji,
        romaji: anime.title.romaji,
        english: anime.title.english,
        format: anime.format,
        episodes: anime.episodes,
        season: anime.season,
        year: anime.seasonYear,
        popularity: anime.popularity,
        inDatabase: !!slugExceptions[anime.id]
      }));
      
      res.json({ success: true, results });
    } else {
      res.json({ success: false, results: [] });
    }
  } catch (error) {
    res.status(500).json({ error: 'Search failed', details: error.message });
  }
});

// Get anime info from AniList API
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
          synonyms
          season
          seasonYear
          format
          type
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
      timeout: 15000
    });

    if (response.data.data && response.data.data.Media) {
      const media = response.data.data.Media;
      return {
        english: media.title.english,
        romaji: media.title.romaji,
        native: media.title.native,
        synonyms: media.synonyms || [],
        season: media.season,
        year: media.seasonYear,
        format: media.format,
        type: media.type
      };
    }
    return null;
  } catch (error) {
    console.log(`❌ AniList API failed for ID ${anilistId}: ${error.message}`);
    return null;
  }
}

// Enhanced slug generation
function generateSlugs(animeInfo, anilistId) {
  if (slugExceptions[anilistId]) {
    const dbEntry = slugExceptions[anilistId];
    const slug = typeof dbEntry === 'string' ? dbEntry : dbEntry.slug;
    console.log(`🎯 Using database mapping: ${slug}`);
    return [slug];
  }

  const titles = [];
  if (animeInfo.english) titles.push(animeInfo.english);
  if (animeInfo.romaji) titles.push(animeInfo.romaji);
  animeInfo.synonyms.slice(0, 2).forEach(syn => titles.push(syn));
  
  const slugs = [];
  
  titles.forEach(title => {
    let cleanTitle = title
      .replace(/Season \d+/gi, '') 
      .replace(/Part \d+/gi, '')   
      .replace(/\d+nd Season/gi, '') 
      .replace(/\d+st Season/gi, '') 
      .replace(/\d+rd Season/gi, '') 
      .replace(/\d+th Season/gi, '') 
      .replace(/: Season \d+/gi, '') 
      .replace(/- Season \d+/gi, '') 
      .replace(/\(TV\)/gi, '')       
      .replace(/\(OVA\)/gi, '')      
      .replace(/\(Movie\)/gi, '')    
      .replace(/\(\d{4}\)/gi, '')
      .replace(/: [^:]*$/gi, '')
      .trim();

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
      },
      {
        type: 'movies',
        patterns: animeInfo.format === 'MOVIE' ? [
          `/movies/${slug}/`,
          `/movies/${slug}-movie/`
        ] : []
      }
    ];

    for (const config of pathConfigs) {
      if (config.patterns.length === 0) continue;
      
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
            const hasContent = $('.entry-content, .post-content, .content').length > 0;
            const notErrorPage = !pageTitle.includes('404') && !pageTitle.includes('not found');
            
            if (notErrorPage && (hasVideo || hasContent)) {
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

// Admin API endpoints
app.get('/admin/stats', requireAuth, (req, res) => {
  res.json({
    totalAnime: Object.keys(slugExceptions).length,
    successRate: 85,
    randomPool: randomAnimePool.length
  });
});

app.get('/admin/database', requireAuth, (req, res) => {
  res.json({ database: slugExceptions });
});

app.post('/admin/anime', requireAuth, async (req, res) => {
  const { id, name, slug, hasAnilistId } = req.body;
  
  if (!id || !slug || !name) {
    return res.status(400).json({ error: 'ID, name, and slug are required' });
  }
  
  slugExceptions[id] = {
    slug: slug,
    name: name,
    hasAnilistId: hasAnilistId || false
  };
  
  await saveDatabase();
  
  res.json({ success: true, message: 'Anime added to database' });
});

app.delete('/admin/anime/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  
  if (slugExceptions[id]) {
    delete slugExceptions[id];
    await saveDatabase();
    res.json({ success: true, message: 'Anime removed from database' });
  } else {
    res.status(404).json({ error: 'Anime not found' });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: '🎬 Enhanced AnimeWorld API with Advanced Admin Panel',
    version: '14.0.0',
    status: 'active',
    endpoints: [
      {
        method: 'GET',
        url: '/api/anime/{anilist_id}/{season}/{episode}',
        example: '/api/anime/101922/1/1',
        description: 'Stream anime episode (clean iframe mode)'
      },
      {
        method: 'GET', 
        url: '/api/random',
        example: '/api/random',
        description: 'Random anime episode (clean iframe mode)'
      },
      {
        method: 'GET',
        url: '/admin',
        description: 'Advanced admin panel (password: 123Admin09)'
      }
    ]
  });
});

// Random endpoint
app.get('/api/random', async (req, res) => {
  const jsonMode = req.query.json === '1';
  
  try {
    const randomId = randomAnimePool[Math.floor(Math.random() * randomAnimePool.length)];
    const season = 1;
    const episode = 1;
    
    console.log(`\n🎲 RANDOM ANIME: AniList ${randomId} - S${season}E${episode}`);
    
    const animeInfo = await getAnimeInfo(randomId);
    if (!animeInfo) {
      return res.status(404).json({ error: 'Random anime info not found' });
    }

    const primaryTitle = animeInfo.english || animeInfo.romaji;
    const slugs = generateSlugs(animeInfo, parseInt(randomId));
    const result = await findEpisode(slugs, season, episode, animeInfo);

    if (!result) {
      return res.status(404).json({ 
        error: 'Random content not found',
        tried_id: randomId
      });
    }

    const responseData = {
      success: true,
      anilist_id: parseInt(randomId),
      anime_title: primaryTitle,
      season: season,
      episode: episode,
      slug: result.slug,
      content_url: result.url,
      sources: result.sources,
      is_random: true,
      total_sources: result.sources.length
    };

    if (jsonMode) {
      return res.json(responseData);
    }

    const html = generatePlayer(primaryTitle, season, episode, result.sources, result.url);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(html);

  } catch (error) {
    console.error('💥 Random error:', error.message);
    res.status(500).json({ 
      error: 'Server error', 
      details: error.message
    });
  }
});

// Main streaming endpoint
app.get('/api/anime/:anilistId/:season/:episode', async (req, res) => {
  const { anilistId, season, episode } = req.params;
  const jsonMode = req.query.json === '1';

  console.log(`\n🎬 ENHANCED STREAMING: ID ${anilistId} - S${season}E${episode}`);
  
  try {
    const isInDatabase = slugExceptions[anilistId];
    let animeInfo = null;
    let primaryTitle = 'Unknown Anime';

    if (isInDatabase) {
      const dbEntry = slugExceptions[anilistId];
      const dbSlug = typeof dbEntry === 'string' ? dbEntry : dbEntry.slug;
      const dbName = typeof dbEntry === 'string' ? null : dbEntry.name;
      
      console.log(`🎯 Found in database: ${dbSlug}`);
      
      animeInfo = await getAnimeInfo(anilistId);
      
      if (animeInfo) {
        primaryTitle = animeInfo.english || animeInfo.romaji;
        console.log(`📺 AniList info found: ${primaryTitle} (${animeInfo.format})`);
      } else {
        primaryTitle = dbName || dbSlug.split('-').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
        console.log(`📺 Custom entry: ${primaryTitle}`);
        
        animeInfo = {
          english: primaryTitle,
          romaji: primaryTitle,
          native: primaryTitle,
          synonyms: [],
          season: null,
          year: null,
          format: 'TV',
          type: 'ANIME'
        };
      }

      const slugs = [dbSlug];
      console.log(`🧠 Using database slug: ${slugs}`);

      console.log('🎯 Searching for content...');
      const result = await findEpisode(slugs, season, episode, animeInfo);

      if (!result) {
        return res.status(404).json({ 
          error: 'Content not found',
          anime_title: primaryTitle,
          tried_slugs: slugs,
          season: parseInt(season),
          episode: parseInt(episode),
          note: 'Slug exists in database but content not accessible'
        });
      }

      console.log(`🎉 SUCCESS! Found on ${result.pathType} with ${result.sources.length} sources`);

      const responseData = {
        success: true,
        id: parseInt(anilistId),
        anime_title: primaryTitle,
        season: parseInt(season),
        episode: parseInt(episode),
        slug: result.slug,
        path_type: result.pathType,
        content_url: result.url,
        sources: result.sources,
        total_sources: result.sources.length,
        from_database: true,
        has_anilist_data: !!animeInfo.season
      };

      if (jsonMode) {
        return res.json(responseData);
      }

      const html = generatePlayer(primaryTitle, season, episode, result.sources, result.url);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(html);

    } else {
      console.log('📡 Not in database, fetching from AniList...');
      animeInfo = await getAnimeInfo(anilistId);
      
      if (!animeInfo) {
        return res.status(404).json({ 
          error: 'Anime not found on AniList and not in custom database',
          suggestion: 'Add this anime to the database via admin panel at /admin'
        });
      }

      primaryTitle = animeInfo.english || animeInfo.romaji;
      console.log(`📺 AniList Anime: ${primaryTitle} (${animeInfo.format})`);

      const slugs = generateSlugs(animeInfo, parseInt(anilistId));
      console.log(`🧠 Generated slugs: ${slugs}`);

      console.log('🎯 Searching for content...');
      const result = await findEpisode(slugs, season, episode, animeInfo);

      if (!result) {
        return res.status(404).json({ 
          error: 'Content not found',
          anime_title: primaryTitle,
          tried_slugs: slugs,
          season: parseInt(season),
          episode: parseInt(episode),
          suggestion: 'Try adding correct slug mapping to database via admin panel at /admin'
        });
      }

      console.log(`🎉 SUCCESS! Found on ${result.pathType} with ${result.sources.length} sources`);

      const responseData = {
        success: true,
        anilist_id: parseInt(anilistId),
        anime_title: primaryTitle,
        season: parseInt(season),
        episode: parseInt(episode),
        slug: result.slug,
        path_type: result.pathType,
        content_url: result.url,
        sources: result.sources,
        total_sources: result.sources.length,
        from_database: false
      };

      if (jsonMode) {
        return res.json(responseData);
      }

      const html = generatePlayer(primaryTitle, season, episode, result.sources, result.url);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(html);
    }

  } catch (error) {
    console.error('💥 Error:', error.message);
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
    version: '14.0.0',
    features: [
      'advanced_admin_panel', 
      'clean_iframe_player',
      'anilist_search_integration', 
      'bulk_operations', 
      'auto_add_popular_anime',
      'database_backup_restore',
      'dynamic_database', 
      'enhanced_series_detection', 
      'random_anime'
    ],
    exception_count: Object.keys(slugExceptions).length,
    random_pool_size: randomAnimePool.length,
    admin_url: '/admin'
  });
});

// Admin panel HTML
app.get('/admin', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AnimeWorld API - Advanced Admin Panel</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            background: linear-gradient(135deg, #0e1532ff, #07144cff);
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
        }
        button {
            background: linear-gradient(45deg, #667eea, #764ba2);
            cursor: pointer;
            font-weight: bold;
        }
        .message {
            padding: 10px;
            margin: 10px 0;
            border-radius: 5px;
            text-align: center;
        }
        .success { background: rgba(56, 239, 125, 0.2); }
        .error { background: rgba(255, 107, 107, 0.2); }
    </style>
</head>
<body>
    <div id="login" class="login-container">
        <div class="login-box">
            <div class="logo">🎬 AnimeWorld API</div>
            <div style="margin-bottom: 30px; color: rgba(255,255,255,0.8);">Advanced Admin Panel</div>
            <form id="loginForm">
                <input type="password" id="password" placeholder="Admin Password" required>
                <button type="submit">Login to Admin Panel</button>
            </form>
            <div id="loginMessage"></div>
        </div>
    </div>

    <script>
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
                    window.location.href = '/admin-panel.html';
                } else {
                    document.getElementById('loginMessage').innerHTML = 
                        '<div class="message error">Invalid password</div>';
                }
            } catch (error) {
                document.getElementById('loginMessage').innerHTML = 
                    '<div class="message error">Login failed</div>';
            }
        });
    </script>
</body>
</html>`);
});

// Initialize and start server
async function startServer() {
  await loadDatabase();
  
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`
🚀 ENHANCED ANIMEWORLD API v14.0 WITH ADVANCED ADMIN PANEL
─────────────────────────────────────────────────────────────────
🔗 Running on: http://localhost:${PORT}
📊 Database: ${Object.keys(slugExceptions).length} entries
🎲 Random Pool: ${randomAnimePool.length} anime
🛡️  Admin Panel: http://localhost:${PORT}/admin
─────────────────────────────────────────────────────────────────
    `);
  });
}

startServer();
