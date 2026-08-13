defmodule Soundsync.Repo.Migrations.CreateAudioFiles do
  use Ecto.Migration

  # A file lives on its own rather than inside a clip: the same sample is used
  # by several clips, and deleting the first of them must not take the audio
  # with it. Hence `on_delete: :restrict` on the clip side.
  def change do
    create table(:audio_files) do
      add :project_id, references(:projects, on_delete: :delete_all), null: false
      add :uploaded_by_id, references(:users, on_delete: :nilify_all)

      add :storage_key, :string, null: false
      add :original_filename, :string, null: false
      add :content_type, :string, null: false
      add :byte_size, :bigint, null: false
      add :checksum, :string

      # Filled in after the audio is analysed; absent until then.
      add :duration_ms, :integer
      add :peaks, :binary

      add :status, :string, null: false, default: "pending"

      timestamps()
    end

    create unique_index(:audio_files, [:storage_key])
    create index(:audio_files, [:project_id])

    # Same bytes uploaded twice into one project reuse the first file.
    create unique_index(:audio_files, [:project_id, :checksum])

    alter table(:clips) do
      add :audio_file_id, references(:audio_files, on_delete: :restrict)
    end

    create index(:clips, [:audio_file_id])
  end
end
