import express from 'express';
import axios from 'axios';
import { load } from 'cheerio';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Fix for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Enhanced anime database with automatic search fallback
let animeDatabase = {
  // Popular Anime - Enhanced with more entries
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
  
  // Cartoons
  998001: { slug: "ben-10", name: "Ben 10", hasAnilistId: false },
  998101: { slug: "shinchan", name: "Shinchan", hasAnilistId: false },
  998201: { slug: "doraemon", name: "Doraemon", hasAnilistId: false }
};

// Updated random anime pool
let randomAnimePool = [20, 21, 113415, 127230, 101922, 16498, 269, 1535, 1735, 140960];

// API statistics
let apiStats = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  autoSearchUsed: 0,
  lastUpdated: new Date().toISOString()
};

// File paths
const DB_FILE = path.join(process.env.VERCEL ? '/tmp' : __dirname, 'anime_database.json');

// Initialize SQLite database with caching
let sqliteDb;
(async () => {
  sqliteDb = await open({
    filename: './anime_cache.db',
    driver: sqlite3.Database,
  });

  await sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS anime_cache (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      query TEXT UNIQUE,
      title TEXT,
      slug TEXT,
      source TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_accessed DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS episode_cache (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT,
      season INTEGER,
      episode INTEGER,
      servers TEXT,
      source TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_accessed DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await sqliteDb.exec('CREATE INDEX IF NOT EXISTS idx_query ON anime_cache(query)');
  await sqliteDb.exec('CREATE INDEX IF NOT EXISTS idx_slug_season_episode ON episode_cache(slug, season, episode)');
})();

// Cache management functions
async function getCachedAnime(query) {
  const cached = await sqliteDb.get(
    'SELECT title, slug, source FROM anime_cache WHERE query = ? AND datetime(last_accessed) > datetime("now", "-1 hour")',
    query.toLowerCase()
  );
  if (cached) {
    await sqliteDb.run('UPDATE anime_cache SET last_accessed = CURRENT_TIMESTAMP WHERE query = ?', query.toLowerCase());
    return cached;
  }
  return null;
}

async function cacheAnime(query, title, slug, source) {
  await sqliteDb.run(
    'INSERT OR REPLACE INTO anime_cache (query, title, slug, source, last_accessed) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)',
    [query.toLowerCase(), title, slug, source]
  );
}

async function getCachedEpisode(slug, season, episode) {
  const cached = await sqliteDb.get(
    'SELECT servers FROM episode_cache WHERE slug = ? AND season = ? AND episode = ? AND datetime(last_accessed) > datetime("now", "-30 minutes")',
    [slug, season, episode]
  );
  if (cached) {
    await sqliteDb.run(
      'UPDATE episode_cache SET last_accessed = CURRENT_TIMESTAMP WHERE slug = ? AND season = ? AND episode = ?',
      [slug, season, episode]
    );
    return JSON.parse(cached.servers);
  }
  return null;
}

async function cacheEpisode(slug, season, episode, servers, source) {
  await sqliteDb.run(
    'INSERT OR REPLACE INTO episode_cache (slug, season, episode, servers, source, last_accessed) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
    [slug, season, episode, JSON.stringify(servers), source]
  );
}

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
    console.log('Database saved');
  } catch (error) {
    console.error('Failed to save database:', error.message);
  }
}

// ==================== ENHANCED AUTO-SEARCH FUNCTIONS ====================

/**
 * Multi-source search function
 */
