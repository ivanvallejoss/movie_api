
const API_BASE_URL = API_CONFIG.BASE_URL;
const API_MOVIES_URL = `${API_BASE_URL}/movies`;

// Estado
let editingMovieId = null;
let appInitialized = false;

// Elementos del DOM
const movieForm = document.getElementById('movie-form');
const moviesGrid = document.getElementById('movies-grid');
const loadingElement = document.getElementById('loading');
const movieCount = document.getElementById('movie-count');
const formTitle = document.getElementById('form-title');
const submitText = document.getElementById('submit-text');
const cancelBtn = document.getElementById('cancel-btn');

// Elementos para validacion de year
const yearInput = document.getElementById('year');
const yearError = document.getElementById('year-error');
const maxYearSpan = document.getElementById('max-year');


// ============ INICIALIZACION ======================

document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    loadMovies();
});

function setupEventListeners(){
    movieForm.addEventListener('submit', handleFormSubmit);
    cancelBtn.addEventListener('click', resetForm)
}



// =================== Validacion de Year ======================

function setupYearValidation(){
    // Calculamos year maximo
    const currentYear = new Date().getFullYear();
    const maxYear = currentYear + 5;

    // Actualizar el atributo max del input
    yearInput.setAttribute('max', maxYear);

    // Actualizar el mensaje de error
    maxYearSpan.textContent = maxYear;

    // Validacion en tiempo real
    yearInput.addEventListener('input', validateYear);
    yearInput.addEventListener('blur', validateYear);
}

function validateYear(){
    const year = parseInt(yearInput.value);
    const currentYear = new Date().getFullYear();
    const minYear = 1888;
    const maxYear = currentYear + 5;

    // Limpiar estado de error primero
    yearInput.classList.remove('input-error');
    yearError.style.display = 'none';

    // Si el campo esta vacio, no validar (required lo manejara)
    if (yearInput.value === ''){
        return true;
    }

    // Verificar que sea un numero entero
    if (!Number.isInteger(year)){
        showYearError('El year debe ser un numero entero');
        return false;
    }

    // Verificar range
    if (year < minYear || year > maxYear){
        showYearError(`El year debe estar entre ${minYear} y ${maxYear}`);
        return false
    }
    // si todo esta validado
    return true
}

function showYearError(message){
    yearInput.classList.add('input-error');
    yearError.textContent = message;
    yearError.style.display = 'block';
}



// ================ CARGAR PELICULAS ================

async function loadMovies() {
    try {
        loadingElement.style.display = 'block';
        moviesGrid.style.display = 'none';

        const response = await fetch(API_MOVIES_URL);
        const result = await response.json();

        if (result.status === 'success') {
            displayMovies(result.data);
            movieCount.textContent = result.data.length;
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



// ================== MOSTRAR PELICULAS ======================

function displayMovies(movies) {
    if (movies.length === 0) {
        moviesGrid.innerHTML = '<p>No hay películas</p>';
        return;
    }
    moviesGrid.innerHTML = movies.map(movie => createMovieCard(movie)).join('');
}

function createMovieCard(movie){
    const rating = movie.rating ? parseFloat(movie.rating).toFixed(1) : `N/A`;
    const posterUrl = movie.poster_url || '';
    const synopsis = movie.synopsis || `Sin sinopsis disponible`;

    return `
        <div class="movie-card" data-id="${movie.id}">
            ${posterUrl ? 
                `<img src="${posterUrl}" class="movie-poster">` :
                `<div class="movie-poster" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; color: white; font-size: 1.2rem;">Movie</div>`
            }
            <div class="movie-content>
                <h3 class="movie-title">${movie.title}</h3>
                <div class="movie-meta">
                    <span>${movie.year} - ${movie.genre}</span>
                    ${rating !== `N/A` ? `<span class="movie-rating">${rating}</span>`: ``}
                </div>
                <p class="movie-director"> ${movie.director}</p>
                <p class="movie-synopsis"> ${synopsis}</p>
                <div class="movie-action">
                    <button class="btn btn-edit" onclick="editMovie(${movie.id})">
                        Editar
                    </button>
                    <button class="btn btn-delete" onclick="deleteMovie(${movie.id})">
                        Eliminar
                    </button>
                </div>
            </div>
        </div>
    `
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
            showMessage(`Pelicula creada exitosamente!`, 'success');
            resetForm();
            loadMovies();
        } else {
            showMessage(`Error al crear la pelicula`, `error`);
        }
    } catch(error) {
        console.error('Error: ', error);
        showMessage('Error de conexion', 'error');
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
            formTitle.textContent = 'Editar pelicula';
            submitText.textContent = 'Actualizar Pelicula';
            cancelBtn.style.display = 'inline-block';
            
            document.querySelector('.form-section').scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    } catch (error){
        console.error('Error: ', error)
        showMessage('Error al cargar la pelicula', 'error')
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
            showMessage('Pelicula actualiza exitosamente', 'success');
            resetForm();
            loadMovies();
        } else {
            showMessage('Error al actualizar la pelicula', 'error')
        }
    } catch (error){
        console.error('Error: ', error);
        showMessage('Error de conexion', 'error');
    }
}



// ======================= ELIMINAR PELICULAS =========================

async function deleteMovie(id){
    const card = document.querySelector(`[data-id="${id}"]`);
    // seleccionamos solo si es distinto a null.
    const title = card?.querySelector('.movie-title')?.textContent || 'esta pelicula';
    
    if (!confirm(`Estas seguro de eliminar "${title}"?`)) return;
    
    await fetch(`${API_MOVIES_URL}/${id}`, {
        method: 'DELETE'
    })
    .then( response => {
        if (response.ok){
            showMessage('Pelicula eliminada exitosamente', 'success');
            loadMovies();
        } else {
            showMessage('Error al eliminar la pelicula', 'error');
        }
    })
    .catch(error => {
        console.error('Error: ', error);
        showMessage('Error de conexion', 'error');
    })
};



// ============== MANEJO DE FORMULARIO ==========================

function handleFormSubmit(e) {
    e.preventDefault();

    const formData = new FormData(movieForm);
    const movieData = {
        title: formData.get('title').trim(),
        director: formData.get('director').trim(),
        year: parseInt(formData.get('year'), 10),
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
    formTitle.textContent = '+ Agregar nueva pelicula';
    submitText.textContent = 'Crear Pelicula';
    cancelBtn.textContent = 'none';
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

// Estilos
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
    }
`;
document.head.appendChild(style);