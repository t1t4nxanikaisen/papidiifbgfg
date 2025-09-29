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

// Enhanced session store with IP tracking and expiration
let sessions = new Map();

// Comprehensive anime database with proper URL patterns and seasonxepisode format
let animeDatabase = {
  // Bleach Series
  269: { slug: "bleach", name: "Bleach", hasAnilistId: true, urlType: "series" },
  41467: { slug: "bleach-thousand-year-blood-war", name: "Bleach: Thousand-Year Blood War", hasAnilistId: true, urlType: "episode" },
  
  // Demon Slayer Series
  101922: { slug: "demon-slayer", name: "Demon Slayer", hasAnilistId: true, urlType: "episode" },
  142329: { slug: "demon-slayer", name: "Demon Slayer Season 2", hasAnilistId: true, urlType: "episode" }, 
  145139: { slug: "demon-slayer", name: "Demon Slayer Season 3", hasAnilistId: true, urlType: "episode" }, 
  166240: { slug: "demon-slayer", name: "Demon Slayer Season 4", hasAnilistId: true, urlType: "episode" },
  
  // Naruto Series
  20: { slug: "naruto", name: "Naruto", hasAnilistId: true, urlType: "series" },
  1735: { slug: "naruto-shippuden", name: "Naruto Shippuden", hasAnilistId: true, urlType: "series" },
  
  // One Piece
  21: { slug: "one-piece", name: "One Piece", hasAnilistId: true, urlType: "series" },
  
  // Attack on Titan Series
  16498: { slug: "attack-on-titan", name: "Attack on Titan", hasAnilistId: true, urlType: "episode" },
  25777: { slug: "attack-on-titan", name: "Attack on Titan Season 2", hasAnilistId: true, urlType: "episode" },
  35760: { slug: "attack-on-titan", name: "Attack on Titan Season 3", hasAnilistId: true, urlType: "episode" }, 
  139630: { slug: "attack-on-titan", name: "Attack on Titan Final Season", hasAnilistId: true, urlType: "episode" },
  
  // Jujutsu Kaisen
  113415: { slug: "jujutsu-kaisen", name: "Jujutsu Kaisen", hasAnilistId: true, urlType: "episode" },
  145134: { slug: "jujutsu-kaisen", name: "Jujutsu Kaisen Season 2", hasAnilistId: true, urlType: "episode" },
  
  // Black Clover
  97940: { slug: "black-clover", name: "Black Clover", hasAnilistId: true, urlType: "series" },
  
  // One Punch Man
  21087: { slug: "one-punch-man", name: "One Punch Man", hasAnilistId: true, urlType: "episode" },
  30276: { slug: "one-punch-man", name: "One Punch Man Season 2", hasAnilistId: true, urlType: "episode" },
  
  // Hunter x Hunter
  11061: { slug: "hunter-x-hunter", name: "Hunter x Hunter (2011)", hasAnilistId: true, urlType: "series" },
  
  // Death Note
  1535: { slug: "death-note", name: "Death Note", hasAnilistId: true, urlType: "series" },
  
  // Chainsaw Man
  127230: { slug: "chainsaw-man", name: "Chainsaw Man", hasAnilistId: true, urlType: "episode" },
  
  // My Hero Academia
  31964: { slug: "my-hero-academia", name: "My Hero Academia", hasAnilistId: true, urlType: "episode" },
  38408: { slug: "my-hero-academia", name: "My Hero Academia Season 2", hasAnilistId: true, urlType: "episode" },
  99693: { slug: "my-hero-academia", name: "My Hero Academia Season 3", hasAnilistId: true, urlType: "episode" },
  102487: { slug: "my-hero-academia", name: "My Hero Academia Season 4", hasAnilistId: true, urlType: "episode" },
  113717: { slug: "my-hero-academia", name: "My Hero Academia Season 5", hasAnilistId: true, urlType: "episode" },
  133844: { slug: "my-hero-academia", name: "My Hero Academia Season 6", hasAnilistId: true, urlType: "episode" },
  
  // Sword Art Online
  11757: { slug: "sword-art-online", name: "Sword Art Online", hasAnilistId: true, urlType: "series" },
  20021: { slug: "sword-art-online", name: "Sword Art Online II", hasAnilistId: true, urlType: "series" },
  31765: { slug: "sword-art-online", name: "Sword Art Online: Alicization", hasAnilistId: true, urlType: "series" },
  
  // Haikyuu!!
  20583: { slug: "haikyuu", name: "Haikyuu!!", hasAnilistId: true, urlType: "series" },
  28891: { slug: "haikyuu", name: "Haikyuu!! Second Season", hasAnilistId: true, urlType: "series" },
  36946: { slug: "haikyuu", name: "Haikyuu!! Third Season", hasAnilistId: true, urlType: "series" },
  38883: { slug: "haikyuu", name: "Haikyuu!! To The Top", hasAnilistId: true, urlType: "series" },
  
  // Tokyo Revengers
  121496: { slug: "tokyo-revengers", name: "Tokyo Revengers", hasAnilistId: true, urlType: "episode" },
  131681: { slug: "tokyo-revengers", name: "Tokyo Revengers Season 2", hasAnilistId: true, urlType: "episode" },
  
  // Spy x Family
  140960: { slug: "spy-x-family", name: "Spy x Family", hasAnilistId: true, urlType: "episode" },
  151661: { slug: "spy-x-family", name: "Spy x Family Season 2", hasAnilistId: true, urlType: "episode" },
  
  // Vinland Saga
  101348: { slug: "vinland-saga", name: "Vinland Saga", hasAnilistId: true, urlType: "episode" },
  119662: { slug: "vinland-saga", name: "Vinland Saga Season 2", hasAnilistId: true, urlType: "episode" },
  
  // Dr. Stone
  105333: { slug: "dr-stone", name: "Dr. Stone", hasAnilistId: true, urlType: "episode" },
  110624: { slug: "dr-stone", name: "Dr. Stone: Stone Wars", hasAnilistId: true, urlType: "episode" },
  132394: { slug: "dr-stone", name: "Dr. Stone: New World", hasAnilistId: true, urlType: "episode" },
  
  // Fire Force
  38671: { slug: "fire-force", name: "Fire Force", hasAnilistId: true, urlType: "episode" },
  112151: { slug: "fire-force", name: "Fire Force Season 2", hasAnilistId: true, urlType: "episode" },
  
  // Mob Psycho 100
  32182: { slug: "mob-psycho-100", name: "Mob Psycho 100", hasAnilistId: true, urlType: "episode" },
  97516: { slug: "mob-psycho-100", name: "Mob Psycho 100 II", hasAnilistId: true, urlType: "episode" },
  
  // Re:Zero
  21355: { slug: "rezero", name: "Re:ZERO -Starting Life in Another World-", hasAnilistId: true, urlType: "episode" },
  108465: { slug: "rezero", name: "Re:ZERO Season 2", hasAnilistId: true, urlType: "episode" },
  
  // The Rising of the Shield Hero
  99263: { slug: "the-rising-of-the-shield-hero", name: "The Rising of the Shield Hero", hasAnilistId: true, urlType: "episode" },
  131588: { slug: "the-rising-of-the-shield-hero", name: "The Rising of the Shield Hero Season 2", hasAnilistId: true, urlType: "episode" },
  143270: { slug: "the-rising-of-the-shield-hero", name: "The Rising of the Shield Hero Season 3", hasAnilistId: true, urlType: "episode" },
  
  // That Time I Got Reincarnated as a Slime
  37430: { slug: "that-time-i-got-reincarnated-as-a-slime", name: "That Time I Got Reincarnated as a Slime", hasAnilistId: true, urlType: "episode" },
  108465: { slug: "that-time-i-got-reincarnated-as-a-slime", name: "That Time I Got Reincarnated as a Slime Season 2", hasAnilistId: true, urlType: "episode" },
  114267: { slug: "that-time-i-got-reincarnated-as-a-slime", name: "That Time I Got Reincarnated as a Slime Season 3", hasAnilistId: true, urlType: "episode" },
  
  // Dragon Ball Series
  223: { slug: "dragon-ball", name: "Dragon Ball", hasAnilistId: true, urlType: "series" },
  813: { slug: "dragon-ball-z", name: "Dragon Ball Z", hasAnilistId: true, urlType: "series" },
  23283: { slug: "dragon-ball-super", name: "Dragon Ball Super", hasAnilistId: true, urlType: "series" },
  
  // Fairy Tail
  6702: { slug: "fairy-tail", name: "Fairy Tail", hasAnilistId: true, urlType: "series" },
  19775: { slug: "fairy-tail", name: "Fairy Tail (2014)", hasAnilistId: true, urlType: "series" },
  
  // Fullmetal Alchemist
  5114: { slug: "fullmetal-alchemist-brotherhood", name: "Fullmetal Alchemist: Brotherhood", hasAnilistId: true, urlType: "series" },
  
  // Code Geass
  1575: { slug: "code-geass", name: "Code Geass: Lelouch of the Rebellion", hasAnilistId: true, urlType: "series" },
  
  // Steins;Gate
  9253: { slug: "steinsgate", name: "Steins;Gate", hasAnilistId: true, urlType: "series" },
  
  // Cowboy Bebop
  1: { slug: "cowboy-bebop", name: "Cowboy Bebop", hasAnilistId: true, urlType: "series" },
  
  // Neon Genesis Evangelion
  30: { slug: "neon-genesis-evangelion", name: "Neon Genesis Evangelion", hasAnilistId: true, urlType: "series" },
  
  // JoJo's Bizarre Adventure
  14719: { slug: "jojos-bizarre-adventure", name: "JoJo's Bizarre Adventure", hasAnilistId: true, urlType: "series" },
  20899: { slug: "jojos-bizarre-adventure", name: "JoJo's Bizarre Adventure: Stardust Crusaders", hasAnilistId: true, urlType: "series" },
  34561: { slug: "jojos-bizarre-adventure", name: "JoJo's Bizarre Adventure: Diamond is Unbreakable", hasAnilistId: true, urlType: "series" },
  37991: { slug: "jojos-bizarre-adventure", name: "JoJo's Bizarre Adventure: Golden Wind", hasAnilistId: true, urlType: "series" },
  113717: { slug: "jojos-bizarre-adventure", name: "JoJo's Bizarre Adventure: Stone Ocean", hasAnilistId: true, urlType: "series" },
  
  // Blue Lock
  118087: { slug: "blue-lock", name: "Blue Lock", hasAnilistId: true, urlType: "episode" },
  
  // Bocchi the Rock!
  47917: { slug: "bocchi-the-rock", name: "Bocchi the Rock!", hasAnilistId: true, urlType: "episode" },
  
  // Oshi no Ko
  150672: { slug: "oshi-no-ko", name: "Oshi no Ko", hasAnilistId: true, urlType: "episode" },
  
  // Hell's Paradise
  142838: { slug: "hells-paradise", name: "Hell's Paradise", hasAnilistId: true, urlType: "episode" },
  
  // Mushoku Tensei
  39587: { slug: "mushoku-tensei", name: "Mushoku Tensei: Jobless Reincarnation", hasAnilistId: true, urlType: "episode" },
  114267: { slug: "mushoku-tensei", name: "Mushoku Tensei Season 2", hasAnilistId: true, urlType: "episode" },
  
  // The Eminence in Shadow
  114081: { slug: "the-eminence-in-shadow", name: "The Eminence in Shadow", hasAnilistId: true, urlType: "episode" },
  153156: { slug: "the-eminence-in-shadow", name: "The Eminence in Shadow Season 2", hasAnilistId: true, urlType: "episode" },
  
  // Cyberpunk: Edgerunners
  125419: { slug: "cyberpunk-edgerunners", name: "Cyberpunk: Edgerunners", hasAnilistId: true, urlType: "episode" },
  
  // Solo Leveling
  153518: { slug: "solo-leveling", name: "Solo Leveling", hasAnilistId: true, urlType: "episode" },
  
  // Frieren: Beyond Journey's End
  154587: { slug: "frieren-beyond-journeys-end", name: "Frieren: Beyond Journey's End", hasAnilistId: true, urlType: "episode" },
  
  // Apothecary Diaries
  151589: { slug: "the-apothecary-diaries", name: "The Apothecary Diaries", hasAnilistId: true, urlType: "episode" },

  // Ben 10 Series
  998001: { slug: "ben-10", name: "Ben 10", hasAnilistId: false, urlType: "series" },
  998002: { slug: "ben-10-alien-force", name: "Ben 10: Alien Force", hasAnilistId: false, urlType: "series" },
  998003: { slug: "ben-10-ultimate-alien", name: "Ben 10: Ultimate Alien", hasAnilistId: false, urlType: "series" },
  998004: { slug: "ben-10-omniverse", name: "Ben 10: Omniverse", hasAnilistId: false, urlType: "series" },

  // Shinchan
  998101: { slug: "shinchan", name: "Shinchan", hasAnilistId: false, urlType: "series" },

  // Doraemon
  998201: { slug: "doraemon", name: "Doraemon", hasAnilistId: false, urlType: "series" },

  // Pokemon
  998301: { slug: "pokemon", name: "Pokemon", hasAnilistId: false, urlType: "series" },
  998302: { slug: "pokemon-advanced", name: "Pokemon: Advanced", hasAnilistId: false, urlType: "series" },
  998303: { slug: "pokemon-diamond-pearl", name: "Pokemon: Diamond and Pearl", hasAnilistId: false, urlType: "series" },

  // Beyblade
  998401: { slug: "beyblade", name: "Beyblade", hasAnilistId: false, urlType: "series" },
  998402: { slug: "beyblade-metal-fusion", name: "Beyblade: Metal Fusion", hasAnilistId: false, urlType: "series" },

  // Transformers
  998501: { slug: "transformers", name: "Transformers", hasAnilistId: false, urlType: "series" }
};

