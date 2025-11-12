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
end