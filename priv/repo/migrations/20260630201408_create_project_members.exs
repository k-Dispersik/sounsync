defmodule Soundsync.Repo.Migrations.CreateProjectMembers do
  use Ecto.Migration

  # `projects_users` could only say that a user is attached to a project, not
  # what they are allowed to do with it. Authorisation needs a role, so the
  # join table becomes a first-class one.
  def up do
    create table(:project_members) do
      add :project_id, references(:projects, on_delete: :delete_all), null: false
      add :user_id, references(:users, on_delete: :delete_all), null: false
      add :role, :string, null: false, default: "editor"

      timestamps()
    end

    create unique_index(:project_members, [:project_id, :user_id])
    create index(:project_members, [:user_id])

    # Everyone attached to a project so far created it, so they become owners.
    execute("""
    INSERT INTO project_members (project_id, user_id, role, inserted_at, updated_at)
    SELECT project_id, user_id, 'owner', NOW(), NOW() FROM projects_users
    """)

    drop table(:projects_users)
  end

  def down do
    create table(:projects_users, primary_key: false) do
      add :project_id, references(:projects, on_delete: :delete_all), null: false
      add :user_id, references(:users, on_delete: :delete_all), null: false
    end

    create unique_index(:projects_users, [:project_id, :user_id])

    execute("""
    INSERT INTO projects_users (project_id, user_id)
    SELECT project_id, user_id FROM project_members
    """)

    drop table(:project_members)
  end
end
