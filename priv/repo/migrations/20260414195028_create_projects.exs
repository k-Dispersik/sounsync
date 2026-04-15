defmodule Soundsync.Repo.Migrations.CreateProjects do
  use Ecto.Migration

  def change do
    create table(:projects) do
      add :title, :string, null: false
      add :description, :text

      timestamps()
    end

    create table(:projects_users, primary_key: false) do
      add :project_id, references(:projects, on_delete: :delete_all), null: false
      add :user_id, references(:users, on_delete: :delete_all), null: false
    end

    # Add a unique index to prevent duplicate entries for the same project
    create unique_index(:projects_users, [:project_id, :user_id])
  end
end
