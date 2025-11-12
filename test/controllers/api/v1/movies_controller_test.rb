require "test_helper"

class Api::V1::MoviesControllerTest < ActionDispatch::IntegrationTest
  setup do
  end

  #===============================
  # TEST 1 : GET
  #===============================
  test "should get index successfully" do
    get api_v1_movies_url
    assert_response :success

    json_response = JSON.parse(response.body)

    # Verificamos estructura de la respuesta
    assert_equal "success", json_response["status"]
    assert_equal "Movies retrieved successfully", json_response["message"]
    # Verificamos que retorna todas las peliculas
    assert_equal 4, json_response["data"].length
    # Verificamos que las peliculas estan ordenadas por created_at (segun el controlador)
    movie_titles = json_response["data"].map { |m| m["title"] }
    assert_includes movie_titles, "Inception"
    assert_includes movie_titles, "The Matrix"

  end

  # =================================
  # TEST 2: POST
  # ==================================
  test "should create movie with valid data" do
    # preparamos datos para la nueva pelicula
    movie_params = {
      movie: {
        title: "Interestellar",
        director: "Christopher Nolan",
        year: 2014,
        genre: "Sci-Fi",
        rating: 8.6,
        synopsis: "A team of explorers travel through a wormhole in space.",
        poster_url: "https://image.tmdb.org/t/p/w500/gEU20QniE6E77NI6lCU6MxlNBvIx.jpg"
      }
    }

    # Verificamos que el count de movie aumente a 1
    assert_difference("Movie.count", 1) do
      post api_v1_movies_url,
        params: movie_params,
        as: :json 
    end

    # Verificamos la respuesta
    assert_response :created
    json_response = JSON.parse(response.body)
    assert_equal "success", json_response["status"]
    assert_equal "Movie created successfully", json_response["message"]

    # Verificamos datos de la pelicula creada
    created_movie = json_response["data"]
    assert_equal "Interestellar", created_movie["title"]
    assert_equal "Christopher Nolan", created_movie["director"]
    assert_equal 2014, created_movie["year"]
    assert_equal "Sci-Fi", created_movie["genre"]
    assert_equal 8.6, created_movie["rating"].to_f
  end


  # ==================================
  # TEST 3 : POST
  # ===================================
  test "should not create movie with invalid data" do
    # Preparamos datos invalidos
    invalid_params = {
      movie: {
        title: "",
        director: "test director",
        year: 2000,
        genre: "Drama"
      }
    }

    assert_no_difference("Movie.count") do
      post api_v1_movies_url,
        params: invalid_params,
        as: :json
    end

    # Verificamos que retorna error de validacion
    assert_response :unprocessable_entity # 402

    json_response = JSON.parse(response.body)
    assert_equal "error", json_response["status"]
    assert_equal "Movie creation failed", json_response["message"]

    assert_not_nil json_response["data"]
  end


  # ===============================
  # TEST 4: GET
  # ================================
  test "should show movie when exists" do
    # Usamos la pelicula del fixture
    movie = movies(:inception)

    # Hacemos peticion con el id
    get api_v1_movie_url(movie)

    assert_response :success
    json_response = JSON.parse(response.body)
    assert_equal "success", json_response["status"]
    assert_equal "Movie retrieved successfully", json_response["message"]

    # Verificamos los datos de la pelicula
    movie_data = json_response["data"]
    assert_equal movie.id, movie_data["id"]
    assert_equal "Inception", movie_data["title"]
    assert_equal "Christopher Nolan", movie_data["director"]
    assert_equal 2010, movie_data["year"]
  end


  # ============================
  # TEST 5: GET
  # ===========================================
  # Verificar manejo de errores cuando la pelicla no existe
  test "should return not found when movie does not exist" do
    # Usamos id inexistente
    non_existent_id = 9999999

    get api_v1_movie_url(non_existent_id)

    # Verificamos que retorna 404
    assert_response :not_found

    json_response = JSON.parse(response.body)
    assert_equal "error", json_response["status"]
    assert_includes json_response["message"], "not found"
    assert_nil json_response["data"]
  end

  # ==============================
  # TESTS ADICIONALES
  # ===============================
  test "should update movie with valid data" do
    movie = movies(:inception)

    updated_params = {
      movie: {
        rating: 9.0, # actualizamos solo el rating
        synopsis: "Updated synopsis"
      }
    }

    patch api_v1_movie_url(movie),
          params: updated_params,
          as: :json

    assert_response :success
    # verificamos que los datos se actualizaron
    movie.reload
    assert_equal 9.0, movie.rating
    assert_equal "Updated synopsis", movie.synopsis
    # El titulo no debe cambiar
    assert_equal "Inception", movie.title
  end

  test "should delete movie" do
    movie = movies(:minimal_movie)

    assert_difference("Movie.count", -1) do
      delete api_v1_movie_url(movie)
    end

    assert_response :success

    json_response = JSON.parse(response.body)
    assert_equal "success", json_response["status"]
    assert_equal "Movie deleted successfully", json_response["message"]
  end

  test "should validate year is greater than 1930" do
    invalid_params = {
      movie: {
        title: "Old movie",
        director: "Test",
        year: 1920,
        genre: "Drama"
      }
    } 

    assert_no_difference("Movie.count") do
      post api_v1_movies_url, params: invalid_params, as: :json
    end

    assert_response :unprocessable_entity
  end

 
  # ============================================================================
  # TEST: Paginación por defecto (página 1, 20 items)
  # ============================================================================
  test "should paginate movies with default values" do
    # ARRANGE: Crear 25 películas para tener múltiples páginas
    25.times do |i|
      Movie.create!(
        title: "Test Movie #{i}",
        director: "Director #{i}",
        year: 2000 + i,
        genre: "Drama"
      )
    end
    
    # ACT: Hacer petición sin parámetros
    get api_v1_movies_url
    
    # ASSERT: Verificar paginación
    assert_response :success
    
    json_response = JSON.parse(response.body)
    
    # Verificar estructura de paginación
    # assert_not_nil json_response["pagination"]
    
    pagination = json_response["pagination"]
    assert_equal 1, pagination["current_page"]
    assert_equal 20, pagination["per_page"]
    assert_equal 2, pagination["total_pages"]  # 25 películas + 4 fixtures = 29 total → 2 páginas
    assert_equal 2, pagination["next_page"]
    assert_nil pagination["prev_page"]
    
    # Verificar que retorna 20 películas (página 1)
    assert_equal 20, json_response["data"].length
  end

  # ============================================================================
  # TEST: Paginación - página 2
  # ============================================================================
  test "should get second page of movies" do
    # ARRANGE: Crear 25 películas
    25.times do |i|
      Movie.create!(
        title: "Test Movie #{i}",
        director: "Director #{i}",
        year: 2020,
        genre: "Drama"
      )
    end
    
    # ACT: Solicitar página 2
    get api_v1_movies_url, params: { page: 2 }
    
    # ASSERT
    assert_response :success
    
    json_response = JSON.parse(response.body)
    pagination = json_response["pagination"]
    
    assert_equal 2, pagination["current_page"]
    assert_equal 1, pagination["prev_page"]
    assert_nil pagination["next_page"]  # No hay página 3
    
    # En página 2 debe haber 9 películas (29 total - 20 en página 1 = 9)
    assert_equal 9, json_response["data"].length
  end

  # ============================================================================
  # TEST: Paginación - cambiar per_page
  # ============================================================================
  test "should respect custom per_page parameter" do
    # ARRANGE: Crear 15 películas
    15.times do |i|
      Movie.create!(
        title: "Movie #{i}",
        director: "Director",
        year: 2020,
        genre: "Drama"
      )
    end
    
    # ACT: Solicitar 5 películas por página
    get api_v1_movies_url, params: { per_page: 5 }
    
    # ASSERT
    json_response = JSON.parse(response.body)
    pagination = json_response["pagination"]
    
    assert_equal 5, pagination["per_page"]
    assert_equal 5, json_response["data"].length
    assert_equal 4, pagination["total_pages"]  # 19 total / 5 = 4 páginas
  end

  # ============================================================================
  # TEST: Paginación - máximo per_page es 100
  # ============================================================================
  test "should limit per_page to maximum of 100" do
    # ACT: Intentar solicitar 200 por página (debe limitarse a 100)
    get api_v1_movies_url, params: { per_page: 200 }
    
    # ASSERT
    json_response = JSON.parse(response.body)
    pagination = json_response["pagination"]
    
    # Debe limitarse a 100
    assert_equal 100, pagination["per_page"]  # O 100 si decides cambiar el límite
  end

  # ============================================================================
  # TEST: Paginación - página inválida retorna página 1
  # ============================================================================
  test "should default to page 1 if invalid page requested" do
    # ACT: Solicitar página 0 o negativa
    get api_v1_movies_url, params: { page: 0 }
    
    # ASSERT
    json_response = JSON.parse(response.body)
    pagination = json_response["pagination"]
    
    assert_equal 1, pagination["current_page"]
  end

  # ============================================================================
  # TEST: Paginación - página más allá del límite
  # ============================================================================
  test "should handle page beyond total pages" do
    # ACT: Solicitar página 999 (no existe)
    get api_v1_movies_url, params: { page: 999 }
    
    # ASSERT: Debe retornar array vacío pero sin error
    assert_response :success
    
    json_response = JSON.parse(response.body)
    assert_equal 0, json_response["data"].length
    assert_equal 999, json_response["pagination"]["current_page"]
    # assert_nil json_response["pagination"]["next_page"]
  end

    # ============================================================================
  # TEST: Filtro por género
  # ============================================================================
  test "should filter movies by genre" do
    # ARRANGE: Tenemos películas de diferentes géneros en fixtures
    # inception, matrix = Sci-Fi
    # godfather = Crime
    
    # ACT: Filtrar solo Sci-Fi
    get api_v1_movies_url, params: { genre: "Sci-Fi" }
    
    # ASSERT
    assert_response :success
    
    json_response = JSON.parse(response.body)
    movies = json_response["data"]
    
    # Verificar que solo retorna películas de Sci-Fi
    assert movies.length >= 2, "Should have at least 2 Sci-Fi movies"
    
    movies.each do |movie|
      assert_equal "Sci-Fi", movie["genre"], 
                   "Movie #{movie['title']} should be Sci-Fi"
    end
    
    # Verificar metadata de filtros
    assert_equal "Sci-Fi", json_response["filters"]["genre"]
  end
  
  # ============================================================================
  # TEST: Filtro por género (case-insensitive)
  # ============================================================================
  test "should filter movies by genre case insensitive" do
    # ACT: Buscar "sci-fi" en minúsculas
    get api_v1_movies_url, params: { genre: "sci-fi" }
    
    # ASSERT: Debe encontrar "Sci-Fi"
    assert_response :success
    
    json_response = JSON.parse(response.body)
    movies = json_response["data"]
    
    assert movies.length >= 2, "Should find Sci-Fi movies regardless of case"
  end

  # ============================================================================
  # TEST: Filtro por año
  # ============================================================================
  test "should filter movies by year" do
    # ARRANGE: Tenemos películas de diferentes años
    # inception = 2010, matrix = 1999, godfather = 1972
    
    # ACT: Filtrar solo año 2010
    get api_v1_movies_url, params: { year: 2010 }
    
    # ASSERT
    assert_response :success
    
    json_response = JSON.parse(response.body)
    movies = json_response["data"]
    
    # Verificar que todas las películas son del 2010
    movies.each do |movie|
      assert_equal 2010, movie["year"]&.to_i,
                   "Movie #{movie['title']} should be from 2010"
    end
    
    # Verificar metadata
    assert_equal 2010, json_response["filters"]["year"].to_i
  end

  # ============================================================================
  # TEST: Búsqueda por título
  # ============================================================================
  test "should search movies by title" do
    # ACT: Buscar "Inception"
    get api_v1_movies_url, params: { q: "Inception" }
    
    # ASSERT
    assert_response :success
    
    json_response = JSON.parse(response.body)
    movies = json_response["data"]
    
    # Debe encontrar al menos Inception
    assert movies.length >= 1, "Should find at least one movie"
    
    # Verificar que Inception está en los resultados
    inception = movies.find { |m| m["title"] == "Inception" }
    assert_not_nil inception, "Should find Inception in search results"
  end

  # ============================================================================
  # TEST: Búsqueda por director
  # ============================================================================
  test "should search movies by director" do
    # ACT: Buscar "Nolan" (director de Inception)
    get api_v1_movies_url, params: { q: "Nolan" }
    
    # ASSERT
    assert_response :success
    
    json_response = JSON.parse(response.body)
    movies = json_response["data"]
    
    # Debe encontrar Inception (dirigida por Christopher Nolan)
    assert movies.length >= 1, "Should find movies by Nolan"
    
    # Verificar que todas tienen "Nolan" en el director
    movies.each do |movie|
      assert_includes movie["director"].downcase, "nolan",
                      "Movie director should contain 'nolan'"
    end
  end

  # ============================================================================
  # TEST: Búsqueda case-insensitive
  # ============================================================================
  test "should search movies case insensitive" do
    # ACT: Buscar en minúsculas
    get api_v1_movies_url, params: { q: "matrix" }
    
    # ASSERT: Debe encontrar "The Matrix"
    assert_response :success
    
    json_response = JSON.parse(response.body)
    movies = json_response["data"]
    
    assert movies.length >= 1, "Should find Matrix regardless of case"
    
    matrix = movies.find { |m| m["title"].downcase.include?("matrix") }
    assert_not_nil matrix, "Should find The Matrix"
  end

  # ============================================================================
  # TEST: Combinar múltiples filtros
  # ============================================================================
  test "should combine multiple filters" do
    # ARRANGE: Crear películas específicas para este test
    Movie.create!(
      title: "Interstellar",
      director: "Christopher Nolan",
      year: 2014,
      genre: "Sci-Fi"
    )
    
    Movie.create!(
      title: "The Dark Knight",
      director: "Christopher Nolan",
      year: 2008,
      genre: "Action"
    )
    
    # ACT: Buscar películas de Sci-Fi de Nolan
    get api_v1_movies_url, params: { genre: "Sci-Fi", q: "Nolan" }
    
    # ASSERT
    assert_response :success
    
    json_response = JSON.parse(response.body)
    movies = json_response["data"]
    
    # Debe encontrar Interstellar e Inception (ambas Sci-Fi de Nolan)
    # pero NO The Dark Knight (es Action)
    movies.each do |movie|
      assert_equal "Sci-Fi", movie["genre"]
      assert_includes movie["director"].downcase, "nolan"
    end
  end

  # ============================================================================
  # TEST: Filtros sin resultados
  # ============================================================================
  test "should return empty array when no movies match filters" do
    # ACT: Buscar algo que no existe
    get api_v1_movies_url, params: { genre: "Western", year: 1950 }
    
    # ASSERT: No debe fallar, solo retornar array vacío
    assert_response :success
    
    json_response = JSON.parse(response.body)
    
    assert_equal 0, json_response["data"].length
    assert_equal 0, json_response["pagination"]["total_count"]
  end

  # ============================================================================
  # TEST: Filtros con paginación
  # ============================================================================
  test "should work filters with pagination" do
    # ARRANGE: Crear 25 películas de Sci-Fi
    25.times do |i|
      Movie.create!(
        title: "Sci-Fi Movie #{i}",
        director: "Director #{i}",
        year: 2020,
        genre: "Sci-Fi"
      )
    end
    
    # ACT: Primera página de películas Sci-Fi (per_page=20)
    get api_v1_movies_url, params: { genre: "Sci-Fi", page: 1, per_page: 20 }
    
    # ASSERT
    assert_response :success
    
    json_response = JSON.parse(response.body)
    
    # Debe haber 20 películas en página 1
    assert_equal 20, json_response["data"].length
    
    # Total debe ser 25 (las que creamos) + 2 (inception, matrix) = 27
    assert json_response["pagination"]["total_count"] >= 27
    
    # Debe haber página 2
    assert_equal 2, json_response["pagination"]["next_page"]
  end

  # ============================================================================
  # TEST: Año inválido es ignorado
  # ============================================================================
  test "should ignore invalid year filter" do
    # ACT: Año inválido (demasiado antiguo)
    get api_v1_movies_url, params: { year: 1800 }
    
    # ASSERT: Debe retornar todas las películas (ignora el filtro)
    assert_response :success
    
    json_response = JSON.parse(response.body)
    
    # Debe retornar todas las películas de fixtures (al menos 4)
    assert json_response["data"].length >= 4
  end
end