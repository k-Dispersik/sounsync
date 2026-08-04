defmodule Core.SeedsTest do
  @moduledoc """
  D-19: `priv/repo/seeds.exs` must give a working local state in one command.
  Running the script is the only way to notice it drifting away from the
  contexts it calls.
  """

  use Soundsync.DataCase, async: true

  import ExUnit.CaptureIO

  alias Core.Accounts.User
  alias Core.Projects.Clip
  alias Core.Projects.Project
  alias Core.Projects.Track

  @seeds Path.expand("../../priv/repo/seeds.exs", __DIR__)

  defp run_seeds, do: capture_io(fn -> Code.eval_file(@seeds) end)

  test "creates a user with one project, three tracks and six clips" do
    run_seeds()

    assert %User{name: "Demo User"} = user = Repo.get_by(User, email: "demo@soundsync.local")
    assert [%Project{title: "Demo session"} = project] = Repo.preload(user, :projects).projects

    assert project.settings.bpm == 128
    assert project.settings.time_signature == :four_four

    assert Repo.aggregate(Track, :count) == 3
    assert Repo.aggregate(Clip, :count) == 6
  end

  test "stores a hashed password, not the plain one" do
    run_seeds()

    user = Repo.get_by(User, email: "demo@soundsync.local")

    refute user.password == "password123"
    assert Bcrypt.verify_pass("password123", user.password)
  end

  test "is idempotent: a second run changes nothing" do
    run_seeds()
    output = run_seeds()

    assert output =~ "already exists"
    assert Repo.aggregate(User, :count) == 1
    assert Repo.aggregate(Clip, :count) == 6
  end
end
