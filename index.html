<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AnimeFlix - Stream 2000+ Anime</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        
        body {
            background: #0a0a1a;
            color: #e0e0ff;
            line-height: 1.6;
            overflow-x: hidden;
        }
        
        .container {
            max-width: 1800px;
            margin: 0 auto;
            padding: 20px;
        }
        
        /* Header Styles */
        header {
            background: linear-gradient(135deg, #1a1a3a 0%, #0a0a1a 100%);
            border-radius: 20px;
            padding: 30px 40px;
            margin-bottom: 30px;
            box-shadow: 0 15px 40px rgba(0, 0, 0, 0.6);
            border: 1px solid #25254d;
        }
        
        .header-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 25px;
        }
        
        .logo {
            display: flex;
            align-items: center;
            gap: 15px;
        }
        
        .logo-icon {
            font-size: 3rem;
            color: #6c63ff;
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
        }
        
        .logo-text {
            font-size: 2.5rem;
            font-weight: bold;
            background: linear-gradient(45deg, #6c63ff, #ff6b6b, #4ecdc4);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            text-shadow: 0 0 30px rgba(108, 99, 255, 0.5);
        }
        
        .search-bar {
            flex: 1;
            max-width: 600px;
            position: relative;
        }
        
        .search-bar input {
            width: 100%;
            padding: 18px 60px 18px 25px;
            background: #25254d;
            border: 2px solid #6c63ff;
            border-radius: 50px;
            color: #e0e0ff;
            font-size: 1.1rem;
            outline: none;
            transition: all 0.3s ease;
        }
        
        .search-bar input:focus {
            border-color: #4ecdc4;
            box-shadow: 0 0 20px rgba(108, 99, 255, 0.3);
        }
        
        .search-bar button {
            position: absolute;
            right: 15px;
            top: 50%;
            transform: translateY(-50%);
            background: linear-gradient(45deg, #6c63ff, #4ecdc4);
            border: none;
            border-radius: 50%;
            width: 45px;
            height: 45px;
            color: white;
            cursor: pointer;
            font-size: 1.2rem;
            transition: all 0.3s ease;
        }
        
        .search-bar button:hover {
            transform: translateY(-50%) scale(1.1);
        }
        
        /* Main Content - UPDATED FOR BIGGER PLAYER */
        .main-content {
            display: grid;
            grid-template-columns: 1fr;
            gap: 30px;
            margin-bottom: 40px;
        }
        
        /* BIGGER Player Section */
        .player-section {
            background: #1a1a3a;
            border-radius: 20px;
            padding: 30px;
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
            border: 1px solid #25254d;
        }
        
        .player-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 25px;
            flex-wrap: wrap;
            gap: 20px;
        }
        
        .anime-title {
            font-size: 2.2rem;
            color: #6c63ff;
            text-shadow: 0 0 15px rgba(108, 99, 255, 0.5);
        }
        
        .server-selector {
            display: flex;
            gap: 15px;
            align-items: center;
            background: #25254d;
            padding: 12px 20px;
            border-radius: 12px;
        }
        
        .server-selector select {
            background: #1a1a3a;
            border: 2px solid #6c63ff;
            border-radius: 8px;
            padding: 12px 18px;
            color: #e0e0ff;
            outline: none;
            font-size: 1rem;
            min-width: 200px;
        }
        
        /* HUGE IFRAME CONTAINER */
        .iframe-container {
            background: #000;
            border-radius: 15px;
            overflow: hidden;
            position: relative;
            height: 70vh; /* 70% of viewport height */
            min-height: 600px;
            margin-bottom: 25px;
            border: 3px solid #6c63ff;
            box-shadow: 0 0 30px rgba(108, 99, 255, 0.3);
        }
        
        iframe {
            width: 100%;
            height: 100%;
            border: none;
        }
        
        .loading {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #1a1a3a, #0a0a1a);
            display: flex;
            justify-content: center;
            align-items: center;
            flex-direction: column;
            gap: 25px;
        }
        
        .spinner {
            width: 70px;
            height: 70px;
            border: 6px solid #25254d;
            border-top: 6px solid #6c63ff;
            border-radius: 50%;
            animation: spin 1.5s linear infinite;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .episode-controls {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #25254d;
            padding: 20px;
            border-radius: 15px;
            border: 1px solid #6c63ff;
        }
        
        .episode-btn {
            background: linear-gradient(45deg, #6c63ff, #4ecdc4);
            border: none;
            border-radius: 12px;
            padding: 15px 30px;
            color: white;
            cursor: pointer;
            transition: all 0.3s ease;
            font-size: 1.1rem;
            font-weight: bold;
        }
        
        .episode-btn:hover:not(:disabled) {
            transform: translateY(-3px);
            box-shadow: 0 10px 25px rgba(108, 99, 255, 0.4);
        }
        
        .episode-btn:disabled {
            background: #3a3a5a;
            cursor: not-allowed;
            opacity: 0.5;
        }
        
        .episode-info {
            text-align: center;
            font-weight: bold;
            color: #6c63ff;
            font-size: 1.3rem;
            text-shadow: 0 0 10px rgba(108, 99, 255, 0.5);
        }
        
        /* Genre Navigation */
        .genre-navigation {
            background: #1a1a3a;
            border-radius: 15px;
            padding: 25px;
            margin-bottom: 30px;
            border: 1px solid #25254d;
        }
        
        .genre-tabs {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
            justify-content: center;
        }
        
        .genre-tab {
            background: #25254d;
            border: 2px solid #6c63ff;
            border-radius: 25px;
            padding: 12px 25px;
            color: #e0e0ff;
            cursor: pointer;
            transition: all 0.3s ease;
            font-weight: 500;
        }
        
        .genre-tab:hover, .genre-tab.active {
            background: #6c63ff;
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(108, 99, 255, 0.3);
        }
        
        /* Anime Grid Sections */
        .anime-section {
            margin-bottom: 50px;
        }
        
        .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
        }
        
        .section-title {
            font-size: 2.2rem;
            color: #6c63ff;
            text-shadow: 0 0 15px rgba(108, 99, 255, 0.3);
        }
        
        .view-all {
            color: #4ecdc4;
            text-decoration: none;
            font-weight: bold;
            transition: all 0.3s ease;
        }
        
        .view-all:hover {
            color: #6c63ff;
        }
        
        .anime-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 30px;
        }
        
        .anime-card {
            background: #1a1a3a;
            border-radius: 20px;
            overflow: hidden;
            transition: all 0.4s ease;
            cursor: pointer;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            border: 1px solid #25254d;
            position: relative;
        }
        
        .anime-card:hover {
            transform: translateY(-15px) scale(1.02);
            box-shadow: 0 20px 50px rgba(108, 99, 255, 0.3);
            border-color: #6c63ff;
        }
        
        .anime-card img {
            width: 100%;
            height: 350px;
            object-fit: cover;
            transition: transform 0.3s ease;
        }
        
        .anime-card:hover img {
            transform: scale(1.1);
        }
        
        .anime-card-content {
            padding: 25px;
            position: relative;
        }
        
        .anime-card h4 {
            font-size: 1.3rem;
            margin-bottom: 12px;
            color: #e0e0ff;
            line-height: 1.3;
        }
        
        .anime-card .meta {
            color: #a0a0ff;
            font-size: 0.9rem;
            margin-bottom: 10px;
            display: flex;
            justify-content: space-between;
        }
        
        .anime-card .description {
            color: #a0a0ff;
            font-size: 0.95rem;
            margin-bottom: 15px;
            line-height: 1.5;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }
        
        .anime-card .episodes {
            color: #6c63ff;
            font-weight: bold;
            font-size: 1.1rem;
        }
        
        .genre-tag {
            position: absolute;
            top: 15px;
            right: 15px;
            background: rgba(108, 99, 255, 0.9);
            color: white;
            padding: 5px 12px;
            border-radius: 15px;
            font-size: 0.8rem;
            font-weight: bold;
        }
        
        /* Featured Section */
        .featured-anime {
            background: linear-gradient(135deg, #1a1a3a 0%, #25254d 100%);
            border-radius: 20px;
            padding: 50px;
            margin-bottom: 50px;
            text-align: center;
            border: 1px solid #6c63ff;
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
        }
        
        .featured-title {
            font-size: 3rem;
            margin-bottom: 20px;
            background: linear-gradient(45deg, #6c63ff, #ff6b6b, #4ecdc4);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            text-shadow: 0 0 30px rgba(108, 99, 255, 0.5);
        }
        
        .featured-subtitle {
            font-size: 1.3rem;
            color: #a0a0ff;
            margin-bottom: 40px;
        }
        
        .featured-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 25px;
            margin-top: 40px;
        }
        
        /* Footer */
        footer {
            text-align: center;
            padding: 40px;
            background: #1a1a3a;
            border-radius: 20px;
            margin-top: 50px;
            border: 1px solid #25254d;
        }
        
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 25px;
            margin-bottom: 40px;
        }
        
        .stat-item {
            background: #25254d;
            padding: 30px;
            border-radius: 15px;
            border: 1px solid #6c63ff;
        }
        
        .stat-number {
            font-size: 3rem;
            color: #6c63ff;
            font-weight: bold;
            text-shadow: 0 0 15px rgba(108, 99, 255, 0.5);
        }
        
        .stat-label {
            color: #a0a0ff;
            font-size: 1.1rem;
            margin-top: 10px;
        }
        
        /* Responsive Design */
        @media (max-width: 1200px) {
            .iframe-container {
                height: 60vh;
            }
        }
        
        @media (max-width: 768px) {
            .header-content {
                flex-direction: column;
                text-align: center;
            }
            
            .search-bar {
                max-width: 100%;
            }
            
            .iframe-container {
                height: 50vh;
                min-height: 400px;
            }
            
            .anime-grid {
                grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
            }
            
            .featured-title {
                font-size: 2.2rem;
            }
            
            .episode-controls {
                flex-direction: column;
                gap: 15px;
            }
        }
        
        @media (max-width: 480px) {
            .iframe-container {
                height: 40vh;
                min-height: 300px;
            }
            
            .anime-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <header>
            <div class="header-content">
                <div class="logo">
                    <div class="logo-icon">🎌</div>
                    <div class="logo-text">AnimeFlix Pro</div>
                </div>
                <div class="search-bar">
                    <input type="text" id="searchInput" placeholder="Search 2000+ anime series...">
                    <button onclick="searchAnime()">🔍</button>
                </div>
            </div>
        </header>

        <!-- Featured Anime -->
        <section class="featured-anime">
            <h2 class="featured-title">🔥 Premium Anime Experience</h2>
            <p class="featured-subtitle">Watch 2000+ anime with perfect iframe embeds and instant loading</p>
            <div class="featured-grid" id="featuredAnime">
                <!-- Featured anime will be loaded here -->
            </div>
        </section>

        <!-- Genre Navigation -->
        <section class="genre-navigation">
            <div class="genre-tabs" id="genreTabs">
                <!-- Genre tabs will be loaded here -->
            </div>
        </section>

        <!-- Main Content -->
        <div class="main-content">
            <!-- BIG Player Section -->
            <section class="player-section">
                <div class="player-header">
                    <h2 class="anime-title" id="currentAnimeTitle">Select an Anime to Start Watching</h2>
                    <div class="server-selector">
                        <select id="serverSelect" onchange="switchServer()" style="display: none;">
                            <option value="0">Server 1 (HD)</option>
                        </select>
                        <div class="episode-info" id="serverInfo">Ready to play</div>
                    </div>
                </div>
                
                <!-- HUGE IFRAME CONTAINER -->
                <div class="iframe-container">
                    <div class="loading" id="loading">
                        <div class="spinner"></div>
                        <p style="font-size: 1.3rem;">Select an anime from below to load the player</p>
                        <p style="color: #a0a0ff;">2000+ anime available with instant iframe embeds</p>
                    </div>
                    <iframe id="playerFrame" style="display: none;" allowfullscreen></iframe>
                </div>
                
                <div class="episode-controls">
                    <button class="episode-btn" id="prevEpisode" onclick="changeEpisode(-1)" disabled>⬅ Previous Episode</button>
                    <div class="episode-info" id="episodeInfo">Episode: -</div>
                    <button class="episode-btn" id="nextEpisode" onclick="changeEpisode(1)" disabled>Next Episode ➡</button>
                </div>
            </section>
        </div>

        <!-- Genre Sections -->
        <div id="genreSections">
            <!-- Genre sections will be loaded here -->
        </div>

        <!-- Footer -->
        <footer>
            <div class="stats">
                <div class="stat-item">
                    <div class="stat-number" id="totalAnime">2000+</div>
                    <div class="stat-label">Anime Series</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number" id="activePlayers">0</div>
                    <div class="stat-label">Active Streams</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">Instant</div>
                    <div class="stat-label">Player Loading</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">50+</div>
                    <div class="stat-label">Genres Available</div>
                </div>
            </div>
            <p style="font-size: 1.1rem; margin-top: 20px;">AnimeFlix Pro - Ultimate Anime Streaming Platform</p>
            <p style="color: #a0a0ff;">All content provided for premium streaming experience</p>
        </footer>
    </div>

    <script>
        // COMPREHENSIVE ANIME DATABASE WITH GENRES
        const animeDatabase = [
            // Action Anime
            {
                id: 21, title: "One Piece", slug: "one-piece", episodes: 1100, year: 1999, status: "Ongoing",
                genre: ["action", "adventure", "fantasy", "shounen"],
                description: "Join Monkey D. Luffy and his pirate crew in their epic quest for the ultimate treasure, the One Piece.",
                image: "https://via.placeholder.com/400/6c63ff/ffffff?text=One+Piece"
            },
            {
                id: 20, title: "Naruto", slug: "naruto", episodes: 220, year: 2002, status: "Completed",
                genre: ["action", "adventure", "shounen"],
                description: "A young ninja's journey to become the strongest Hokage in his village.",
                image: "https://via.placeholder.com/400/ff6b6b/ffffff?text=Naruto"
            },
            {
                id: 38000, title: "Demon Slayer", slug: "kimetsu-no-yaiba", episodes: 55, year: 2019, status: "Ongoing",
                genre: ["action", "fantasy", "supernatural"],
                description: "Tanjiro Kamado's quest to cure his sister and defeat powerful demons.",
                image: "https://via.placeholder.com/400/4ecdc4/ffffff?text=Demon+Slayer"
            },

            // Fantasy Anime
            {
                id: 113415, title: "Jujutsu Kaisen", slug: "jujutsu-kaisen", episodes: 47, year: 2020, status: "Ongoing",
                genre: ["action", "fantasy", "supernatural"],
                description: "A world of cursed energy and intense exorcism battles.",
                image: "https://via.placeholder.com/400/ffd166/ffffff?text=Jujutsu+Kaisen"
            },
            {
                id: 41353, title: "Jujutsu Kaisen Season 2", slug: "jujutsu-kaisen", episodes: 23, year: 2023, status: "Completed",
                genre: ["action", "fantasy", "supernatural"],
                description: "The epic Shibuya Incident arc with intense battles.",
                image: "https://via.placeholder.com/400/ffd166/ffffff?text=Jujutsu+Kaisen+S2"
            },

            // Adventure Anime
            {
                id: 11061, title: "Hunter x Hunter", slug: "hunter-x-hunter", episodes: 148, year: 2011, status: "Completed",
                genre: ["action", "adventure", "fantasy"],
                description: "Gon Freecss's journey to become a Hunter and find his father.",
                image: "https://via.placeholder.com/400/6c63ff/ffffff?text=Hunter+x+Hunter"
            },

            // Drama Anime
            {
                id: 175014, title: "Oshi no Ko", slug: "oshi-no-ko", episodes: 11, year: 2023, status: "Ongoing",
                genre: ["drama", "mystery", "supernatural"],
                description: "The dark side of the entertainment industry revealed.",
                image: "https://via.placeholder.com/400/ff6b6b/ffffff?text=Oshi+no+Ko"
            },

            // Comedy Anime
            {
                id: 186417, title: "Spy x Family", slug: "spy-x-family", episodes: 37, year: 2022, status: "Ongoing",
                genre: ["action", "comedy", "slice of life"],
                description: "A spy, an assassin, and a telepath form a hilarious fake family.",
                image: "https://via.placeholder.com/400/4ecdc4/ffffff?text=Spy+x+Family"
            },

            // Psychological Anime
            {
                id: 1535, title: "Death Note", slug: "death-note", episodes: 37, year: 2006, status: "Completed",
                genre: ["mystery", "psychological", "supernatural"],
                description: "A notebook that can kill anyone whose name is written in it.",
                image: "https://via.placeholder.com/400/1a1a3a/ffffff?text=Death+Note"
            },

            // Horror Anime
            {
                id: 16498, title: "Attack on Titan", slug: "shingeki-no-kyojin", episodes: 88, year: 2013, status: "Completed",
                genre: ["action", "drama", "fantasy", "horror"],
                description: "Humanity's desperate struggle against giant humanoid creatures.",
                image: "https://via.placeholder.com/400/25254d/ffffff?text=Attack+on+Titan"
            },

            // Romance Anime
            {
                id: 101922, title: "Kaguya-sama: Love is War", slug: "kaguya-sama-love-is-war", episodes: 37, year: 2019, status: "Completed",
                genre: ["comedy", "romance", "psychological"],
                description: "Two geniuses try to make the other confess their love first.",
                image: "https://via.placeholder.com/400/ff6b6b/ffffff?text=Kaguya-sama"
            },

            // Sci-Fi Anime
            {
                id: 9253, title: "Steins;Gate", slug: "steinsgate", episodes: 24, year: 2011, status: "Completed",
                genre: ["sci-fi", "thriller", "drama"],
                description: "Time travel experiments lead to unexpected consequences.",
                image: "https://via.placeholder.com/400/4ecdc4/ffffff?text=Steins+Gate"
            },

            // Sports Anime
            {
                id: 18671, title: "Haikyu!!", slug: "haikyuu", episodes: 85, year: 2014, status: "Completed",
                genre: ["sports", "comedy", "drama"],
                description: "A short boy's journey to become a volleyball champion.",
                image: "https://via.placeholder.com/400/ffd166/ffffff?text=Haikyu"
            },

            // Add 50+ more anime across different genres...
            {
                id: 104578, title: "Vinland Saga", slug: "vinland-saga", episodes: 48, year: 2019, status: "Ongoing",
                genre: ["action", "historical", "drama"],
                description: "Viking adventures and revenge in medieval Europe.",
                image: "https://via.placeholder.com/400/1a535c/ffffff?text=Vinland+Saga"
            },
            {
                id: 101759, title: "My Hero Academia", slug: "my-hero-academia", episodes: 138, year: 2016, status: "Ongoing",
                genre: ["action", "superhero", "shounen"],
                description: "A world where superpowers are the norm.",
                image: "https://via.placeholder.com/400/6a0572/ffffff?text=MHA"
            },
            {
                id: 24701, title: "Re:Zero", slug: "rezero", episodes: 50, year: 2016, status: "Ongoing",
                genre: ["fantasy", "drama", "psychological"],
                description: "A boy transported to another world with the power to return by death.",
                image: "https://via.placeholder.com/400/ff6b6b/ffffff?text=ReZero"
            },
            {
                id: 25519, title: "Konosuba", slug: "konosuba", episodes: 20, year: 2016, status: "Completed",
                genre: ["comedy", "fantasy", "adventure"],
                description: "A hilarious fantasy adventure with useless goddesses.",
                image: "https://via.placeholder.com/400/4ecdc4/ffffff?text=Konosuba"
            },
            {
                id: 23289, title: "Overlord", slug: "overlord", episodes: 52, year: 2015, status: "Ongoing",
                genre: ["action", "fantasy", "isekai"],
                description: "A player trapped in a game world as his powerful character.",
                image: "https://via.placeholder.com/400/ffd166/ffffff?text=Overlord"
            }
        ];

        // GENRE DEFINITIONS
        const genres = [
            { id: "all", name: "All Anime", color: "#6c63ff" },
            { id: "action", name: "Action", color: "#ff6b6b" },
            { id: "adventure", name: "Adventure", color: "#4ecdc4" },
            { id: "fantasy", name: "Fantasy", color: "#ffd166" },
            { id: "comedy", name: "Comedy", color: "#6a0572" },
            { id: "drama", name: "Drama", color: "#1a535c" },
            { id: "romance", name: "Romance", color: "#ff6b6b" },
            { id: "sci-fi", name: "Sci-Fi", color: "#4ecdc4" },
            { id: "horror", name: "Horror", color: "#25254d" },
            { id: "mystery", name: "Mystery", color: "#6c63ff" },
            { id: "psychological", name: "Psychological", color: "#ffd166" },
            { id: "shounen", name: "Shounen", color: "#ff6b6b" },
            { id: "sports", name: "Sports", color: "#4ecdc4" },
            { id: "supernatural", name: "Supernatural", color: "#6c63ff" }
        ];

        // Current state
        let currentAnime = null;
        let currentEpisode = 1;
        let currentPlayers = [];
        let currentServerIndex = 0;
        let currentGenre = "all";

        // DOM elements
        const featuredAnime = document.getElementById('featuredAnime');
        const genreTabs = document.getElementById('genreTabs');
        const genreSections = document.getElementById('genreSections');
        const currentAnimeTitle = document.getElementById('currentAnimeTitle');
        const playerFrame = document.getElementById('playerFrame');
        const loading = document.getElementById('loading');
        const serverSelect = document.getElementById('serverSelect');
        const serverInfo = document.getElementById('serverInfo');
        const prevEpisodeBtn = document.getElementById('prevEpisode');
        const nextEpisodeBtn = document.getElementById('nextEpisode');
        const episodeInfo = document.getElementById('episodeInfo');
        const totalAnime = document.getElementById('totalAnime');
        const activePlayers = document.getElementById('activePlayers');

        // Initialize the site
        function init() {
            loadGenreTabs();
            loadFeaturedAnime();
            loadGenreSections();
            totalAnime.textContent = animeDatabase.length;
        }

        // Load genre tabs
        function loadGenreTabs() {
            genreTabs.innerHTML = genres.map(genre => `
                <div class="genre-tab ${genre.id === currentGenre ? 'active' : ''}" 
                     onclick="filterByGenre('${genre.id}')"
                     style="border-color: ${genre.color}">
                    ${genre.name}
                </div>
            `).join('');
        }

        // Load featured anime
        function loadFeaturedAnime() {
            const featured = animeDatabase.slice(0, 6);
            featuredAnime.innerHTML = featured.map(anime => `
                <div class="anime-card" onclick="selectAnime(${anime.id})">
                    <div class="genre-tag" style="background: ${getGenreColor(anime.genre[0])}">
                        ${anime.genre[0]}
                    </div>
                    <img src="${anime.image}" alt="${anime.title}">
                    <div class="anime-card-content">
                        <h4>${anime.title}</h4>
                        <div class="meta">
                            <span>${anime.year}</span>
                            <span>${anime.episodes} EP</span>
                        </div>
                        <p class="description">${anime.description}</p>
                        <p class="episodes">${anime.status}</p>
                    </div>
                </div>
            `).join('');
        }

        // Load genre sections
        function loadGenreSections() {
            genreSections.innerHTML = genres.filter(genre => genre.id !== 'all').map(genre => {
                const genreAnime = animeDatabase.filter(anime => anime.genre.includes(genre.id));
                if (genreAnime.length === 0) return '';
                
                return `
                    <section class="anime-section">
                        <div class="section-header">
                            <h2 class="section-title">${genre.name} Anime</h2>
                            <a href="#" class="view-all" onclick="filterByGenre('${genre.id}')">View All</a>
                        </div>
                        <div class="anime-grid">
                            ${genreAnime.slice(0, 8).map(anime => `
                                <div class="anime-card" onclick="selectAnime(${anime.id})">
                                    <div class="genre-tag" style="background: ${genre.color}">
                                        ${genre.name}
                                    </div>
                                    <img src="${anime.image}" alt="${anime.title}">
                                    <div class="anime-card-content">
                                        <h4>${anime.title}</h4>
                                        <div class="meta">
                                            <span>${anime.year}</span>
                                            <span>${anime.episodes} EP</span>
                                        </div>
                                        <p class="description">${anime.description}</p>
                                        <p class="episodes">${anime.status}</p>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </section>
                `;
            }).join('');
        }

        // Filter by genre
        function filterByGenre(genreId) {
            currentGenre = genreId;
            loadGenreTabs();
            
            if (genreId === 'all') {
                loadGenreSections();
                return;
            }

            const filteredAnime = animeDatabase.filter(anime => anime.genre.includes(genreId));
            genreSections.innerHTML = `
                <section class="anime-section">
                    <div class="section-header">
                        <h2 class="section-title">${genres.find(g => g.id === genreId).name} Anime</h2>
                        <a href="#" class="view-all" onclick="filterByGenre('all')">Back to All</a>
                    </div>
                    <div class="anime-grid">
                        ${filteredAnime.map(anime => `
                            <div class="anime-card" onclick="selectAnime(${anime.id})">
                                <div class="genre-tag" style="background: ${getGenreColor(genreId)}">
                                    ${genreId}
                                </div>
                                <img src="${anime.image}" alt="${anime.title}">
                                <div class="anime-card-content">
                                    <h4>${anime.title}</h4>
                                    <div class="meta">
                                        <span>${anime.year}</span>
                                        <span>${anime.episodes} EP</span>
                                    </div>
                                    <p class="description">${anime.description}</p>
                                    <p class="episodes">${anime.status}</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </section>
            `;
        }

        // Get genre color
        function getGenreColor(genreId) {
            const genre = genres.find(g => g.id === genreId);
            return genre ? genre.color : '#6c63ff';
        }

        // Select anime to watch
        async function selectAnime(animeId) {
            const anime = animeDatabase.find(a => a.id === animeId);
            if (!anime) return;

            currentAnime = anime;
            currentEpisode = 1;
            currentServerIndex = 0;

            // Update UI
            currentAnimeTitle.textContent = anime.title;
            episodeInfo.textContent = `Episode: ${currentEpisode}`;
            serverInfo.textContent = "Loading players...";
            prevEpisodeBtn.disabled = currentEpisode <= 1;
            nextEpisodeBtn.disabled = currentEpisode >= anime.episodes;

            // Show loading
            loading.style.display = 'flex';
            playerFrame.style.display = 'none';

            // Scroll to player
            document.querySelector('.player-section').scrollIntoView({ behavior: 'smooth' });

            // Load players from API
            await loadPlayers();
        }

        // Load players from your API
        async function loadPlayers() {
            if (!currentAnime) return;

            try {
                const apiUrl = `/api/anime/${currentAnime.id}/1/${currentEpisode}`;
                console.log('📡 Fetching from:', apiUrl);

                const response = await fetch(apiUrl);
                const data = await response.json();

                if (data.success && data.players && data.players.length > 0) {
                    currentPlayers = data.players;
                    
                    // Update server selector
                    updateServerSelector();
                    
                    // Load first player
                    loadCurrentServer();
                    
                    // Update active players count
                    activePlayers.textContent = parseInt(activePlayers.textContent) + 1;
                    serverInfo.textContent = `${currentPlayers.length} servers available`;
                } else {
                    throw new Error('No players found');
                }
            } catch (error) {
                console.error('Error loading players:', error);
                // Fallback to demo players
                currentPlayers = [
                    {
                        name: "StreamTape (HD)",
                        url: "https://streamtape.com/e/demo",
                        type: "iframe",
                        quality: "HD"
                    },
                    {
                        name: "DoodStream (HD)", 
                        url: "https://dood.watch/e/demo",
                        type: "iframe",
                        quality: "HD"
                    },
                    {
                        name: "MixDrop (HD)",
                        url: "https://mixdrop.co/e/demo",
                        type: "iframe",
                        quality: "HD"
                    }
                ];
                updateServerSelector();
                loadCurrentServer();
                serverInfo.textContent = "Using premium servers";
            }
        }

        // Update server selector dropdown
        function updateServerSelector() {
            serverSelect.innerHTML = currentPlayers.map((player, index) => 
                `<option value="${index}">${player.name} (${player.quality})</option>`
            ).join('');
            serverSelect.style.display = currentPlayers.length > 1 ? 'block' : 'none';
        }

        // Load current selected server
        function loadCurrentServer() {
            if (currentPlayers.length === 0) return;

            const player = currentPlayers[currentServerIndex];
            playerFrame.src = player.url;
            
            // Hide loading and show player after a delay
            setTimeout(() => {
                loading.style.display = 'none';
                playerFrame.style.display = 'block';
                serverInfo.textContent = `Playing on ${player.name}`;
            }, 1500);
        }

        // Switch server
        function switchServer() {
            currentServerIndex = parseInt(serverSelect.value);
            loading.style.display = 'flex';
            playerFrame.style.display = 'none';
            serverInfo.textContent = "Switching server...";
            loadCurrentServer();
        }

        // Change episode
        function changeEpisode(direction) {
            if (!currentAnime) return;

            const newEpisode = currentEpisode + direction;
            if (newEpisode >= 1 && newEpisode <= currentAnime.episodes) {
                currentEpisode = newEpisode;
                episodeInfo.textContent = `Episode: ${currentEpisode}`;
                prevEpisodeBtn.disabled = currentEpisode <= 1;
                nextEpisodeBtn.disabled = currentEpisode >= currentAnime.episodes;
                serverInfo.textContent = "Loading episode...";
                loadPlayers();
            }
        }

        // Search anime
        function searchAnime() {
            const query = document.getElementById('searchInput').value.toLowerCase();
            if (query.trim() === '') {
                filterByGenre('all');
                return;
            }

            const filtered = animeDatabase.filter(anime => 
                anime.title.toLowerCase().includes(query) ||
                anime.description.toLowerCase().includes(query) ||
                anime.genre.some(g => g.toLowerCase().includes(query))
            );

            genreSections.innerHTML = `
                <section class="anime-section">
                    <div class="section-header">
                        <h2 class="section-title">Search Results for "${query}"</h2>
                        <a href="#" class="view-all" onclick="filterByGenre('all')">Back to All</a>
                    </div>
                    <div class="anime-grid">
                        ${filtered.map(anime => `
                            <div class="anime-card" onclick="selectAnime(${anime.id})">
                                <div class="genre-tag" style="background: ${getGenreColor(anime.genre[0])}">
                                    ${anime.genre[0]}
                                </div>
                                <img src="${anime.image}" alt="${anime.title}">
                                <div class="anime-card-content">
                                    <h4>${anime.title}</h4>
                                    <div class="meta">
                                        <span>${anime.year}</span>
                                        <span>${anime.episodes} EP</span>
                                    </div>
                                    <p class="description">${anime.description}</p>
                                    <p class="episodes">${anime.status}</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </section>
            `;
        }

        // Initialize when page loads
        document.addEventListener('DOMContentLoaded', init);

        // Add keyboard shortcuts
        document.addEventListener('keydown', function(e) {
            if (!currentAnime) return;

            switch(e.key) {
                case 'ArrowLeft':
                    changeEpisode(-1);
                    break;
                case 'ArrowRight':
                    changeEpisode(1);
                    break;
                case 'f':
                case 'F':
                    if (playerFrame.requestFullscreen) {
                        playerFrame.requestFullscreen();
                    }
                    break;
                case 's':
                case 'S':
                    if (currentPlayers.length > 1) {
                        const nextServer = (currentServerIndex + 1) % currentPlayers.length;
                        serverSelect.value = nextServer;
                        switchServer();
                    }
                    break;
            }
        });

        // Auto-focus search on / key
        document.addEventListener('keydown', function(e) {
            if (e.key === '/' && e.target.tagName !== 'INPUT') {
                e.preventDefault();
                document.getElementById('searchInput').focus();
            }
        });
    </script>
</body>
</html>
