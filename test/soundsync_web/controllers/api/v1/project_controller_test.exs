defmodule SoundsyncWeb.API.V1.ProjectControllerTest do
  use SoundsyncWeb.ConnCase, async: true

  alias Core.Accounts
  alias Core.ProjectsCtx.Projects

  # The wire format the API speaks today; task 29 moves it to snake_case.
  @settings_body %{
    "settings" => %{"BPM" => 90, "timeSignature" => "4/4", "timelineLengthMs" => 60_000}
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

    test "B-1: a project with tracks does not blow the list up", %{conn: conn, owner: owner} do
      assert [%{"tracks" => [_track]}] =
               conn |> as(owner) |> get(~p"/v1/projects") |> json_response(200)
    end

    test "a user with no projects gets an empty list", %{conn: conn} do
      assert [] = conn |> as(user_fixture()) |> get(~p"/v1/projects") |> json_response(200)
    end
  end

  describe "GET /v1/projects/:id" do
    test "the owner sees the project", %{conn: conn, owner: owner, project: project} do
      body = conn |> as(owner) |> get(~p"/v1/projects/#{project.id}") |> json_response(200)

      assert body["title"] == "Owned"
    end

    test "a viewer sees it too", %{conn: conn, project: project} do
      viewer = user_fixture()
      {:ok, _} = Projects.add_member(project, viewer, :viewer)

      assert conn |> as(viewer) |> get(~p"/v1/projects/#{project.id}") |> json_response(200)
    end

    test "S-1: a stranger gets 403", %{conn: conn, project: project} do
      conn = conn |> as(user_fixture()) |> get(~p"/v1/projects/#{project.id}")

      assert json_response(conn, 403) == %{"error" => "Forbidden"}
    end

    test "a missing project is 404", %{conn: conn, owner: owner} do
      assert conn |> as(owner) |> get(~p"/v1/projects/0") |> json_response(404)
    end
  end

  # POST /v1/projects is not covered here: the router points at :create while
  # the controller defines create_project/2, so the route cannot be reached at
  # all. Creating a project and becoming its owner is covered in
  # Core.UsersCtxTest until the route names are put right.

  describe "write actions" do
    setup %{project: project} do
      viewer = user_fixture()
      {:ok, _} = Projects.add_member(project, viewer, :viewer)

      %{viewer: viewer, stranger: user_fixture()}
    end

    test "the owner may add a track", %{conn: conn, owner: owner, project: project} do
      conn = conn |> as(owner) |> post(~p"/v1/projects/#{project.id}/tracks", %{row: 7})

      assert json_response(conn, 201)["row_index"] == 7
    end

    test "an editor may add a track", %{conn: conn, project: project} do
      editor = user_fixture()
      {:ok, _} = Projects.add_member(project, editor, :editor)

      conn = conn |> as(editor) |> post(~p"/v1/projects/#{project.id}/tracks", %{row: 7})

      assert json_response(conn, 201)
    end

    test "a viewer may not add a track", %{conn: conn, viewer: viewer, project: project} do
      conn = conn |> as(viewer) |> post(~p"/v1/projects/#{project.id}/tracks", %{row: 7})

      assert json_response(conn, 403)
    end

    test "a stranger may not touch clips, settings or tracks", ctx do
      %{conn: conn, stranger: stranger, project: project, track: track, clip: clip} = ctx
      conn = as(conn, stranger)

      assert json_response(
               patch(conn, ~p"/v1/projects/#{project.id}/settings", @settings_body),
               403
             )

      assert json_response(
               delete(conn, ~p"/v1/projects/#{project.id}/tracks/#{track.id}"),
               403
             )

      assert json_response(
               post(conn, ~p"/v1/projects/#{project.id}/tracks/#{track.id}/clips", %{
                 project_id: project.id,
                 track_id: track.id,
                 start_time: 0,
                 duration: 1000
               }),
               403
             )

      assert json_response(
               patch(
                 conn,
                 ~p"/v1/projects/#{project.id}/tracks/#{track.id}/clips/#{clip.id}",
                 %{project_id: project.id, track_id: track.id, clip_id: clip.id, start_time: 10}
               ),
               403
             )
    end

    test "a viewer may not change settings", %{conn: conn, viewer: viewer, project: project} do
      conn = conn |> as(viewer) |> patch(~p"/v1/projects/#{project.id}/settings", @settings_body)

      assert json_response(conn, 403)
    end

    test "the owner may change settings", %{conn: conn, owner: owner, project: project} do
      conn = conn |> as(owner) |> patch(~p"/v1/projects/#{project.id}/settings", @settings_body)

      assert json_response(conn, 200)["settings"]["BPM"] == 90
    end

    test "the owner may delete a track", %{
      conn: conn,
      owner: owner,
      project: project,
      track: track
    } do
      conn = conn |> as(owner) |> delete(~p"/v1/projects/#{project.id}/tracks/#{track.id}")

      assert json_response(conn, 200)
    end
  end
end