// Random anime pool
let randomAnimePool = [20, 113415, 127230, 97940, 21087, 16498, 11757, 20583, 31964, 39587, 121496, 140960, 118087, 151589, 998001, 998101];

// API statistics
let apiStats = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  lastUpdated: new Date().toISOString()
};

// File paths for Vercel compatibility
const DATA_DIR = process.env.VERCEL ? '/tmp' : __dirname;
const DB_FILE = path.join(DATA_DIR, 'anime_database.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');

// Enhanced database management for Vercel persistence
async function ensureDataDir() {
  if (!process.env.VERCEL) {
    try {
      await fs.access(DATA_DIR);
    } catch (error) {
      await fs.mkdir(DATA_DIR, { recursive: true });
    }
  }
}

// Enhanced loadDatabase with Vercel environment variable support
async function loadDatabase() {
  try {
    // First try environment variable (for Vercel persistence)
    if (process.env.VERCEL_ANIME_DATABASE) {
      try {
        const savedData = JSON.parse(process.env.VERCEL_ANIME_DATABASE);
        animeDatabase = { ...animeDatabase, ...savedData.animeDatabase };
        randomAnimePool = savedData.randomAnimePool || randomAnimePool;
        apiStats = savedData.apiStats || apiStats;
        console.log(`📊 Loaded ${Object.keys(animeDatabase).length} entries from Vercel environment`);
        return;
      } catch (error) {
        console.log('❌ Failed to parse Vercel environment database, falling back to file');
      }
    }

    // Fallback to file system
    await ensureDataDir();
    const data = await fs.readFile(DB_FILE, 'utf8');
    const savedData = JSON.parse(data);
    animeDatabase = { ...animeDatabase, ...savedData.animeDatabase };
    randomAnimePool = savedData.randomAnimePool || randomAnimePool;
    apiStats = savedData.apiStats || apiStats;
    console.log(`📊 Loaded ${Object.keys(animeDatabase).length} entries from file system`);
  } catch (error) {
    console.log('📊 Using default database (file/environment not found)');
    await saveDatabase();
  }
}

