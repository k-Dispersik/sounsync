defmodule Soundsync.Repo.Migrations.AddSettingsToProjects do
  use Ecto.Migration

  def change do
    alter table(:projects) do
      add :settings, :map, null: false, default: %{"bpm" => 120}
    end
  end
end
