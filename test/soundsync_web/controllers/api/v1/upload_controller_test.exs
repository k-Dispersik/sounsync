defmodule SoundsyncWeb.API.V1.UploadControllerTest do
  # Not async: the storage adapter root lives in the application environment.
  use SoundsyncWeb.ConnCase, async: false

  alias Core.Accounts
  alias Core.Projects
  alias Core.Storage
  alias Core.Storage.AudioFile
  alias Soundsync.Repo

  @wav Soundsync.TestAudio.wav(200)

  setup %{conn: conn} do
    root = Path.join(System.tmp_dir!(), "soundsync-upload-#{System.unique_integer([:positive])}")
    original = Application.fetch_env!(:soundsync, :storage)
    Application.put_env(:soundsync, :storage, Keyword.put(original, :root, root))

    on_exit(fn ->
      File.rm_rf!(root)
      Application.put_env(:soundsync, :storage, original)
    end)

    owner = user_fixture()
    project = project_fixture(%{user: owner})

    %{conn: conn, owner: owner, project: project, root: root}
  end

  defp as(conn, user) do
    put_req_header(conn, "authorization", "Bearer " <> Accounts.create_session_token(user))
  end

  defp announce(conn, project, overrides \\ %{}) do
    body =
      Enum.into(overrides, %{
        original_filename: "kick.wav",
        content_type: "audio/wav",
        byte_size: byte_size(@wav),
        checksum: "sha256-#{System.unique_integer([:positive])}"
      })

    post(conn, ~p"/v1/projects/#{project.id}/uploads", body)
  end

  describe "POST /v1/projects/:id/uploads" do
    test "registers the file and says where to send it", ctx do
      %{conn: conn, owner: owner, project: project} = ctx

      body = conn |> as(owner) |> announce(project) |> json_response(201)

      assert body["audio_file"]["original_filename"] == "kick.wav"
      assert body["audio_file"]["status"] == "pending"
      assert body["upload"]["method"] == "PUT"
      assert body["upload"]["url"] =~ ~r"^/v1/uploads/\d+/data$"
      assert body["upload"]["headers"]["content-type"] == "audio/wav"
    end

    test "the storage key is generated, not taken from the filename", ctx do
      %{conn: conn, owner: owner, project: project} = ctx

      body =
        conn
        |> as(owner)
        |> announce(project, %{original_filename: "../../etc/passwd"})
        |> json_response(201)

      file = Storage.get_audio_file(body["audio_file"]["id"])

      assert String.starts_with?(file.storage_key, "projects/#{project.id}/audio/")
      refute file.storage_key =~ ".."
      assert file.original_filename == "../../etc/passwd"
    end

    test "a type we cannot play is refused", ctx do
      %{conn: conn, owner: owner, project: project} = ctx

      conn = conn |> as(owner) |> announce(project, %{content_type: "application/x-msdownload"})

      assert %{"error" => %{"code" => "unsupported_content_type"}} = json_response(conn, 422)
      assert Repo.aggregate(AudioFile, :count) == 0
    end

    test "a file over the limit is refused before anything is written", ctx do
      %{conn: conn, owner: owner, project: project} = ctx

      conn =
        conn |> as(owner) |> announce(project, %{byte_size: Storage.max_upload_bytes() + 1})

      assert %{"error" => %{"code" => "file_too_large"}} = json_response(conn, 413)
      assert Repo.aggregate(AudioFile, :count) == 0
    end

    test "the same bytes announced twice reuse the first file", ctx do
      %{conn: conn, owner: owner, project: project} = ctx
      checksum = "sha256-identical"

      first = conn |> as(owner) |> announce(project, %{checksum: checksum}) |> json_response(201)
      second = conn |> as(owner) |> announce(project, %{checksum: checksum}) |> json_response(201)

      assert second["audio_file"]["id"] == first["audio_file"]["id"]
      assert second["upload"] == nil
      assert Repo.aggregate(AudioFile, :count) == 1
    end

    test "a viewer may not upload", %{conn: conn, project: project} do
      viewer = user_fixture()
      {:ok, _} = Projects.add_member(project, viewer, :viewer)

      assert json_response(conn |> as(viewer) |> announce(project), 403)
    end

    test "no token, no upload", %{conn: conn, project: project} do
      assert json_response(announce(conn, project), 401)
    end

    test "a missing filename is 422", ctx do
      %{conn: conn, owner: owner, project: project} = ctx

      conn =
        post(as(conn, owner), ~p"/v1/projects/#{project.id}/uploads", %{content_type: "audio/wav"})

      assert %{"error" => %{"code" => "validation_failed", "details" => details}} =
               json_response(conn, 422)

      assert details["original_filename"]
    end
  end

  describe "PUT /v1/uploads/:id/data" do
    setup %{conn: conn, owner: owner, project: project} do
      body = conn |> as(owner) |> announce(project) |> json_response(201)
      %{upload_url: body["upload"]["url"], file_id: body["audio_file"]["id"]}
    end

    test "stores the bytes under the generated key", ctx do
      %{conn: conn, owner: owner, upload_url: url, file_id: file_id, root: root} = ctx

      conn =
        conn
        |> as(owner)
        |> put_req_header("content-type", "audio/wav")
        |> put(url, @wav)

      assert response(conn, 204)

      file = Storage.get_audio_file(file_id)
      assert File.read!(Path.join(root, file.storage_key)) == @wav
    end

    test "a stranger cannot push bytes into someone else's project", ctx do
      %{conn: conn, upload_url: url} = ctx

      conn =
        conn
        |> as(user_fixture())
        |> put_req_header("content-type", "audio/wav")
        |> put(url, @wav)

      assert json_response(conn, 403)
    end

    test "an unknown upload is 404", %{conn: conn, owner: owner} do
      conn =
        conn
        |> as(owner)
        |> put_req_header("content-type", "audio/wav")
        |> put(~p"/v1/uploads/0/data", @wav)

      assert json_response(conn, 404)
    end

    test "no token, no bytes", %{conn: conn, upload_url: url} do
      conn = conn |> put_req_header("content-type", "audio/wav") |> put(url, @wav)

      assert json_response(conn, 401)
    end
  end

  describe "POST /v1/uploads/:id/complete" do
    setup %{conn: conn, owner: owner, project: project} do
      body = conn |> as(owner) |> announce(project) |> json_response(201)
      %{upload_url: body["upload"]["url"], file_id: body["audio_file"]["id"]}
    end

    defp send_bytes(conn, owner, url, bytes) do
      conn
      |> as(owner)
      |> put_req_header("content-type", "audio/wav")
      |> put(url, bytes)
    end

    test "measures the file and marks it ready once the bytes check out", ctx do
      %{conn: conn, owner: owner, upload_url: url, file_id: file_id} = ctx
      assert response(send_bytes(conn, owner, url, @wav), 204)

      assert conn |> as(owner) |> post(~p"/v1/uploads/#{file_id}/complete") |> json_response(200)

      stored = Storage.get_audio_file(file_id)
      assert stored.status == :ready
      assert_in_delta stored.duration_ms, 200, 60
      assert byte_size(stored.peaks) > 0
    end

    test "completing twice is not an error", ctx do
      %{conn: conn, owner: owner, upload_url: url, file_id: file_id} = ctx
      assert response(send_bytes(conn, owner, url, @wav), 204)
      conn |> as(owner) |> post(~p"/v1/uploads/#{file_id}/complete") |> json_response(200)

      assert conn
             |> as(owner)
             |> post(~p"/v1/uploads/#{file_id}/complete")
             |> json_response(200)

      assert Storage.get_audio_file(file_id).status == :ready
    end

    test "a file that is not audio is rejected and deleted", ctx do
      %{conn: conn, owner: owner, upload_url: url, file_id: file_id, root: root} = ctx
      executable = "MZ" <> String.duplicate(<<0>>, byte_size(@wav) - 2)
      assert response(send_bytes(conn, owner, url, executable), 204)

      conn = conn |> as(owner) |> post(~p"/v1/uploads/#{file_id}/complete")

      assert %{"error" => %{"code" => "unsupported_content_type"}} = json_response(conn, 422)

      file = Storage.get_audio_file(file_id)
      assert file.status == :failed
      refute File.exists?(Path.join(root, file.storage_key))
    end

    test "audio of the wrong kind is rejected too", ctx do
      %{conn: conn, owner: owner, upload_url: url, file_id: file_id} = ctx
      mp3 = "ID3" <> String.duplicate(<<0>>, byte_size(@wav) - 3)
      assert response(send_bytes(conn, owner, url, mp3), 204)

      conn = conn |> as(owner) |> post(~p"/v1/uploads/#{file_id}/complete")

      assert %{"error" => %{"code" => "content_type_mismatch"}} = json_response(conn, 422)
      assert Storage.get_audio_file(file_id).status == :failed
    end

    test "a size that does not match what was announced is rejected", ctx do
      %{conn: conn, owner: owner, upload_url: url, file_id: file_id} = ctx
      assert response(send_bytes(conn, owner, url, @wav <> "extra"), 204)

      conn = conn |> as(owner) |> post(~p"/v1/uploads/#{file_id}/complete")

      assert %{"error" => %{"code" => "size_mismatch"}} = json_response(conn, 422)
      assert Storage.get_audio_file(file_id).status == :failed
    end

    test "completing an upload that never arrived is rejected", ctx do
      %{conn: conn, owner: owner, file_id: file_id} = ctx

      conn = conn |> as(owner) |> post(~p"/v1/uploads/#{file_id}/complete")

      assert %{"error" => %{"code" => "upload_missing"}} = json_response(conn, 422)
      assert Storage.get_audio_file(file_id).status == :failed
    end

    test "a stranger cannot complete someone else's upload", ctx do
      %{conn: conn, file_id: file_id} = ctx

      assert json_response(
               conn |> as(user_fixture()) |> post(~p"/v1/uploads/#{file_id}/complete"),
               403
             )
    end
  end
end
