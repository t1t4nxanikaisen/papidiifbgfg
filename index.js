import express from 'express';
import axios from 'axios';
import * as cheerio from 'cheerio';
import m3u8Parser from 'm3u8-parser';
import cors from 'cors';

const app = express();
const PORT = 3000;
app.use(cors());

const TMDB_API_KEY = "a2f888b27315e62e471b2d587048f32e"; // <-- INSERT YOUR KEY HERE!

// -----------------------------
// Helpers
// -----------------------------
function slugify(title) {
  // Replace macron vowels with a dash (word break)
  const vowelBreakMap = {
    'ā': '-', 'ē': '-', 'ī': '-', 'ō': '-', 'ū': '-',
    'Ā': '-', 'Ē': '-', 'Ī': '-', 'Ō': '-', 'Ū': '-',
  };

  // Step 1: replace any macron vowel with "-"
  let cleaned = title.split('').map(ch => vowelBreakMap[ch] || ch).join('');

  // Step 2: strip other accents & clean up
  return cleaned
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .replace(/['"]/g, '')            // remove quotes
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')   // keep existing dashes
    .replace(/^-+|-+$/g, '');       // trim leading/trailing dash
}

async function getTmdbTitle(tmdbId, showType = "TV") {
  if (!tmdbId) throw new Error('No tmdbId');
  try {
    if (showType.toUpperCase() === "MOVIE") {
      const resp = await axios.get(`https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${TMDB_API_KEY}&language=en`);
      return resp.data.title || resp.data.original_title || null;
    } else {
      const resp = await axios.get(`https://api.themoviedb.org/3/tv/${tmdbId}?api_key=${TMDB_API_KEY}&language=en`);
      return resp.data.name || resp.data.original_name || null;
    }
  } catch (err) {
    throw new Error(`TMDb title fetch failed: ${err.message}`);
  }
}

function titleVariants(title) {
  const words = title.split(/\s+/);
  const arr = [];
  for (let len = words.length; len >= 2; len--) {
    arr.push(words.slice(0, len).join(' '));
  }
  return arr;
}

function scoreCandidateUniversal(name, originalTitle) {
  const nameL = name.toLowerCase();
  const origL = originalTitle.toLowerCase();

  if (nameL === origL) return 10000;

  const origWords = originalTitle.split(/\s+/).map(w => w.toLowerCase());
  let presentWords = 0;
  origWords.forEach(w => { if (nameL.includes(w)) presentWords++; });

  let score = presentWords * 1000;

  if (nameL.includes(origL)) score += 500;

  const seasonInOrig = origL.match(/season\s*(\d+)/i) || origL.match(/s(\d+)/i);
  const seasonInName = nameL.match(/season\s*(\d+)/i) || nameL.match(/s(\d+)/i);

  if (seasonInOrig && seasonInName) {
    const so = parseInt(seasonInOrig[1]);
    const sn = parseInt(seasonInName[1]);
    if (so === sn) score += 2000;
    else score -= 800 * Math.abs(so-sn);
  }

  if (origL.includes("arc") && nameL.includes("arc")) score += 400;
  if (origL.includes("part") && nameL.includes("part")) score += 400;

  score -= Math.abs(name.length - originalTitle.length);

  return score;
}

// -----------------------------
// Satoru Helpers
// -----------------------------
async function getAnimeTitleAndType(apiUrl) {
  try {
    const { data } = await axios.get(apiUrl);
    if (!data.success) throw new Error('Anime info not found');
    return {
      title: data.results.data.title
        .replace(/[^\w\s-]/gi, '') // keep letters, numbers, spaces, and dash
        .replace(/\s+/g, ' ')
        .trim(),
      showType: data.results.data.showType ? data.results.data.showType.trim().toUpperCase() : null,
      tmdbId: data.results.data.tmdbId || null,
    };
  } catch (err) {
    throw new Error(`[getAnimeTitleAndType] ${err.message} (url: ${apiUrl})`);
  }
}

async function getEpisodeNumberFromId(hianimeId, episodeId) {
  try {
    const apiUrl = `https://api-anome-three.vercel.app/api/episodes/id=${hianimeId}`;
    const { data } = await axios.get(apiUrl);
    if (!data.success) throw new Error('Episodes data not found');

    const episode = data.results.episodes.find(ep => ep.episode_id === episodeId);
    if (!episode) throw new Error(`Episode ID ${episodeId} not found in episodes list`);

    console.log(`[⚙️ Satoru] Found episode ${episode.episode_no}: ${episode.title} (ID: ${episodeId})`);
    return episode.episode_no;
  } catch (err) {
    throw new Error(`[getEpisodeNumberFromId] ${err.message} (hianimeId: ${hianimeId}, episodeId: ${episodeId})`);
  }
}

async function searchSatoruAll(keyword, originalTitle) {
  try {
    const url = `https://satoru.one/filter?keyword=${encodeURIComponent(keyword)}`;
    const { data: html } = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const $ = cheerio.load(html);
    let results = [];
    $('.flw-item').each((i, el) => {
      const name = $(el).find('.film-name a').text().trim();
      const dataId = $(el).find('.film-poster-ahref').attr('data-id');
      const showType = $(el).find('.fd-infor .fdi-item').first().text().trim().toUpperCase();
      if (dataId && name) {
        let score = scoreCandidateUniversal(name, originalTitle);
        results.push({ id: dataId, displayName: name, score, showType });
      }
    });
    return results;
  } catch (err) {
    console.warn(`[⚙️ Satoru searchSatoruAll] Failed: ${err.message}`);
    return [];
  }
}

async function searchSatoruMultiBest(title, expectedShowType) {
  const variants = titleVariants(title);
  let allCandidates = [];
  for (const variant of variants) {
    console.log(`[⚙️ Satoru] Trying variant "${variant}"...`);
    const candidates = await searchSatoruAll(variant, title);
    allCandidates = allCandidates.concat(candidates);
  }
  if (!allCandidates.length) throw new Error(`No anime candidates found for any variant: ${variants.join(' | ')}`);

  let filtered = allCandidates;
  if (expectedShowType) {
    filtered = allCandidates.filter(x => x.showType === expectedShowType.toUpperCase());
    if (!filtered.length) throw new Error(`No anime found of required showType ${expectedShowType}`);
  }

  filtered.sort((a, b) => b.score - a.score);

  console.log('[⚙️ Satoru] Matches:');
  filtered.forEach(x => console.log(`- ${x.displayName} (${x.showType}, ID: ${x.id}) score=${x.score}`));

  return filtered[0].id;
}

async function getEpisodeList(animeId, episodeNum) {
  try {
    const url = `https://satoru.one/ajax/episode/list/${animeId}`;
    const { data } = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const $ = cheerio.load(data.html);

    let epId = null;
    let foundEpisodeNums = [];
    $('.ep-item').each((i, el) => {
      const num = $(el).attr('data-number');
      const id = $(el).attr('data-id');
      foundEpisodeNums.push(num);
      if (String(num) === String(episodeNum)) epId = id;
    });

    console.log(`[⚙️ Satoru] animeId=${animeId}, found episodes=[${foundEpisodeNums.join(', ')}], requested=${episodeNum}`);

    if (!epId) throw new Error(`Episode not found. Available episode numbers: [${foundEpisodeNums.join(', ')}], requested: ${episodeNum}`);
    return epId;
  } catch (err) {
    throw new Error(`[getEpisodeList] ${err.message} (animeId: ${animeId}, episodeNum: ${episodeNum})`);
  }
}

async function getServerAndSourceId(epId) {
  try {
    const url = `https://satoru.one/ajax/episode/servers?episodeId=${epId}`;
    const { data } = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });

    let intro = null, outro = null;
    if (data.status && data.skip) {
      data.skip.forEach(k => {
        if (k.skip_type === 'op') intro = { start: k.start_time, end: k.end_time };
        if (k.skip_type === 'ed') outro = { start: k.start_time, end: k.end_time };
      });
    }

    const $ = cheerio.load(data.html);
    const serverSourceId = $('.server-item').first().attr('data-id');
    if (!serverSourceId) throw new Error('No server source found');
    return { intro, outro, serverSourceId };
  } catch (err) {
    throw new Error(`[getServerAndSourceId] ${err.message} (epId: ${epId})`);
  }
}

