defmodule SoundsyncWeb.API.V1.AudioFileControllerTest do
  use SoundsyncWeb.ConnCase, async: true

  alias Core.Accounts
  alias Core.Projects
  alias Core.Storage
  alias Core.Storage.AudioFile
  alias Soundsync.Repo

  setup %{conn: conn} do
    owner = user_fixture()
    project = project_fixture(%{user: owner})

    %{conn: conn, owner: owner, project: project}
  end

  defp as(conn, user) do
    put_req_header(conn, "authorization", "Bearer " <> Accounts.create_session_token(user))
  end

  defp audio_file_fixture(project, overrides \\ %{}) do
    attrs =
      Enum.into(overrides, %{
        project_id: project.id,
        storage_key: Storage.build_key(project.id, "sample.wav"),
        original_filename: "sample.wav",
        content_type: "audio/wav",
        byte_size: 2_048,
        checksum: "sha256-#{System.unique_integer([:positive])}"
      })

    {:ok, file} = %AudioFile{} |> AudioFile.changeset(attrs) |> Repo.insert()
    file
  end

  test "lists the project's audio, newest first", ctx do
    %{conn: conn, owner: owner, project: project} = ctx
    audio_file_fixture(project, %{original_filename: "older.wav"})
    audio_file_fixture(project, %{original_filename: "newer.wav"})

    body =
      conn |> as(owner) |> get(~p"/v1/projects/#{project.id}/audio_files") |> json_response(200)

    assert Enum.map(body, & &1["original_filename"]) == ["newer.wav", "older.wav"]
  end

  test "includes files that are still being processed", ctx do
    %{conn: conn, owner: owner, project: project} = ctx
    audio_file_fixture(project)

    assert [%{"status" => "pending", "duration_ms" => nil}] =
             conn
             |> as(owner)
             |> get(~p"/v1/projects/#{project.id}/audio_files")
             |> json_response(200)
  end

  test "a project with no audio gives an empty list", ctx do
    %{conn: conn, owner: owner, project: project} = ctx

    assert [] =
             conn
             |> as(owner)
             |> get(~p"/v1/projects/#{project.id}/audio_files")
             |> json_response(200)
  end

  test "never leaks another project's audio", ctx do
    %{conn: conn, owner: owner, project: project} = ctx
    audio_file_fixture(project_fixture(), %{original_filename: "someone-elses.wav"})

    body =
      conn |> as(owner) |> get(~p"/v1/projects/#{project.id}/audio_files") |> json_response(200)

    assert body == []
  end

  test "a viewer may read the library", %{conn: conn, project: project} do
    viewer = user_fixture()
    {:ok, _} = Projects.add_member(project, viewer, :viewer)

    assert json_response(
             conn |> as(viewer) |> get(~p"/v1/projects/#{project.id}/audio_files"),
             200
           )
  end

  test "a stranger may not", %{conn: conn, project: project} do
    assert json_response(
             conn |> as(user_fixture()) |> get(~p"/v1/projects/#{project.id}/audio_files"),
             403
           )
  end

  test "no token, no library", %{conn: conn, project: project} do
    assert json_response(get(conn, ~p"/v1/projects/#{project.id}/audio_files"), 401)
  end

  describe "clips referencing audio" do
    test "a clip may point at audio from its own project", ctx do
      %{conn: conn, owner: owner, project: project} = ctx
      file = audio_file_fixture(project)
      track = track_fixture(project)

      body =
        conn
        |> as(owner)
        |> post(~p"/v1/projects/#{project.id}/tracks/#{track.id}/clips", %{
          type: "drums",
          start_time: 0,
          duration: 1_000,
          audio_file_id: file.id
        })
        |> json_response(201)

      assert body["audio_file_id"] == file.id
    end

    test "but not at audio from another project", ctx do
      %{conn: conn, owner: owner, project: project} = ctx
      foreign = audio_file_fixture(project_fixture())
      track = track_fixture(project)

      conn =
        conn
        |> as(owner)
        |> post(~p"/v1/projects/#{project.id}/tracks/#{track.id}/clips", %{
          type: "drums",
          start_time: 0,
          duration: 1_000,
          audio_file_id: foreign.id
        })

      assert %{"error" => %{"code" => "not_found"}} = json_response(conn, 404)
    end
  end
end
