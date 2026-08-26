defmodule Soundsync.Repo.Migrations.AddVersionToProjects do
  use Ecto.Migration

  # Every accepted edit bumps this. An operation carries the version it was
  # made against, so an edit built on a state the server has already moved past
  # can be refused instead of applied on top of something the client never saw.
  def change do
    alter table(:projects) do
      add :version, :integer, null: false, default: 0
    end
  end
end
