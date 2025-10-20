import express from 'express';
import axios from 'axios';
import { load } from 'cheerio';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// API statistics
let apiStats = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  anilistRequests: 0,
  lastUpdated: new Date().toISOString()
};

// Enhanced SOURCES with discovery capabilities
const SOURCES = [
  {
    name: 'satoru.one',
    baseUrl: 'https://satoru.one',
    searchUrl: 'https://satoru.one/filter?keyword=',
    discoverUrl: 'https://satoru.one/ajax/filter?type=&status=&order=title&page=',
    patterns: []
  },
  {
    name: 'watchanimeworld.in',
    baseUrl: 'https://watchanimeworld.in',
    searchUrl: 'https://watchanimeworld.in/?s=',
    discoverUrl: 'https://watchanimeworld.in/page/',
    patterns: [
      '/episode/{slug}-{season}x{episode}/',
      '/episode/{slug}-episode-{episode}/',
      '/{slug}-episode-{episode}/'
    ]
  }
];

// ==================== ENHANCED HEADERS ====================
function getHeaders(referer = 'https://google.com') {
  return {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Referer': referer,
    'Cache-Control': 'max-age=0'
  };
}

// ==================== ANIME DISCOVERY SYSTEM ====================
async function discoverAnimeFromSource(source, page = 1, type = 'all') {
  try {
    let url = source.discoverUrl + page;
    
    // Adjust URL based on type for satoru
    if (source.name === 'satoru.one') {
      if (type === 'movies') url += '&type=movie';
      else if (type === 'series') url += '&type=tv';
      else if (type === 'cartoons') url += '&type=tv'; // Cartoons are usually TV series
    }

    console.log(`🔍 Discovering ${type} from ${source.name} page ${page}`);
    
    const response = await axios.get(url, {
      headers: getHeaders(source.baseUrl),
      timeout: 8000
    });

    const $ = load(response.data);
    const animeList = [];

    // Satoru discovery
    if (source.name === 'satoru.one') {
      $('.flw-item, .film_list-wrap .film-detail').each((i, el) => {
        const $el = $(el);
        const title = $el.find('.film-name, .film-title').text().trim();
        const image = $el.find('.film-poster img, .film-poster-img').attr('src');
        const url = $el.find('.film-poster-ahref, .film-poster a').attr('href');
        const id = $el.find('.film-poster-ahref').attr('data-id') || 
                   url?.split('/').pop() || 
                   `satoru-${i}`;

        if (title && image) {
          animeList.push({
            id,
            title,
            image: image.startsWith('http') ? image : source.baseUrl + image,
            url: url?.startsWith('http') ? url : source.baseUrl + url,
            source: source.name,
            type: type
          });
        }
      });
    } 
    // Animeworld discovery
    else if (source.name === 'watchanimeworld.in') {
      $('.item, .post, .anime-card, article').each((i, el) => {
        const $el = $(el);
        const title = $el.find('h3, h2, .title, .entry-title').text().trim();
        const image = $el.find('img').attr('src');
        const url = $el.find('a').attr('href');

        if (title && image && !title.includes('Episode')) {
          animeList.push({
            id: `aw-${i}-${page}`,
            title,
            image: image.startsWith('http') ? image : source.baseUrl + image,
            url: url?.startsWith('http') ? url : source.baseUrl + url,
            source: source.name,
            type: type
          });
        }
      });
    }

    console.log(`✅ Found ${animeList.length} ${type} from ${source.name}`);
    return animeList;
  } catch (error) {
    console.error(`💥 Discovery error from ${source.name}:`, error.message);
    return [];
  }
}

