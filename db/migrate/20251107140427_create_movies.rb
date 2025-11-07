class CreateMovies < ActiveRecord::Migration[8.1]
  def change
    create_table :movies do |t|
      t.string :title, null: false
      t.string :director, null: false
      t.integer :year, null: false
      t.string :genre, null: false
      t.decimal :rating, precision: 3, scale: 1
      t.text :synopsis
      t.string :poster_url

      t.timestamps
    end

    # Indices para busquedas mas rapidas
    add_index :movies, :title
    add_index :movies, :genre
    add_index :movies, :year
  end
end
