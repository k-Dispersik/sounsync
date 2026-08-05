defmodule SoundsyncWeb.API.V1.ClipControllerTest do
  use SoundsyncWeb.ConnCase, async: true

  alias Core.Accounts
  alias Core.Projects
  alias Core.Projects.Clip
  alias Soundsync.Repo

  setup %{conn: conn} do
    owner = user_fixture()
    project = project_fixture(%{user: owner})
    track = track_fixture(project)
    clip = clip_fixture(track, %{title: "Kick", start_time: 0})

    viewer = user_fixture()
    {:ok, _} = Projects.add_member(project, viewer, :viewer)

    %{conn: conn, owner: owner, viewer: viewer, project: project, track: track, clip: clip}
  end

  defp as(conn, user) do
    put_req_header(conn, "authorization", "Bearer " <> Accounts.create_session_token(user))
  end

  defp clips_path(project, track), do: ~p"/v1/projects/#{project.id}/tracks/#{track.id}/clips"

  @valid %{title: "Snare", type: "drums", start_time: 2_000, duration: 1_000}

  describe "POST .../clips" do
    test "creates a clip on the track", ctx do
      %{conn: conn, owner: owner, project: project, track: track} = ctx

      body = conn |> as(owner) |> post(clips_path(project, track), @valid) |> json_response(201)

      assert body["title"] == "Snare"
      assert body["start_time"] == 2_000
      assert Repo.get(Clip, body["id"]).track_id == track.id
    end

    test "a viewer may not add clips", ctx do
      %{conn: conn, viewer: viewer, project: project, track: track} = ctx

      assert json_response(conn |> as(viewer) |> post(clips_path(project, track), @valid), 403)
    end

    test "missing required fields are 422 with per-field messages", ctx do
      %{conn: conn, owner: owner, project: project, track: track} = ctx

      conn = conn |> as(owner) |> post(clips_path(project, track), %{title: "No timing"})

      assert %{"error" => %{"code" => "validation_failed", "details" => details}} =
               json_response(conn, 422)

      assert details["start_time"]
      assert details["duration"]
    end

    test "no token, no clip", ctx do
      %{conn: conn, project: project, track: track} = ctx

      assert %{"error" => %{"code" => "unauthorized"}} =
               json_response(post(conn, clips_path(project, track), @valid), 401)
    end

    test "a track from another project is 404", ctx do
      %{conn: conn, owner: owner, project: project} = ctx
      foreign = project_fixture() |> track_fixture()

      assert json_response(conn |> as(owner) |> post(clips_path(project, foreign), @valid), 404)
    end
  end

  describe "PATCH .../clips/:id" do
    test "moves the clip", ctx do
      %{conn: conn, owner: owner, project: project, track: track, clip: clip} = ctx

      body =
        conn
        |> as(owner)
        |> patch("#{clips_path(project, track)}/#{clip.id}", %{start_time: 4_000})
        |> json_response(200)

      assert body["start_time"] == 4_000
      assert Repo.get(Clip, clip.id).start_time == 4_000
    end

    test "a viewer may not move it", ctx do
      %{conn: conn, viewer: viewer, project: project, track: track, clip: clip} = ctx

      conn =
        conn
        |> as(viewer)
        |> patch("#{clips_path(project, track)}/#{clip.id}", %{start_time: 4_000})

      assert json_response(conn, 403)
      assert Repo.get(Clip, clip.id).start_time == 0
    end

    test "an unknown clip is 404", ctx do
      %{conn: conn, owner: owner, project: project, track: track} = ctx

      conn =
        conn |> as(owner) |> patch("#{clips_path(project, track)}/0", %{start_time: 4_000})

      assert json_response(conn, 404)
    end

    test "a start time that is not a number is 422", ctx do
      %{conn: conn, owner: owner, project: project, track: track, clip: clip} = ctx

      conn =
        conn
        |> as(owner)
        |> patch("#{clips_path(project, track)}/#{clip.id}", %{start_time: "soon"})

      assert %{"error" => %{"code" => "validation_failed", "details" => details}} =
               json_response(conn, 422)

      assert details["start_time"]
    end

    test "no token, no move", ctx do
      %{conn: conn, project: project, track: track, clip: clip} = ctx

      conn = patch(conn, "#{clips_path(project, track)}/#{clip.id}", %{start_time: 4_000})

      assert json_response(conn, 401)
    end
  end
end
