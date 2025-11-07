# Be sure to restart your server when you modify this file.

# Avoid CORS issues when API is called from the frontend app.
# Handle Cross-Origin Resource Sharing (CORS) in order to accept cross-origin Ajax requests.

# Read more: https://github.com/cyu/rack-cors

Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    if Rails.env.development?  
      allowed_origins = ENV['ALLOWED_ORIGINS']&.split(',')
      origins(*allowed_origins)
    else
      # Produccion: solo el dominio frontend
      origins ENV.fetch['FRONTEND_URL']
    end

    resource "/api/*",
      headers: :any,
      methods: [:get, :post, :put, :patch, :delete, :options, :head],
      credentials: false,
      max_age: 600
  end
end