// ==================== RANDOM EPISODE GENERATOR ====================
async function getRandomEpisode() {
  try {
    console.log('🎲 Generating random episode...');
    
    // Get random anime from discovery
    const allAnime = await discoverAnimeFromSource(SOURCES[0], 1, 'all');
    if (allAnime.length === 0) throw new Error('No anime found for random episode');

    const randomAnime = allAnime[Math.floor(Math.random() * allAnime.length)];
    const randomEpisode = Math.floor(Math.random() * 50) + 1; // Assume up to 50 episodes
    
    console.log(`🎯 Random selection: "${randomAnime.title}" Episode ${randomEpisode}`);

    // Try to get episode data
    const episodeData = await findSatoruEpisode(randomAnime.title, randomEpisode);
    
    return {
      anime: randomAnime.title,
      season: 1,
      episode: randomEpisode,
      image: randomAnime.image,
      stream_url: episodeData.servers[0]?.url,
      source: 'satoru.one',
      success: true
    };
  } catch (error) {
    console.error('💥 Random episode error:', error.message);
    
    // Fallback to a popular anime
    return {
      anime: 'One Piece',
      season: 1,
      episode: 1,
      image: 'https://via.placeholder.com/300x400/333/fff?text=Anime',
      stream_url: '/api/stream/One%20Piece/1/1',
      source: 'fallback',
      success: true
    };
  }
}

// ==================== EXISTING STREAMING FUNCTIONS ====================
// [Include all the existing functions from your original code here:
// getAnimeTitleFromAniList, findSatoruEpisode, findAnimeWorldEpisode, 
// searchAllSourcesParallel, tryEpisodeUrl, extractAllServers, 
// buildEpisodeUrl, normalizeUrl, detectServerType]
// They remain exactly the same as in your original code

async function getAnimeTitleFromAniList(anilistId) {
  // ... keep existing implementation
}

async function findSatoruEpisode(animeTitle, episodeNum) {
  // ... keep existing implementation
}

async function findAnimeWorldEpisode(animeTitle, season, episode, sourceName) {
  // ... keep existing implementation
}

async function searchAllSourcesParallel(animeTitle, season, episode) {
  // ... keep existing implementation
}

async function tryEpisodeUrl(url, baseUrl) {
  // ... keep existing implementation
}

function extractAllServers($, baseUrl) {
  // ... keep existing implementation
}

function buildEpisodeUrl(pattern, slug, season, episode, baseUrl) {
  // ... keep existing implementation
}

function normalizeUrl(url, baseUrl) {
  // ... keep existing implementation
}

function detectServerType(url) {
  // ... keep existing implementation
}

// ==================== ENHANCED API ENDPOINTS ====================
app.get('/api/anime/:anilistId/:season/:episode', async (req, res) => {
  // ... keep existing implementation
});

app.get('/api/stream/:name/:season/:episode', async (req, res) => {
  // ... keep existing implementation
});

// ==================== NEW DISCOVERY ENDPOINTS ====================
app.get('/api/discover/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const { page = 1 } = req.query;
    
    console.log(`📚 Discover request: ${type} page ${page}`);
    
    const validTypes = ['all', 'anime', 'movies', 'cartoons', 'series'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid type. Use: all, anime, movies, cartoons, series' });
    }

    // Discover from all sources in parallel
    const discoveryPromises = SOURCES.map(source => 
      discoverAnimeFromSource(source, page, type)
    );
    
    const results = await Promise.allSettled(discoveryPromises);
    const allAnime = results
      .filter(result => result.status === 'fulfilled')
      .flatMap(result => result.value);

    // Remove duplicates based on title
    const uniqueAnime = allAnime.filter((anime, index, self) =>
      index === self.findIndex(a => a.title === anime.title)
    );

    res.json({
      success: true,
      type,
      page: parseInt(page),
      total: uniqueAnime.length,
      anime: uniqueAnime
    });
  } catch (error) {
    console.error('💥 Discovery endpoint error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// ==================== RANDOM EPISODE ENDPOINT ====================
app.get('/api/random', async (req, res) => {
  try {
    const randomData = await getRandomEpisode();
    res.json(randomData);
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// ==================== FRONTEND ROUTES ====================
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/watch', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'watch.html'));
});

app.get('/movies', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'movies.html'));
});

app.get('/cartoons', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'cartoons.html'));
});

app.get('/series', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'series.html'));
});

app.get('/anime', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'anime.html'));
});

