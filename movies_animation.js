

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
    animationPage.classList.add('hidden');
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
