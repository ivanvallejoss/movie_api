const API_BASE_URL = API_CONFIG.BASE_URL;
const API_MOVIES_URL = `${API_BASE_URL}/movies`;

// Estado global de la aplicación
let currentPage = 1;
let perPage = 12;  // Películas por página
let totalPages = 1;
let currentFilters = {
    search: '',
    genre: '',
    year: ''
};
let editingMovieId = null;

// Elementos del DOM - Formulario
const movieForm = document.getElementById('movie-form');
const formTitle = document.getElementById('form-title');
const submitText = document.getElementById('submit-text');
const cancelBtn = document.getElementById('cancel-btn');

// Elementos del DOM - Películas
const moviesGrid = document.getElementById('movies-grid');
const loadingElement = document.getElementById('loading');
const movieCount = document.getElementById('movie-count');

// Elementos del DOM - Filtros
const searchInput = document.getElementById('search-input');
const genreFilter = document.getElementById('genre-filter');
const yearFilter = document.getElementById('year-filter');
const clearFiltersBtn = document.getElementById('clear-filters-btn');
const resultsInfo = document.getElementById('results-info');

// Elementos del DOM - Paginación
const paginationContainer = document.getElementById('pagination-container');
const prevPageBtn = document.getElementById('prev-page-btn');
const nextPageBtn = document.getElementById('next-page-btn');
const pageNumbers = document.getElementById('page-numbers');

// Elementos del DOM - Validación de year
const yearInput = document.getElementById('year');
const yearError = document.getElementById('year-error');
const maxYearSpan = document.getElementById('max-year');


// ============ INICIALIZACIÓN ======================

document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    setupYearValidation();
    loadMovies();
});

function setupEventListeners(){
    // Formulario
    movieForm.addEventListener('submit', handleFormSubmit);
    cancelBtn.addEventListener('click', resetForm);
    
    // Filtros - usar debounce para búsqueda
    searchInput.addEventListener('input', debounce(handleFilterChange, 500));
    genreFilter.addEventListener('change', handleFilterChange);
    yearFilter.addEventListener('change', handleFilterChange);
    clearFiltersBtn.addEventListener('click', clearFilters);
    
    // Paginación
    prevPageBtn.addEventListener('click', goToPreviousPage);
    nextPageBtn.addEventListener('click', goToNextPage);
}


// ============ VALIDACIÓN DE YEAR ======================

function setupYearValidation() {
    const currentYear = new Date().getFullYear();
    const maxYear = currentYear + 5;
    
    yearInput.setAttribute('max', maxYear);
    maxYearSpan.textContent = maxYear;
    
    yearInput.addEventListener('input', validateYear);
    yearInput.addEventListener('blur', validateYear);
}

function validateYear() {
    const year = parseInt(yearInput.value);
    const currentYear = new Date().getFullYear();
    const minYear = 1930;
    const maxYear = currentYear + 5;
    
    yearInput.classList.remove('input-error');
    yearError.style.display = 'none';
    
    if (yearInput.value === '') {
        return true;
    }
    
    if (!Number.isInteger(year)) {
        showYearError('El año debe ser un número entero');
        return false;
    }
    
    if (year < minYear || year > maxYear) {
        showYearError(`El año debe estar entre ${minYear} y ${maxYear}`);
        return false;
    }
    
    return true;
}

function showYearError(message) {
    yearInput.classList.add('input-error');
    yearError.textContent = message;
    yearError.style.display = 'block';
}


// ================ FILTROS ======================

function handleFilterChange() {
    // Actualizar estado de filtros
    currentFilters.search = searchInput.value.trim();
    currentFilters.genre = genreFilter.value;
    currentFilters.year = yearFilter.value;
    
    // Resetear a página 1 cuando cambian los filtros
    currentPage = 1;
    
    // Cargar películas con filtros
    loadMovies();
}

function clearFilters() {
    searchInput.value = '';
    genreFilter.value = '';
    yearFilter.value = '';
    
    currentFilters = { search: '', genre: '', year: '' };
    currentPage = 1;
    
    loadMovies();
}

// Debounce helper (evita hacer requests mientras el usuario escribe)
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}


// ================ CARGAR PELÍCULAS ================

