class Api::V1::MoviesController < ApplicationController
  # Deshabilitamos proteccion CSRF para API
  # skip_before_action :verify_authenticity_token

  # Callbacks
  before_action :set_movie, only: [:show, :update, :destroy]

  # GET /api/v1/movies
  def index
    page = params[:page].to_i 
    page = 1 if page < 1 # Validamos que no sea NUNCA menor a 1

    per_page = params[:per_page].to_i

    if per_page < 1
      per_page = 20
    elsif per_page > 100
      per_page = 100
    end

    # Calculamos el salto por pagina
    offset = (page - 1) * per_page

    # ===================================
    # CONSTRUCCION DE QUERY CON FILTROS.
    # ===================================
    # Obtenemos todas las peliculas
    @movies = Movie.all
    # Aplicamos filtros, si es que hay
    @movies = apply_filters(@movies)
    # contamos cantidad DESPUES de aplicar filtros
    total_count = @movies.count
    # Aplicamos ordenamiento y paginacion
    @movies = @movies.order(created_at: :desc)
                    .limit(per_page)
                    .offset(offset)

    # ====================================
    # METADA DE PAGINACION
    # ====================================
    # Calculamos la metadata de paginacion
    total_pages = (total_count.to_f / per_page).ceil # Redondeamos hacia arriba
    # Calculamos next_page y prev_page
    next_page = page < total_pages ? page + 1 : nil
    prev_page = page > 1 ? page - 1 : nil

    # ==================
    # RESPUESTA JSON
    # ==================

    render json: {
      status: 'success',
      data: @movies,
      pagination: {
        current_page: page,
        per_page: per_page,
        total_count: total_count,
        total_pages: total_pages,
        next_page: next_page,
        prev_page: prev_page
      },
      filters: applied_filters_summary,
      message: 'Movies retrieved successfully'
    }, status: :ok
  end

  # GET /api/v1/movies/:id
  def show
    render json: {
      status: 'success',
      data: @movie,
      message: 'Movie retrieved successfully'
    }, status: :ok
  end

  # POST /api/v1/movies
  def create
    @movie = Movie.new(movie_params)

    if @movie.save
      render json: {
        status: 'success',
        data: @movie,
        message: 'Movie created successfully'
      }, status: :created
    else
      render json: {
        status: 'error',
        data: @movie.errors,
        message: 'Movie creation failed'
      }, status: :unprocessable_entity
    end
  end

  # PATCH/PUT /api/v1/movies/:id
  def update
    if @movie.update(movie_params)
      render json: {
        status: 'success',
        data: @movie,
        message: 'Movie updated successfully'
      }, status: :ok
    else
      render json: {
        status: 'error',
        data: @movie.errors,
        message: 'Movie update failed'
      }, status: :unprocessable_entity
    end
  end

  # DELETE /api/v1/movies/:id
  def destroy
    @movie.destroy

    render json: {
      status: 'success',
      data: nil,
      message: 'Movie deleted successfully'
    }, status: :ok
  end

  private

  # Buscar pelicula por id
  def set_movie
    @movie = Movie.find_by(id: params[:id])

    unless @movie
      render json: {
        status: 'error',
        data: nil,
        message: "Movie with ID #{params[:id]} not found"
      }, status: :not_found
      return
    end
  end

  # Strong parameters (seguridad)
  def movie_params
    params.require(:movie).permit(
      :title,
      :director,
      :year,
      :genre,
      :rating,
      :synopsis,
      :poster_url
    )
  end



  # ======================
  # Metodo para filtros
  # ======================
  # Aplica todos los filtros disponibles a la query
  def apply_filters(query)
    query = filter_by_genre(query) if params[:genre].present?
    query = filter_by_year(query) if params[:year].present?
    query = filter_by_search(query) if params[:q].present?
    query
  end

  # Filtro por genero (case-insensitive)
  def filter_by_genre(query)
    genre = params[:genre].strip
    # Utilizamos ILIKE para postgresql
    query.where("LOWER(genre) = ?", genre.downcase)
  end

  # Filtro por year
  def filter_by_year(query)
    year = params[:year].to_i

    # Validar que el year sea razonable
    return query if year < 1930 || year > (Date.current.year + 5)

    query.where(year: year)
  end

  # Busqueda en titulo y director (case-insensitive)
  def filter_by_search(query)
    search_term = params[:q].strip
    # Escapar caracteres especiales de SQL
    search_pattern = "%#{sanitize_sql_like(search_term)}%"
    # Buscamos en titulo o director
    query.where(
      "LOWER(title) ILIKE ? OR LOWER(director) ILIKE ?",
      search_pattern.downcase,
      search_pattern.downcase
    )
  end

  # Genera un resumen de los filtro aplicados
  def applied_filters_summary
    filters = {}
    filters[:genre] = params[:genre] if params[:genre].present?
    filters[:year] = params[:year] if params[:year].present?
    filters[:q] = params[:q] if params[:q].present?
    filters
  end

  # Helper para escapar caracteres especiales en LIKE
  def sanitize_sql_like(string)
    string.gsub(/[%_]/,'\\\\\0')
  end
end
