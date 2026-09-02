defmodule SoundsyncWeb.API.V1.AudioFileControllerTest do
  # Not async: the content tests point the storage adapter at a root of their own.
  use SoundsyncWeb.ConnCase, async: false

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

  describe "GET .../audio_files/:id/peaks" do
    test "returns the waveform and what it is scaled to", ctx do
      %{conn: conn, owner: owner, project: project} = ctx
      file = audio_file_fixture(project)

      {:ok, file} =
        file
        |> AudioFile.analysed_changeset(%{status: :ready, peaks: <<1, 2, 3>>})
        |> Repo.update()

      body =
        conn
        |> as(owner)
        |> get(~p"/v1/projects/#{project.id}/audio_files/#{file.id}/peaks")
        |> json_response(200)

      assert Base.decode64!(body["peaks"]) == <<1, 2, 3>>
      assert body["peaks_per_second"] == 512
    end

    test "a file that has not been analysed says so rather than pretending", ctx do
      %{conn: conn, owner: owner, project: project} = ctx
      file = audio_file_fixture(project)

      body =
        conn
        |> as(owner)
        |> get(~p"/v1/projects/#{project.id}/audio_files/#{file.id}/peaks")
        |> json_response(200)

      assert body["peaks"] == nil
    end

    test "a file from another project is 404", ctx do
      %{conn: conn, owner: owner, project: project} = ctx
      foreign = audio_file_fixture(project_fixture())

      assert json_response(
               conn
               |> as(owner)
               |> get(~p"/v1/projects/#{project.id}/audio_files/#{foreign.id}/peaks"),
               404
             )
    end

    test "a stranger gets nothing", ctx do
      %{conn: conn, project: project} = ctx
      file = audio_file_fixture(project)

      assert json_response(
               conn
               |> as(user_fixture())
               |> get(~p"/v1/projects/#{project.id}/audio_files/#{file.id}/peaks"),
               403
             )
    end
  end

  describe "GET .../audio_files/:id/content" do
    setup do
      root = Path.join(System.tmp_dir!(), "audio-content-#{System.unique_integer([:positive])}")
      original = Application.fetch_env!(:soundsync, :storage)
      Application.put_env(:soundsync, :storage, Keyword.put(original, :root, root))

      on_exit(fn ->
        File.rm_rf!(root)
        Application.put_env(:soundsync, :storage, original)
      end)

      :ok
    end

    test "serves the bytes to someone who may read the project", ctx do
      %{conn: conn, owner: owner, project: project} = ctx
      file = audio_file_fixture(project)
      {:ok, _key} = Storage.put(file.storage_key, "RIFF....WAVE")

      conn =
        conn |> as(owner) |> get(~p"/v1/projects/#{project.id}/audio_files/#{file.id}/content")

      assert response(conn, 200) == "RIFF....WAVE"
      assert response_content_type(conn, :wav) =~ "audio/wav"
    end

    test "S-2: a content type nobody offered to play is not echoed back", ctx do
      %{conn: conn, owner: owner, project: project} = ctx
      file = audio_file_fixture(project, %{content_type: "text/html"})
      {:ok, _key} = Storage.put(file.storage_key, "<script>alert(1)</script>")

      conn =
        conn |> as(owner) |> get(~p"/v1/projects/#{project.id}/audio_files/#{file.id}/content")

      assert response(conn, 200)
      assert ["application/octet-stream" <> _charset] = get_resp_header(conn, "content-type")
      assert get_resp_header(conn, "x-content-type-options") == ["nosniff"]
    end

    test "a stranger gets nothing", ctx do
      %{conn: conn, project: project} = ctx
      file = audio_file_fixture(project)
      {:ok, _key} = Storage.put(file.storage_key, "RIFF....WAVE")

      conn =
        conn
        |> as(user_fixture())
        |> get(~p"/v1/projects/#{project.id}/audio_files/#{file.id}/content")

      assert json_response(conn, 403)
    end

    test "no token, no audio", ctx do
      %{conn: conn, project: project} = ctx
      file = audio_file_fixture(project)

      assert json_response(
               get(conn, ~p"/v1/projects/#{project.id}/audio_files/#{file.id}/content"),
               401
             )
    end

    test "a record whose bytes never arrived is reported, not a 500", ctx do
      %{conn: conn, owner: owner, project: project} = ctx
      file = audio_file_fixture(project)

      conn =
        conn |> as(owner) |> get(~p"/v1/projects/#{project.id}/audio_files/#{file.id}/content")

      assert %{"error" => %{"code" => "upload_missing"}} = json_response(conn, 422)
    end

    test "audio from another project is not found", ctx do
      %{conn: conn, owner: owner, project: project} = ctx
      foreign = audio_file_fixture(project_fixture())

      assert json_response(
               conn
               |> as(owner)
               |> get(~p"/v1/projects/#{project.id}/audio_files/#{foreign.id}/content"),
               404
             )
    end
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
