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
// Now stores both slug and name for custom entries
let slugExceptions = {
  // Only anime with different URLs or names than expected
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

// Load/Save database functions
async function loadDatabase() {
  try {
    const data = await fs.readFile('anime_database.json', 'utf8');
    slugExceptions = JSON.parse(data);
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

// Admin panel HTML
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
            max-width: 1200px;
            width: 90%;
        }
        .login-box {
            max-width: 400px;
            text-align: center;
        }
        .logo {
            font-size: 2.5em;
            margin-bottom: 10px;
            font-weight: bold;
            background: linear-gradient(45deg, #0e1532ff, rgba(14, 9, 83, 1)ff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .subtitle {
            color: rgba(255, 255, 255, 0.8);
            margin-bottom: 30px;
            font-size: 1.1em;
        }
        input, select, button {
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
        input::placeholder { color: rgba(255, 255, 255, 0.6); }
        button {
            background: linear-gradient(45deg, #0e1532ff, #13083eff);
            cursor: pointer;
            font-weight: bold;
            text-transform: uppercase;
        }
        button:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4); }
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
        .anime-slug { color: rgba(255, 255, 255, 0.8); }
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
        .message {
            padding: 15px;
            border-radius: 10px;
            margin: 15px 0;
            text-align: center;
            font-weight: bold;
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
                    <p>Manage anime database and monitor API performance</p>
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
            </div>

            <div class="sections">
                <div class="section">
                    <h3>📝 Add New Anime</h3>
                    <form id="addAnimeForm">
                        <div class="form-group">
                            <label>Anime Name</label>
                            <input type="text" id="animeName" placeholder="e.g., Bleach: Thousand Year Blood War" required>
                        </div>
                        
                        <div class="form-group">
                            <div class="checkbox-group">
                                <input type="checkbox" id="hasAnilistId" onchange="toggleAnilistInput()">
                                <label for="hasAnilistId">Has AniList ID</label>
                            </div>
                        </div>
                        
                        <div class="form-group" id="anilistGroup" style="display: none;">
                            <label>AniList ID</label>
                            <input type="number" id="anilistId" placeholder="e.g., 41467">
                        </div>
                        
                        <div class="form-group" id="randomIdGroup">
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
                    <h3>📊 Current Database</h3>
                    <div class="anime-list" id="animeList">
                        Loading...
                    </div>
                    <button onclick="refreshDatabase()" style="margin-top: 15px;">🔄 Refresh List</button>
                </div>
            </div>
        </div>
    </div>

    <script>
        let authToken = '';

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
                    document.getElementById('login').style.display = 'none';
                    document.getElementById('adminPanel').style.display = 'flex';
                    loadStats();
                    refreshDatabase();
                } else {
                    showMessage('loginMessage', data.error, 'error');
                }
            } catch (error) {
                showMessage('loginMessage', 'Login failed', 'error');
            }
        });

        // Add anime functionality
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

        function toggleAnilistInput() {
            const hasAnilistId = document.getElementById('hasAnilistId').checked;
            document.getElementById('anilistGroup').style.display = hasAnilistId ? 'block' : 'none';
            document.getElementById('randomIdGroup').style.display = hasAnilistId ? 'none' : 'block';
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
                list.innerHTML = '';
                
                Object.entries(data.database).forEach(([id, entry]) => {
                    const item = document.createElement('div');
                    item.className = 'anime-item';
                    
                    // Handle both old string format and new object format
                    const displayName = typeof entry === 'string' ? 
                        entry.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 
                        entry.name;
                    const slug = typeof entry === 'string' ? entry : entry.slug;
                    
                    item.innerHTML = \`
                        <div class="anime-info">
                            <div class="anime-id">ID: \${id}</div>
                            <div style="color: #38ef7d; font-weight: bold;">\${displayName}</div>
                            <div class="anime-slug">\${slug}</div>
                        </div>
                        <button class="delete-btn" onclick="deleteAnime(\${id})">Delete</button>
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

        function showMessage(elementId, message, type) {
            const element = document.getElementById(elementId);
            element.innerHTML = \`<div class="message \${type}">\${message}</div>\`;
            setTimeout(() => element.innerHTML = '', 3000);
        }

        function logout() {
            authToken = '';
            document.getElementById('login').style.display = 'flex';
            document.getElementById('adminPanel').style.display = 'none';
            document.getElementById('password').value = '';
        }
    </script>
</body>
</html>`);
});

