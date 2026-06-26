defmodule Soundsync.Repo.Migrations.AddUniqueIndexToUsersEmail do
  use Ecto.Migration

  # `unique_constraint(:email)` has been in the changeset from the start, but
  # without an index behind it Postgres never raised, so duplicates got in.
  # citext makes the uniqueness case-insensitive: "Ada@x.com" and "ada@x.com"
  # are the same account to a person, and should be to the database too.
  def up do
    execute("CREATE EXTENSION IF NOT EXISTS citext", "")

    alter table(:users) do
      modify :email, :citext, null: false
    end

    create unique_index(:users, [:email])
  end

  def down do
    drop unique_index(:users, [:email])

    alter table(:users) do
      modify :email, :string, null: false
    end
  end
end