async function searchAnime(query) {
  console.log(`Searching for: ${query}`);
  
  const sources = [
    {
      name: 'watchanimeworld',
      searchUrl: `https://watchanimeworld.in/?s=${encodeURIComponent(query)}`,
      extractResults: ($) => {
        const results = [];
        $('.item, .post, .anime-card, .search-result, a').each((i, el) => {
          const $el = $(el);
          const title = $el.find('h3, h2, .title').first().text().trim() || $el.text().trim();
          const url = $el.attr('href');
          
          if (title && url && (url.includes('/anime/') || url.includes('/series/')) && title.length > 2) {
            const slugMatch = url.match(/\/(anime|series)\/([^\/]+)/);
            if (slugMatch) {
              results.push({
                title: title,
                url: url,
                slug: slugMatch[2],
                source: 'watchanimeworld'
              });
            }
          }
        });
        return results.filter((result, index, self) => 
          index === self.findIndex(r => r.slug === result.slug)
        );
      }
    },
    {
      name: 'satoru',
      searchUrl: `https://satoru.one/search?keyword=${encodeURIComponent(query)}`,
      extractResults: ($) => {
        const results = [];
        $('.film_list-wrap .film_list, .search-results .item, a').each((i, el) => {
          const $el = $(el);
          const title = $el.find('.film-name, .title, .name').first().text().trim() || $el.text().trim();
          const url = $el.attr('href');
          
          if (title && url && url.includes('/watch/') && title.length > 2) {
            const slugMatch = url.match(/\/watch\/([^?]+)/);
            if (slugMatch) {
              results.push({
                title: title,
                url: url,
                slug: slugMatch[1],
                source: 'satoru'
              });
            }
          }
        });
        return results.filter((result, index, self) => 
          index === self.findIndex(r => r.slug === result.slug)
        );
      }
    }
  ];

  const allResults = [];

  for (const source of sources) {
    try {
      const { data } = await axios.get(source.searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9'
        },
        timeout: 8000
      });

      const $ = load(data);
      const results = source.extractResults($);
      allResults.push(...results);
      
      console.log(`Found ${results.length} results from ${source.name}`);
    } catch (error) {
      console.log(`Search failed for ${source.name}:`, error.message);
    }
  }

  return allResults;
}

/**
 * Find the best matching anime from search results
 */
function findBestMatch(results, query) {
  if (results.length === 0) return null;
  
  const queryLower = query.toLowerCase().trim();
  
  const scoredResults = results.map(result => {
    let score = 0;
    const titleLower = result.title.toLowerCase().trim();
    
    // Exact match gets highest score
    if (titleLower === queryLower) score += 100;
    
    // Contains all words
    const queryWords = queryLower.split(/\s+/).filter(word => word.length > 2);
    const titleWords = titleLower.split(/\s+/);
    
    const containsAllWords = queryWords.every(word => titleLower.includes(word));
    if (containsAllWords) score += 50;
    
    // Contains most words
    const containsWords = queryWords.filter(word => titleLower.includes(word)).length;
    score += containsWords * 10;
    
    // Starts with query
    if (titleLower.startsWith(queryLower)) score += 30;
    
    // Length similarity
    const lengthDiff = Math.abs(titleLower.length - queryLower.length);
    score += Math.max(0, 20 - lengthDiff);
    
    return { ...result, score };
  });
  
  // Sort by score descending
  scoredResults.sort((a, b) => b.score - a.score);
  
  if (scoredResults[0].score > 10) {
    console.log(`Best match: "${scoredResults[0].title}" with score ${scoredResults[0].score}`);
    return scoredResults[0];
  }
  
  return null;
}

/**
 * Enhanced episode finder with multi-source support
 */
async function findEpisodeEnhanced(slug, season, episode, animeTitle = "", autoSearch = false) {
  const sources = [
    {
      name: 'watchanimeworld',
      patterns: [
        `https://watchanimeworld.in/episode/${slug}-${season}x${episode}/`,
        `https://watchanimeworld.in/episode/${slug}-s${season.toString().padStart(2, '0')}e${episode.toString().padStart(2, '0')}/`,
        `https://watchanimeworld.in/episode/${slug}-episode-${episode}/`,
        `https://watchanimeworld.in/episode/${slug}-season-${season}-episode-${episode}/`,
        `https://watchanimeworld.in/series/${slug}/season-${season}/episode-${episode}/`,
        `https://watchanimeworld.in/anime/${slug}/episode-${episode}/`
      ]
    },
    {
      name: 'satoru',
      patterns: [
        `https://satoru.one/watch/${slug}?ep=${episode}`,
        `https://satoru.one/watch/${slug}?ep=${episode.toString().padStart(2, '0')}`,
        `https://satoru.one/watch/${slug}-episode-${episode}`,
        `https://satoru.one/watch/${slug}-${episode}`
      ]
    }
  ];

  console.log(`Enhanced search for: ${slug} S${season}E${episode}`);

  for (const source of sources) {
    for (const pattern of source.patterns) {
      console.log(`Trying pattern: ${pattern}`);
      
      try {
        const response = await axios.get(pattern, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Referer': source.name === 'satoru' ? 'https://satoru.one/' : 'https://watchanimeworld.in/'
          },
          timeout: 10000,
          validateStatus: (status) => status < 500
        });

        console.log(`Response status: ${response.status} for ${source.name}`);

        // Enhanced page existence checks
        if (response.status === 404 || 
            response.data.includes('404') || 
            response.data.includes('Not Found') ||
            response.data.includes('Page Not Found') ||
            response.data.includes('episode not found')) {
          continue;
        }

        if (response.status !== 200) continue;

        const $ = load(response.data);
        const servers = await extractAllServers($, source.name, pattern);
        
        if (servers.length > 0) {
          console.log(`Success with ${source.name}! Found ${servers.length} servers`);
          return { 
            url: pattern, 
            servers,
            usedPattern: pattern,
            source: source.name,
            autoSearched: autoSearch
          };
        }

      } catch (error) {
        console.log(`Error with ${source.name}:`, error.message);
        continue;
      }
    }
  }

  return null;
}

