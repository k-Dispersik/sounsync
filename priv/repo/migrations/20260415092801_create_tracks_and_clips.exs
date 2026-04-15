defmodule Soundsync.Repo.Migrations.CreateTracksAndClips do
  use Ecto.Migration

  def change do
    create table(:tracks) do
      add :title, :string, null: true
      add :row_index, :integer, null: false
      add :category, :string, null: true

      add :project_id, references(:projects, on_delete: :delete_all), null: false
    end

    create unique_index(:tracks, [:project_id, :row_index])

    create table(:clips) do
      add :start_time, :integer, null: false
      add :duration, :integer, null: false
      add :settings, :map, null: false
      add :file_path, :string, null: false

      add :track_id, references(:tracks, on_delete: :delete_all), null: false
    end
  end
end
