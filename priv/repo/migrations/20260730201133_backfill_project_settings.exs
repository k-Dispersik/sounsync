defmodule Soundsync.Repo.Migrations.BackfillProjectSettings do
  use Ecto.Migration

  @defaults %{bpm: 120, time_signature: "four_four", timeline_length_ms: 60_000}

  # The column default was only `{"bpm": 120}`, and Ecto's `defaults_to_struct`
  # fills a NULL column, not a half-filled map. Projects created before the
  # other two keys existed therefore load them as nil, which the frontend has
  # been papering over with `|| "4/4"`. Fill them in once, and give the column
  # a complete default so it cannot happen again.
  def up do
    execute("""
    UPDATE projects SET settings = jsonb_build_object(
      'bpm',                COALESCE(settings->'bpm', '#{@defaults.bpm}'::jsonb),
      'time_signature',     COALESCE(settings->'time_signature', '"#{@defaults.time_signature}"'::jsonb),
      'timeline_length_ms', COALESCE(settings->'timeline_length_ms', '#{@defaults.timeline_length_ms}'::jsonb)
    )
    """)

    alter table(:projects) do
      modify :settings, :map, null: false, default: @defaults
    end
  end

  def down do
    alter table(:projects) do
      modify :settings, :map, null: false, default: %{bpm: 120}
    end
  end
end