async function loadMovies() {
    try {
        loadingElement.style.display = 'block';
        moviesGrid.style.display = 'none';
        paginationContainer.style.display = 'none';

        // Construir URL con parámetros
        const url = buildApiUrl();
        
        const response = await fetch(url);
        const result = await response.json();

        if (result.status === 'success') {
            displayMovies(result.data);
            updatePagination(result.pagination);
            updateResultsInfo(result.pagination, result.filters);
            movieCount.textContent = result.pagination.total_count;
        }

    } catch (error) {
        console.error('❌ Error:', error);
        moviesGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px;">
                <p style="color: red; font-size: 1.2rem;">Error al cargar películas</p>
                <p>¿Está el servidor Rails corriendo?</p>
            </div>
        `;
    } finally {
        loadingElement.style.display = 'none';
        moviesGrid.style.display = 'grid';
    }
}

function buildApiUrl() {
    const params = new URLSearchParams();
    
    // Paginación
    params.append('page', currentPage);
    params.append('per_page', perPage);
    
    // Filtros
    if (currentFilters.search) {
        params.append('q', currentFilters.search);
    }
    if (currentFilters.genre) {
        params.append('genre', currentFilters.genre);
    }
    if (currentFilters.year) {
        params.append('year', currentFilters.year);
    }
    
    return `${API_MOVIES_URL}?${params.toString()}`;
}

function updateResultsInfo(pagination, filters) {
    const { current_page, per_page, total_count } = pagination;
    
    const start = (current_page - 1) * per_page + 1;
    const end = Math.min(current_page * per_page, total_count);
    
    let text = '';
    
    if (total_count === 0) {
        text = 'No se encontraron películas';
    } else {
        text = `Mostrando ${start}-${end} de ${total_count} película${total_count !== 1 ? 's' : ''}`;
        
        // Agregar info de filtros activos
        const activeFilters = [];
        if (filters?.search) activeFilters.push(`"${filters.search}"`);
        if (filters?.genre) activeFilters.push(filters.genre);
        if (filters?.year) activeFilters.push(filters.year);
        
        if (activeFilters.length > 0) {
            text += ` (filtrado por: ${activeFilters.join(', ')})`;
        }
    }
    
    resultsInfo.textContent = text;
}


// ================ PAGINACIÓN ======================

function updatePagination(pagination) {
    totalPages = pagination.total_pages;
    currentPage = pagination.current_page;
    
    // Mostrar/ocultar contenedor de paginación
    if (totalPages <= 1) {
        paginationContainer.style.display = 'none';
        return;
    }
    
    paginationContainer.style.display = 'flex';
    
    // Botón anterior
    prevPageBtn.disabled = !pagination.prev_page;
    
    // Botón siguiente
    nextPageBtn.disabled = !pagination.next_page;
    
    // Números de página
    renderPageNumbers();
}

function renderPageNumbers() {
    pageNumbers.innerHTML = '';
    
    // Mostrar máximo 7 números de página
    const maxVisible = 7;
    let startPage = Math.max(1, currentPage - 3);
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    
    // Ajustar si estamos cerca del final
    if (endPage - startPage < maxVisible - 1) {
        startPage = Math.max(1, endPage - maxVisible + 1);
    }
    
    // Primera página
    if (startPage > 1) {
        addPageButton(1);
        if (startPage > 2) {
            addEllipsis();
        }
    }
    
    // Páginas intermedias
    for (let i = startPage; i <= endPage; i++) {
        addPageButton(i);
    }
    
    // Última página
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            addEllipsis();
        }
        addPageButton(totalPages);
    }
}

function addPageButton(pageNum) {
    const button = document.createElement('button');
    button.className = 'page-number';
    button.textContent = pageNum;
    
    if (pageNum === currentPage) {
        button.classList.add('active');
    }
    
    button.addEventListener('click', () => goToPage(pageNum));
    pageNumbers.appendChild(button);
}

function addEllipsis() {
    const span = document.createElement('span');
    span.className = 'page-ellipsis';
    span.textContent = '...';
    pageNumbers.appendChild(span);
}

function goToPage(page) {
    currentPage = page;
    loadMovies();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function goToPreviousPage() {
    if (currentPage > 1) {
        goToPage(currentPage - 1);
    }
}

function goToNextPage() {
    if (currentPage < totalPages) {
        goToPage(currentPage + 1);
    }
}


// ================== MOSTRAR PELICULAS ======================

function displayMovies(movies) {
    if (movies.length === 0) {
        moviesGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
                <p style="font-size: 3rem;">🎬</p>
                <p style="font-size: 1.2rem; color: #666;">No se encontraron películas</p>
                <p style="color: #999;">Intenta ajustar los filtros</p>
            </div>
        `;
        return;
    }
    moviesGrid.innerHTML = movies.map(movie => createMovieCard(movie)).join('');
}

function createMovieCard(movie){
    const rating = movie.rating ? parseFloat(movie.rating).toFixed(1) : 'N/A';
    const posterUrl = movie.poster_url || '';
    const synopsis = movie.synopsis || 'Sin sinopsis disponible';

    return `
        <div class="movie-card" data-id="${movie.id}">
            ${posterUrl ? 
                `<img src="${posterUrl}" class="movie-poster" alt="${escape(movie.title)}">` :
                `<div class="movie-poster movie-poster-placeholder">
                    <span style="font-size: 3rem;">🎬</span>
                </div>`
            }
            <div class="movie-content">
                <h3 class="movie-title">${escape(movie.title)}</h3>
                <div class="movie-meta">
                    <span>${movie.year} • ${escape(movie.genre)}</span>
                    ${rating !== 'N/A' ? `<span class="movie-rating">⭐ ${rating}</span>` : ''}
                </div>
                <p class="movie-director">🎬 ${escape(movie.director)}</p>
                <p class="movie-synopsis">${escape(synopsis)}</p>
                <div class="movie-actions">
                    <button class="btn btn-edit" onclick="editMovie(${movie.id})">
                        ✏️ Editar
                    </button>
                    <button class="btn btn-delete" onclick="deleteMovie(${movie.id})">
                        🗑️ Eliminar
                    </button>
                </div>
            </div>
        </div>
    `;
}


