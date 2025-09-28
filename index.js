import express from 'express';
import axios from 'axios';
import * as cheerio from 'cheerio';
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

// Enhanced anime database with proper URL patterns and seasonxepisode format
let slugExceptions = {
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
  
  // Chainsaw Man
  127230: { slug: "chainsaw-man", name: "Chainsaw Man", hasAnilistId: true, urlType: "episode" },
  
  // Solo Leveling
  153518: { slug: "solo-leveling", name: "Solo Leveling", hasAnilistId: true, urlType: "episode" },
  
  // Frieren: Beyond Journey's End
  154587: { slug: "frieren-beyond-journeys-end", name: "Frieren: Beyond Journey's End", hasAnilistId: true, urlType: "episode" },
  
  // Apothecary Diaries
  151589: { slug: "the-apothecary-diaries", name: "The Apothecary Diaries", hasAnilistId: true, urlType: "episode" }
};

// Random anime pool
let randomAnimePool = [20, 113415, 127230, 97940, 21087, 16498, 11757, 20583, 31964, 39587, 121496, 140960, 118087, 151589];

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

// Ensure data directory exists
async function ensureDataDir() {
  if (!process.env.VERCEL) {
    try {
      await fs.access(DATA_DIR);
    } catch (error) {
      await fs.mkdir(DATA_DIR, { recursive: true });
    }
  }
}

// Load/Save database functions
async function loadDatabase() {
  try {
    await ensureDataDir();
    const data = await fs.readFile(DB_FILE, 'utf8');
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
    await ensureDataDir();
    const dataToSave = {
      slugExceptions,
      randomAnimePool,
      apiStats,
      lastSaved: new Date().toISOString()
    };
    await fs.writeFile(DB_FILE, JSON.stringify(dataToSave, null, 2));
    console.log('💾 Database saved successfully');
  } catch (error) {
    console.error('❌ Failed to save database:', error.message);
  }
}

// Enhanced session management with IP tracking and 5-day expiration
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

// Enhanced episode finder with URL type support and seasonxepisode priority
async function findEpisode(slugs, season, episode, animeInfo, urlType = "episode") {
  const baseUrl = 'https://watchanimeworld.in';
  
  for (const slug of slugs) {
    console.log(`🎯 Trying slug: ${slug} with URL type: ${urlType}`);
    
    const pathConfigs = [
      {
        type: 'episode',
        patterns: [
          `/episode/${slug}-${season}x${episode}/`,  // Priority: seasonxepisode format
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

    // If specific URL type is requested, only try that type
    const configsToTry = urlType === "auto" ? pathConfigs : pathConfigs.filter(config => config.type === urlType);

    for (const config of configsToTry) {
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
              console.log(`✅ Valid page found: ${config.type} - ${episodeUrl}`);
              
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

// Clean iframe player - Only iframe, no text or buttons
function generateCleanIframePlayer(url) {
  return `<!DOCTYPE html>
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
}

// Enhanced player with navigation - Removed all buttons and text
function generatePlayer(title, season, episode, sources, contentUrl, anilistId) {
  if (sources.length === 0) {
    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${title} - S${season}E${episode}</title>
    <style>
        body { background: #0f0f23; color: white; font-family: Arial; padding: 20px; text-align: center; }
        .redirect { background: #1a1a2e; padding: 40px; border-radius: 10px; margin: 50px auto; max-width: 600px; }
        .btn { display: inline-block; padding: 15px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 10px; margin-top: 20px; margin-right: 10px; }
    </style>
</head>
<body>
    <div class="redirect">
        <h1>${title}</h1>
        <p>Season ${season} • Episode ${episode}</p>
        <p>Content found but requires manual navigation</p>
        <a href="${contentUrl}" class="btn" target="_blank">Open Content Page</a>
        <a href="/admin" class="btn" style="background: #11998e;">Admin Panel</a>
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
            background: #000;
            color: white; 
            font-family: 'Segoe UI', sans-serif;
            min-height: 100vh;
            overflow: hidden;
        }
        .player-container { 
            width: 100vw; 
            height: 100vh; 
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
    </style>
</head>
<body>
    <div class="player-container">
        <iframe id="player" src="${primarySource.url}" allowfullscreen 
                allow="autoplay; fullscreen; picture-in-picture"></iframe>
    </div>
</body>
</html>`;
}

// ==================== MAIN API ROUTES ====================

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: '🎬 AnimeWorld API with Enhanced Admin Panel',
    version: '3.1.0',
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
        url: '/api/iframe?url=SOURCE_URL',
        description: 'Clean iframe player'
      },
      {
        method: 'GET',
        url: '/admin',
        description: 'Admin panel (password: 123Admin09)'
      }
    ]
  });
});

