// app.js - Frontend para Movie API

// Configuración de la API
const API_BASE_URL = 'http://localhost:3000/api/v1';
const API_MOVIES_URL = `${API_BASE_URL}/movies`;

// Estado de la aplicación
let editingMovieId = null;

// Elementos del DOM
const movieForm = document.getElementById('movie-form');
const moviesGrid = document.getElementById('movies-grid');
const loadingElement = document.getElementById('loading');
const errorMessage = document.getElementById('error-message');
const movieCount = document.getElementById('movie-count');
const formTitle = document.getElementById('form-title');
const submitBtn = document.getElementById('submit-btn');
const submitText = document.getElementById('submit-text');
const cancelBtn = document.getElementById('cancel-btn');

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎬 Movie API Frontend initialized');
    loadMovies();
    setupEventListeners();
});

// Configurar event listeners
function setupEventListeners() {
    movieForm.addEventListener('submit', handleFormSubmit);
    cancelBtn.addEventListener('click', resetForm);
}

// ==================== FETCH MOVIES ====================

async function loadMovies() {
    try {
        showLoading(true);
        hideError();

        const response = await fetch(API_MOVIES_URL);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.status === 'success') {
            displayMovies(result.data);
            updateMovieCount(result.data.length);
        } else {
            throw new Error(result.message || 'Error al cargar películas');
        }

    } catch (error) {
        console.error('Error loading movies:', error);
        showError('Error al cargar las películas. ¿Está el servidor corriendo?');
    } finally {
        showLoading(false);
    }
}

// ==================== DISPLAY MOVIES ====================

function displayMovies(movies) {
    if (movies.length === 0) {
        moviesGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #666;">
                <p style="font-size: 1.2rem;">📭 No hay películas aún</p>
                <p>Agrega tu primera película usando el formulario arriba</p>
            </div>
        `;
        return;
    }

    moviesGrid.innerHTML = movies.map(movie => createMovieCard(movie)).join('');
}

function createMovieCard(movie) {
    const posterUrl = movie.poster_url || 'https://via.placeholder.com/300x450?text=No+Poster';
    const rating = movie.rating ? parseFloat(movie.rating).toFixed(1) : 'N/A';
    const synopsis = movie.synopsis || 'Sin sinopsis disponible';

    return `
        <div class="movie-card" data-id="${movie.id}">
            <img src="${posterUrl}" alt="${movie.title}" class="movie-poster" 
                 onerror="this.src='https://via.placeholder.com/300x450?text=Error+Loading+Image'">
            <div class="movie-content">
                <div class="movie-header">
                    <h3 class="movie-title">${escapeHtml(movie.title)}</h3>
                    <div class="movie-meta">
                        <span>${movie.year} • ${escapeHtml(movie.genre)}</span>
                        ${rating !== 'N/A' ? `<span class="movie-rating">⭐ ${rating}</span>` : ''}
                    </div>
                </div>
                <p class="movie-director">🎬 ${escapeHtml(movie.director)}</p>
                <p class="movie-synopsis">${escapeHtml(synopsis)}</p>
                <div class="movie-actions">
                    <button class="btn btn-edit" onclick="editMovie(${movie.id})">
                        ✏️ Editar
                    </button>
                    <button class="btn btn-delete" onclick="deleteMovie(${movie.id}, '${escapeHtml(movie.title)}')">
                        🗑️ Eliminar
                    </button>
                </div>
            </div>
        </div>
    `;
}

// ==================== CREATE MOVIE ====================

async function createMovie(movieData) {
    try {
        const response = await fetch(API_MOVIES_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ movie: movieData })
        });

        const result = await response.json();

        if (response.ok && result.status === 'success') {
            console.log('✅ Movie created:', result.data);
            showSuccess('Película creada exitosamente');
            resetForm();
            loadMovies();
        } else {
            throw new Error(result.message || 'Error al crear la película');
        }

    } catch (error) {
        console.error('Error creating movie:', error);
        showError(`Error al crear la película: ${error.message}`);
    }
}

// ==================== UPDATE MOVIE ====================

async function updateMovie(id, movieData) {
    try {
        const response = await fetch(`${API_MOVIES_URL}/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ movie: movieData })
        });

        const result = await response.json();

        if (response.ok && result.status === 'success') {
            console.log('✅ Movie updated:', result.data);
            showSuccess('Película actualizada exitosamente');
            resetForm();
            loadMovies();
        } else {
            throw new Error(result.message || 'Error al actualizar la película');
        }

    } catch (error) {
        console.error('Error updating movie:', error);
        showError(`Error al actualizar la película: ${error.message}`);
    }
}

