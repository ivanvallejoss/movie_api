class Api::V1::MoviesController < ApplicationController
  # Deshabilitamos proteccion CSRF para API
  # skip_before_action :verify_authenticity_token

  # Callbacks
  before_action :set_movie, only: [:show, :update, :destroy]

  # GET /api/v1/movies
  def index
    @movies = Movie.all.order(created_at: :desc)

    render json: {
      status: 'success',
      data: @movies,
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
end
