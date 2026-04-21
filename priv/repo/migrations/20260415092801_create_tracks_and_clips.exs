defmodule Soundsync.Repo.Migrations.CreateTracksAndClips do
  use Ecto.Migration

  def change do
    create table(:tracks) do
      add :row_index, :integer, null: false

      add :project_id, references(:projects, on_delete: :delete_all), null: false
    end

    create unique_index(:tracks, [:project_id, :row_index])

    create table(:clips) do
      add :title, :string, null: true
      add :type, :string, null: false
      add :start_time, :integer, null: false
      add :duration, :integer, null: false
      add :settings, :map, null: true, default: %{}
      add :file_path, :string, null: true

      add :track_id, references(:tracks, on_delete: :delete_all), null: false
    end
  end
end
