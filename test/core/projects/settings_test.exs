defmodule Core.Projects.SettingsTest do
  use Soundsync.DataCase, async: true

  alias Core.Projects
  alias SoundsyncWeb.JSON

  test "B-11: a project stored with only a bpm still loads complete settings" do
    project = project_fixture()

    # What rows written before the other two keys existed look like. Raw SQL
    # on purpose: Ecto would refuse to write a half-filled embed.
    Repo.query!("UPDATE projects SET settings = '{\"bpm\": 140}'::jsonb WHERE id = $1", [
      project.id
    ])

    reloaded = Projects.get_project(project.id)

    assert reloaded.settings.bpm == 140
    refute is_nil(reloaded.settings.time_signature)
    refute is_nil(reloaded.settings.timeline_length_ms)
  end

  test "D-2: settings are serialised in snake_case" do
    settings = JSON.project(project_fixture(), :summary).settings

    assert Map.keys(settings) |> Enum.sort() == [:bpm, :time_signature, :timeline_length_ms]
    assert settings.time_signature == "4/4"
  end
end
