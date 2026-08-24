defmodule Core.Projects.OperationTest do
  @moduledoc """
  Operations are what realtime edits turn into, so the checks that matter are
  the ones that stop a bad edit reaching the database: an unknown type, a
  payload missing a field, a viewer, a track from another project.
  """

  use Soundsync.DataCase, async: true

  alias Core.Projects
  alias Core.Projects.Clip
  alias Core.Projects.Operation
  alias Core.Projects.Track

  setup do
    owner = user_fixture()
    project = project_fixture(%{user: owner})
    track = track_fixture(project, %{row_index: 0})
    clip = clip_fixture(track, %{title: "Kick", start_time: 0})

    %{owner: owner, project: reload(project), track: track, clip: clip}
  end

  defp reload(project), do: Projects.get_project(project.id, assoc: [tracks: [:clips]])

  describe "authorisation" do
    test "a viewer may not edit", %{project: project} do
      viewer = user_fixture()
      {:ok, _} = Projects.add_member(project, viewer, :viewer)

      assert {:error, :forbidden} =
               Operation.apply(project, viewer, "track.create", %{"row_index" => 1})

      assert Repo.aggregate(Track, :count) == 1
    end

    test "a stranger may not edit", %{project: project} do
      assert {:error, :forbidden} =
               Operation.apply(project, user_fixture(), "track.create", %{"row_index" => 1})
    end
  end

  describe "validation" do
    test "an unknown operation is refused, not ignored", %{project: project, owner: owner} do
      assert {:error, :unknown_operation} =
               Operation.apply(project, owner, "project.delete", %{})
    end

    test "a missing required field is refused before anything is written", ctx do
      %{project: project, owner: owner} = ctx

      assert {:error, changeset} = Operation.apply(project, owner, "clip.create", %{})
      assert errors_on(changeset).start_time
      assert Repo.aggregate(Clip, :count) == 1
    end

    test "a field of the wrong type is refused", %{project: project, owner: owner} do
      assert {:error, changeset} =
               Operation.apply(project, owner, "track.create", %{"row_index" => "second"})

      assert errors_on(changeset).row_index
    end

    test "unknown keys in the payload are dropped, not stored", ctx do
      %{project: project, owner: owner} = ctx

      assert {:ok, %{data: %Track{} = track}} =
               Operation.apply(project, owner, "track.create", %{
                 "row_index" => 4,
                 "project_id" => 999,
                 "id" => 12_345
               })

      assert track.project_id == project.id
      refute track.id == 12_345
    end
  end

  describe "tracks" do
    test "track.create adds one and reports it", %{project: project, owner: owner} do
      assert {:ok, %{type: "track.create", data: %Track{row_index: 2}}} =
               Operation.apply(project, owner, "track.create", %{"row_index" => 2})

      assert Repo.aggregate(Track, :count) == 2
    end

    test "track.delete removes it", ctx do
      %{project: project, owner: owner, track: track} = ctx

      assert {:ok, %{type: "track.delete", data: %{track_id: id}}} =
               Operation.apply(project, owner, "track.delete", %{"track_id" => track.id})

      assert id == track.id
      refute Repo.get(Track, track.id)
    end

    test "a track from another project cannot be deleted through this one", ctx do
      %{project: project, owner: owner} = ctx
      foreign = project_fixture() |> track_fixture()

      assert {:error, :not_found} =
               Operation.apply(project, owner, "track.delete", %{"track_id" => foreign.id})

      assert Repo.get(Track, foreign.id)
    end
  end

  describe "clips" do
    test "clip.create places one on a track", ctx do
      %{project: project, owner: owner, track: track} = ctx

      assert {:ok, %{type: "clip.create", data: %Clip{} = clip}} =
               Operation.apply(project, owner, "clip.create", %{
                 "track_id" => track.id,
                 "start_time" => 2_000,
                 "duration" => 1_000,
                 "type" => "drums"
               })

      assert clip.start_time == 2_000
      assert clip.track_id == track.id
    end

    test "clip.move changes where it sits", ctx do
      %{project: project, owner: owner, track: track, clip: clip} = ctx

      assert {:ok, %{type: "clip.move", data: %Clip{start_time: 4_000}}} =
               Operation.apply(project, owner, "clip.move", %{
                 "clip_id" => clip.id,
                 "track_id" => track.id,
                 "start_time" => 4_000
               })

      assert Repo.get(Clip, clip.id).start_time == 4_000
    end

    test "clip.update changes only what it names", ctx do
      %{project: project, owner: owner, track: track, clip: clip} = ctx

      {:ok, _event} =
        Operation.apply(project, owner, "clip.update", %{
          "clip_id" => clip.id,
          "track_id" => track.id,
          "title" => "Snare"
        })

      updated = Repo.get(Clip, clip.id)
      assert updated.title == "Snare"
      assert updated.start_time == clip.start_time
    end

    test "clip.delete removes it", ctx do
      %{project: project, owner: owner, track: track, clip: clip} = ctx

      assert {:ok, %{type: "clip.delete", data: %{clip_id: id}}} =
               Operation.apply(project, owner, "clip.delete", %{
                 "clip_id" => clip.id,
                 "track_id" => track.id
               })

      assert id == clip.id
      refute Repo.get(Clip, clip.id)
    end

    test "a clip on another project's track cannot be moved", ctx do
      %{project: project, owner: owner, clip: clip} = ctx
      foreign_track = project_fixture() |> track_fixture()

      assert {:error, :not_found} =
               Operation.apply(project, owner, "clip.move", %{
                 "clip_id" => clip.id,
                 "track_id" => foreign_track.id,
                 "start_time" => 9_000
               })

      assert Repo.get(Clip, clip.id).start_time == 0
    end
  end

  describe "settings" do
    test "project.settings.update changes what it names and leaves the rest", ctx do
      %{project: project, owner: owner} = ctx

      assert {:ok, %{type: "project.settings.update", data: updated}} =
               Operation.apply(project, owner, "project.settings.update", %{"bpm" => 90})

      assert updated.settings.bpm == 90
      assert updated.settings.time_signature == :four_four
    end

    test "an impossible tempo is refused", ctx do
      %{project: project, owner: owner} = ctx

      assert {:error, %Ecto.Changeset{}} =
               Operation.apply(project, owner, "project.settings.update", %{"bpm" => 5})

      assert reload(project).settings.bpm == 120
    end
  end

  test "types/0 lists every operation the schemas cover" do
    assert Enum.sort(Operation.types()) == [
             "clip.create",
             "clip.delete",
             "clip.move",
             "clip.update",
             "project.settings.update",
             "track.create",
             "track.delete"
           ]
  end
end
