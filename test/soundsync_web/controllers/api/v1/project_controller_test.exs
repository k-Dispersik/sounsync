defmodule SoundsyncWeb.API.V1.ProjectControllerTest do
  use SoundsyncWeb.ConnCase, async: true

  alias Core.Accounts
  alias Core.ProjectsCtx.Projects

  @settings_body %{
    "settings" => %{"bpm" => 90, "time_signature" => "4/4", "timeline_length_ms" => 60_000}
  }

  setup %{conn: conn} do
    owner = user_fixture()
    project = project_fixture(%{user: owner, title: "Owned"})
    track = track_fixture(project)
    clip = clip_fixture(track)

    %{conn: conn, owner: owner, project: project, track: track, clip: clip}
  end

  defp as(conn, user) do
    put_req_header(conn, "authorization", "Bearer " <> Accounts.create_session_token(user))
  end

  describe "GET /v1/projects" do
    test "lists only the caller's own projects", %{conn: conn, owner: owner} do
      project_fixture(%{title: "Someone else's"})

      body = conn |> as(owner) |> get(~p"/v1/projects") |> json_response(200)

      assert Enum.map(body, & &1["title"]) == ["Owned"]
    end

    test "B-1: a list of projects with tracks does not blow up", %{conn: conn, owner: owner} do
      assert [summary] = conn |> as(owner) |> get(~p"/v1/projects") |> json_response(200)

      assert summary["title"] == "Owned"
      assert summary["settings"]["bpm"]
    end

    test "D-6: the summary carries no associations", %{conn: conn, owner: owner} do
      assert [summary] = conn |> as(owner) |> get(~p"/v1/projects") |> json_response(200)

      refute Map.has_key?(summary, "tracks")
    end

    test "a user with no projects gets an empty list", %{conn: conn} do
      assert [] = conn |> as(user_fixture()) |> get(~p"/v1/projects") |> json_response(200)
    end
  end

  describe "GET /v1/projects/:id" do
    test "the owner sees the project with its tracks and clips", ctx do
      %{conn: conn, owner: owner, project: project} = ctx

      body = conn |> as(owner) |> get(~p"/v1/projects/#{project.id}") |> json_response(200)

      assert body["title"] == "Owned"
      assert [%{"clips" => [clip]}] = body["tracks"]
      assert clip["start_time"] == 0
    end

    test "a viewer sees it too", %{conn: conn, project: project} do
      viewer = user_fixture()
      {:ok, _} = Projects.add_member(project, viewer, :viewer)

      assert conn |> as(viewer) |> get(~p"/v1/projects/#{project.id}") |> json_response(200)
    end

    test "S-1: a stranger gets 403", %{conn: conn, project: project} do
      conn = conn |> as(user_fixture()) |> get(~p"/v1/projects/#{project.id}")

      assert %{"error" => %{"code" => "forbidden", "message" => "Forbidden"}} =
               json_response(conn, 403)
    end

    test "a missing project is 404", %{conn: conn, owner: owner} do
      assert conn |> as(owner) |> get(~p"/v1/projects/0") |> json_response(404)
    end
  end

  describe "POST /v1/projects" do
    test "B-2: the route reaches the action and makes the caller the owner", %{conn: conn} do
      user = user_fixture()

      body =
        conn
        |> as(user)
        |> post(~p"/v1/projects", %{title: "Fresh", description: "d"})
        |> json_response(201)

      assert body["title"] == "Fresh"
      assert Projects.member_role(Projects.get(body["id"]), user) == :owner
    end
  end

  describe "PATCH /v1/projects/:id/settings" do
    setup %{project: project} do
      viewer = user_fixture()
      {:ok, _} = Projects.add_member(project, viewer, :viewer)

      %{viewer: viewer}
    end

    test "the owner may change settings", %{conn: conn, owner: owner, project: project} do
      conn = conn |> as(owner) |> patch(~p"/v1/projects/#{project.id}/settings", @settings_body)

      assert json_response(conn, 200)["settings"]["bpm"] == 90
    end

    test "a viewer may not", %{conn: conn, viewer: viewer, project: project} do
      conn = conn |> as(viewer) |> patch(~p"/v1/projects/#{project.id}/settings", @settings_body)

      assert json_response(conn, 403)
    end

    test "a stranger may not", %{conn: conn, project: project} do
      conn =
        conn
        |> as(user_fixture())
        |> patch(~p"/v1/projects/#{project.id}/settings", @settings_body)

      assert json_response(conn, 403)
    end
  end
end