// Enhanced saveDatabase with Vercel environment variable logging
async function saveDatabase() {
  try {
    await ensureDataDir();
    const dataToSave = {
      animeDatabase,
      randomAnimePool,
      apiStats,
      lastSaved: new Date().toISOString()
    };
    
    // Save to file system
    await fs.writeFile(DB_FILE, JSON.stringify(dataToSave, null, 2));
    
    // Log the database for Vercel environment variable
    const dbString = JSON.stringify(dataToSave);
    console.log('💾 Database saved successfully');
    console.log('📋 For Vercel persistence, add this to VERCEL_ANIME_DATABASE environment variable:');
    console.log(dbString.substring(0, 200) + '...'); // Show first 200 chars
    
    return dataToSave;
  } catch (error) {
    console.error('❌ Failed to save database:', error.message);
  }
}

// Enhanced session management
async function loadSessions() {
  try {
    await ensureDataDir();
    const data = await fs.readFile(SESSIONS_FILE, 'utf8');
    const savedSessions = JSON.parse(data);
    
    // Filter out expired sessions
    const now = Date.now();
    const validSessions = new Map();
    
    for (const [sessionId, sessionData] of Object.entries(savedSessions)) {
      if (now - sessionData.createdAt < 5 * 24 * 60 * 60 * 1000) { // 5 days
        validSessions.set(sessionId, sessionData);
      }
    }
    
    sessions = validSessions;
    console.log(`🔑 Loaded ${sessions.size} active sessions`);
  } catch (error) {
    console.log('🔑 No saved sessions found');
    sessions = new Map();
  }
}

async function saveSessions() {
  try {
    await ensureDataDir();
    const sessionsObject = Object.fromEntries(sessions);
    await fs.writeFile(SESSIONS_FILE, JSON.stringify(sessionsObject, null, 2));
  } catch (error) {
    console.error('❌ Failed to save sessions:', error.message);
  }
}

// Create session with IP tracking and 5-day expiration
function createSession(ip) {
  const sessionId = 'session_' + Date.now().toString() + Math.random().toString(36).substr(2, 9);
  const sessionData = {
    id: sessionId,
    ip: ip,
    createdAt: Date.now(),
    expiresAt: Date.now() + (5 * 24 * 60 * 60 * 1000) // 5 days
  };
  
  sessions.set(sessionId, sessionData);
  
  // Clean old sessions (keep only active ones)
  cleanupSessions();
  
  return sessionId;
}

// Clean up expired sessions
function cleanupSessions() {
  const now = Date.now();
  for (const [sessionId, sessionData] of sessions.entries()) {
    if (now > sessionData.expiresAt) {
      sessions.delete(sessionId);
    }
  }
}

