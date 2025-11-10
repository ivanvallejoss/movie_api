# Movie API

API REST completa para entender el desarrollo de estas en un armado con Ruby on Rails, utilizando PostgreSQL y un frontend en JS vanilla.

![Ruby](https://img.shields.io/badge/Ruby-3.2.3-red?style=flat-square&logo=ruby)
![Rails](https://img.shields.io/badge/Rails-8.1.1-red?style=flat-square&logo=rubyonrails)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue?style=flat-square&logo=postgresql)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6-yellow?style=flat-square&logo=javascript)

---

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Tech Stack](#-tech-stack)
- [Arquitectura](#-arquitectura)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Uso](#-uso)
- [Endpoints de la API](#-endpoints-de-la-api)
- [Frontend](#-frontend)
- [Testing](#-testing)
- [Deploy](#-deploy)
- [Decisiones Técnicas](#-decisiones-técnicas)

---

## Características

- ✅ **CRUD completo** de películas (Create, Read, Update, Delete)
- ✅ **API RESTful** con arquitectura versionada (`/api/v1`)
- ✅ **Validaciones** a nivel de modelo y base de datos
- ✅ **CORS configurado** para comunicación frontend-backend
- ✅ **Seeds protegidos** por ambiente (solo desarrollo/test)
- ✅ **Respuestas JSON consistentes** con manejo de errores
- ✅ **Frontend responsive** con JavaScript vanilla
- ✅ **PostgreSQL** con índices optimizados

---

## 🛠 Tech Stack

### Backend
- **Ruby** 3.2.3
- **Rails** 8.1.1 (API mode)
- **PostgreSQL** 16
- **Puma** web server

### Frontend
- **HTML5** / **CSS3**
- **JavaScript** (Vanilla ES6+)
- **Fetch API** para comunicación con backend

### Herramientas
- **dotenv-rails** para variables de ambiente
- **rack-cors** para CORS
- **Git** para control de versiones

---

## 🏗 Arquitectura
```
movie_api/
├── app/
│   ├── controllers/
│   │   └── api/
│   │       └── v1/
│   │           └── movies_controller.rb    # Controlador RESTful
│   └── models/
│       └── movie.rb                        # Modelo con validaciones
├── config/
│   ├── database.yml                        # Configuración de PostgreSQL
│   ├── routes.rb                           # Rutas de la API
│   └── initializers/
│       └── cors.rb                         # Configuración CORS
├── db/
│   ├── migrate/                            # Migraciones
│   ├── seeds.rb                            # Datos de ejemplo
│   └── schema.rb                           # Esquema de la DB
├── frontend/
│   ├── index.html                          # Interfaz principal
│   ├── styles.css                          # Estilos
│   ├── app.js                              # Lógica del frontend
│   └── config.js                           # Configuración de API URL
├── .env                                    # Variables de ambiente (no versionado)
├── .env.example                            # Plantilla de variables
└── README.md                               # Este archivo
```

---

## 📦 Instalación

### Prerequisitos

- Ruby 3.0+
- Rails 7.0+
- PostgreSQL 12+
- Git

### 1. Clonar el repositorio
```bash
git clone https://github.com/tu-usuario/movie_api.git
cd movie_api
```

### 2. Instalar dependencias
```bash
bundle install
```

### 3. Configurar variables de ambiente
```bash
cp .env.example .env
```

Edita `.env` con tus credenciales de PostgreSQL:
```bash
DB_USERNAME=tu_usuario
DB_PASSWORD=tu_password
DB_HOST=localhost
DB_NAME=movie_api_development
```

### 4. Crear y configurar la base de datos
```bash
rails db:create
rails db:migrate
rails db:seed
```

---

## ⚙️ Configuración

### Variables de Ambiente

El proyecto utiliza las siguientes variables de ambiente:

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `DB_USERNAME` | Usuario de PostgreSQL | `postgres` |
| `DB_PASSWORD` | Contraseña de PostgreSQL | `password123` |
| `DB_HOST` | Host de la base de datos | `localhost` |
| `DB_NAME` | Nombre de la base de datos | `movie_api_development` |
| `RAILS_ENV` | Ambiente de Rails | `development` |

### CORS

El backend está configurado para aceptar peticiones desde:
- `http://localhost:5500`
- `http://127.0.0.1:5500`

Configuración en `config/initializers/cors.rb`.

---

## 🚀 Uso

### Backend (Rails API)
```bash
# Iniciar el servidor
rails server

# El servidor correrá en http://localhost:3000
```

### Frontend

**Opción 1: Live Server (VSCode)**

1. Instala la extensión Live Server
2. Click derecho en `frontend/index.html`
3. "Open with Live Server"

Not recommended, it reloads multiple times and "edit" options does not work because of this.

**Opción 2: Python HTTP Server**
```bash
cd frontend
python3 -m http.server 5500

# Abre http://localhost:5500
```
Recommended

**Opción 3: Node.js http-server**
```bash
npm install -g http-server
cd frontend
http-server -p 5500
```

---

## 🔌 Endpoints de la API

Base URL: `http://localhost:3000/api/v1`

### Listar todas las películas
```http
GET /api/v1/movies
```

**Respuesta:**
```json
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "title": "The Shawshank Redemption",
      "director": "Frank Darabont",
      "year": 1994,
      "genre": "Drama",
      "rating": "9.3",
      "synopsis": "Two imprisoned men bond...",
      "poster_url": "https://...",
      "created_at": "2024-11-07T...",
      "updated_at": "2024-11-07T..."
    }
  ],
  "message": "Movies retrieved successfully"
}
```

### Obtener una película
```http
GET /api/v1/movies/:id
```

### Crear una película
```http
POST /api/v1/movies
Content-Type: application/json

{
  "movie": {
    "title": "Inception",
    "director": "Christopher Nolan",
    "year": 2010,
    "genre": "Sci-Fi",
    "rating": 8.8,
    "synopsis": "A thief who steals corporate secrets...",
    "poster_url": "https://..."
  }
}
```

### Actualizar una película
```http
PATCH /api/v1/movies/:id
Content-Type: application/json

{
  "movie": {
    "rating": 9.0
  }
}
```

### Eliminar una película
```http
DELETE /api/v1/movies/:id
```

### Códigos de Estado HTTP

| Código | Significado |
|--------|-------------|
| `200` | Éxito (GET, PATCH, DELETE) |
| `201` | Creado (POST) |
| `404` | No encontrado |
| `422` | Error de validación |
| `500` | Error del servidor |

---

## 🎨 Frontend

El frontend es una SPA (Single Page Application) construida con JavaScript vanilla que consume la API REST.

### Características

- ✅ Listado de películas con cards visuales
- ✅ Formulario para crear películas
- ✅ Edición inline de películas existentes
- ✅ Eliminación con confirmación
- ✅ Mensajes de éxito/error
- ✅ Diseño responsive
- ✅ Sin dependencias externas (vanilla JS)

### Estructura del Frontend
```javascript
// Arquitectura del código JavaScript
- API_BASE_URL: Configuración de la URL base
- loadMovies(): Obtiene y muestra películas
- createMovie(): Crea nueva película
- editMovie(): Carga película para edición
- updateMovie(): Actualiza película existente
- deleteMovie(): Elimina película
- displayMovies(): Renderiza el grid de películas
```

---

## 🧪 Testing

### Seeds

El proyecto incluye 15 películas de ejemplo. Para cargar los seeds:
```bash
rails db:seed
```

⚠️ **Protección de Seeds:**
- Solo funcionan en ambientes `development` y `test`
- Requieren confirmación antes de borrar datos
- Bloqueados automáticamente en producción

### Consola de Rails

Prueba el modelo en la consola:
```bash
rails console

# Listar películas
Movie.all

# Buscar por género
Movie.where(genre: "Sci-Fi")

# Crear película
Movie.create(
  title: "Test Movie",
  director: "Test Director",
  year: 2024,
  genre: "Drama"
)
```

---

## 🌐 Deploy

### Frontend

**Vercel** (Recomendado)

1. Crea una cuenta en [Vercel](https://vercel.com)
2. Conecta tu repositorio de GitHub
3. Configura:
   - **Build Command:** (dejar vacío)
   - **Output Directory:** `frontend`
   - **Environment Variables:** `API_BASE_URL=https://tu-backend.com/api/v1`

**Netlify**

1. Crea una cuenta en [Netlify](https://netlify.com)
2. Conecta tu repositorio
3. Configura:
   - **Base directory:** `frontend`
   - **Build command:** (dejar vacío)
   - **Publish directory:** `frontend`

### Backend

**Railway** (Recomendado para Rails)

1. Crea una cuenta en [Railway](https://railway.app)
2. Crea un nuevo proyecto
3. Agrega PostgreSQL addon
4. Agrega tu repositorio
5. Configura variables de ambiente:
```
   DB_USERNAME=postgres
   DB_PASSWORD=(auto-generado por Railway)
   DB_HOST=(auto-generado por Railway)
   RAILS_ENV=production
   FRONTEND_URL=https://tu-frontend.vercel.app
```

**Render**

1. Crea una cuenta en [Render](https://render.com)
2. Crea PostgreSQL database
3. Crea Web Service
4. Conecta repositorio y configura variables

---

## 💡 Decisiones Técnicas

### ¿Por qué Rails API mode?

- Más liviano que Rails completo (sin views, assets)
- Diseñado específicamente para APIs
- Mejor performance al no cargar middleware innecesario

### ¿Por qué PostgreSQL?

- Estándar de la industria para producción
- Mejor soporte para tipos de datos complejos
- Excelente integración con Rails
- Deployment más sencillo (Heroku, Railway, Render)

### ¿Por qué Vanilla JavaScript?

- Demuestra conocimiento de JavaScript puro
- Sin dependencias ni configuración compleja
- Más rápido de cargar
- Ideal para proyectos pequeños/demos

### ¿Por qué arquitectura versionada (`/api/v1`)?

- Permite crear nuevas versiones sin romper clientes existentes
- Estándar de la industria
- Facilita mantenimiento a largo plazo

### Validaciones en Modelo + Base de Datos

- **Modelo (Ruby):** Valida lógica de negocio, mensajes amigables
- **Base de Datos (migrations):** Integridad de datos, última línea de defensa
- Defensa en capas (defense in depth)

### Strong Parameters

- Protección contra mass assignment attacks
- Solo permite actualizar campos específicamente autorizados
- Seguridad crítica en aplicaciones web

---

## 📚 Recursos Adicionales

- [Rails Guides](https://guides.rubyonrails.org/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [MDN Web Docs - Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
- [Ruby on Rails API Documentation](https://api.rubyonrails.org/)

---

## 👤 Autor

**Ivan** - Backend Developer

- 📧 Email: ivanvallejos06@gmail.com
- 💼 LinkedIn: [tu-perfil](https://linkedin.com/in/ivanvallejoss)
- 🐙 GitHub: [tu-usuario](https://github.com/ivanvallejoss)

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

---

## 🙏 Agradecimientos

- Películas de ejemplo obtenidas de [The Movie Database (TMDB)](https://www.themoviedb.org/)
- Inspiración de arquitectura de [Rails API guides](https://guides.rubyonrails.org/api_app.html)

---

**⭐ Si te gustó este proyecto, dale una estrella en GitHub!**