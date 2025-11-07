class Movie < ApplicationRecord
    # Validaciones de presencia
    validates :title, presence: true, length: { minimum: 1, maximum: 255 }
    validates :director, presence: true, length: { minimum: 1, maximum: 255 }
    validates :year, presence: true, numericality: {
        only_integer: true,
        greatedr_than_or_equal_to: 1930, # Para no ir tan atras en el tiempo
        less_than_or_equal_to: -> { Time.current.year + 5 } # Proximos estrenos 
    }
    validates :genre, presence: true

    # Validaciones para el rating
    validates :rating, numericality: {
        greatedr_than_or_equal_to: 0.0,
        less_than_or_equal_to: 10.0,
        allow_nil: true
    }

    # Validacion de URL del poster
    validates :poster_url, format: {
        with: URI::DEFAULT_PARSER.make_regexp(%w[http https]),
        message: "must be a valid URL",
        allow_blank: true
    }
end