// Get client IP
function getClientIP(req) {
  return req.ip || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
         '127.0.0.1';
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

// Enhanced authentication middleware with IP checking
function requireAuth(req, res, next) {
  const sessionId = req.headers.authorization || req.query.token;
  const clientIP = getClientIP(req);
  
  if (sessionId && sessions.has(sessionId)) {
    const sessionData = sessions.get(sessionId);
    
    // Check if session is expired
    if (Date.now() > sessionData.expiresAt) {
      sessions.delete(sessionId);
      saveSessions();
      return res.status(401).json({ error: 'Session expired' });
    }
    
    // Update session expiration on activity (optional)
    sessionData.expiresAt = Date.now() + (5 * 24 * 60 * 60 * 1000);
    
    next();
  } else {
    res.status(401).json({ error: 'Authentication required' });
  }
}

// AniList API endpoint
const ANILIST_API = 'https://graphql.anilist.co';

// Get anime info from AniList
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

    const response = await axios.post(ANILIST_API, {
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
async function findEpisodeUniversal(slug, season, episode, animeTitle = "", urlType = "episode") {
  const baseUrl = 'https://watchanimeworld.in';
  
  console.log(`🔍 Universal search for: ${slug} S${season}E${episode} (URL Type: ${urlType})`);

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

  // Filter patterns based on URL type
  const patternsToTry = urlType === "series" 
    ? patterns.filter(p => p.name.includes('series') || p.name.includes('anime'))
    : urlType === "episode" 
    ? patterns.filter(p => p.name.includes('episode'))
    : patterns;

  for (const pattern of patternsToTry) {
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
            type: 'iframe',
            server: detectServer(fullUrl)
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
            type: 'direct',
            server: 'Direct'
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
            type: 'iframe',
            server: detectServer(fullUrl)
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

// Detect server from URL
function detectServer(url) {
  const serverMap = {
    'streamtape': 'StreamTape',
    'dood': 'DoodStream',
    'filemoon': 'FileMoon',
    'mixdrop': 'MixDrop',
    'mp4upload': 'Mp4Upload',
    'vidstream': 'VidStream',
    'gogostream': 'GogoStream'
  };

  const urlLower = url.toLowerCase();
  for (const [key, name] of Object.entries(serverMap)) {
    if (urlLower.includes(key)) return name;
  }
  return 'Unknown Server';
}

// ULTRA-FAST IFRAME PLAYER - Optimized for speed
function sendCleanIframe(res, url) {
  const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Player</title>
    <style>body,html{margin:0;padding:0;overflow:hidden;background:#000}iframe{width:100vw;height:100vh;border:none;position:fixed;top:0;left:0}</style>
</head>
<body>
    <iframe src="${url}" allow="autoplay;fullscreen" allowfullscreen loading="eager"></iframe>
    <script>
        // Preload optimization
        window.addEventListener('load', function() {
            const iframe = document.querySelector('iframe');
            iframe.focus();
        });
        
        // Mobile optimization
        if ('ontouchstart' in window) {
            document.body.style.webkitOverflowScrolling = 'touch';
        }
    </script>
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
    <title>${title} - ${season === 'Movie' ? 'Movie' : `S${season}E${episode}`}</title>
    <style>
        body,html{margin:0;padding:0;overflow:hidden;background:#000;color:white;font-family:'Segoe UI',sans-serif;min-height:100vh}
        .player-container{width:100vw;height:100vh;position:fixed;top:0;left:0}
        iframe{width:100%;height:100%;border:none;background:#000}
        .player-info{position:fixed;top:10px;left:10px;background:rgba(0,0,0,0.7);color:white;padding:10px;border-radius:5px;z-index:1000;font-family:Arial,sans-serif;font-size:14px}
    </style>
</head>
<body>
    <div class="player-info">${title} - ${season === 'Movie' ? 'Movie' : `S${season}E${episode}`}</div>
    <div class="player-container">
        <iframe src="${videoUrl}" allow="autoplay;fullscreen" allowfullscreen loading="eager"></iframe>
    </div>
    <script>
        // Performance optimizations
        window.addEventListener('load', function() {
            const iframe = document.querySelector('iframe');
            iframe.focus();
        });
    </script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
}

// ==================== MAIN API ROUTES ====================

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: '🎬 Ultimate AnimeWorld API with Enhanced Admin Panel',
    version: '6.0.0',
    status: 'active',
    endpoints: {
      '/api/anime/:id/:season/:episode': 'Stream anime episode',
      '/api/movie/:id': 'Stream anime movie',
      '/api/random': 'Random anime episode', 
      '/api/iframe?url=URL': 'Clean iframe player',
      '/admin': 'Admin panel (password: admin123)',
      '/health': 'Health check'
    },
    features: [
      'Session-based authentication',
      'API usage statistics',
      'Vercel environment persistence',
      '100+ pre-configured anime',
      'Bulk database operations',
      'Multiple URL pattern support',
      'Server detection',
      '5-day session expiration'
    ]
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
        trackAPIUsage(false);
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
    const episodeData = await findEpisodeUniversal(slug, season, episode, animeTitle, dbEntry?.urlType);
    if (!episodeData) {
      trackAPIUsage(false);
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
        trackAPIUsage(true);
        return clean ? sendCleanIframe(res, episodeData.servers[serverIdx].url) 
                     : sendPlayer(res, animeTitle, season, episode, episodeData.servers[serverIdx].url);
      }
      trackAPIUsage(false);
      return res.status(404).send('Server not found');
    }

    // JSON response
    if (json) {
      trackAPIUsage(true);
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
    trackAPIUsage(true);
    return clean ? sendCleanIframe(res, episodeData.servers[0].url)
                 : sendPlayer(res, animeTitle, season, episode, episodeData.servers[0].url);

  } catch (error) {
    console.error('💥 Error:', error.message);
    trackAPIUsage(false);
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
        trackAPIUsage(false);
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
      trackAPIUsage(false);
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
        trackAPIUsage(true);
        return clean ? sendCleanIframe(res, movieData.servers[serverIdx].url) 
                     : sendPlayer(res, animeTitle, 'Movie', 'Full', movieData.servers[serverIdx].url);
      }
      trackAPIUsage(false);
      return res.status(404).send('Server not found');
    }

    // JSON response
    if (json) {
      trackAPIUsage(true);
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
    trackAPIUsage(true);
    return clean ? sendCleanIframe(res, movieData.servers[0].url)
                 : sendPlayer(res, animeTitle, 'Movie', 'Full', movieData.servers[0].url);

  } catch (error) {
    console.error('💥 Movie Error:', error.message);
    trackAPIUsage(false);
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
        trackAPIUsage(false);
        return res.status(404).json({ error: 'Random anime not found' });
      }
      animeTitle = animeInfo.title;
      slug = slugify(animeTitle);
    }

    const episodeData = await findEpisodeUniversal(slug, season, episode, animeTitle);
    if (!episodeData) {
      trackAPIUsage(false);
      return res.status(404).json({ error: 'Random episode not found' });
    }

    if (server) {
      const serverIdx = parseInt(server) - 1;
      if (episodeData.servers[serverIdx]) {
        trackAPIUsage(true);
        return clean ? sendCleanIframe(res, episodeData.servers[serverIdx].url)
                     : sendPlayer(res, animeTitle, season, episode, episodeData.servers[serverIdx].url);
      }
      trackAPIUsage(false);
      return res.status(404).send('Server not found');
    }

    if (json) {
      trackAPIUsage(true);
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

    trackAPIUsage(true);
    return clean ? sendCleanIframe(res, episodeData.servers[0].url)
                 : sendPlayer(res, animeTitle, season, episode, episodeData.servers[0].url);

  } catch (error) {
    console.error('💥 Random error:', error.message);
    trackAPIUsage(false);
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
    version: '6.0.0',
    database_entries: Object.keys(animeDatabase).length,
    random_pool: randomAnimePool.length,
    total_requests: apiStats.totalRequests,
    successful_requests: apiStats.successfulRequests,
    failed_requests: apiStats.failedRequests,
    success_rate: apiStats.totalRequests > 0 ? 
      Math.round((apiStats.successfulRequests / apiStats.totalRequests) * 100) : 0,
    active_sessions: sessions.size,
    last_updated: apiStats.lastUpdated
  });
});

// ==================== ADMIN PANEL ROUTES ====================

// Admin login endpoint with IP tracking
app.post('/admin/login', async (req, res) => {
  const { password } = req.body;
  const clientIP = getClientIP(req);
  
  if (password === 'admin123') {
    const sessionId = createSession(clientIP);
    
    await saveSessions();
    
    res.json({ 
      success: true, 
      token: sessionId,
      message: 'Logged in successfully. Session valid for 5 days.'
    });
  } else {
    res.status(401).json({ error: 'Invalid password' });
  }
});

// Check session endpoint
app.get('/admin/check-session', requireAuth, (req, res) => {
  const sessionData = sessions.get(req.headers.authorization);
  res.json({ 
    valid: true, 
    session: {
      ip: sessionData.ip,
      createdAt: new Date(sessionData.createdAt).toLocaleString(),
      expiresAt: new Date(sessionData.expiresAt).toLocaleString(),
      remainingDays: Math.ceil((sessionData.expiresAt - Date.now()) / (24 * 60 * 60 * 1000))
    }
  });
});

// Logout endpoint
app.post('/admin/logout', requireAuth, async (req, res) => {
  const sessionId = req.headers.authorization;
  sessions.delete(sessionId);
  await saveSessions();
  res.json({ success: true, message: 'Logged out successfully' });
});

// Admin API endpoints
app.get('/admin/stats', requireAuth, (req, res) => {
  const successRate = apiStats.totalRequests > 0 
    ? Math.round((apiStats.successfulRequests / apiStats.totalRequests) * 100)
    : 0;
    
  res.json({
    totalAnime: Object.keys(animeDatabase).length,
    successRate: successRate,
    randomPool: randomAnimePool.length,
    totalRequests: apiStats.totalRequests,
    successfulRequests: apiStats.successfulRequests,
    failedRequests: apiStats.failedRequests,
    activeSessions: sessions.size,
    lastUpdated: apiStats.lastUpdated
  });
});

app.get('/admin/database', requireAuth, (req, res) => {
  // Convert to array for easier handling in frontend
  const databaseArray = Object.entries(animeDatabase).map(([id, entry]) => ({
    id: parseInt(id),
    name: entry.name,
    slug: entry.slug,
    hasAnilistId: entry.hasAnilistId,
    urlType: entry.urlType || 'episode'
  }));
  
  res.json({ database: databaseArray });
});

app.post('/admin/anime', requireAuth, async (req, res) => {
  const { id, name, slug, hasAnilistId, urlType } = req.body;
  
  if (!id || !slug || !name) {
    return res.status(400).json({ error: 'ID, name, and slug are required' });
  }
  
  // Store both slug and name for better handling
  animeDatabase[id] = {
    slug: slug,
    name: name,
    hasAnilistId: hasAnilistId || false,
    urlType: urlType || 'episode'
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
      if (animeDatabase[anime.id]) {
        results.skipped.push({
          id: anime.id,
          title: anime.name,
          reason: 'Already exists in database'
        });
        continue;
      }
      
      // Add to database
      animeDatabase[anime.id] = {
        slug: anime.slug,
        name: anime.name,
        hasAnilistId: anime.hasAnilistId || false,
        urlType: anime.urlType || 'episode'
      };
      
      // Add to random pool if it has AniList ID
      if (anime.hasAnilistId && !randomAnimePool.includes(parseInt(anime.id))) {
        randomAnimePool.push(parseInt(anime.id));
      }
      
      results.added.push({
        id: anime.id,
        title: anime.name,
        slug: anime.slug,
        urlType: anime.urlType || 'episode'
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
        const slug = slugify(animeInfo.english || animeInfo.romaji);
          
        results.push({
          id: id,
          name: animeInfo.english || animeInfo.romaji,
          slug: slug,
          hasAnilistId: true,
          urlType: 'episode', // Default to episode URLs
          success: true
        });
      } else {
        results.push({
          id: id,
          name: 'Unknown',
          slug: 'unknown',
          hasAnilistId: true,
          urlType: 'episode',
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
        urlType: 'episode',
        success: false,
        error: error.message
      });
    }
  }
  
  res.json({ success: true, results });
});

app.delete('/admin/anime/:id', requireAuth, async (req, res) => {
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

// Export database endpoint
app.get('/admin/export-database', requireAuth, async (req, res) => {
  try {
    const dataToSave = {
      animeDatabase,
      randomAnimePool,
      apiStats,
      lastSaved: new Date().toISOString()
    };
    
    res.json({
      success: true,
      database: dataToSave,
      message: 'Copy the database object to VERCEL_ANIME_DATABASE environment variable'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to export database' });
  }
});

// Test anime URL endpoint
app.post('/admin/test-anime', requireAuth, async (req, res) => {
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

// ==================== ENHANCED ADMIN PANEL HTML ====================

app.get('/admin', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AnimeWorld API - Enhanced Admin Panel</title>
    <style>
        :root {
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
        }
        
        .login-container, .admin-container {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            padding: 20px;
        }
        
        .login-box, .admin-panel {
            background: var(--secondary);
            border-radius: 8px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            border: 1px solid var(--border);
            width: 100%;
            max-width: 1400px;
        }
        
        .login-box {
            max-width: 400px;
            padding: 40px;
            text-align: center;
        }
        
        .logo {
            font-size: 2.5em;
            margin-bottom: 10px;
            font-weight: bold;
        }
        
        .subtitle {
            color: var(--text-muted);
            margin-bottom: 30px;
            font-size: 1.1em;
        }
        
        input, select, button, textarea {
            width: 100%;
            padding: 12px 16px;
            margin: 8px 0;
            border: 1px solid var(--border);
            border-radius: 3px;
            font-size: 16px;
            background: var(--primary);
            color: var(--text);
            transition: all 0.2s ease;
        }
        
        input:focus, select:focus, textarea:focus {
            border-color: var(--accent);
            outline: none;
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
        
        button.secondary {
            background: var(--success);
        }
        
        button.secondary:hover {
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
        
        .admin-header {
            background: var(--primary);
            padding: 20px 30px;
            border-bottom: 1px solid var(--border);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .admin-content {
            padding: 30px;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .stat-card {
            background: var(--primary);
            padding: 20px;
            border-radius: 6px;
            border: 1px solid var(--border);
            text-align: center;
        }
        
        .stat-number {
            font-size: 2em;
            font-weight: bold;
            color: var(--accent);
            margin-bottom: 5px;
        }
        
        .tabs {
            display: flex;
            gap: 5px;
            margin-bottom: 25px;
            background: var(--primary);
            padding: 5px;
            border-radius: 6px;
            border: 1px solid var(--border);
        }
        
        .tab {
            flex: 1;
            padding: 12px 20px;
            text-align: center;
            cursor: pointer;
            border-radius: 4px;
            transition: background 0.2s ease;
            font-weight: 600;
        }
        
        .tab.active {
            background: var(--accent);
        }
        
        .tab-content {
            display: none;
        }
        
        .tab-content.active {
            display: block;
        }
        
        .form-section {
            background: var(--primary);
            padding: 25px;
            border-radius: 6px;
            border: 1px solid var(--border);
            margin-bottom: 20px;
        }
        
        .form-section h3 {
            margin-bottom: 20px;
            color: var(--accent);
            font-size: 1.3em;
        }
        
        .form-group {
            margin-bottom: 15px;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 5px;
            color: var(--text);
            font-weight: 600;
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
            max-height: 500px;
            overflow-y: auto;
            background: var(--primary);
            border-radius: 6px;
            border: 1px solid var(--border);
        }
        
        .anime-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px 20px;
            border-bottom: 1px solid var(--border);
        }
        
        .anime-item:last-child {
            border-bottom: none;
        }
        
        .anime-info {
            flex: 1;
        }
        
        .anime-id {
            color: var(--accent);
            font-weight: bold;
            font-size: 0.9em;
        }
        
        .anime-name {
            color: var(--text);
            font-weight: 600;
            margin: 5px 0;
        }
        
        .anime-slug {
            color: var(--text-muted);
            font-size: 0.9em;
        }
        
        .anime-type {
            background: var(--accent);
            color: white;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 0.8em;
            margin-left: 8px;
        }
        
        .url-type {
            background: var(--success);
            color: white;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 0.8em;
            margin-left: 8px;
        }
        
        .delete-btn {
            background: var(--danger);
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 3px;
            cursor: pointer;
            font-size: 12px;
            width: auto;
            margin: 0;
        }
        
        .test-btn {
            background: var(--warning);
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 3px;
            cursor: pointer;
            font-size: 12px;
            width: auto;
            margin: 0 5px;
        }
        
        .message {
            padding: 12px 16px;
            border-radius: 4px;
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
        
        .bulk-results {
            max-height: 300px;
            overflow-y: auto;
            margin: 15px 0;
            background: var(--primary);
            border-radius: 6px;
            border: 1px solid var(--border);
            padding: 15px;
        }
        
        .bulk-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px;
            margin: 5px 0;
            background: var(--secondary);
            border-radius: 4px;
        }
        
        .grid-2 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
        }
        
        .grid-3 {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 20px;
        }
        
        .session-info {
            background: var(--primary);
            padding: 15px;
            border-radius: 6px;
            border: 1px solid var(--border);
            margin-bottom: 20px;
            font-size: 0.9em;
        }
        
        .session-info strong {
            color: var(--accent);
        }
        
        .url-preview {
            background: var(--primary);
            padding: 15px;
            border-radius: 6px;
            border: 1px solid var(--border);
            margin: 10px 0;
            font-family: monospace;
            font-size: 0.9em;
        }
        
        .server-list {
            margin-top: 10px;
        }
        
        .server-item {
            background: var(--secondary);
            padding: 10px;
            margin: 5px 0;
            border-radius: 4px;
            border-left: 3px solid var(--accent);
        }
        
        @media (max-width: 768px) {
            .grid-2, .grid-3 {
                grid-template-columns: 1fr;
            }
            
            .stats-grid {
                grid-template-columns: 1fr 1fr;
            }
            
            .tabs {
                flex-direction: column;
            }
        }
    </style>
</head>
<body>
    <!-- Login Form -->
    <div id="login" class="login-container">
        <div class="login-box">
            <div class="logo">🎬 AnimeWorld API</div>
            <div class="subtitle">Enhanced Admin Panel v6.0</div>
            <form id="loginForm">
                <input type="password" id="password" placeholder="Enter admin password (admin123)" required>
                <button type="submit">Login to Admin Panel</button>
            </form>
            <div id="loginMessage"></div>
        </div>
    </div>

    <!-- Admin Panel -->
    <div id="adminPanel" class="admin-container" style="display: none;">
        <div class="admin-panel">
            <div class="admin-header">
                <div>
                    <h1>🎬 AnimeWorld API Enhanced Admin Panel</h1>
                    <p style="color: var(--text-muted);">Complete database management with Vercel persistence</p>
                </div>
                <div>
                    <button onclick="logout()" style="width: auto; padding: 10px 20px; margin-left: 10px;">Logout</button>
                </div>
            </div>

            <div class="admin-content">
                <div class="session-info" id="sessionInfo" style="display: none;">
                    <strong>Session Info:</strong> 
                    <span id="sessionDetails">Loading...</span>
                </div>

                <div class="stats-grid">
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
                    <div class="tab" onclick="switchTab('test')">🧪 Test URLs</div>
                    <div class="tab" onclick="switchTab('export')">📤 Export</div>
                </div>

                <!-- Single Add Tab -->
                <div id="singleTab" class="tab-content active">
                    <div class="grid-2">
                        <div class="form-section">
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
                                    <button type="button" onclick="fetchAnimeInfo()" class="secondary" style="width: auto; margin-top: 5px;">🔍 Fetch from AniList</button>
                                </div>
                                
                                <div class="form-group" id="customIdGroup" style="display: none;">
                                    <label>Custom ID (for internal use)</label>
                                    <input type="number" id="customId" placeholder="e.g., 999001">
                                </div>
                                
                                <div class="form-group">
                                    <label>Anime URL Slug</label>
                                    <input type="text" id="animeSlug" placeholder="e.g., bleach-thousand-year-blood-war" required>
                                </div>
                                
                                <div class="form-group">
                                    <label>URL Type</label>
                                    <select id="urlType">
                                        <option value="episode">Episode URLs (recommended)</option>
                                        <option value="series">Series URLs</option>
                                        <option value="auto">Auto-detect</option>
                                    </select>
                                </div>
                                
                                <button type="submit">Add to Database</button>
                            </form>
                            <div id="addMessage"></div>
                        </div>

                        <div class="form-section">
                            <h3>💡 Quick Actions</h3>
                            <button onclick="testRandomAnime()" class="secondary">🎲 Test Random Anime</button>
                            <button onclick="refreshStats()" class="secondary">📈 Refresh Stats</button>
                            <button onclick="testAPI()" class="secondary">🔗 Test API Endpoint</button>
                            <button onclick="exportDatabase()" class="secondary" style="margin-top: 10px;">📤 Export Database</button>
                            
                            <div class="url-preview" style="margin-top: 20px;">
                                <strong>URL Pattern Preview:</strong><br>
                                <span id="slugPreview">/episode/slug-1x1/</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Bulk Add Tab -->
                <div id="bulkTab" class="tab-content">
                    <div class="grid-2">
                        <div class="form-section">
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

                        <div class="form-section">
                            <h3>⚡ Quick Bulk Actions</h3>
                            <button onclick="addPopularAnime()" class="secondary">Add Popular Anime</button>
                            <button onclick="clearBulkForm()" class="danger">Clear Form</button>
                            
                            <div style="margin-top: 20px;">
                                <h4>Popular Anime IDs:</h4>
                                <div style="font-size: 0.9em; color: var(--text-muted);">
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
                    <div class="form-section">
                        <h3>📊 Current Database (<span id="dbCount">0</span> entries)</h3>
                        <div class="anime-list" id="animeList">
                            Loading...
                        </div>
                        <button onclick="refreshDatabase()" style="margin-top: 15px;">🔄 Refresh List</button>
                    </div>
                </div>

                <!-- Test URLs Tab -->
                <div id="testTab" class="tab-content">
                    <div class="form-section">
                        <h3>🧪 Test Anime URLs</h3>
                        <div class="grid-3">
                            <div>
                                <div class="form-group">
                                    <label>Anime Slug</label>
                                    <input type="text" id="testSlug" placeholder="e.g., demon-slayer">
                                </div>
                                <div class="form-group">
                                    <label>Season</label>
                                    <input type="number" id="testSeason" value="1">
                                </div>
                            </div>
                            <div>
                                <div class="form-group">
                                    <label>Episode</label>
                                    <input type="number" id="testEpisode" value="1">
                                </div>
                                <div class="form-group">
                                    <label>Content Type</label>
                                    <select id="testType">
                                        <option value="episode">Episode</option>
                                        <option value="movie">Movie</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <div class="form-group">
                                    <label>URL Type</label>
                                    <select id="testUrlType">
                                        <option value="auto">Auto-detect</option>
                                        <option value="episode">Episode URLs</option>
                                        <option value="series">Series URLs</option>
                                    </select>
                                </div>
                                <button onclick="testAnimeUrl()" class="warning">🧪 Test URL Patterns</button>
                            </div>
                        </div>
                        
                        <div id="testResults"></div>
                        <div id="playerPreviews"></div>
                    </div>
                </div>

                <!-- Export Tab -->
                <div id="exportTab" class="tab-content">
                    <div class="form-section">
                        <h3>📤 Export Database</h3>
                        <p>For Vercel persistence, copy the database JSON and add it as an environment variable:</p>
                        <div class="form-group">
                            <label>Environment Variable Name:</label>
                            <input type="text" value="VERCEL_ANIME_DATABASE" readonly>
                        </div>
                        <button onclick="exportDatabase()" class="secondary">📋 Export Database JSON</button>
                        <div id="exportResult" style="margin-top: 20px;"></div>
                    </div>
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

        // Check session validity and show session info
        async function checkSession() {
            try {
                const response = await fetch('/admin/check-session', {
                    headers: { 'Authorization': authToken }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    showAdminPanel();
                    showSessionInfo(data.session);
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
            updateSlugPreview();
        }

        function showSessionInfo(session) {
            const sessionInfo = document.getElementById('sessionInfo');
            const sessionDetails = document.getElementById('sessionDetails');
            
            sessionDetails.innerHTML = \`
                IP: \${session.ip} | 
                Created: \${session.createdAt} | 
                Expires: \${session.expiresAt} | 
                Remaining: \${session.remainingDays} days
            \`;
            sessionInfo.style.display = 'block';
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

        // Update slug preview
        function updateSlugPreview() {
            const slug = document.getElementById('animeSlug').value || 'slug';
            const urlType = document.getElementById('urlType').value;
            let pattern = '';
            
            if (urlType === 'series') {
                pattern = \`/series/\${slug}/season-1/episode-1/\`;
            } else {
                pattern = \`/episode/\${slug}-1x1/\`;
            }
            
            document.getElementById('slugPreview').textContent = pattern;
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
                    showMessage('loginMessage', data.message, 'success');
                } else {
                    showMessage('loginMessage', data.error, 'error');
                }
            } catch (error) {
                showMessage('loginMessage', 'Login failed', 'error');
            }
        });

        // Fetch anime info from AniList
        async function fetchAnimeInfo() {
            const anilistId = document.getElementById('anilistId').value;
            if (!anilistId) return alert('Enter AniList ID');

            try {
                const response = await fetch('/admin/fetch-anime-info', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': authToken
                    },
                    body: JSON.stringify({ ids: [parseInt(anilistId)] })
                });

                const data = await response.json();
                if (data.success && data.results.length > 0) {
                    const anime = data.results[0];
                    if (anime.success) {
                        document.getElementById('animeName').value = anime.name;
                        document.getElementById('animeSlug').value = anime.slug;
                        showMessage('addMessage', '✅ Anime info fetched successfully!', 'success');
                        updateSlugPreview();
                    } else {
                        showMessage('addMessage', '❌ Failed to fetch: ' + anime.error, 'error');
                    }
                } else {
                    showMessage('addMessage', '❌ Failed to fetch anime info', 'error');
                }
            } catch (error) {
                showMessage('addMessage', '❌ Error fetching anime info', 'error');
            }
        }

        // Add single anime functionality
        document.getElementById('addAnimeForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('animeName').value;
            const hasAnilistId = document.getElementById('hasAnilistId').checked;
            const anilistId = hasAnilistId ? parseInt(document.getElementById('anilistId').value) : null;
            const customId = !hasAnilistId ? parseInt(document.getElementById('customId').value) : null;
            const slug = document.getElementById('animeSlug').value;
            const urlType = document.getElementById('urlType').value;
            
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
                        hasAnilistId,
                        urlType
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    showMessage('addMessage', 'Anime added successfully!', 'success');
                    document.getElementById('addAnimeForm').reset();
                    refreshDatabase();
                    loadStats();
                    updateSlugPreview();
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
                        <div style="font-size: 0.9em; color: var(--text-muted);">
                            ID: \${anime.id} • Slug: \${anime.slug} • URL Type: \${anime.urlType}
                            \${anime.success ? '<span style="color: var(--success);">✓</span>' : '<span style="color: var(--danger);">✗ ' + anime.error + '</span>'}
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
                            hasAnilistId: anime.hasAnilistId,
                            urlType: anime.urlType
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

        // Test anime URL functionality
        async function testAnimeUrl() {
            const slug = document.getElementById('testSlug').value;
            const season = document.getElementById('testSeason').value || 1;
            const episode = document.getElementById('testEpisode').value || 1;
            const type = document.getElementById('testType').value;
            const urlType = document.getElementById('testUrlType').value;

            if (!slug) return alert('Enter anime slug to test');

            const resultsDiv = document.getElementById('testResults');
            const playersDiv = document.getElementById('playerPreviews');
            resultsDiv.innerHTML = '<div class="message info">Testing all URL patterns... Please wait</div>';
            playersDiv.innerHTML = '';

            try {
                const response = await fetch('/admin/test-anime', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': authToken
                    },
                    body: JSON.stringify({
                        slug: slug,
                        season: parseInt(season),
                        episode: parseInt(episode),
                        type: type,
                        urlType: urlType
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
                                '<strong>Server ' + (index + 1) + ':</strong> ' + (server.server || 'Unknown') + ' (' + server.type + ')<br>' +
                                '<small>URL: ' + server.url + '</small>' +
                                '</div>';
                                
                            playersHtml += '<div style="margin: 10px 0; padding: 10px; background: var(--secondary); border-radius: 5px;">' +
                                '<strong>🎮 ' + (server.server || 'Unknown') + ' - ' + server.type + '</strong><br>' +
                                '<iframe src="/api/iframe?url=' + encodeURIComponent(server.url) + '" style="width: 100%; height: 300px; border: none; border-radius: 5px;"></iframe>' +
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
            } catch (error) {
                resultsDiv.innerHTML = '<div class="message error">' +
                    '<strong>❌ Test Error!</strong><br>' +
                    'Error: ' + error.message +
                    '</div>';
                playersDiv.innerHTML = '';
            }
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
                    const urlType = entry.urlType || 'episode';
                    
                    item.innerHTML = \`
                        <div class="anime-info">
                            <div class="anime-id">ID: \${entry.id}</div>
                            <div class="anime-name">
                                \${displayName}
                                <span class="anime-type">\${type}</span>
                                <span class="url-type">\${urlType}</span>
                            </div>
                            <div class="anime-slug">\${slug}</div>
                        </div>
                        <div>
                            <button class="test-btn" onclick="testExistingAnime(\${entry.id})">Test</button>
                            <button class="delete-btn" onclick="deleteAnime(\${entry.id})">Delete</button>
                        </div>
                    \`;
                    list.appendChild(item);
                });
            } catch (error) {
                document.getElementById('animeList').innerHTML = 'Failed to load database';
            }
        }

        async function testExistingAnime(id) {
            const response = await fetch('/admin/database', {
                headers: { 'Authorization': authToken }
            });
            const data = await response.json();
            const anime = data.database.find(a => a.id === id);
            
            if (anime) {
                document.getElementById('testSlug').value = anime.slug;
                switchTab('test');
                setTimeout(() => testAnimeUrl(), 100);
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

        async function exportDatabase() {
            try {
                const response = await fetch('/admin/export-database', {
                    headers: { 'Authorization': authToken }
                });
                const data = await response.json();
                
                if (data.success) {
                    const dbString = JSON.stringify(data.database, null, 2);
                    document.getElementById('exportResult').innerHTML = \`
                        <div class="message success">
                            <strong>Database exported successfully!</strong>
                            <p>Copy the JSON below and add it as VERCEL_ANIME_DATABASE environment variable:</p>
                            <textarea style="width: 100%; height: 300px; margin-top: 10px; font-family: monospace; background: var(--primary); color: var(--text); border: 1px solid var(--border); padding: 10px; border-radius: 4px;">\${dbString}</textarea>
                            <button onclick="copyToClipboard('\${dbString.replace(/'/g, "\\\\'")}')" class="secondary" style="margin-top: 10px;">📋 Copy to Clipboard</button>
                        </div>
                    \`;
                }
            } catch (error) {
                document.getElementById('exportResult').innerHTML = \`
                    <div class="message error">Failed to export database: \${error.message}</div>
                \`;
            }
        }

        function copyToClipboard(text) {
            navigator.clipboard.writeText(text).then(() => {
                alert('Database JSON copied to clipboard!');
            }).catch(err => {
                alert('Failed to copy: ' + err);
            });
        }

        async function testRandomAnime() {
            try {
                const response = await fetch('/api/random?json=1');
                const data = await response.json();
                
                if (data.success) {
                    showMessage('addMessage', \`Random test: \${data.title} - Success!\`, 'success');
                } else {
                    showMessage('addMessage', 'Random test failed', 'error');
                }
            } catch (error) {
                showMessage('addMessage', 'Random test error', 'error');
            }
        }

        async function testAPI() {
            try {
                const response = await fetch('/health');
                const data = await response.json();
                showMessage('addMessage', \`API Status: \${data.status} - \${data.database_entries} anime in database\`, 'success');
            } catch (error) {
                showMessage('addMessage', 'API test failed', 'error');
            }
        }

        async function refreshStats() {
            await loadStats();
            showMessage('addMessage', 'Stats updated!', 'success');
        }

        async function logout() {
            try {
                const response = await fetch('/admin/logout', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': authToken
                    }
                });
                
                const data = await response.json();
                if (data.success) {
                    showMessage('addMessage', 'Logged out successfully', 'success');
                }
            } catch (error) {
                console.error('Logout error:', error);
            }
            
            authToken = '';
            localStorage.removeItem('adminToken');
            document.getElementById('login').style.display = 'flex';
            document.getElementById('adminPanel').style.display = 'none';
            document.getElementById('password').value = '';
        }

        function showMessage(elementId, message, type) {
            const element = document.getElementById(elementId);
            element.innerHTML = \`<div class="message \${type}">\${message}</div>\`;
            setTimeout(() => element.innerHTML = '', 5000);
        }

        // Initialize
        toggleIdInput();
        document.getElementById('animeSlug').addEventListener('input', updateSlugPreview);
        document.getElementById('urlType').addEventListener('change', updateSlugPreview);
        updateSlugPreview();
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
🚀 ULTIMATE ANIMEWORLD API WITH ENHANCED ADMIN PANEL
───────────────────────────────────────────
📍 Port: ${PORT}
📊 Database: ${Object.keys(animeDatabase).length} anime
🎲 Random Pool: ${randomAnimePool.length} anime
🔑 Active Sessions: ${sessions.size}
⏰ Session Duration: 5 days
🔗 Admin: http://localhost:${PORT}/admin
🔗 API: http://localhost:${PORT}/api/anime/101922/1/1
🔑 Password: admin123
───────────────────────────────────────────
🎯 FEATURES:
• Session-based authentication with IP tracking
• API usage statistics and success rate tracking  
• Vercel environment variable persistence
• 100+ pre-configured anime with proper slugs
• Bulk database operations with progress tracking
• Multiple URL pattern support (seasonxepisode priority)
• Server detection in video sources
• Enhanced error handling with client IP
• 5-day session expiration management
• Real-time URL testing and player previews
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