// ==================== DELETE MOVIE ====================

async function deleteMovie(id, title) {
    if (!confirm(`¿Estás seguro de eliminar "${title}"?`)) {
        return;
    }

    try {
        const response = await fetch(`${API_MOVIES_URL}/${id}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (response.ok && result.status === 'success') {
            console.log('✅ Movie deleted:', id);
            showSuccess('Película eliminada exitosamente');
            loadMovies();
        } else {
            throw new Error(result.message || 'Error al eliminar la película');
        }

    } catch (error) {
        console.error('Error deleting movie:', error);
        showError(`Error al eliminar la película: ${error.message}`);
    }
}

// ==================== EDIT MOVIE ====================

async function editMovie(id) {
    try {
        const response = await fetch(`${API_MOVIES_URL}/${id}`);
        const result = await response.json();

        if (response.ok && result.status === 'success') {
            const movie = result.data;
            
            // Llenar el formulario con los datos de la película
            document.getElementById('title').value = movie.title;
            document.getElementById('director').value = movie.director;
            document.getElementById('year').value = movie.year;
            document.getElementById('genre').value = movie.genre;
            document.getElementById('rating').value = movie.rating || '';
            document.getElementById('synopsis').value = movie.synopsis || '';
            document.getElementById('poster_url').value = movie.poster_url || '';

            // Cambiar el modo del formulario a edición
            editingMovieId = id;
            formTitle.textContent = '✏️ Editar Película';
            submitText.textContent = 'Actualizar Película';
            submitBtn.classList.remove('btn-primary');
            submitBtn.classList.add('btn-edit');
            cancelBtn.style.display = 'inline-block';

            // Scroll al formulario
            document.querySelector('.form-section').scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });

        } else {
            throw new Error(result.message || 'Error al cargar la película');
        }

    } catch (error) {
        console.error('Error loading movie for edit:', error);
        showError(`Error al cargar la película: ${error.message}`);
    }
}

// ==================== FORM HANDLING ====================

function handleFormSubmit(e) {
    e.preventDefault();

    const formData = new FormData(movieForm);
    const movieData = {
        title: formData.get('title').trim(),
        director: formData.get('director').trim(),
        year: parseInt(formData.get('year')),
        genre: formData.get('genre').trim(),
        rating: formData.get('rating') ? parseFloat(formData.get('rating')) : null,
        synopsis: formData.get('synopsis').trim(),
        poster_url: formData.get('poster_url').trim()
    };

    // Limpiar campos vacíos
    Object.keys(movieData).forEach(key => {
        if (movieData[key] === '' || movieData[key] === null) {
            delete movieData[key];
        }
    });

    if (editingMovieId) {
        updateMovie(editingMovieId, movieData);
    } else {
        createMovie(movieData);
    }
}

function resetForm() {
    movieForm.reset();
    editingMovieId = null;
    formTitle.textContent = '➕ Agregar Nueva Película';
    submitText.textContent = 'Crear Película';
    submitBtn.classList.remove('btn-edit');
    submitBtn.classList.add('btn-primary');
    cancelBtn.style.display = 'none';
}

// ==================== UI HELPERS ====================

function showLoading(show) {
    loadingElement.style.display = show ? 'block' : 'none';
    moviesGrid.style.display = show ? 'none' : 'grid';
}

function showError(message) {
    errorMessage.textContent = `❌ ${message}`;
    errorMessage.style.display = 'block';
    setTimeout(() => {
        errorMessage.style.display = 'none';
    }, 5000);
}

function hideError() {
    errorMessage.style.display = 'none';
}

function showSuccess(message) {
    // Crear elemento de éxito temporal
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.innerHTML = `✅ ${message}`;
    successDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #d4edda;
        color: #155724;
        padding: 15px 25px;
        border-radius: 8px;
        border: 1px solid #c3e6cb;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
        successDiv.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => successDiv.remove(), 300);
    }, 3000);
}

function updateMovieCount(count) {
    movieCount.textContent = count;
}

function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.toString().replace(/[&<>"']/g, m => map[m]);
}

// Agregar estilos para animaciones
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

console.log('✅ Movie API Frontend loaded successfully');