defmodule Soundsync.FixturesTest do
  @moduledoc """
  The factories are used by every other test, so a break in them reads as a
  break somewhere else entirely. Cheaper to catch it here.
  """

  use Soundsync.DataCase, async: true

  alias Core.Accounts.User
  alias Core.DB.Clip
  alias Core.DB.Project
  alias Core.DB.Track

  test "user_fixture/1 gives each user a unique email" do
    assert %User{name: "Test User"} = first = user_fixture()
    assert %User{} = second = user_fixture()

    refute first.email == second.email
  end

  test "user_fixture/1 takes overrides" do
    assert %User{name: "Ada", email: "ada@example.com"} =
             user_fixture(%{name: "Ada", email: "ada@example.com"})
  end

  test "project_fixture/1 attaches the project to a user" do
    user = user_fixture()
    project = project_fixture(%{user: user, title: "Session one"})

    assert %Project{title: "Session one"} = project
    assert project.settings.bpm == 120
    assert [%Project{id: id}] = Repo.preload(user, :projects).projects
    assert id == project.id
  end

  test "project_fixture/1 creates its own user when none is given" do
    assert %Project{} = project_fixture()
    assert Repo.aggregate(User, :count) == 1
  end

  test "track_fixture/2 and clip_fixture/2 build a full timeline row" do
    track = project_fixture() |> track_fixture(%{row_index: 2})
    clip = clip_fixture(track, %{title: "Snare", start_time: 2_000})

    assert %Track{row_index: 2} = track
    assert %Clip{title: "Snare", start_time: 2_000, type: :drums} = clip
    assert Repo.get!(Clip, clip.id).track_id == track.id
  end
end