/**
 * Enhanced server extraction for multiple providers
 */
async function extractAllServers($, source, baseUrl) {
  const servers = [];
  
  if (source === 'watchanimeworld') {
    // Extract from watchanimeworld
    $('iframe').each((i, el) => {
      let src = $(el).attr('src') || $(el).attr('data-src') || $(el).attr('data-url');
      if (src) {
        if (src.startsWith('//')) src = 'https:' + src;
        else if (src.startsWith('/')) src = 'https://watchanimeworld.in' + src;
        
        if (src.startsWith('http')) {
          const serverType = detectServerType(src);
          servers.push({
            name: `${serverType} ${servers.length + 1}`,
            url: src,
            type: 'iframe',
            server: serverType,
            source: 'watchanimeworld'
          });
        }
      }
    });
  } else if (source === 'satoru') {
    // Enhanced Satoru server extraction
    $('[data-server], .server-btn, .lang-btn, button, .episode-server').each((i, el) => {
      const $el = $(el);
      const serverName = $el.text().trim() || $el.attr('title') || $el.attr('data-lang') || `Server ${servers.length + 1}`;
      const dataServer = $el.attr('data-server');
      const dataCode = $el.attr('data-code');
      const dataId = $el.attr('data-id');
      const onclick = $el.attr('onclick');
      
      // Extract server URL from various attributes
      let serverUrl;
      if (dataServer) {
        serverUrl = `https://satoru.one/embed/${dataServer}`;
      } else if (dataCode) {
        serverUrl = `https://satoru.one/embed/${dataCode}`;
      } else if (dataId) {
        serverUrl = `https://satoru.one/embed/${dataId}`;
      } else if (onclick) {
        const match = onclick.match(/loadEpisode\(['"]([^'"]+)['"]\)/);
        if (match) serverUrl = `https://satoru.one/embed/${match[1]}`;
        
        const match2 = onclick.match(/['"]([^'"]+embed[^'"]+)['"]/);
        if (match2) serverUrl = match2[1].startsWith('http') ? match2[1] : `https://satoru.one${match2[1]}`;
      }

      if (serverUrl) {
        const serverType = detectServerType(serverUrl) || detectServerFromName(serverName);
        servers.push({
          name: serverName,
          url: serverUrl,
          type: 'embed',
          server: serverType,
          source: 'satoru'
        });
      }
    });

    // Also extract direct iframes
    $('iframe').each((i, el) => {
      const src = $(el).attr('src');
      if (src && src.includes('http')) {
        let serverUrl = src.startsWith('//') ? 'https:' + src : src;
        servers.push({
          name: `Embed ${servers.length + 1}`,
          url: serverUrl,
          type: 'iframe',
          server: detectServerType(serverUrl),
          source: 'satoru'
        });
      }
    });
  }

  // Remove duplicates based on URL
  const uniqueServers = [];
  const seenUrls = new Set();
  
  servers.forEach(server => {
    if (!seenUrls.has(server.url)) {
      seenUrls.add(server.url);
      uniqueServers.push(server);
    }
  });

  console.log(`Extracted ${uniqueServers.length} unique servers from ${source}`);
  return uniqueServers;
}

// Enhanced server type detection
function detectServerType(url) {
  const urlLower = url.toLowerCase();
  const serverMap = {
    'streamtape': 'StreamTape',
    'dood': 'DoodStream',
    'filemoon': 'FileMoon',
    'mixdrop': 'MixDrop',
    'mp4upload': 'Mp4Upload',
    'vidstream': 'VidStream',
    'gogostream': 'GogoStream',
    'voee': 'Voe',
    'voe': 'Voe',
    'earnvid': 'EarnVids',
    'earnvids': 'EarnVids',
    'abyss': 'Abyss',
    'streamwish': 'Streamwish',
    'play.zephyrflick': 'ZephyrFlick',
    'vidsrc': 'VidSrc',
    'vidsrc.pro': 'VidSrc Pro',
    '2embed': '2Embed',
    'dokicloud': 'DokiCloud'
  };

  for (const [key, name] of Object.entries(serverMap)) {
    if (urlLower.includes(key)) return name;
  }
  return 'Unknown Server';
}

function detectServerFromName(serverName) {
  const nameLower = serverName.toLowerCase();
  if (nameLower.includes('vidstream') || nameLower.includes('vid-stream')) return 'VidStream';
  if (nameLower.includes('earnvid') || nameLower.includes('earn-vid')) return 'EarnVids';
  if (nameLower.includes('abyss')) return 'Abyss';
  if (nameLower.includes('filemoon') || nameLower.includes('file-moon')) return 'FileMoon';
  if (nameLower.includes('streamwish') || nameLower.includes('stream-wish')) return 'Streamwish';
  if (nameLower.includes('voe')) return 'Voe';
  if (nameLower.includes('dood')) return 'DoodStream';
  if (nameLower.includes('mixdrop')) return 'MixDrop';
  if (nameLower.includes('streamtape')) return 'StreamTape';
  if (nameLower.includes('bn') || nameLower.includes('bangla')) return 'Bangla';
  if (nameLower.includes('hi') || nameLower.includes('hindi')) return 'Hindi';
  if (nameLower.includes('en') || nameLower.includes('english')) return 'English';
  if (nameLower.includes('jp') || nameLower.includes('japanese')) return 'Japanese';
  return serverName;
}

// ==================== ENHANCED MAIN API ROUTES ====================

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Ultimate AnimeWorld API - Boss Level v11.0',
    version: '11.0.0',
    endpoints: {
      '/api/anime/:id/:season/:episode': 'Stream anime episode',
      '/api/auto/:name/:season/:episode': 'Auto-search and stream',
      '/api/random': 'Random anime episode', 
      '/api/iframe?url=URL': 'Clean iframe player',
      '/api/search?q=query': 'Search anime',
      '/admin': 'Admin panel',
      '/health': 'Health check'
    },
    features: [
      'Multi-source scraping (WatchAnimeWorld + Satoru)',
      'SQLite caching for fast performance',
      'Auto-search functionality',
      'Enhanced server detection',
      'Collapsible server selector',
      'Backup source support'
    ]
  });
});

