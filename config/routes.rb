Rails.application.routes.draw do
  # Health check endpoint
  get "up" => "rails/health#show", as: :rails_health_check

  # API Routes
  namespace :api do
    namespace :v1 do
      resources :movies
    end
  end

  # Documentacion de rutas disponibles 
  # Accede a http://localhost:3000/api/v1 para ver info
  namespace :api do
    namespace :v1 do
      get '/', to: proc {
        [200, {'Content-Type' => 'application/json'},
        [{
          message: 'Movie API v1',
    endpoints: {
      movies: '/api/v1/movies',
      movie: '/api/v1/movies/:id'
    }
  }.to_json]]
      }
    end
  end
end