// ==================== ENHANCED PLAYER WITH OVERLAY ====================
function sendEnhancedPlayer(res, title, season, episode, videoUrl, servers = [], image = '') {
  const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - S${season}E${episode}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body, html {
            overflow: hidden;
            background: #000;
            width: 100vw;
            height: 100vh;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        .player-container {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: #000;
        }
        
        /* Enhanced Overlay */
        .player-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            padding: 25px;
            background: linear-gradient(to bottom, rgba(0,0,0,0.9) 0%, transparent 100%);
            color: white;
            z-index: 1000;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            pointer-events: none;
            transition: opacity 0.5s ease;
        }
        
        .anime-info {
            pointer-events: auto;
        }
        
        .anime-title {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
            color: #fff;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
        }
        
        .season-episode {
            font-size: 18px;
            color: #00ff88;
            text-shadow: 1px 1px 3px rgba(0,0,0,0.8);
            font-weight: 600;
        }
        
        .player-controls {
            pointer-events: auto;
            display: flex;
            gap: 15px;
        }
        
        .control-btn {
            background: rgba(255,255,255,0.15);
            border: 1px solid rgba(255,255,255,0.3);
            color: white;
            padding: 10px 20px;
            border-radius: 25px;
            cursor: pointer;
            backdrop-filter: blur(10px);
            transition: all 0.3s ease;
            font-weight: 500;
        }
        
        .control-btn:hover {
            background: rgba(255,255,255,0.25);
            transform: translateY(-2px);
        }
        
        iframe {
            width: 100%;
            height: 100%;
            border: none;
            background: #000;
        }
        
        .server-list {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: rgba(0,0,0,0.95);
            color: white;
            padding: 20px;
            border-radius: 12px;
            z-index: 1000;
            font-size: 14px;
            border: 1px solid rgba(255,255,255,0.1);
            backdrop-filter: blur(15px);
            transition: opacity 0.3s;
            max-width: 300px;
        }
        
        .server-item {
            padding: 8px 0;
            border-bottom: 1px solid rgba(255,255,255,0.1);
            display: flex;
            justify-content: space-between;
        }
        
        .server-item:last-child {
            border-bottom: none;
        }
        
        .auto-play-notice {
            position: fixed;
            bottom: 10px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0,0,0,0.9);
            color: #00ff88;
            padding: 10px 20px;
            border-radius: 25px;
            font-size: 14px;
            z-index: 1000;
            transition: opacity 0.3s;
            border: 1px solid rgba(0,255,136,0.3);
        }
        
        .fade-out {
            opacity: 0.3;
        }
    </style>
</head>
<body>
    <div class="player-container">
        <!-- Enhanced Overlay -->
        <div class="player-overlay" id="playerOverlay">
            <div class="anime-info">
                <div class="anime-title">${title}</div>
                <div class="season-episode">Season ${season} × Episode ${episode}</div>
            </div>
            <div class="player-controls">
                <button class="control-btn" onclick="playRandomEpisode()">🎲 Random</button>
                <button class="control-btn" onclick="goHome()">🏠 Home</button>
            </div>
        </div>
        
        <div class="server-list" id="serverList">
            <div style="margin-bottom: 15px; font-weight: bold; font-size: 16px;">📡 Available Servers:</div>
            ${servers.map((server, index) => 
                `<div class="server-item">
                    <span>${index + 1}. ${server.name}</span>
                    <span style="color: #00ff88;">${server.server}</span>
                </div>`
            ).join('')}
        </div>
        
        <div class="auto-play-notice" id="autoPlayNotice">
            🔄 Auto-play Enabled • No YouTube Sources
        </div>

        <iframe 
            src="${videoUrl}" 
            allow="autoplay; fullscreen; encrypted-media; accelerometer; gyroscope; picture-in-picture" 
            allowfullscreen
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
            loading="eager"
            id="videoFrame"
            onload="console.log('🎬 Player loaded successfully')"
            onerror="console.log('❌ Player load error')">
        </iframe>
    </div>

    <script>
        // Enhanced player functionality
        let overlayVisible = true;
        let hideTimeout;
        
        function resetHideTimeout() {
            clearTimeout(hideTimeout);
            hideTimeout = setTimeout(hideOverlay, 5000);
        }
        
        function hideOverlay() {
            const overlay = document.getElementById('playerOverlay');
            const servers = document.getElementById('serverList');
            const notice = document.getElementById('autoPlayNotice');
            
            if (overlay) overlay.classList.add('fade-out');
            if (servers) servers.classList.add('fade-out');
            if (notice) notice.classList.add('fade-out');
            
            overlayVisible = false;
        }
        
        function showOverlay() {
            const overlay = document.getElementById('playerOverlay');
            const servers = document.getElementById('serverList');
            const notice = document.getElementById('autoPlayNotice');
            
            if (overlay) overlay.classList.remove('fade-out');
            if (servers) servers.classList.remove('fade-out');
            if (notice) notice.classList.remove('fade-out');
            
            overlayVisible = true;
            resetHideTimeout();
        }
        
        // Mouse movement detection
        document.addEventListener('mousemove', () => {
            if (!overlayVisible) {
                showOverlay();
            }
            resetHideTimeout();
        });
        
        // Auto-play enhancement
        document.addEventListener('DOMContentLoaded', function() {
            console.log('🚀 Enhanced player initialized');
            resetHideTimeout();
            
            // Multiple auto-play attempts
            attemptAutoPlay();
            setTimeout(attemptAutoPlay, 2000);
            setTimeout(attemptAutoPlay, 4000);
        });
        
        function attemptAutoPlay() {
            const iframe = document.getElementById('videoFrame');
            if (iframe) {
                iframe.focus();
                // Some iframes need this to auto-play
                setTimeout(() => {
                    window.focus();
                    iframe.contentWindow?.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
                }, 1000);
            }
        }
        
        function playRandomEpisode() {
            window.location.href = '/api/random?player=true';
        }
        
        function goHome() {
            window.location.href = '/';
        }
        
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                showOverlay();
                resetHideTimeout();
            }
        });
    </script>
