defmodule SoundsyncWeb.JSONTest do
  @moduledoc """
  The response shape is the contract, so it is pinned here rather than inferred
  from whichever endpoint happens to be under test.
  """

  use Soundsync.DataCase, async: true

  alias Core.Projects
  alias Core.Projects.Project
  alias SoundsyncWeb.JSON

  setup do
    project = project_fixture(%{title: "Session"})
    track = track_fixture(project, %{row_index: 1})
    clip_fixture(track, %{title: "Kick"})

    %{
      project: Projects.get_project(project.id, assoc: [tracks: [:clips]]),
      bare: Projects.get_project(project.id)
    }
  end

  test "the summary has the project's own fields and nothing else", %{project: project} do
    summary = JSON.project(project, :summary)

    assert summary.id == project.id
    assert summary.title == "Session"
    assert summary.settings.bpm == 120
    refute Map.has_key?(summary, :tracks)
  end

  test "the full shape carries tracks and their clips", %{project: project} do
    full = JSON.project(project, :full)

    assert [track] = full.tracks
    assert track.row_index == 1
    assert [%{title: "Kick"}] = track.clips
  end

  test "B-1: an unloaded association is left out, not guessed at", %{bare: bare} do
    assert %Ecto.Association.NotLoaded{} = bare.tracks

    full = JSON.project(bare, :full)

    refute Map.has_key?(full, :tracks)
  end

  test "an empty association is an empty list, not a missing key", %{project: project} do
    empty = %Project{project | tracks: []}

    assert JSON.project(empty, :full).tracks == []
  end

  test "a user is never serialised with their password", %{project: project} do
    [user] = Repo.preload(project, :users).users

    serialised = JSON.user(user)

    assert serialised.email == user.email
    refute Map.has_key?(serialised, :password)
  end
end