// Admin API endpoints
app.get('/admin/stats', requireAuth, (req, res) => {
  res.json({
    totalAnime: Object.keys(slugExceptions).length,
    successRate: 85, // Estimated
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
  
  // Store both slug and name for better handling
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
    message: '🎬 Enhanced AnimeWorld API with Admin Panel',
    version: '13.0.0',
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

// Enhanced slug generation (only use database for exceptions)
function generateSlugs(animeInfo, anilistId) {
  // Check exception database first
  if (slugExceptions[anilistId]) {
    const dbEntry = slugExceptions[anilistId];
    const slug = typeof dbEntry === 'string' ? dbEntry : dbEntry.slug;
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
      is_random: true
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
    // Check if this ID exists in our database first
    const isInDatabase = slugExceptions[anilistId];
    let animeInfo = null;
    let primaryTitle = 'Unknown Anime';

    if (isInDatabase) {
      const dbEntry = slugExceptions[anilistId];
      const dbSlug = typeof dbEntry === 'string' ? dbEntry : dbEntry.slug;
      const dbName = typeof dbEntry === 'string' ? null : dbEntry.name;
      
      console.log(`🎯 Found in database: ${dbSlug}`);
      
      // Try to get AniList info, but don't fail if it doesn't exist
      animeInfo = await getAnimeInfo(anilistId);
      
      if (animeInfo) {
        primaryTitle = animeInfo.english || animeInfo.romaji;
        console.log(`📺 AniList info found: ${primaryTitle} (${animeInfo.format})`);
      } else {
        // Use stored name or generate from slug for custom entries
        primaryTitle = dbName || dbSlug.split('-').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
        console.log(`📺 Custom entry: ${primaryTitle}`);
        
        // Create mock anime info for custom entries
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

      // Use database slug directly
      const slugs = [dbSlug];
      console.log(`🧠 Using database slug: ${slugs}`);

      // Find episode
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
      // Not in database, try AniList approach
      console.log('📡 Not in database, fetching from AniList...');
      animeInfo = await getAnimeInfo(anilistId);
      
      if (!animeInfo) {
        return res.status(404).json({ 
          error: 'Anime not found on AniList and not in custom database',
          suggestion: 'Add this anime to the database via admin panel'
        });
      }

      primaryTitle = animeInfo.english || animeInfo.romaji;
      console.log(`📺 AniList Anime: ${primaryTitle} (${animeInfo.format})`);

      // Generate slugs naturally
      const slugs = generateSlugs(animeInfo, parseInt(anilistId));
      console.log(`🧠 Generated slugs: ${slugs}`);

      // Find episode
      console.log('🎯 Searching for content...');
      const result = await findEpisode(slugs, season, episode, animeInfo);

      if (!result) {
        return res.status(404).json({ 
          error: 'Content not found',
          anime_title: primaryTitle,
          tried_slugs: slugs,
          season: parseInt(season),
          episode: parseInt(episode),
          suggestion: 'Try adding correct slug mapping to database via admin panel'
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

// Generate HTML player
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
        .btn { display: inline-block; padding: 15px 30px; background: #03114cff; color: white; text-decoration: none; border-radius: 10px; margin-top: 20px; }
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
        .random-btn {
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
        }
        .random-btn:hover {
            transform: scale(1.05);
            box-shadow: 0 5px 15px rgba(17, 153, 142, 0.4);
        }
    </style>
</head>
<body>
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

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'active',
    version: '13.0.0',
    features: ['admin_panel', 'dynamic_database', 'enhanced_series_detection', 'random_anime'],
    exception_count: Object.keys(slugExceptions).length,
    random_pool_size: randomAnimePool.length
  });
});

// Initialize and start server
async function startServer() {
  await loadDatabase();
  
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`
🚀 ENHANCED ANIMEWORLD API v13.0 WITH ADMIN PANEL
─────────────────────────────────────────────────────────────────
✨ NEW FEATURES:
   • 🛡️  Admin Panel with Pterodactyl-style UI
   • 🔐 Authentication System (Password: 123Admin09)
   • 📊 Dynamic Database Management
   • 🎲 Random Anime Endpoint
   • 🔧 Enhanced Series Path Detection
   • 💾 Persistent JSON Database

🔗 Running on: http://localhost:${PORT}
─────────────────────────────────────────────────────────────────
📺 API Endpoints:
   • http://localhost:${PORT}/api/anime/41467/1/1 (Bleach TYBW)
   • http://localhost:${PORT}/api/anime/269/1/1 (Original Bleach)
   • http://localhost:${PORT}/api/random (Random Anime)

🛡️  Admin Panel:
   • http://localhost:${PORT}/admin (Password: 123Admin09)
   
📊 Current Database: ${Object.keys(slugExceptions).length} entries
🎯 Random Pool: ${randomAnimePool.length} anime
─────────────────────────────────────────────────────────────────
    `);
  });
}

startServer();