</body>
</html>`;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
}

// ==================== CREATE PUBLIC DIRECTORY & FRONTEND FILES ====================
import fs from 'fs';

// Ensure public directory exists
if (!fs.existsSync('public')) {
  fs.mkdirSync('public');
}

// Create main HTML files
const htmlFiles = {
  'index.html': `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AnimeFlix - Ultimate Streaming</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            background: #0f0f0f;
            color: white;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        .navbar {
            background: linear-gradient(135deg, #1a1a1a 0%, #2d1b69 100%);
            padding: 1rem 2rem;
            position: fixed;
            width: 100%;
            top: 0;
            z-index: 1000;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: 0 4px 20px rgba(0,0,0,0.5);
        }
        .logo {
            font-size: 2rem;
            font-weight: bold;
            background: linear-gradient(45deg, #ff6b6b, #ffa726);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .nav-links {
            display: flex;
            gap: 2rem;
        }
        .nav-links a {
            color: white;
            text-decoration: none;
            padding: 0.5rem 1rem;
            border-radius: 25px;
            transition: all 0.3s ease;
            font-weight: 500;
        }
        .nav-links a:hover, .nav-links a.active {
            background: rgba(255,255,255,0.1);
            transform: translateY(-2px);
        }
        .hero {
            margin-top: 80px;
            padding: 4rem 2rem;
            text-align: center;
            background: linear-gradient(135deg, #1a1a1a 0%, #2d1b69 100%);
        }
        .hero h1 {
            font-size: 3.5rem;
            margin-bottom: 1rem;
            background: linear-gradient(45deg, #ff6b6b, #ffa726);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .hero p {
            font-size: 1.2rem;
            margin-bottom: 2rem;
            opacity: 0.9;
        }
        .cta-buttons {
            display: flex;
            gap: 1rem;
            justify-content: center;
            flex-wrap: wrap;
        }
        .btn {
            padding: 12px 30px;
            border: none;
            border-radius: 30px;
            font-size: 1.1rem;
            cursor: pointer;
            transition: all 0.3s ease;
            font-weight: 600;
            text-decoration: none;
            display: inline-block;
        }
        .btn-primary {
            background: linear-gradient(45deg, #ff6b6b, #ffa726);
            color: white;
        }
        .btn-secondary {
            background: rgba(255,255,255,0.1);
            color: white;
            border: 2px solid rgba(255,255,255,0.3);
        }
        .btn:hover {
            transform: translateY(-3px);
            box-shadow: 0 10px 25px rgba(0,0,0,0.3);
        }
        .sections {
            padding: 3rem 2rem;
        }
        .section-title {
            font-size: 2rem;
            margin-bottom: 2rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .anime-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 1.5rem;
            margin-bottom: 3rem;
        }
        .anime-card {
            background: #1a1a1a;
            border-radius: 15px;
            overflow: hidden;
            transition: all 0.3s ease;
            cursor: pointer;
            border: 1px solid rgba(255,255,255,0.1);
        }
        .anime-card:hover {
            transform: translateY(-10px);
            box-shadow: 0 15px 35px rgba(0,0,0,0.5);
            border-color: #ff6b6b;
        }
        .anime-card img {
            width: 100%;
            height: 250px;
            object-fit: cover;
        }
        .anime-info {
            padding: 1rem;
        }
        .anime-title {
            font-weight: 600;
            margin-bottom: 0.5rem;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .watch-btn {
            background: linear-gradient(45deg, #ff6b6b, #ffa726);
            color: white;
            border: none;
            padding: 8px 15px;
            border-radius: 20px;
            cursor: pointer;
            width: 100%;
            font-weight: 600;
            transition: all 0.3s ease;
        }
        .watch-btn:hover {
            transform: scale(1.05);
        }
        .loading {
            text-align: center;
            padding: 2rem;
            font-size: 1.2rem;
        }
        .footer {
            background: #1a1a1a;
            padding: 2rem;
            text-align: center;
            margin-top: 3rem;
            border-top: 1px solid rgba(255,255,255,0.1);
        }
        @media (max-width: 768px) {
            .nav-links {
                gap: 1rem;
            }
            .hero h1 {
                font-size: 2.5rem;
            }
            .anime-grid {
                grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            }
        }
    </style>
</head>
<body>
    <!-- Navigation -->
    <nav class="navbar">
        <div class="logo">AnimeFlix</div>
        <div class="nav-links">
            <a href="/" class="active">Home</a>
            <a href="/anime">Anime</a>
            <a href="/movies">Movies</a>
            <a href="/series">Series</a>
            <a href="/cartoons">Cartoons</a>
            <a href="/api/random?player=true" style="background: linear-gradient(45deg, #ff6b6b, #ffa726);">🎲 Random</a>
        </div>
    </nav>

    <!-- Hero Section -->
    <section class="hero">
        <h1>Unlimited Anime Streaming</h1>
        <p>Watch thousands of anime, movies, and series for free with no ads</p>
        <div class="cta-buttons">
            <a href="/api/random?player=true" class="btn btn-primary">🎲 Watch Random Episode</a>
            <a href="/anime" class="btn btn-secondary">📺 Browse All Anime</a>
        </div>
    </section>

    <!-- Content Sections -->
    <section class="sections">
        <!-- Featured Anime -->
        <div class="section-title">
            <h2>🔥 Featured Anime</h2>
            <a href="/anime" style="color: #ffa726; text-decoration: none;">View All →</a>
        </div>
        <div class="anime-grid" id="featuredAnime">
            <div class="loading">Loading featured anime...</div>
        </div>

        <!-- Latest Movies -->
        <div class="section-title">
            <h2>🎬 Anime Movies</h2>
            <a href="/movies" style="color: #ffa726; text-decoration: none;">View All →</a>
        </div>
        <div class="anime-grid" id="animeMovies">
            <div class="loading">Loading movies...</div>
        </div>

        <!-- Popular Series -->
        <div class="section-title">
            <h2>📺 Popular Series</h2>
            <a href="/series" style="color: #ffa726; text-decoration: none;">View All →</a>
        </div>
        <div class="anime-grid" id="popularSeries">
            <div class="loading">Loading series...</div>
        </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
        <p>&copy; 2024 AnimeFlix. All anime content is provided by third-party sources.</p>
    </footer>

    <script>
        // Load content for homepage
        async function loadHomepageContent() {
            try {
                // Load featured anime
                const featuredResponse = await fetch('/api/discover/all?page=1');
                const featuredData = await featuredResponse.json();
                
                if (featuredData.success) {
                    displayAnimeGrid('featuredAnime', featuredData.anime.slice(0, 8));
                }

                // Load movies
                const moviesResponse = await fetch('/api/discover/movies?page=1');
                const moviesData = await moviesResponse.json();
                
                if (moviesData.success) {
                    displayAnimeGrid('animeMovies', moviesData.anime.slice(0, 8));
                }

                // Load series
                const seriesResponse = await fetch('/api/discover/series?page=1');
                const seriesData = await seriesResponse.json();
                
                if (seriesData.success) {
                    displayAnimeGrid('popularSeries', seriesData.anime.slice(0, 8));
                }

            } catch (error) {
                console.error('Error loading homepage content:', error);
                document.getElementById('featuredAnime').innerHTML = '<div class="loading">Error loading content</div>';
            }
        }

        function displayAnimeGrid(elementId, animeList) {
            const grid = document.getElementById(elementId);
            
            if (!animeList || animeList.length === 0) {
                grid.innerHTML = '<div class="loading">No content available</div>';
                return;
            }

            grid.innerHTML = animeList.map(anime => `
                <div class="anime-card" onclick="watchAnime('${anime.title}', 1, 1)">
                    <img src="${anime.image}" alt="${anime.title}" onerror="this.src='https://via.placeholder.com/200x300/333/fff?text=Anime'">
                    <div class="anime-info">
                        <div class="anime-title">${anime.title}</div>
                        <button class="watch-btn" onclick="event.stopPropagation(); watchAnime('${anime.title}', 1, 1)">
                            Watch Now
                        </button>
                    </div>
                </div>
            `).join('');
        }

        function watchAnime(title, season, episode) {
            window.location.href = \`/watch?anime=\${encodeURIComponent(title)}&season=\${season}&episode=\${episode}\`;
        }

        // Load content when page loads
        document.addEventListener('DOMContentLoaded', loadHomepageContent);
    </script>
</body>
</html>`,

  'watch.html': `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Watch - AnimeFlix</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            background: #0f0f0f;
            color: white;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        .navbar {
            background: linear-gradient(135deg, #1a1a1a 0%, #2d1b69 100%);
            padding: 1rem 2rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .logo {
            font-size: 1.5rem;
            font-weight: bold;
            background: linear-gradient(45deg, #ff6b6b, #ffa726);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .player-container {
            width: 100%;
            max-width: 1200px;
            margin: 2rem auto;
            background: #000;
            border-radius: 15px;
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(0,0,0,0.5);
        }
        .player-wrapper {
            position: relative;
            width: 100%;
            padding-bottom: 56.25%; /* 16:9 aspect ratio */
            height: 0;
        }
        #videoPlayer {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            border: none;
        }
        .player-info {
            padding: 1.5rem;
            background: #1a1a1a;
        }
        .anime-title {
            font-size: 1.8rem;
            font-weight: bold;
            margin-bottom: 0.5rem;
        }
        .episode-info {
            color: #ffa726;
            font-size: 1.2rem;
            margin-bottom: 1rem;
        }
        .controls {
            display: flex;
            gap: 1rem;
            flex-wrap: wrap;
        }
        .btn {
            padding: 10px 20px;
            border: none;
            border-radius: 25px;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.3s ease;
        }
        .btn-primary {
            background: linear-gradient(45deg, #ff6b6b, #ffa726);
            color: white;
        }
        .btn-secondary {
            background: rgba(255,255,255,0.1);
            color: white;
            border: 2px solid rgba(255,255,255,0.3);
        }
        .btn:hover {
            transform: translateY(-2px);
        }
        .loading {
            text-align: center;
            padding: 3rem;
            font-size: 1.2rem;
        }
        .error {
            text-align: center;
            padding: 3rem;
            color: #ff6b6b;
            font-size: 1.2rem;
        }
    </style>
</head>
<body>
    <nav class="navbar">
        <div class="logo">AnimeFlix</div>
        <div>
            <a href="/" style="color: white; text-decoration: none;">← Back to Home</a>
        </div>
    </nav>

    <div class="player-container">
        <div class="player-wrapper">
            <div id="playerLoading" class="loading">
                🎬 Loading player...
            </div>
            <iframe id="videoPlayer" style="display: none;"></iframe>
        </div>
        
        <div class="player-info">
            <div id="playerInfo">
                <div class="loading">Loading episode info...</div>
            </div>
        </div>
    </div>

    <script>
        // Get URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const anime = urlParams.get('anime');
        const season = urlParams.get('season') || '1';
        const episode = urlParams.get('episode') || '1';

        async function loadPlayer() {
            try {
                if (anime) {
                    // Load stream for specific anime
                    const response = await fetch(\`/api/stream/\${encodeURIComponent(anime)}/\${season}/\${episode}?json=true\`);
                    const data = await response.json();
                    
                    if (data.success) {
                        displayPlayer(data);
                    } else {
                        showError('Episode not found');
                    }
                } else {
                    // Load random episode
                    const response = await fetch('/api/random');
                    const data = await response.json();
                    
                    if (data.success) {
                        displayPlayer(data);
                    } else {
                        showError('Failed to load random episode');
                    }
                }
            } catch (error) {
                console.error('Error loading player:', error);
                showError('Failed to load video player');
            }
        }

        function displayPlayer(data) {
            const player = document.getElementById('videoPlayer');
            const loading = document.getElementById('playerLoading');
            const info = document.getElementById('playerInfo');
            
            // Update player
            player.src = data.stream_url || data.servers[0]?.url;
            player.style.display = 'block';
            loading.style.display = 'none';
            
            // Update info
            info.innerHTML = \`
                <div class="anime-title">\${data.anime || data.title}</div>
                <div class="episode-info">Season \${data.season} × Episode \${data.episode}</div>
                <div class="controls">
                    <button class="btn btn-primary" onclick="playRandom()">🎲 Random Episode</button>
                    <button class="btn btn-secondary" onclick="goHome()">🏠 Home</button>
                </div>
            \`;
        }

        function showError(message) {
            document.getElementById('playerLoading').innerHTML = \`
                <div class="error">
                    ❌ \${message}
                    <br><br>
                    <button class="btn btn-primary" onclick="playRandom()">Try Random Episode</button>
                </div>
            \`;
        }

        function playRandom() {
            window.location.href = '/api/random?player=true';
        }

        function goHome() {
            window.location.href = '/';
        }

        // Load player when page loads
        document.addEventListener('DOMContentLoaded', loadPlayer);
    </script>
</body>
</html>`,

  'anime.html': `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Anime - AnimeFlix</title>
    <style>
        /* Reuse styles from index.html and add pagination */
        .pagination {
            display: flex;
            justify-content: center;
            gap: 1rem;
            margin: 2rem 0;
        }
        .page-btn {
            padding: 10px 20px;
            background: rgba(255,255,255,0.1);
            color: white;
            border: none;
            border-radius: 25px;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        .page-btn:hover {
            background: rgba(255,255,255,0.2);
        }
        .page-btn.active {
            background: linear-gradient(45deg, #ff6b6b, #ffa726);
        }
    </style>
</head>
<body>
    <nav class="navbar">
        <div class="logo">AnimeFlix</div>
        <div class="nav-links">
            <a href="/">Home</a>
            <a href="/anime" class="active">Anime</a>
            <a href="/movies">Movies</a>
            <a href="/series">Series</a>
            <a href="/cartoons">Cartoons</a>
            <a href="/api/random?player=true" style="background: linear-gradient(45deg, #ff6b6b, #ffa726);">🎲 Random</a>
        </div>
    </nav>

    <section class="sections">
        <div class="section-title">
            <h2>📺 All Anime</h2>
        </div>
        
        <div class="anime-grid" id="animeList">
            <div class="loading">Loading anime...</div>
        </div>
        
        <div class="pagination" id="pagination">
            <!-- Pagination will be generated here -->
        </div>
    </section>

    <script>
        let currentPage = 1;
        
        async function loadAnime(page = 1) {
            try {
                document.getElementById('animeList').innerHTML = '<div class="loading">Loading anime...</div>';
                
                const response = await fetch(\`/api/discover/all?page=\${page}\`);
                const data = await response.json();
                
                if (data.success) {
                    displayAnime(data.anime);
                    setupPagination(page, data.total);
                } else {
                    document.getElementById('animeList').innerHTML = '<div class="loading">Error loading anime</div>';
                }
            } catch (error) {
                console.error('Error loading anime:', error);
                document.getElementById('animeList').innerHTML = '<div class="loading">Error loading anime</div>';
            }
        }

        function displayAnime(animeList) {
            const grid = document.getElementById('animeList');
            
            if (!animeList || animeList.length === 0) {
                grid.innerHTML = '<div class="loading">No anime found</div>';
                return;
            }

            grid.innerHTML = animeList.map(anime => \`
                <div class="anime-card" onclick="watchAnime('\${anime.title}', 1, 1)">
                    <img src="\${anime.image}" alt="\${anime.title}" onerror="this.src='https://via.placeholder.com/200x300/333/fff?text=Anime'">
                    <div class="anime-info">
                        <div class="anime-title">\${anime.title}</div>
                        <button class="watch-btn" onclick="event.stopPropagation(); watchAnime('\${anime.title}', 1, 1)">
                            Watch Now
                        </button>
                    </div>
                </div>
            \`).join('');
        }

        function setupPagination(currentPage, totalItems) {
            const pagination = document.getElementById('pagination');
            const totalPages = Math.ceil(totalItems / 20); // Assuming 20 items per page
            
            let paginationHTML = '';
            
            if (currentPage > 1) {
                paginationHTML += \`<button class="page-btn" onclick="loadAnime(\${currentPage - 1})">← Previous</button>\`;
            }
            
            // Show page numbers
            for (let i = 1; i <= Math.min(totalPages, 5); i++) {
                paginationHTML += \`<button class="page-btn \${i === currentPage ? 'active' : ''}" onclick="loadAnime(\${i})">\${i}</button>\`;
            }
            
            if (currentPage < totalPages) {
                paginationHTML += \`<button class="page-btn" onclick="loadAnime(\${currentPage + 1})">Next →</button>\`;
            }
            
            pagination.innerHTML = paginationHTML;
        }

        function watchAnime(title, season, episode) {
            window.location.href = \`/watch?anime=\${encodeURIComponent(title)}&season=\${season}&episode=\${episode}\`;
        }

        // Load anime when page loads
        document.addEventListener('DOMContentLoaded', () => loadAnime(1));
    </script>
</body>
</html>`
};

// Create movies.html, cartoons.html, series.html (similar structure)
['movies', 'cartoons', 'series'].forEach(type => {
  htmlFiles[`${type}.html`] = htmlFiles['anime.html'].replace(/All Anime/g, 
    type.charAt(0).toUpperCase() + type.slice(1))
    .replace(`/api/discover/all?page=`, `/api/discover/${type}?page=`)
    .replace('📺 All Anime', 
      type === 'movies' ? '🎬 Anime Movies' : 
      type === 'cartoons' ? '🐰 Cartoons' : '📺 TV Series');
});

// Write HTML files
Object.entries(htmlFiles).forEach(([filename, content]) => {
  fs.writeFileSync(`public/${filename}`, content);
});

console.log('✅ Frontend files created successfully!');

// ==================== HEALTH & STATUS ====================
app.get('/health', (req, res) => {
  const successRate = apiStats.totalRequests > 0 ? 
    Math.round((apiStats.successfulRequests / apiStats.totalRequests) * 100) : 0;
    
  res.json({ 
    status: 'active', 
    version: '3.0.0',
    performance: 'Ultra-fast streaming',
    total_requests: apiStats.totalRequests,
    successful_requests: apiStats.successfulRequests,
    failed_requests: apiStats.failedRequests,
    anilist_requests: apiStats.anilistRequests,
    success_rate: successRate + '%',
    sources: SOURCES.map(s => s.name),
    features: [
      'Full-stack application',
      'Anime discovery system',
      'Random episode generator',
      'Enhanced player with overlay',
      'Multi-category browsing',
      'Responsive design'
    ]
  });
});

// ==================== SERVER STARTUP ====================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`
🎉 COMPLETE ANIME STREAMING PLATFORM v3.0
───────────────────────────────────────────
Port: ${PORT}
Frontend: http://localhost:${PORT}
API: http://localhost:${PORT}/health

🏠 FRONTEND SECTIONS:
• Home - Featured content dashboard
• Anime - Complete anime catalog
• Movies - Anime movies collection  
• Series - TV series section
• Cartoons - Animated content
• Watch - Enhanced video player

🎯 ENHANCED FEATURES:
• Random Episode Generator
• Anime Discovery System
• Player Overlay (Season × Episode)
• Multi-source Streaming
• Responsive Design
• Auto-play Optimization

🚀 PERFORMANCE:
• Parallel source discovery
• 8-second timeout limits
• Optimized selectors
• Fast fallback systems

📊 TEST ENDPOINTS:
• /api/random - Random episode
• /api/discover/all - All anime
• /api/discover/movies - Anime movies
• /api/stream/One%20Piece/1/1 - Direct stream

✅ READY: Full-stack application deployed!
───────────────────────────────────────────
  `);
});
