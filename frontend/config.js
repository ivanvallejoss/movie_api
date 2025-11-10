// establecer la conexion al back de acuerdo al ambiente en el que estemos

const API_CONFIG = {
    // Detectar el entorno automaticamente
    BASE_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000/api/v1' // desarrollo
    : 'https://api-produccion.com/api/v1' // Produccion
};