async function getSources(serverSourceId) {
  try {
    const url = `https://satoru.one/ajax/episode/sources?id=${serverSourceId}`;
    const { data } = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (data.type !== 'iframe') throw new Error('No iframe source');
    return data.link;
  } catch (err) {
    throw new Error(`[getSources] ${err.message} (serverSourceId: ${serverSourceId})`);
  }
}

async function extractFinalM3u8Url(iframeUrl) {
  try {
    if (iframeUrl.includes('buycodeonline.com')) {
      const response = await axios.get(iframeUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const html = response.data;
      const m3u8Pattern = /const\s+mastreUrl\s*=\s*['"]([^'"]+\.m3u8)['"]/;
      const match = m3u8Pattern.exec(html);
      if (match && match[1]) return match[1];
    }
    return iframeUrl.replace(/\/[^\/]+$/, '/master.m3u8');
  } catch (err) {
    throw new Error(`[extractFinalM3u8Url] ${err.message} (iframeUrl: ${iframeUrl})`);
  }
}

async function extractM3u8(m3u8Url) {
  try {
    const { data: playlistStr } = await axios.get(m3u8Url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const parser = new m3u8Parser.Parser();
    parser.push(playlistStr);
    parser.end();
    const manifest = parser.manifest;

    const audios = manifest.mediaGroups && manifest.mediaGroups.AUDIO ? Object.values(manifest.mediaGroups.AUDIO.audio || {}) : [];
    const streams = manifest.playlists || [];

    const audio_tracks = audios.map(track => ({ language: track.language, name: track.name, url: track.uri }));
    const videos = streams.map(v => ({ resolution: v.attributes.RESOLUTION ? v.attributes.RESOLUTION.height + 'p' : '', url: v.uri }));

    return { audio_tracks, videos };
  } catch (err) {
    throw new Error(`[extractM3u8] ${err.message} (url: ${m3u8Url})`);
  }
}

// -----------------------------
// AnimeWorld Scraper
// -----------------------------
async function scrapeFromAnimeWorld(hianimeId, episodeId) {
  try {
    console.log(`[🌸 AnimeWorld] Starting scrape for hianimeId=${hianimeId}, episodeId=${episodeId}`);

    // --- Fetch info ---
    const infoUrl = `https://api-anome-three.vercel.app/api/info?id=${hianimeId}`;
    const { data: infoData } = await axios.get(infoUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!infoData.success) throw new Error('Info fetch failed');

    const { tmdbId, showType, anilistId } = infoData.results.data;
    if (!tmdbId) throw new Error('No tmdbId for fallback!');

    const tmdbTitle = await getTmdbTitle(tmdbId, showType);
    if (!tmdbTitle) throw new Error('TMDb title not found');

    const slug = slugify(tmdbTitle);
    console.log(`[🌸 AnimeWorld] tmdbTitle=${tmdbTitle}, showType=${showType}, slug=${slug}`);

    // --- MOVIE logic ---
    if (showType && showType.toUpperCase() === 'MOVIE') {
      const movieUrl = `https://animeworld-india.me/movies/${slug}`;
      console.log(`[🌸 AnimeWorld] Movie URL: ${movieUrl}`);
      const { data: movieHtml } = await axios.get(movieUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const $ = cheerio.load(movieHtml);

      const iframe =
        $('#options-0 iframe').attr('data-src') ||
        $('#options-0 iframe').attr('src') ||
        $('iframe').first().attr('data-src') ||
        $('iframe').first().attr('src');
      if (!iframe) throw new Error('No iframe found on movie page');

      console.log(`[🌸 AnimeWorld] Movie iframe found: ${iframe}`);
      const { data: iframeHtml } = await axios.get(iframe, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const txtMatch =
        iframeHtml.match(/https?:\/\/[^'"]+\.txt[^'"]*/i) ||
        iframeHtml.match(/https?:\/\/[^'"]+\.m3u8[^'"]*/i);
      if (!txtMatch) throw new Error('No .txt/.m3u8 master link found in iframe (movie)');

      const masterUrl = txtMatch[0];
      const basePath = masterUrl.replace(/\/[^/]+$/, '/');
      console.log(`[🌸 AnimeWorld] masterUrl=${masterUrl}`);

      const { data: playlistStr } = await axios.get(masterUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const parser = new m3u8Parser.Parser();
      parser.push(playlistStr);
      parser.end();
      const manifest = parser.manifest;

      const audios =
        manifest.mediaGroups && manifest.mediaGroups.AUDIO
          ? Object.values(manifest.mediaGroups.AUDIO.audio || {})
          : [];
      const videos = manifest.playlists || [];
      const audioTracks = audios.map((a) => ({ name: a.name, language: a.language, url: basePath + a.uri }));
      const videoTracks = videos.map((v) => ({
        resolution: v.attributes.RESOLUTION ? v.attributes.RESOLUTION.height + 'p' : '',
        url: basePath + v.uri,
      }));

      return {
        source: 'animeworld',
        fallback_reason: null,
        tmdbTitle,
        showType,
        episode: 1,
        episode_id: episodeId,
        sources: videoTracks.map((v) => ({ quality: v.resolution, url: v.url, audio_tracks: audioTracks })),
      };
    }

    // --- SERIES logic ---
    const seriesUrl = `https://animeworld-india.me/series/${slug}`;
    console.log(`[🌸 AnimeWorld] Series URL: ${seriesUrl}`);
    const { data: seriesHtml } = await axios.get(seriesUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const $ = cheerio.load(seriesHtml);

    // --- Extract all seasons dynamically ---
    const seasonElements = $('ul.aa-cnt.sub-menu li a');
    const seasons = [];
    seasonElements.each((i, el) => {
      const seasonNum = parseInt($(el).attr('data-season'), 10);
      const post = $(el).attr('data-post');
      const aslug = $(el).attr('data-aslug');
      if (seasonNum && post && aslug) seasons.push({ seasonNum, post, aslug });
    });
    if (seasons.length === 0) throw new Error('No seasons found in HTML');

    console.log(`[🌸 AnimeWorld] ✅ Found ${seasons.length} seasons`);
    seasons.forEach((s) => console.log(`[🧩 Debug] Season ${s.seasonNum}: post=${s.post}, aslug=${s.aslug}`));

    // --- Fetch episodes from API ---
    const episodesApiUrl = `https://api-anome-three.vercel.app/api/episodes/id=${hianimeId}`;
    const { data: episodesData } = await axios.get(episodesApiUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!episodesData.success) throw new Error('Episodes fetch failed (AnimeWorld)');
    const requestedEpisode = episodesData.results.episodes.find((e) => e.episode_id === episodeId);
    if (!requestedEpisode) throw new Error('Episode ID not found in episodes list (AnimeWorld)');
    const episode_no = requestedEpisode.episode_no;

    // --- Get season from AniList if available ---
    let seasonFromAni = null;
    if (anilistId) {
      try {
        const aniMappingUrl = `https://api.ani.zip/mappings?anilist_id=${anilistId}`;
        const { data: aniMapping } = await axios.get(aniMappingUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        if (aniMapping?.episodes?.[episode_no]) {
          seasonFromAni = aniMapping.episodes[episode_no].seasonNumber;
          console.log(`[🌸 AnimeWorld] Episode ${episode_no} belongs to season ${seasonFromAni} according to AniList`);
        }
      } catch (err) {
        console.warn(`[🌸 AnimeWorld] AniList mapping fetch failed: ${err.message}`);
      }
    }

    // --- Find the correct episode URL ---
    let episodeUrl = null;

    if (seasonFromAni) {
      // Directly use the AniList season
      const seasonToUse = seasons.find(s => s.seasonNum === seasonFromAni);
      if (!seasonToUse) throw new Error(`AniList season ${seasonFromAni} not found in AnimeWorld`);

      console.log(`[🌸 AnimeWorld] Using season ${seasonToUse.seasonNum} from AniList mapping`);

      const postData = new URLSearchParams({
        action: 'action_select_season',
        season: String(seasonToUse.seasonNum),
        post: String(seasonToUse.post),
        aslug: String(seasonToUse.aslug),
      });

      const { data: seasonHtml } = await axios.post('https://animeworld-india.me/ajax/ajax.php', postData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          Referer: seriesUrl,
          Origin: 'https://animeworld-india.me',
          'User-Agent': 'Mozilla/5.0',
        },
        validateStatus: () => true,
      });

      const $season = cheerio.load(seasonHtml);
      const episodeElements = $season('li article.post');
      const epsInSeason = episodeElements.length;
      if (epsInSeason === 0) throw new Error(`No episodes found for season ${seasonToUse.seasonNum}`);

      for (let i = 0; i < epsInSeason; i++) {
        const epEl = episodeElements.eq(i);
        const epNumText = epEl.find('.num-epi').text().trim();
        const match = epNumText.match(/x(\d+)/);
        const epNum = match ? parseInt(match[1]) : i + 1;
        if (epNum === episode_no) {
          episodeUrl = epEl.find('a.lnk-blk').attr('href');
          console.log(`[🌸 AnimeWorld] ✅ Found episode URL: ${episodeUrl}`);
          break;
        }
      }
    } else {
      // Fallback to old loop
      let totalEpsSoFar = 0;
      for (const { seasonNum, post, aslug } of seasons) {
        console.log(`\n[🌸 AnimeWorld] Checking Season ${seasonNum} for ${slug}...`);
        console.log(`[🧩 Debug] Using: season=${seasonNum}, post=${post}, aslug=${aslug}`);

        const postData = new URLSearchParams({
          action: 'action_select_season',
          season: String(seasonNum),
          post: String(post),
          aslug: String(aslug),
        });

        try {
          const { data: seasonHtml } = await axios.post('https://animeworld-india.me/ajax/ajax.php', postData, {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
              Referer: seriesUrl,
              Origin: 'https://animeworld-india.me',
              'User-Agent': 'Mozilla/5.0',
            },
            validateStatus: () => true,
          });

          const $season = cheerio.load(seasonHtml);
          const episodeElements = $season('li article.post');
          const epsInSeason = episodeElements.length;
          if (epsInSeason === 0) continue;

          const firstNumEpi = $season(episodeElements.first()).find('.num-epi').text().trim();
          const match = firstNumEpi.match(/x(\d+)/);
          const seasonStartEp = match ? parseInt(match[1]) : 1;
          const seasonEndEp = seasonStartEp + epsInSeason - 1;

          console.log(`[🌸 AnimeWorld] Season ${seasonNum} spans episodes ${seasonStartEp}–${seasonEndEp}`);

          if (episode_no >= seasonStartEp && episode_no <= seasonEndEp) {
            const idxInSeason = episode_no - seasonStartEp;
            const episodeEl = episodeElements.eq(idxInSeason);
            const epUrl = episodeEl.find('a.lnk-blk').attr('href');
            if (epUrl) {
              episodeUrl = epUrl;
              console.log(`[🌸 AnimeWorld] ✅ Found episode URL: ${episodeUrl}`);
              break;
            }
          }

          totalEpsSoFar += epsInSeason;
        } catch (err) {
          console.error(`[🌸 AnimeWorld] ❌ AJAX failed for season ${seasonNum}: ${err.message}`);
        }

        if (episodeUrl) break;
      }
    }

    if (!episodeUrl) throw new Error('Episode URL not found across all seasons');

    // --- Fetch episode page and extract iframe ---
    const { data: episodeHtml } = await axios.get(episodeUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const $ep = cheerio.load(episodeHtml);

    const iframe =
      $ep('#options-0 iframe').attr('data-src') ||
      $ep('#options-0 iframe').attr('src') ||
      $ep('iframe').first().attr('data-src') ||
      $ep('iframe').first().attr('src');
    if (!iframe) throw new Error('No iframe found in episode page');
    console.log(`[🌸 AnimeWorld] Episode iframe: ${iframe}`);

    const { data: iframeHtml } = await axios.get(iframe, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const txtMatch =
      iframeHtml.match(/https?:\/\/[^'"]+\.txt[^'"]*/i) ||
      iframeHtml.match(/https?:\/\/[^'"]+\.m3u8[^'"]*/i);
    if (!txtMatch) throw new Error('No .txt/.m3u8 master link found in iframe');

    const masterUrl = txtMatch[0];
    const basePath = masterUrl.replace(/\/[^/]+$/, '/');
    console.log(`[🌸 AnimeWorld] masterUrl=${masterUrl}`);

    const { data: playlistStr } = await axios.get(masterUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const parser = new m3u8Parser.Parser();
    parser.push(playlistStr);
    parser.end();
    const manifest = parser.manifest;

    const audios =
      manifest.mediaGroups && manifest.mediaGroups.AUDIO
        ? Object.values(manifest.mediaGroups.AUDIO.audio || {})
        : [];
    const videos = manifest.playlists || [];
    const audioTracks = audios.map((a) => ({ name: a.name, language: a.language, url: basePath + a.uri }));
    const videoTracks = videos.map((v) => ({
      resolution: v.attributes.RESOLUTION ? v.attributes.RESOLUTION.height + 'p' : '',
      url: basePath + v.uri,
    }));

    return {
      source: 'animeworld',
      fallback_reason: null,
      tmdbTitle,
      showType,
      episode: episode_no,
      episode_id: episodeId,
      sources: videoTracks.map((v) => ({ quality: v.resolution, url: v.url, audio_tracks: audioTracks })),
    };
  } catch (err) {
    console.error(`[🌸 AnimeWorld] ❌ Scraper failed: ${err.message}`);
    throw err;
  }
}

// -----------------------------
// Satoru Scraper
// -----------------------------
async function scrapeFromSatoru(hianimeId, episodeId) {
  try {
    console.log(`[⚙️ Satoru] Starting scrape as fallback for hianimeId=${hianimeId}, episodeId=${episodeId}`);
    const infoUrl = `https://api-anome-three.vercel.app/api/info?id=${hianimeId}`;
    const { title, showType } = await getAnimeTitleAndType(infoUrl);
    console.log(`[⚙️ Satoru] title=${title}, showType=${showType}`);

    const episodeNum = await getEpisodeNumberFromId(hianimeId, episodeId);
    const satoruId = await searchSatoruMultiBest(title, showType);
    const epId = await getEpisodeList(satoruId, episodeNum);
    const { intro, outro, serverSourceId } = await getServerAndSourceId(epId);
    const iframeUrl = await getSources(serverSourceId);
    const m3u8MasterUrl = await extractFinalM3u8Url(iframeUrl);
    const m3u8BasePath = m3u8MasterUrl.replace(/\/master\.m3u8$/, '/');
    const { audio_tracks, videos } = await extractM3u8(m3u8MasterUrl);

    return {
      source: 'satoru',
      title,
      showType,
      episode: episodeNum,
      episode_id: episodeId,
      intro,
      outro,
      sources: videos.map(v => ({
        quality: v.resolution,
        url: m3u8BasePath + v.url,
        audio_tracks: audio_tracks.map(a => ({ ...a, url: m3u8BasePath + a.url }))
      }))
    };
  } catch (err) {
    throw new Error(`[⚙️ Satoru] ${err.message}`);
  }
}

// -----------------------------
// Wrapper: AnimeWorld first, Satoru fallback
// -----------------------------
async function scrapeAll(hianimeId, episodeId) {
  try {
    return await scrapeFromAnimeWorld(hianimeId, episodeId);
  } catch (primaryErr) {
    console.warn(`[scrapeAll] AnimeWorld failed: ${primaryErr.message}. Falling back to Satoru.`);
    try {
      const fallbackResult = await scrapeFromSatoru(hianimeId, episodeId);
      fallbackResult.fallback_reason = `animeworld_failed: ${primaryErr.message}`;
      return fallbackResult;
    } catch (fallbackErr) {
      throw new Error(`Both primary (AnimeWorld) and fallback (Satoru) failed. Primary: ${primaryErr.message} | Fallback: ${fallbackErr.message}`);
    }
  }
}

// -----------------------------
// Express endpoints
// -----------------------------
app.get('/api/servers/:hianime_id', async (req, res) => {
  try {
    const { hianime_id } = req.params;
    const { ep: episode_id } = req.query;
    if (!episode_id) return res.status(400).json({ error: 'Episode ID (ep) query parameter is required' });

    const servers = [];

    // --- AnimeWorld (Reco) ---
    try {
      const awResult = await scrapeFromAnimeWorld(hianime_id, episode_id);
      // Map to server format
      awResult.sources.forEach((_src, idx) => {
        servers.push({
          type: "mult",
          data_id: episode_id,
          server_id: idx + 1,
          serverName: "Reco"
        });
      });
    } catch (awErr) {
      console.warn(`[Servers] AnimeWorld failed: ${awErr.message}`);
    }

    // --- Satoru (Aika) ---
    try {
      const infoUrl = `https://api-anome-three.vercel.app/api/info?id=${hianime_id}`;
      const { title, showType } = await getAnimeTitleAndType(infoUrl);
      const episodeNum = await getEpisodeNumberFromId(hianime_id, episode_id);
      const satoruId = await searchSatoruMultiBest(title, showType);
      const epId = await getEpisodeList(satoruId, episodeNum);
      const { intro, outro, serverSourceId } = await getServerAndSourceId(epId);

      servers.push({
        type: "mult",
        data_id: episode_id,
        server_id: 1,
        serverName: "Aika"
      });
    } catch (satoruErr) {
      console.warn(`[Servers] Satoru failed: ${satoruErr.message}`);
    }

    if (!servers.length) return res.status(500).json({ success: false, message: "No servers found" });

    res.json({ success: true, results: servers });
  } catch (err) {
    console.error(`[API /api/servers] ${err.message}`);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/stream/:hianime_id', async (req, res) => {
  try {
    const { hianime_id } = req.params;
    const { ep: episode_id } = req.query;
    if (!episode_id) return res.status(400).json({ error: 'Episode ID (ep) query parameter is required' });

    const result = await scrapeAll(hianime_id, episode_id);
    res.json(result);
  } catch (err) {
    console.error(`[API /api/stream] ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

app.get('/', (req, res) => res.send('AnimeWorld Primary / Satoru Fallback Scraper API 🚀'));

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