// ====================== CREAR PELICULAS ===========================

async function createMovie(movieData){
    try{
        const response = await fetch(API_MOVIES_URL, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({movie: movieData})
        });

        const result = await response.json();

        if (response.ok && result.status === 'success'){
            showMessage('Película creada exitosamente!', 'success');
            resetForm();
            loadMovies();
        } else {
            showMessage('Error al crear la película', 'error');
        }
    } catch(error) {
        console.error('Error: ', error);
        showMessage('Error de conexión', 'error');
    }
}


// ====================== EDITAR PELICULAS =============================

async function editMovie(id){
    try {
        const response = await fetch(`${API_MOVIES_URL}/${id}`);
        const result = await response.json();

        if (response.ok && result.status === 'success'){
            const movie = result.data;

            document.getElementById('title').value = movie.title;
            document.getElementById('director').value = movie.director;
            document.getElementById('year').value = movie.year;
            document.getElementById('genre').value = movie.genre;
            document.getElementById('rating').value = movie.rating || '';
            document.getElementById('synopsis').value = movie.synopsis || '';
            document.getElementById('poster_url').value = movie.poster_url || '';
            
            editingMovieId = id;
            formTitle.textContent = '✏️ Editar Película';
            submitText.textContent = 'Actualizar Película';
            cancelBtn.style.display = 'inline-block';
            
            validateYear();
            
            document.querySelector('.form-section').scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    } catch (error){
        console.error('Error: ', error);
        showMessage('Error al cargar la película', 'error');
    }
}

async function updateMovie(id, movieData){
    try {
        const response = await fetch(`${API_MOVIES_URL}/${id}`, {
            method: 'PATCH',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({movie: movieData})
        });
        const result = await response.json();
        if (response.ok && result.status === 'success'){
            showMessage('Película actualizada exitosamente', 'success');
            resetForm();
            loadMovies();
        } else {
            showMessage('Error al actualizar la película', 'error');
        }
    } catch (error){
        console.error('Error: ', error);
        showMessage('Error de conexión', 'error');
    }
}


// ======================= ELIMINAR PELICULAS =========================

async function deleteMovie(id){
    const card = document.querySelector(`[data-id="${id}"]`);
    const title = card?.querySelector('.movie-title')?.textContent || 'esta película';
    
    if (!confirm(`¿Estás seguro de eliminar "${title}"?`)) return;
    
    try {
        const response = await fetch(`${API_MOVIES_URL}/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok){
            showMessage('Película eliminada exitosamente', 'success');
            loadMovies();
        } else {
            showMessage('Error al eliminar la película', 'error');
        }
    } catch (error) {
        console.error('Error: ', error);
        showMessage('Error de conexión', 'error');
    }
}


// ============== MANEJO DE FORMULARIO ==========================

function handleFormSubmit(e) {
    e.preventDefault();
    
    if (!validateYear()) {
        showMessage('Por favor corrige el año antes de continuar', 'error');
        yearInput.focus();
        return;
    }

    const formData = new FormData(movieForm);
    const movieData = {
        title: formData.get('title').trim(),
        director: formData.get('director').trim(),
        year: parseInt(formData.get('year')),
        genre: formData.get('genre').trim(),
        rating: formData.get('rating') ? parseFloat(formData.get('rating')) : null,
        synopsis: formData.get('synopsis').trim() || null,
        poster_url: formData.get('poster_url').trim() || null
    };

    if (editingMovieId) {
        updateMovie(editingMovieId, movieData);
    } else {
        createMovie(movieData);
    }
}

function resetForm(){
    movieForm.reset();
    editingMovieId = null;
    formTitle.textContent = '➕ Agregar Nueva Película';
    submitText.textContent = 'Crear Película';
    cancelBtn.style.display = 'none';
    
    yearInput.classList.remove('input-error');
    yearError.style.display = 'none';
}


// ====================== UTILIDADES ============================

function showMessage(message, type){
    const div = document.createElement('div');
    div.textContent = message;
    div.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        border-radius: 8px;
        color: white;
        background: ${type === 'success' ? '#28a745' : '#dc3545'};
        box-shadow: 0 4px 6px rgba(0,0,0,0.2);
        z-index: 9999;
        animation: slideIn 0.3s ease-out;
    `;

    document.body.appendChild(div);
    setTimeout(() => div.remove(), 3000);
}

function escape(text){
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Estilos para animación
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
`;
document.head.appendChild(style);