// Enhanced main streaming endpoint with auto-search fallback
app.get('/api/anime/:id/:season/:episode', async (req, res) => {
  try {
    const { id, season, episode } = req.params;
    const { server, json, clean, autosearch } = req.query;

    console.log(`Streaming: ${id} S${season}E${episode}`);
    apiStats.totalRequests++;

    // Check if anime exists in database
    let dbEntry = animeDatabase[id];
    let usedAutoSearch = false;

    // If not found in database but autosearch is enabled, try to find it
    if (!dbEntry && autosearch !== 'false') {
      console.log(`Anime ${id} not in database, attempting auto-search...`);
      const searchQuery = id;
      const searchResults = await searchAnime(searchQuery);
      const bestMatch = findBestMatch(searchResults, searchQuery);
      
      if (bestMatch) {
        dbEntry = {
          slug: bestMatch.slug,
          name: bestMatch.title,
          hasAnilistId: false,
          autoDiscovered: true
        };
        usedAutoSearch = true;
        apiStats.autoSearchUsed++;
        console.log(`Auto-discovered: ${bestMatch.title} with slug: ${bestMatch.slug}`);
      }
    }

    if (!dbEntry) {
      apiStats.failedRequests++;
      return res.status(404).json({ 
        error: 'Anime not found in database',
        suggestion: 'Try using /api/auto/ endpoint or add this anime via /admin panel'
      });
    }

    const slug = dbEntry.slug;
    const animeTitle = dbEntry.name;

    console.log(`Using slug: ${slug} (${animeTitle}) - AutoSearch: ${usedAutoSearch}`);

    // Try cached episode first
    let episodeData = null;
    const cachedServers = await getCachedEpisode(slug, season, episode);
    
    if (cachedServers && cachedServers.length > 0) {
      episodeData = {
        url: `cached-${slug}-${season}x${episode}`,
        servers: cachedServers,
        usedPattern: 'cached',
        source: 'cache',
        autoSearched: usedAutoSearch
      };
      console.log(`Using cached servers for ${slug}`);
    } else {
      // Find episode with enhanced URL patterns
      episodeData = await findEpisodeEnhanced(slug, season, episode, animeTitle, usedAutoSearch);
      if (episodeData && episodeData.servers.length > 0) {
        await cacheEpisode(slug, season, episode, episodeData.servers, episodeData.source);
      }
    }

    if (!episodeData || episodeData.servers.length === 0) {
      apiStats.failedRequests++;
      return res.status(404).json({ 
        error: 'Episode not found',
        anime_title: animeTitle,
        tried_slug: slug,
        season: season,
        episode: episode,
        suggestion: 'Try different season or use auto-search'
      });
    }

    // Handle server selection
    if (server) {
      const serverIdx = parseInt(server) - 1;
      if (episodeData.servers[serverIdx]) {
        apiStats.successfulRequests++;
        return clean ? sendCleanIframe(res, episodeData.servers[serverIdx].url) 
                     : sendEnhancedPlayer(res, animeTitle, season, episode, episodeData.servers[serverIdx].url, episodeData.servers);
      }
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
        from_database: !usedAutoSearch,
        auto_searched: usedAutoSearch,
        episodeUrl: episodeData.url,
        servers: episodeData.servers,
        used_pattern: episodeData.usedPattern,
        source: episodeData.source,
        total_servers: episodeData.servers.length,
        cached: !!cachedServers
      });
    }

    // Default: send enhanced player
    apiStats.successfulRequests++;
    return clean ? sendCleanIframe(res, episodeData.servers[0].url)
                 : sendEnhancedPlayer(res, animeTitle, season, episode, episodeData.servers[0].url, episodeData.servers);

  } catch (error) {
    console.error('Error:', error.message);
    apiStats.failedRequests++;
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Enhanced Auto-search endpoint with SQLite caching
app.get('/api/auto/:name/:season/:episode', async (req, res) => {
  try {
    const { name, season, episode } = req.params;
    const { server, json, clean, source } = req.query;

    console.log(`Auto-search: ${name} S${season}E${episode}`);
    apiStats.totalRequests++;
    apiStats.autoSearchUsed++;

    // Check cache first
    const cachedAnime = await getCachedAnime(name);
    let animeData = cachedAnime;

    if (!animeData) {
      // Perform multi-source search
      const searchResults = await searchAnime(name);
      const bestMatch = findBestMatch(searchResults, name);

      if (!bestMatch) {
        apiStats.failedRequests++;
        return res.status(404).json({ 
          error: 'Anime not found in search',
          searched_name: name,
          suggestion: 'Try different spelling or check the anime name'
        });
      }

      animeData = bestMatch;
      await cacheAnime(name, animeData.title, animeData.slug, animeData.source);
    }

    const slug = animeData.slug;
    const animeTitle = animeData.title;

    console.log(`Found: ${animeTitle} with slug: ${slug} from ${animeData.source}`);

    // Get servers with caching
    let servers = await getCachedEpisode(slug, season, episode);
    let episodeSource = source || animeData.source;
    
    if (!servers || servers.length === 0) {
      const episodeData = await findEpisodeEnhanced(slug, season, episode, animeTitle, true);
      if (episodeData && episodeData.servers.length > 0) {
        servers = episodeData.servers;
        episodeSource = episodeData.source;
        await cacheEpisode(slug, season, episode, servers, episodeSource);
      }
    }

    if (!servers || servers.length === 0) {
      apiStats.failedRequests++;
      return res.status(404).json({ 
        error: 'No servers found',
        anime_title: animeTitle,
        found_slug: slug,
        season: season,
        episode: episode
      });
    }

    // Handle direct server selection
    if (server) {
      const serverIdx = parseInt(server) - 1;
      if (servers[serverIdx]) {
        apiStats.successfulRequests++;
        return clean ? sendCleanIframe(res, servers[serverIdx].url) 
                     : sendEnhancedPlayer(res, animeTitle, season, episode, servers[serverIdx].url, servers);
      }
    }

    if (json) {
      apiStats.successfulRequests++;
      return res.json({
        success: true,
        title: animeTitle,
        season: parseInt(season),
        episode: parseInt(episode),
        slug: slug,
        source: episodeSource,
        auto_searched: true,
        servers: servers,
        total_servers: servers.length,
        cached: !!cachedAnime
      });
    }

    apiStats.successfulRequests++;
    return clean ? sendCleanIframe(res, servers[0].url)
                 : sendEnhancedPlayer(res, animeTitle, season, episode, servers[0].url, servers);

  } catch (error) {
    console.error('Auto-search error:', error.message);
    apiStats.failedRequests++;
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Search endpoint
app.get('/api/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'Query parameter required' });

    const results = await searchAnime(q);
    res.json({
      query: q,
      results: results,
      count: results.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Search failed', details: error.message });
  }
});

// ==================== ENHANCED PLAYER WITH COLLAPSIBLE SERVER SELECTOR ====================

function sendEnhancedPlayer(res, title, season, episode, videoUrl, servers = []) {
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
            margin: 0;
            padding: 0;
            overflow: hidden;
            background: #000;
            color: white;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            width: 100vw;
            height: 100vh;
        }
        
        .player-container {
            width: 100%;
            height: 100%;
            position: fixed;
            top: 0;
            left: 0;
            display: flex;
            flex-direction: column;
        }
        
        .player-header {
            background: rgba(0,0,0,0.9);
            padding: 15px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #5865f2;
            z-index: 1000;
            backdrop-filter: blur(10px);
        }
        
        .anime-info {
            flex: 1;
        }
        
        .anime-title {
            font-size: 1.3em;
            font-weight: bold;
            color: #fff;
            margin-bottom: 5px;
        }
        
        .episode-info {
            font-size: 0.9em;
            color: #b9bbbe;
        }
        
        .server-controls {
            display: flex;
            align-items: center;
            gap: 15px;
        }
        
        .server-toggle {
            background: #5865f2;
            border: none;
            color: white;
            padding: 8px 16px;
            border-radius: 5px;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.2s ease;
        }
        
        .server-toggle:hover {
            background: #4752c4;
            transform: translateY(-1px);
        }
        
        .server-toggle.collapsed {
            background: #57f287;
        }
        
        .server-panel {
            background: rgba(0,0,0,0.95);
            border-top: 1px solid #2f3136;
            padding: 20px;
            max-height: 200px;
            overflow-y: auto;
            transition: all 0.3s ease;
            backdrop-filter: blur(10px);
        }
        
        .server-panel.collapsed {
            max-height: 0;
            padding: 0;
            border: none;
            overflow: hidden;
        }
        
        .server-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 10px;
        }
        
        .server-btn {
            background: #2f3136;
            border: 1px solid #40444b;
            color: white;
            padding: 10px 15px;
            border-radius: 5px;
            cursor: pointer;
            text-align: left;
            transition: all 0.2s ease;
        }
        
        .server-btn:hover {
            background: #40444b;
            border-color: #5865f2;
        }
        
        .server-btn.active {
            background: #5865f2;
            border-color: #5865f2;
        }
        
        .server-name {
            font-weight: 600;
            font-size: 0.9em;
        }
        
        .server-type {
            font-size: 0.8em;
            color: #b9bbbe;
            margin-top: 2px;
        }
        
        .video-container {
            flex: 1;
            background: #000;
        }
        
        iframe {
            width: 100%;
            height: 100%;
            border: none;
            background: #000;
        }
        
        /* Scrollbar styling */
        .server-panel::-webkit-scrollbar {
            width: 8px;
        }
        
        .server-panel::-webkit-scrollbar-track {
            background: #2f3136;
        }
        
        .server-panel::-webkit-scrollbar-thumb {
            background: #5865f2;
            border-radius: 4px;
        }
        
        .server-panel::-webkit-scrollbar-thumb:hover {
            background: #4752c4;
        }
        
        @media (max-width: 768px) {
            .player-header {
                padding: 10px 15px;
                flex-direction: column;
                gap: 10px;
            }
            
            .server-controls {
                width: 100%;
                justify-content: space-between;
            }
            
            .server-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="player-container">
        <div class="player-header">
            <div class="anime-info">
                <div class="anime-title">${title}</div>
                <div class="episode-info">Season ${season} • Episode ${episode}</div>
            </div>
            ${servers.length > 1 ? `
            <div class="server-controls">
                <button class="server-toggle" id="serverToggle">Servers (${servers.length})</button>
            </div>
            ` : ''}
        </div>
        
        ${servers.length > 1 ? `
        <div class="server-panel collapsed" id="serverPanel">
            <div class="server-grid">
                ${servers.map((server, index) => `
                <button class="server-btn" onclick="switchServer(${index})" data-server="${index}">
                    <div class="server-name">${server.name}</div>
                    <div class="server-type">${server.server} • ${server.type}</div>
                </button>
                `).join('')}
            </div>
        </div>
        ` : ''}
        
        <div class="video-container">
            <iframe src="${videoUrl}" allow="autoplay; fullscreen; encrypted-media" allowfullscreen id="videoFrame"></iframe>
        </div>
    </div>
    
    <script>
        let currentServer = 0;
        const servers = ${JSON.stringify(servers)};
        
        const serverToggle = document.getElementById('serverToggle');
        const serverPanel = document.getElementById('serverPanel');
        const videoFrame = document.getElementById('videoFrame');
        
        if (serverToggle && serverPanel) {
            serverToggle.addEventListener('click', function() {
                serverPanel.classList.toggle('collapsed');
                serverToggle.classList.toggle('collapsed');
                serverToggle.textContent = serverPanel.classList.contains('collapsed') 
                    ? 'Servers (' + servers.length + ')' 
                    : 'Hide Servers';
            });
        }
        
        function switchServer(serverIndex) {
            if (servers[serverIndex]) {
                currentServer = serverIndex;
                videoFrame.src = servers[serverIndex].url;
                
                // Update active server button
                document.querySelectorAll('.server-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                document.querySelector(\`[data-server="\${serverIndex}"]\`).classList.add('active');
                
                // Collapse panel after selection
                if (serverPanel) {
                    serverPanel.classList.add('collapsed');
                    serverToggle.classList.remove('collapsed');
                    serverToggle.textContent = 'Servers (' + servers.length + ')';
                }
            }
        }
        
        // Handle iframe errors
        videoFrame.addEventListener('error', function() {
            console.log('Iframe loading error, trying next server...');
            const nextServer = (currentServer + 1) % servers.length;
            if (nextServer !== currentServer) {
                switchServer(nextServer);
            }
        });
    </script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
}

// Clean iframe endpoint
function sendCleanIframe(res, url) {
  const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Player</title>
    <style>
        body,html { margin:0; padding:0; overflow:hidden; background:#000; width:100vw; height:100vh; }
        iframe { width:100%; height:100%; border:none; position:fixed; top:0; left:0; }
    </style>
</head>
<body>
    <iframe src="${url}" allow="autoplay; fullscreen; encrypted-media" allowfullscreen></iframe>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
}

// ==================== REMAINING ENDPOINTS ====================

// Random anime endpoint
app.get('/api/random', async (req, res) => {
  try {
    const { server, json, clean } = req.query;

    const randomId = randomAnimePool[Math.floor(Math.random() * randomAnimePool.length)];
    const season = 1, episode = 1;
    
    console.log(`Random: ${randomId} S${season}E${episode}`);
    apiStats.totalRequests++;

    const dbEntry = animeDatabase[randomId];
    if (!dbEntry) {
      apiStats.failedRequests++;
      return res.status(404).json({ error: 'Random anime not found in database' });
    }

    const animeTitle = dbEntry.name;
    const slug = dbEntry.slug;

    // Try cache first
    let servers = await getCachedEpisode(slug, season, episode);
    let episodeData = null;

    if (servers && servers.length > 0) {
      episodeData = { servers };
    } else {
      episodeData = await findEpisodeEnhanced(slug, season, episode, animeTitle);
      if (episodeData && episodeData.servers.length > 0) {
        servers = episodeData.servers;
        await cacheEpisode(slug, season, episode, servers, episodeData.source);
      }
    }

    if (!episodeData || episodeData.servers.length === 0) {
      apiStats.failedRequests++;
      return res.status(404).json({ error: 'Random episode not found' });
    }

    if (server) {
      const serverIdx = parseInt(server) - 1;
      if (episodeData.servers[serverIdx]) {
        apiStats.successfulRequests++;
        return clean ? sendCleanIframe(res, episodeData.servers[serverIdx].url)
                     : sendEnhancedPlayer(res, animeTitle, season, episode, episodeData.servers[serverIdx].url, episodeData.servers);
      }
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
        used_pattern: episodeData.usedPattern,
        source: episodeData.source
      });
    }

    apiStats.successfulRequests++;
    return clean ? sendCleanIframe(res, episodeData.servers[0].url)
                 : sendEnhancedPlayer(res, animeTitle, season, episode, episodeData.servers[0].url, episodeData.servers);

  } catch (error) {
    console.error('Random error:', error.message);
    apiStats.failedRequests++;
    res.status(500).json({ error: 'Server error' });
  }
});

// Health check endpoint
app.get('/health', async (req, res) => {
  const successRate = apiStats.totalRequests > 0 ? 
    Math.round((apiStats.successfulRequests / apiStats.totalRequests) * 100) : 0;

  const cacheStats = await sqliteDb.get(`
    SELECT 
      (SELECT COUNT(*) FROM anime_cache) as anime_count,
      (SELECT COUNT(*) FROM episode_cache) as episode_count
  `);
    
  res.json({ 
    status: 'active', 
    version: '11.0.0',
    database_entries: Object.keys(animeDatabase).length,
    random_pool: randomAnimePool.length,
    total_requests: apiStats.totalRequests,
    successful_requests: apiStats.successfulRequests,
    failed_requests: apiStats.failedRequests,
    auto_searches: apiStats.autoSearchUsed,
    success_rate: successRate + '%',
    cache: cacheStats,
    features: [
      'Multi-source scraping (WatchAnimeWorld + Satoru)',
      'SQLite caching system',
      'Auto-search functionality',
      'Enhanced server detection'
    ]
  });
});

// Clear cache endpoint
app.delete('/cache', async (req, res) => {
  await sqliteDb.run('DELETE FROM anime_cache WHERE datetime(created_at) < datetime("now", "-1 day")');
  await sqliteDb.run('DELETE FROM episode_cache WHERE datetime(created_at) < datetime("now", "-1 hour")');
  res.json({ message: 'Cache cleared' });
});

// Initialize and start server
const PORT = process.env.PORT || 3000;

async function startServer() {
  await loadDatabase();
  app.listen(PORT, () => {
    console.log(`
🎯 ULTIMATE ANIMEWORLD API v11.0 - BOSS LEVEL WITH SQLITE
───────────────────────────────────────────
Port: ${PORT}
Database: ${Object.keys(animeDatabase).length} anime
Random Pool: ${randomAnimePool.length} anime
API: http://localhost:${PORT}

🚀 ENHANCED FEATURES:
• MULTI-SOURCE SCRAPING (WatchAnimeWorld + Satoru.one)
• SQLITE CACHING - Ultra-fast performance
• AUTO-SEARCH FUNCTIONALITY - No more database limitations!
• Enhanced server detection with language support
• Collapsible server selector with beautiful UI

📊 ENDPOINTS:
• /api/anime/:id/:season/:episode - Stream with auto-search fallback
• /api/auto/:name/:season/:episode - Direct auto-search streaming
• /api/search?q=query - Search anime
• /api/random - Random content  
• /api/iframe?url=URL - Clean player
• /health - Enhanced health check
• /cache - Clear cache (DELETE)

🎮 USAGE EXAMPLES:
• Database: /api/anime/21/1/1 (One Piece via ID)
• Auto-search: /api/auto/bleach/1/1 (Bleach via name)
• Auto-search: /api/auto/attack%20on%20titan/1/1
• Search: /api/search?q=naruto shippuden
───────────────────────────────────────────
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
