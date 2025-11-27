// Movie & TV Show Streaming Web App

const API_BASE = 'http://localhost:5000/api';

// DOM Elements - Pages
const searchPage = document.getElementById('searchPage');
const detailsPage = document.getElementById('detailsPage');
const playerPage = document.getElementById('playerPage');

// DOM Elements - Search
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const searchStatus = document.getElementById('searchStatus');
const resultsContainer = document.getElementById('resultsContainer');
const loadingSpinner = document.getElementById('loadingSpinner');
const searchSuggestions = document.getElementById('searchSuggestions');
const homeSections = document.getElementById('homeSections');

// DOM Elements - Details
const detailsPoster = document.getElementById('detailsPoster');
const detailsTitle = document.getElementById('detailsTitle');
const detailsYear = document.getElementById('detailsYear');
const detailsRating = document.getElementById('detailsRating');
const detailsDuration = document.getElementById('detailsDuration');
const detailsGenre = document.getElementById('detailsGenre');
const detailsCountry = document.getElementById('detailsCountry');
const detailsDescription = document.getElementById('detailsDescription');

// DOM Elements - Player
const videoPlayer = document.getElementById('videoPlayer');
const playerTitle = document.getElementById('playerTitle');
const videoQualityDisplay = document.getElementById('videoQualityDisplay');
const videoDurationDisplay = document.getElementById('videoDurationDisplay');
const qualitySelect = document.getElementById('qualitySelect');
const subtitleSelect = document.getElementById('subtitleSelect');

// State
let currentMovie = null;
let availableStreams = [];
let availableSubtitles = [];
let isTVShow = false;
let tvShowSeasons = [];
let selectedSeason = 1;
let selectedEpisode = 1;

// Event Listeners
searchBtn.addEventListener('click', handleSearch);
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
});

// Logo click to reset home
document.querySelector('.logo').addEventListener('click', (e) => {
    e.preventDefault();
    searchInput.value = '';
    resultsContainer.innerHTML = '';
    searchStatus.textContent = '';
    homeSections.classList.remove('hidden');
    showSearchPage();
});

// Quality change event
qualitySelect.addEventListener('change', (e) => {
    const streamIndex = parseInt(e.target.value);
    if (!isNaN(streamIndex) && availableStreams[streamIndex]) {
        changeVideoQuality(availableStreams[streamIndex]);
    }
});

// Subtitle change event
subtitleSelect.addEventListener('change', (e) => {
    loadSubtitleTrack(e.target.value);
});

// Page Navigation
function showSearchPage() {
    searchPage.classList.remove('hidden');
    detailsPage.classList.add('hidden');
    playerPage.classList.add('hidden');
}

function showDetailsPage() {
    searchPage.classList.add('hidden');
    detailsPage.classList.remove('hidden');
    playerPage.classList.add('hidden');
}

function showPlayer() {
    // For movies, we need streams. For TV shows, we fetch them after clicking play.
    if (!currentMovie) return;
    
    if (!isTVShow && availableStreams.length === 0) {
        alert('Please wait for streams to load');
        return;
    }
    
    searchPage.classList.add('hidden');
    detailsPage.classList.add('hidden');
    playerPage.classList.remove('hidden');
    
    // Play with selected season/episode for TV shows, or first stream for movies
    if (isTVShow) {
        playTVEpisode(selectedSeason, selectedEpisode);
    } else {
        playMovieWithStream(availableStreams[0]);
    }
}

// Search for movies
async function handleSearch() {
    const query = searchInput.value.trim();
    
    if (!query) {
        searchStatus.textContent = 'Please enter a movie name';
        searchStatus.style.color = 'var(--error)';
        return;
    }
    
    showLoading(true);
    searchStatus.textContent = `Searching for "${query}"...`;
    searchStatus.style.color = 'var(--text-muted)';
    resultsContainer.innerHTML = '';
    homeSections.classList.add('hidden');
    
    try {
        const response = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        showLoading(false);
        
        if (data.results && data.results.length > 0) {
            searchStatus.textContent = `Found ${data.results.length} results for "${query}"`;
            searchStatus.style.color = 'var(--success)';
            displayMovies(data.results);
        } else {
            searchStatus.textContent = `No results found for "${query}". Try another search.`;
            searchStatus.style.color = 'var(--error)';
            displayPlaceholder();
        }
    } catch (error) {
        showLoading(false);
        console.error('Search error:', error);
        searchStatus.textContent = 'Error searching movies. Please try again.';
        searchStatus.style.color = 'var(--error)';
    }
}