// Clean iframe endpoint
app.get('/api/iframe', (req, res) => {
  const url = req.query.url;
  
  if (!url) {
    return res.status(400).json({ error: 'URL parameter is required' });
  }
  
  console.log(`🎬 CLEAN IFRAME: ${url}`);
  
  const html = generateCleanIframePlayer(url);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
});

// Main streaming endpoint with URL type support
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
    let urlType = "episode"; // Default to episode URLs

    if (isInDatabase) {
      const dbEntry = slugExceptions[anilistId];
      const dbSlug = dbEntry.slug;
      const dbName = dbEntry.name;
      urlType = dbEntry.urlType || "episode"; // Use stored URL type
      
      console.log(`🎯 Found in database: ${dbSlug} (URL Type: ${urlType})`);
      
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

      // Find episode with specific URL type
      console.log(`🎯 Searching for content with URL type: ${urlType}...`);
      const result = await findEpisode(slugs, season, episode, animeInfo, urlType);

      if (!result) {
        // If specific URL type fails, try auto mode
        console.log(`❌ ${urlType} URL type failed, trying auto mode...`);
        const autoResult = await findEpisode(slugs, season, episode, animeInfo, "auto");
        if (autoResult) {
          console.log(`✅ Found with auto mode: ${autoResult.pathType}`);
          trackAPIUsage(true);
          
          const responseData = {
            success: true,
            id: parseInt(anilistId),
            anime_title: primaryTitle,
            season: parseInt(season),
            episode: parseInt(episode),
            slug: autoResult.slug,
            content_url: autoResult.url,
            sources: autoResult.sources,
            from_database: true,
            has_anilist_id: dbEntry.hasAnilistId,
            url_type: autoResult.pathType
          };

          if (jsonMode) {
            return res.json(responseData);
          }

          if (cleanMode && autoResult.sources.length > 0) {
            const primarySource = autoResult.sources[0];
            const html = generateCleanIframePlayer(primarySource.url);
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            return res.send(html);
          }

          const html = generatePlayer(primaryTitle, season, episode, autoResult.sources, autoResult.url, anilistId);
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          return res.send(html);
        }
        
        trackAPIUsage(false);
        return res.status(404).json({ 
          error: 'Content not found',
          anime_title: primaryTitle,
          tried_slugs: slugs,
          url_type: urlType
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
        has_anilist_id: dbEntry.hasAnilistId,
        url_type: result.pathType
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

      const html = generatePlayer(primaryTitle, season, episode, result.sources, result.url, anilistId);
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

      // Find episode with auto URL type detection
      console.log('🎯 Searching for content with auto URL type detection...');
      const result = await findEpisode(slugs, season, episode, animeInfo, "auto");

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
        from_database: false,
        url_type: result.pathType
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

      const html = generatePlayer(primaryTitle, season, episode, result.sources, result.url, anilistId);
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

    const html = generatePlayer(primaryTitle, season, episode, result.sources, result.url, randomId);
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
    version: '3.1.0',
    database_entries: Object.keys(slugExceptions).length,
    random_pool: randomAnimePool.length,
    total_requests: apiStats.totalRequests,
    active_sessions: sessions.size
  });
});

// ==================== ADMIN PANEL ROUTES ====================

// Admin login endpoint with IP tracking
app.post('/admin/login', async (req, res) => {
  const { password } = req.body;
  const clientIP = getClientIP(req);
  
  if (password === '123Admin09') {
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
    : 85;
    
  res.json({
    totalAnime: Object.keys(slugExceptions).length,
    successRate: successRate,
    randomPool: randomAnimePool.length,
    totalRequests: apiStats.totalRequests,
    successfulRequests: apiStats.successfulRequests,
    failedRequests: apiStats.failedRequests,
    activeSessions: sessions.size
  });
});

app.get('/admin/database', requireAuth, (req, res) => {
  // Convert to array for easier handling in frontend
  const databaseArray = Object.entries(slugExceptions).map(([id, entry]) => ({
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
  slugExceptions[id] = {
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
            max-width: 1200px;
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
        
        @media (max-width: 768px) {
            .grid-2 {
                grid-template-columns: 1fr;
            }
            
            .stats-grid {
                grid-template-columns: 1fr 1fr;
            }
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
                <input type="password" id="password" placeholder="Enter admin password" required>
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
                    <h1>🎬 AnimeWorld API Admin Panel</h1>
                    <p style="color: var(--text-muted);">Manage anime database with custom IDs and bulk operations</p>
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
⏰ Session Duration: 5 days
🔗 Admin: http://localhost:${PORT}/admin
🔗 API: http://localhost:${PORT}/api/anime/101922/1/1
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
