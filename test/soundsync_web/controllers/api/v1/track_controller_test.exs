defmodule SoundsyncWeb.API.V1.TrackControllerTest do
  use SoundsyncWeb.ConnCase, async: true

  alias Core.Accounts
  alias Core.Projects
  alias Core.Projects.Track
  alias Soundsync.Repo

  setup %{conn: conn} do
    owner = user_fixture()
    project = project_fixture(%{user: owner})
    track = track_fixture(project)

    viewer = user_fixture()
    {:ok, _} = Projects.add_member(project, viewer, :viewer)

    %{conn: conn, owner: owner, viewer: viewer, project: project, track: track}
  end

  defp as(conn, user) do
    put_req_header(conn, "authorization", "Bearer " <> Accounts.create_session_token(user))
  end

  describe "POST /v1/projects/:project_id/tracks" do
    test "creates a track for a member who may write", ctx do
      %{conn: conn, owner: owner, project: project} = ctx

      body =
        conn
        |> as(owner)
        |> post(~p"/v1/projects/#{project.id}/tracks", %{row: 3})
        |> json_response(201)

      assert body["row_index"] == 3
      assert body["project_id"] == project.id
    end

    test "a viewer gets 403", %{conn: conn, viewer: viewer, project: project} do
      conn = conn |> as(viewer) |> post(~p"/v1/projects/#{project.id}/tracks", %{row: 3})

      assert %{"error" => %{"code" => "forbidden"}} = json_response(conn, 403)
    end

    test "a stranger gets 403", %{conn: conn, project: project} do
      conn = conn |> as(user_fixture()) |> post(~p"/v1/projects/#{project.id}/tracks", %{row: 3})

      assert json_response(conn, 403)
    end

    test "no token, no track", %{conn: conn, project: project} do
      assert json_response(post(conn, ~p"/v1/projects/#{project.id}/tracks", %{row: 3}), 401)
    end

    test "D-5: a missing row is 422 with a per-field message, not a crash", ctx do
      %{conn: conn, owner: owner, project: project} = ctx

      conn = conn |> as(owner) |> post(~p"/v1/projects/#{project.id}/tracks", %{})

      assert %{"error" => %{"code" => "validation_failed", "details" => details}} =
               json_response(conn, 422)

      assert details["row"] == ["can't be blank"]
    end

    test "an unknown project is 404", %{conn: conn, owner: owner} do
      assert json_response(conn |> as(owner) |> post(~p"/v1/projects/0/tracks", %{row: 1}), 404)
    end

    test "a project id that is not a number is 404, not a 500", ctx do
      %{conn: conn, owner: owner} = ctx

      assert json_response(conn |> as(owner) |> post(~p"/v1/projects/abc/tracks", %{row: 1}), 404)
    end
  end

  describe "DELETE /v1/projects/:project_id/tracks/:id" do
    test "removes the track and answers 204", ctx do
      %{conn: conn, owner: owner, project: project, track: track} = ctx

      conn = conn |> as(owner) |> delete(~p"/v1/projects/#{project.id}/tracks/#{track.id}")

      assert response(conn, 204)
      refute Repo.get(Track, track.id)
    end

    test "a viewer may not delete", ctx do
      %{conn: conn, viewer: viewer, project: project, track: track} = ctx

      conn = conn |> as(viewer) |> delete(~p"/v1/projects/#{project.id}/tracks/#{track.id}")

      assert json_response(conn, 403)
      assert Repo.get(Track, track.id)
    end

    test "no token, no delete", ctx do
      %{conn: conn, project: project, track: track} = ctx

      conn = delete(conn, ~p"/v1/projects/#{project.id}/tracks/#{track.id}")

      assert %{"error" => %{"code" => "unauthorized"}} = json_response(conn, 401)
      assert Repo.get(Track, track.id)
    end

    test "a track id that is not a number is 404", ctx do
      %{conn: conn, owner: owner, project: project} = ctx

      conn = conn |> as(owner) |> delete(~p"/v1/projects/#{project.id}/tracks/abc")

      assert json_response(conn, 404)
    end

    test "a track from another project is 404", ctx do
      %{conn: conn, owner: owner, project: project} = ctx
      other_track = project_fixture() |> track_fixture()

      conn =
        conn |> as(owner) |> delete(~p"/v1/projects/#{project.id}/tracks/#{other_track.id}")

      assert json_response(conn, 404)
      assert Repo.get(Track, other_track.id)
    end
  end
end