// Home Page Configuration
const HOME_CONFIG = [
    { title: 'Trending Now', type: 'trending' },
    { title: 'Western TV', type: 'collection', id: '2337210270994629192' },
    { title: 'K-Drama', type: 'collection', id: '2462114791909901808' },
    { title: 'Turkish Drama', type: 'collection', id: '7481476133956322608' },
    { title: 'Arabic Drama', type: 'collection', id: '5490279765967865272' },
    { title: 'Arabic Movies', type: 'collection', id: '1581736020528300216' },
    { title: 'Top 100', type: 'collection', id: '5715714650961068312' }
];

async function loadHomeSections() {
    console.log('Loading home sections...');
    homeSections.innerHTML = '';
    homeSections.classList.remove('hidden');
    
    for (const section of HOME_CONFIG) {
        console.log(`Loading section: ${section.title}`);
        await loadSection(section);
    }
}

async function loadSection(section) {
    try {
        let url;
        if (section.type === 'trending') {
            url = `${API_BASE}/home/trending`;
        } else {
            url = `${API_BASE}/home/collection/${section.id}`;
        }
        
        console.log(`Fetching ${url}`);
        const response = await fetch(url);
        const data = await response.json();
        console.log(`Data for ${section.title}:`, data);
        
        if (data.subjectList && data.subjectList.length > 0) {
            renderSection(section.title, data.subjectList);
        } else {
            console.log(`No items found for ${section.title}`);
        }
    } catch (error) {
        console.error(`Error loading section ${section.title}:`, error);
    }
}

function renderSection(title, items) {
    const sectionDiv = document.createElement('div');
    sectionDiv.className = 'home-section';
    
    const titleEl = document.createElement('h2');
    titleEl.className = 'section-title';
    titleEl.textContent = title;
    sectionDiv.appendChild(titleEl);
    
    const listDiv = document.createElement('div');
    listDiv.className = 'horizontal-list';
    
    items.forEach(movie => {
        const card = createMovieCard(movie);
        listDiv.appendChild(card);
    });
    
    sectionDiv.appendChild(listDiv);
    homeSections.appendChild(sectionDiv);
}

function createMovieCard(movie) {
    const card = document.createElement('div');
    card.className = 'movie-card';
    
    const placeholderImage = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="450"%3E%3Crect width="300" height="450" fill="%231a1a2e"/%3E%3C/svg%3E';
    
    // Handle different image structures
    let imageUrl = '';
    if (movie.cover && movie.cover.url) imageUrl = movie.cover.url;
    else if (movie.image) imageUrl = movie.image;
    
    const posterUrl = imageUrl && imageUrl.includes('http') ? imageUrl : placeholderImage;
    
    // Check for dubbed content in title
    let dubbedBadge = '';
    const dubbedMatch = movie.title.match(/\[(.*?)\]/);
    if (dubbedMatch) {
        dubbedBadge = `<div class="dubbed-badge">Dubbed to ${dubbedMatch[1]}</div>`;
    }
    
    // Map data for loadMovieDetails
    // The home page API returns 'detailPath' instead of 'slug'
    // It also returns 'cover' object instead of 'image' string
    const movieData = {
        ...movie,
        slug: movie.slug || movie.detailPath, // Map detailPath to slug
        image: imageUrl, // Ensure image is a string URL
        subjectType: movie.subjectType // Ensure subjectType is preserved
    };
    
    card.innerHTML = `
        <div class="poster-wrapper">
            <img src="${posterUrl}" alt="${movie.title}" class="movie-poster" onerror="this.src='${placeholderImage}'">
            ${dubbedBadge}
        </div>
        <div class="movie-info">
            <h3 class="movie-title">${movie.title}</h3>
            <p class="movie-slug">${movie.genre || movie.year || ''}</p>
        </div>
    `;
    
    card.addEventListener('click', () => loadMovieDetails(movieData));
    return card;
}

// Display movie cards (Search Results)
function displayMovies(movies) {
    resultsContainer.innerHTML = '';
    
    movies.forEach((movie, index) => {
        const card = createMovieCard(movie);
        card.style.animationDelay = `${index * 0.1}s`;
        resultsContainer.appendChild(card);
    });
}

function displayPlaceholder() {
    resultsContainer.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-muted);">
            <h3>No movies found</h3>
            <p>Try searching for a different title</p>
        </div>
    `;
}

// Load movie/TV show details
async function loadMovieDetails(movie) {
    currentMovie = movie;
    showDetailsPage();
    
    // Detect if TV show (subjectType === 2) or movie (subjectType === 1)
    isTVShow = movie.subjectType === 2 || movie.subjectType === '2';
    
    console.log(`Loading ${isTVShow ? 'TV Show' : 'Movie'}: ${movie.title}`);
    
    // Set basic info
    detailsPoster.src = movie.image || '';
    detailsTitle.textContent = movie.title;
    detailsYear.textContent = movie.year || 'N/A';
    detailsRating.textContent = movie.rating || 'N/A';
    detailsGenre.textContent = movie.genre || 'N/A';
    detailsCountry.textContent = movie.country || 'Unknown';
    detailsDescription.textContent = movie.description || 'No description available.';
    
    // Set backdrop
    const backdrop = document.getElementById('detailsBackdrop');
    if (movie.stills && movie.stills.url) {
        backdrop.style.backgroundImage = `url('${movie.stills.url}')`;
    } else if (movie.image) {
        backdrop.style.backgroundImage = `url('${movie.image}')`;
    }
    
    // Set rating count
    const ratingCountElem = document.getElementById('detailsRatingCount');
    if (movie.imdbRatingCount) {
        ratingCountElem.textContent = `${(movie.imdbRatingCount / 1000).toFixed(1)}K votes`;
        ratingCountElem.style.display = 'inline-block';
    } else {
        ratingCountElem.style.display = 'none';
    }
    
    // Set post title
    const postTitleElem = document.getElementById('detailsPostTitle');
    if (movie.postTitle) {
        postTitleElem.textContent = movie.postTitle;
        postTitleElem.style.display = 'block';
    } else {
        postTitleElem.style.display = 'none';
    }
    
    // Show loading
    document.getElementById('detailsLoadingIndicator').classList.remove('hidden');
    
    try {
        // Get subject ID
        let subjectId = movie.subjectId;
        if (!subjectId) {
            const idResponse = await fetch(`${API_BASE}/get-subject-id/${movie.slug}`);
            if (!idResponse.ok) throw new Error('Failed to get subject ID');
            const idData = await idResponse.json();
            subjectId = idData.subjectId;
            currentMovie.subjectId = subjectId;
        }
        
        if (isTVShow) {
            // Load TV show specific data
            await loadTVShowDetails(subjectId, movie.slug);
        } else {
            // Load movie data
            await loadMovieStreams(subjectId, movie.slug);
        }
        
        // Hide loading
        document.getElementById('detailsLoadingIndicator').classList.add('hidden');
        
        // Fetch recommended content
        loadRecommendedMovies(subjectId);
        
    } catch (error) {
        console.error('Error loading details:', error);
        document.getElementById('detailsLoadingIndicator').classList.add('hidden');
        alert(`Failed to load details: ${error.message}`);
    }
}

// Load TV show details (seasons, episodes, cast)
async function loadTVShowDetails(subjectId, slug) {
    const response = await fetch(`${API_BASE}/tv-details/${subjectId}/${slug}`);
    if (!response.ok) throw new Error('Failed to load TV show details');
    
    const tvData = await response.json();
    
    // Store seasons
    tvShowSeasons = tvData.seasons || [];
    
    // Update play button text
    document.getElementById('playBtnText').textContent = 'Play Episode';
    
    // Hide movie controls, show TV controls
    document.getElementById('tvShowControls').classList.remove('hidden');
    
    // Display cast if available
    if (tvData.cast && tvData.cast.length > 0) {
        displayCast(tvData.cast);
    }
    
    // Setup season selector
    const seasonSelect = document.getElementById('seasonSelect');
    seasonSelect.innerHTML = '';
    tvShowSeasons.forEach(season => {
        const option = document.createElement('option');
        option.value = season.se;
        option.textContent = `Season ${season.se} (${season.maxEp} episodes)`;
        seasonSelect.appendChild(option);
    });
    
    // Set first season as default
    if (tvShowSeasons.length > 0) {
        selectedSeason = tvShowSeasons[0].se;
        displayEpisodes(tvShowSeasons[0]);
    }
    
    // Season change listener
    seasonSelect.addEventListener('change', (e) => {
        selectedSeason = parseInt(e.target.value);
        const season = tvShowSeasons.find(s => s.se === selectedSeason);
        if (season) {
            displayEpisodes(season);
        }
    });
    
    console.log(`Loaded ${tvShowSeasons.length} seasons`);
}

// Display episodes for selected season
function displayEpisodes(season) {
    const episodesGrid = document.getElementById('episodesGrid');
    episodesGrid.innerHTML = '';
    
    for (let ep = 1; ep <= season.maxEp; ep++) {
        const btn = document.createElement('button');
        btn.className = 'episode-btn';
        btn.textContent = `E${ep}`;
        btn.onclick = () => selectEpisode(ep);
        
        if (ep === 1) {
            btn.classList.add('selected');
            selectedEpisode = 1;
        }
        
        episodesGrid.appendChild(btn);
    }
}

// Select episode
function selectEpisode(ep) {
    selectedEpisode = ep;
    
    // Update button states
    document.querySelectorAll('.episode-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    event.target.classList.add('selected');
    
    console.log(`Selected S${selectedSeason}E${selectedEpisode}`);
}

// Display cast members
function displayCast(cast) {
    const castSection = document.getElementById('castSection');
    const castGrid = document.getElementById('castGrid');
    
    castSection.classList.remove('hidden');
    castGrid.innerHTML = '';
    
    cast.forEach(member => {
        const card = document.createElement('div');
        card.className = 'cast-card';
        
        const avatar = member.avatar || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="150" height="200"%3E%3Crect width="150" height="200" fill="%231a1a2e"/%3E%3C/svg%3E';
        
        card.innerHTML = `
            <img src="${avatar}" class="cast-avatar" alt="${member.name}">
            <div class="cast-name">${member.name}</div>
            <div class="cast-character">${member.character || ''}</div>
        `;
        
        castGrid.appendChild(card);
    });
}

// Load movie streams
async function loadMovieStreams(subjectId, slug) {
    const streamResponse = await fetch(`${API_BASE}/stream/${slug}/${subjectId}`);
    if (!streamResponse.ok) throw new Error('No streams available');
    
    const streamData = await streamResponse.json();
    availableStreams = streamData.streams || [];
    
    // Display duration
    if (availableStreams.length > 0) {
        const duration = availableStreams[0].duration_seconds;
        const minutes = Math.floor(duration / 60);
        detailsDuration.textContent = `${minutes} min`;
    }
    
    // Hide TV show controls
    document.getElementById('tvShowControls').classList.add('hidden');
    document.getElementById('castSection').classList.add('hidden');
    document.getElementById('playBtnText').textContent = 'Play Movie';
    
    console.log(`Loaded ${availableStreams.length} quality options`);
}

// Play TV episode
async function playTVEpisode(season, episode) {
    showLoading(true);
    
    try {
        console.log(`Playing S${season}E${episode}`);
        
        // Fetch streams for this episode
        const response = await fetch(`${API_BASE}/stream/${currentMovie.slug}/${currentMovie.subjectId}?se=${season}&ep=${episode}`);
        if (!response.ok) throw new Error('Episode not available');
        
        const data = await response.json();
        availableStreams = data.streams || [];
        
        if (availableStreams.length === 0) {
            throw new Error('No streams for this episode');
        }
        
        // Update player title
        playerTitle.textContent = `${currentMovie.title} - S${season}E${episode}`;
        
        // Play first (highest) quality
        playMovieWithStream(availableStreams[0]);
        
        showLoading(false);
        
    } catch (error) {
        showLoading(false);
        console.error('Play error:', error);
        alert(`Failed to play episode: ${error.message}`);
    }
}

// Load recommended movies
async function loadRecommendedMovies(subjectId) {
    try {
        const response = await fetch(`${API_BASE}/movie-details/${subjectId}`);
        if (!response.ok) {
            console.log('No recommendations available');
            return;
        }
        
        const data = await response.json();
        const recommendations = data.recommendations || [];
        
        console.log(`Found ${recommendations.length} recommended movies`);
        
        // Display recommendations
        const grid = document.getElementById('recommendedGrid');
        grid.innerHTML = '';
        
        recommendations.forEach(rec => {
            const card = document.createElement('div');
            card.className = 'recommended-card';
            
            const placeholderImage = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="180" height="270"%3E%3Crect width="180" height="270" fill="%231a1a2e"/%3E%3C/svg%3E';
            const posterUrl = rec.image && rec.image.includes('http') ? rec.image : placeholderImage;
            
            card.innerHTML = `
                <img src="${posterUrl}" alt="${rec.title}" class="recommended-poster" onerror="this.src='${placeholderImage}'">
                <div class="recommended-info">
                    <h4>${rec.title}</h4>
                    <div class="recommended-meta">${rec.year || ''} ${rec.rating ? '⭐ ' + rec.rating : ''}</div>
                </div>
            `;
            
            const fullRecMovie = {
                ...rec,
                country: '',
                description: '',
                stills: null,
                imdbRatingCount: null,
                postTitle: null
            };
            
            card.addEventListener('click', () => loadMovieDetails(fullRecMovie));
            
            grid.appendChild(card);
        });
        
    } catch (error) {
        console.error('Error loading recommendations:', error);
    }
}

// Play movie with specific stream
function playMovieWithStream(stream) {
    console.log('Playing with quality:', stream.quality);
    
    // Update player title
    if (!isTVShow) {
        playerTitle.textContent = currentMovie.title;
    }
    
    // Update quality display
    videoQualityDisplay.textContent = `Quality: ${stream.quality}`;
    const minutes = Math.floor(stream.duration_seconds / 60);
    videoDurationDisplay.textContent = `Duration: ${minutes} min`;
    
    // Setup quality dropdown
    setupQualityDropdown(stream);
    
    // Try direct URL first, fallback to proxy if CORS fails
    const directUrl = stream.url;
    const proxyUrl = `/api/proxy-stream?url=${encodeURIComponent(stream.url)}`;
    
    videoPlayer.crossOrigin = "anonymous";
    videoPlayer.src = directUrl;
    
    videoPlayer.onerror = () => {
        console.log('Direct playback failed, switching to proxy...');
        videoPlayer.src = proxyUrl;
        videoPlayer.load();
    };
    
    videoPlayer.load();
    videoPlayer.play();
    
    // Load subtitles
    if (stream.id && currentMovie.subjectId) {
        loadSubtitles(currentMovie.slug, currentMovie.subjectId, stream.id);
    } else {
        subtitleSelect.innerHTML = '<option value="">No subtitles</option>';
    }
}

// Setup quality dropdown
function setupQualityDropdown(currentStream) {
    qualitySelect.innerHTML = '';
    
    availableStreams.forEach((stream, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = `${stream.quality} (${(stream.size_bytes / 1024 / 1024).toFixed(0)}MB)`;
        
        if (stream.id === currentStream.id) {
            option.selected = true;
        }
        
        qualitySelect.appendChild(option);
    });
}

// Change video quality
function changeVideoQuality(stream) {
    const currentTime = videoPlayer.currentTime;
    playMovieWithStream(stream);
    
    // Resume from where we were
    videoPlayer.addEventListener('loadedmetadata', () => {
        videoPlayer.currentTime = currentTime;
        videoPlayer.play();
    }, { once: true });
}

// Load subtitles
async function loadSubtitles(slug, subjectId, streamId) {
    try {
        console.log('Fetching subtitles...');
        const response = await fetch(`${API_BASE}/captions/${slug}/${subjectId}/${streamId}`);
        
        if (!response.ok) {
            console.log('No subtitles available');
            subtitleSelect.innerHTML = '<option value="">No subtitles</option>';
            return;
        }
        
        const data = await response.json();
        availableSubtitles = data.captions || [];
        
        console.log(`Found ${availableSubtitles.length} subtitle tracks`);
        setupSubtitleDropdown();
        
    } catch (error) {
        console.error('Subtitle fetch error:', error);
        subtitleSelect.innerHTML = '<option value="">No subtitles</option>';
    }
}

// Setup subtitle dropdown
function setupSubtitleDropdown() {
    subtitleSelect.innerHTML = '<option value="">Off</option>';
    
    if (availableSubtitles.length === 0) {
        subtitleSelect.innerHTML = '<option value="">No subtitles available</option>';
        return;
    }
    
    availableSubtitles.forEach(subtitle => {
        const option = document.createElement('option');
        option.value = subtitle.url;
        option.textContent = subtitle.languageName;
        option.dataset.language = subtitle.language;
        subtitleSelect.appendChild(option);
    });
    
    // Auto-select English if available
    const englishOption = Array.from(subtitleSelect.options).find(opt => 
        opt.dataset.language === 'en'
    );
    if (englishOption) {
        subtitleSelect.value = englishOption.value;
        loadSubtitleTrack(englishOption.value);
    }
}

// Load subtitle track
async function loadSubtitleTrack(url) {
    // Remove existing tracks
    const tracks = videoPlayer.querySelectorAll('track');
    tracks.forEach(track => track.remove());
    
    if (!url) {
        console.log('Subtitles turned off');
        return;
    }
    
    try {
        console.log('Loading subtitle:', url);
        
        const response = await fetch(url);
        const srtText = await response.text();
        const vttText = convertSRTtoVTT(srtText);
        
        const blob = new Blob([vttText], { type: 'text/vtt' });
        const blobUrl = URL.createObjectURL(blob);
        
        const track = document.createElement('track');
        track.kind = 'subtitles';
        track.label = 'Subtitles';
        track.srclang = 'en';
        track.src = blobUrl;
        track.default = true;
        
        videoPlayer.appendChild(track);
        track.track.mode = 'showing';
        
        console.log('Subtitle loaded successfully');
        
    } catch (error) {
        console.error('Failed to load subtitle:', error);
    }
}

// Convert SRT to VTT
function convertSRTtoVTT(srt) {
    let vtt = 'WEBVTT\n\n';
    vtt += srt.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2');
    vtt = vtt.replace(/<[^>]+>/g, '');
    return vtt;
}

// Show/hide loading spinner
function showLoading(show) {
    if (show) {
        loadingSpinner.classList.remove('hidden');
    } else {
        loadingSpinner.classList.add('hidden');
    }
}

// Initialize
// Initialize
window.addEventListener('load', () => {
    console.log('MovieStream app loaded!');
    console.log('Search for your favorite movies and TV shows...');
    loadHomeSections();
});

// Search Suggestions Logic
let debounceTimer;

searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    const query = e.target.value.trim();
    
    if (query.length < 2) {
        searchSuggestions.classList.add('hidden');
        return;
    }
    
    debounceTimer = setTimeout(() => {
        fetchSuggestions(query);
    }, 300);
});

// Hide suggestions when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-container')) {
        searchSuggestions.classList.add('hidden');
    }
});

async function fetchSuggestions(query) {
    try {
        const response = await fetch(`${API_BASE}/search-suggest`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ keyword: query })
        });
        
        if (!response.ok) return;
        
        const data = await response.json();
        displaySuggestions(data.suggestions || []);
    } catch (error) {
        console.error('Error fetching suggestions:', error);
    }
}

function displaySuggestions(suggestions) {
    if (suggestions.length === 0) {
        searchSuggestions.classList.add('hidden');
        return;
    }
    
    searchSuggestions.innerHTML = '';
    suggestions.forEach(suggestion => {
        const div = document.createElement('div');
        div.className = 'suggestion-item';
        div.textContent = suggestion;
        div.addEventListener('click', () => {
            searchInput.value = suggestion;
            searchSuggestions.classList.add('hidden');
            handleSearch();
        });
        searchSuggestions.appendChild(div);
    });
    
    searchSuggestions.classList.remove('hidden');
}

// ==================== TV SHOWS BROWSER ====================

let currentPage = 1;
let currentFilters = {
    genre: '',
    year: '',
    country: '',
    sort: 'Latest',
    classify: '',
    rating: '0'
};

function showTVShowsBrowser() {
    searchPage.classList.add('hidden');
    detailsPage.classList.add('hidden');
    playerPage.classList.add('hidden');
    tvShowsPage.classList.remove('hidden');
    
    // Reset to page 1
    currentPage = 1;
    loadTVShows();
}

async function loadTVShows() {
    try {
        showLoading(true);
        
        // Build query params
        const params = new URLSearchParams({
            page: currentPage,
            perPage: 18
        });
        
        if (currentFilters.genre) params.append('genre', currentFilters.genre);
        if (currentFilters.year) params.append('year', currentFilters.year);
        if (currentFilters.country) params.append('country', currentFilters.country);
        if (currentFilters.sort) params.append('sort', currentFilters.sort);
        if (currentFilters.classify) params.append('classify', currentFilters.classify);
        if (currentFilters.rating && currentFilters.rating !== '0') params.append('rating', currentFilters.rating);
        
        const response = await fetch(`${API_BASE}/tv-shows/browse?${params}`);
        const data = await response.json();
        
        showLoading(false);
        
        if (data.items && data.items.length > 0) {
            renderTVShowsGrid(data.items);
            updatePagination(data.pager);
        } else {
            tvShowsGrid.innerHTML = '<p class="no-results">No TV shows found</p>';
        }
    } catch (error) {
        showLoading(false);
        console.error('Error loading TV shows:', error);
        tvShowsGrid.innerHTML = '<p class="error-message">Error loading TV shows</p>';
    }
}

function renderTVShowsGrid(items) {
    tvShowsGrid.innerHTML = '';
    
    items.forEach(show => {
        const movieData = {
            ...show,
            slug: show.slug || show.detailPath,
            image: show.cover?.url || show.image,
            subjectType: show.subjectType
        };
        
        const card = createMovieCard(movieData);
        tvShowsGrid.appendChild(card);
    });
}

function updatePagination(pager) {
    const pageInfo = document.getElementById('pageInfo');
    const prevPageBtn = document.getElementById('prevPageBtn');
    const nextPageBtn = document.getElementById('nextPageBtn');
    
    pageInfo.textContent = `Page ${pager.page}`;
    
    // Disable/enable prev button
    prevPageBtn.disabled = currentPage === 1;
    
    // Disable/enable next button
    nextPageBtn.disabled = !pager.hasMore;
}

// Event listeners for TV Shows page
const tvShowsPage = document.getElementById('tvShowsPage');
const tvShowsGrid = document.getElementById('tvShowsGrid');
const genreFilter = document.getElementById('genreFilter');
const yearFilter = document.getElementById('yearFilter');
const countryFilter = document.getElementById('countryFilter');
const ratingFilter = document.getElementById('ratingFilter');
const ratingValue = document.getElementById('ratingValue');
const applyFilterBtn = document.getElementById('applyFilterBtn');
const resetFilterBtn = document.getElementById('resetFilterBtn');
const prevPageBtn = document.getElementById('prevPageBtn');
const nextPageBtn = document.getElementById('nextPageBtn');

// Sort buttons
document.querySelectorAll('.filter-btn[data-sort]').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn[data-sort]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilters.sort = btn.dataset.sort;
    });
});

// Language buttons
document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilters.classify = btn.dataset.lang;
    });
});

// Rating slider
if (ratingFilter) {
    ratingFilter.addEventListener('input', (e) => {
        ratingValue.textContent = e.target.value;
        currentFilters.rating = e.target.value;
    });
}

// Apply filters
if (applyFilterBtn) {
    applyFilterBtn.addEventListener('click', () => {
        currentFilters.genre = genreFilter.value;
        currentFilters.year = yearFilter.value;
        currentFilters.country = countryFilter.value;
        currentPage = 1;
        loadTVShows();
    });
}

// Reset filters
if (resetFilterBtn) {
    resetFilterBtn.addEventListener('click', () => {
        currentFilters = {
            genre: '',
            year: '',
            country: '',
            sort: 'Latest',
            classify: '',
            rating: '0'
        };
        genreFilter.value = '';
        yearFilter.value = '';
        countryFilter.value = '';
        ratingFilter.value = '0';
        ratingValue.textContent = '0';
        
        document.querySelectorAll('.filter-btn[data-sort]').forEach(b => b.classList.remove('active'));
        document.querySelector('.filter-btn[data-sort="Latest"]').classList.add('active');
        
        document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
        document.querySelector('.lang-btn[data-lang=""]').classList.add('active');
        
        currentPage = 1;
        loadTVShows();
    });
}

if (prevPageBtn) {
    prevPageBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            loadTVShows();
        }
    });
}

if (nextPageBtn) {
    nextPageBtn.addEventListener('click', () => {
        currentPage++;
        loadTVShows();
    });
}


// ==================== MOVIES BROWSER ====================

let moviesPage = 1;
let moviesFilters = {
    genre: '',
    year: '',
    country: '',
    sort: 'Latest',
    classify: '',
    rating: '0'
};

function showMoviesBrowser() {
    searchPage.classList.add('hidden');
    detailsPage.classList.add('hidden');
    playerPage.classList.add('hidden');
    tvShowsPage.classList.add('hidden');
    document.getElementById('animationPage').classList.add('hidden');
    document.getElementById('moviesPage').classList.remove('hidden');
    
    moviesPage = 1;
    loadMovies();
}

async function loadMovies() {
    try {
        showLoading(true);
        
        const params = new URLSearchParams({
            page: moviesPage,
            perPage: 18
        });
        
        if (moviesFilters.genre) params.append('genre', moviesFilters.genre);
        if (moviesFilters.year) params.append('year', moviesFilters.year);
        if (moviesFilters.country) params.append('country', moviesFilters.country);
        if (moviesFilters.sort) params.append('sort', moviesFilters.sort);
        if (moviesFilters.classify) params.append('classify', moviesFilters.classify);
        if (moviesFilters.rating && moviesFilters.rating !== '0') params.append('rating', moviesFilters.rating);
        
        const response = await fetch(`${API_BASE}/movies/browse?${params}`);
        const data = await response.json();
        
        showLoading(false);
        
        if (data.items && data.items.length > 0) {
            const moviesGrid = document.getElementById('moviesGrid');
            moviesGrid.innerHTML = '';
            
            data.items.forEach(movie => {
                const movieData = {
                    ...movie,
                    slug: movie.slug || movie.detailPath,
                    image: movie.cover?.url || movie.image,
                    subjectType: movie.subjectType
                };
                
                const card = createMovieCard(movieData);
                moviesGrid.appendChild(card);
            });
            
            updateMoviesPagination(data.pager);
        } else {
            document.getElementById('moviesGrid').innerHTML = '<p class="no-results">No movies found</p>';
        }
    } catch (error) {
        showLoading(false);
        console.error('Error loading movies:', error);
        document.getElementById('moviesGrid').innerHTML = '<p class="error-message">Error loading movies</p>';
    }
}

function updateMoviesPagination(pager) {
    const pageInfo = document.getElementById('moviesPageInfo');
    const prevBtn = document.getElementById('moviesPrevBtn');
    const nextBtn = document.getElementById('moviesNextBtn');
    
    pageInfo.textContent = `Page ${pager.page}`;
    prevBtn.disabled = moviesPage === 1;
    nextBtn.disabled = !pager.hasMore;
}

// Movies event listeners
document.querySelectorAll('.movies-sort-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.movies-sort-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        moviesFilters.sort = btn.dataset.sort;
    });
});

document.querySelectorAll('.movies-lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.movies-lang-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        moviesFilters.classify = btn.dataset.lang;
    });
});

const moviesRatingFilter = document.getElementById('moviesRatingFilter');
const moviesRatingValue = document.getElementById('moviesRatingValue');
if (moviesRatingFilter) {
    moviesRatingFilter.addEventListener('input', (e) => {
        moviesRatingValue.textContent = e.target.value;
        moviesFilters.rating = e.target.value;
    });
}

const moviesApplyBtn = document.getElementById('moviesApplyBtn');
if (moviesApplyBtn) {
    moviesApplyBtn.addEventListener('click', () => {
        moviesFilters.genre = document.getElementById('moviesGenreFilter').value;
        moviesFilters.year = document.getElementById('moviesYearFilter').value;
        moviesFilters.country = document.getElementById('moviesCountryFilter').value;
        moviesPage = 1;
        loadMovies();
    });
}

const moviesResetBtn = document.getElementById('moviesResetBtn');
if (moviesResetBtn) {
    moviesResetBtn.addEventListener('click', () => {
        moviesFilters = { genre: '', year: '', country: '', sort: 'Latest', classify: '', rating: '0' };
        document.getElementById('moviesGenreFilter').value = '';
        document.getElementById('moviesYearFilter').value = '';
        document.getElementById('moviesCountryFilter').value = '';
        moviesRatingFilter.value = '0';
        moviesRatingValue.textContent = '0';
        
        document.querySelectorAll('.movies-sort-btn').forEach(b => b.classList.remove('active'));
        document.querySelector('.movies-sort-btn[data-sort="Latest"]').classList.add('active');
        
        document.querySelectorAll('.movies-lang-btn').forEach(b => b.classList.remove('active'));
        document.querySelector('.movies-lang-btn[data-lang=""]').classList.add('active');
        
        moviesPage = 1;
        loadMovies();
    });
}

document.getElementById('moviesPrevBtn')?.addEventListener('click', () => {
    if (moviesPage > 1) {
        moviesPage--;
        loadMovies();
    }
});

document.getElementById('moviesNextBtn')?.addEventListener('click', () => {
    moviesPage++;
    loadMovies();
});

// ==================== ANIMATION BROWSER ====================

let animationPage = 1;
let animationFilters = {
    year: '',
    country: ''
};

function showAnimationBrowser() {
    searchPage.classList.add('hidden');
    detailsPage.classList.add('hidden');
    playerPage.classList.add('hidden');
    tvShowsPage.classList.add('hidden');
    document.getElementById('moviesPage').classList.add('hidden');
    document.getElementById('animationPage').classList.remove('hidden');
    
    animationPage = 1;
    loadAnimation();
}

async function loadAnimation() {
    try {
        showLoading(true);
        
        const params = new URLSearchParams({
            page: animationPage,
            perPage: 18
        });
        
        if (animationFilters.year) params.append('year', animationFilters.year);
        if (animationFilters.country) params.append('country', animationFilters.country);
        
        const response = await fetch(`${API_BASE}/animation/browse?${params}`);
        const data = await response.json();
        
        showLoading(false);
        
        if (data.items && data.items.length > 0) {
            const animationGrid = document.getElementById('animationGrid');
            animationGrid.innerHTML = '';
            
            data.items.forEach(item => {
                const itemData = {
                    ...item,
                    slug: item.slug ||  item.detailPath,
                    image: item.cover?.url || item.image,
                    subjectType: item.subjectType
                };
                
                const card = createMovieCard(itemData);
                animationGrid.appendChild(card);
            });
            
            updateAnimationPagination(data.pager);
        } else {
            document.getElementById('animationGrid').innerHTML = '<p class="no-results">No animation found</p>';
        }
    } catch (error) {
        showLoading(false);
        console.error('Error loading animation:', error);
        document.getElementById('animationGrid').innerHTML = '<p class="error-message">Error loading animation</p>';
    }
}

function updateAnimationPagination(pager) {
    const pageInfo = document.getElementById('animationPageInfo');
    const prevBtn = document.getElementById('animationPrevBtn');
    const nextBtn = document.getElementById('animationNextBtn');
    
    pageInfo.textContent = `Page ${pager.page}`;
    prevBtn.disabled = animationPage === 1;
    nextBtn.disabled = !pager.hasMore;
}

// Animation event listeners
const animationApplyBtn = document.getElementById('animationApplyBtn');
if (animationApplyBtn) {
    animationApplyBtn.addEventListener('click', () => {
        animationFilters.year = document.getElementById('animationYearFilter').value;
        animationFilters.country = document.getElementById('animationCountryFilter').value;
        animationPage = 1;
        loadAnimation();
    });
}

const animationResetBtn = document.getElementById('animationResetBtn');
if (animationResetBtn) {
    animationResetBtn.addEventListener('click', () => {
        animationFilters = { year: '', country: '' };
        document.getElementById('animationYearFilter').value = '';
        document.getElementById('animationCountryFilter').value = '';
        animationPage = 1;
        loadAnimation();
    });
}

document.getElementById('animationPrevBtn')?.addEventListener('click', () => {
    if (animationPage > 1) {
        animationPage--;
        loadAnimation();
    }
});

document.getElementById('animationNextBtn')?.addEventListener('click', () => {
    animationPage++;
    loadAnimation();
});
