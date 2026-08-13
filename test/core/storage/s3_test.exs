defmodule Core.Storage.S3Test do
  @moduledoc """
  No bucket is touched here. What matters about this adapter is the shape of
  what it hands the client — a signed URL that expires, aimed at the right
  object — and that it reads S3's answers correctly. Both are checkable
  against a stub.
  """

  # Not async: these swap the storage adapter in the application environment,
  # which is global. Two of them running at once would read each other's config.
  use ExUnit.Case, async: false

  alias Core.Storage.S3

  @bucket "soundsync-test"
  @region "eu-central-1"

  setup do
    original = Application.fetch_env!(:soundsync, :storage)

    Application.put_env(
      :soundsync,
      :storage,
      original
      |> Keyword.put(:adapter, S3)
      |> Keyword.put(:bucket, @bucket)
      |> Keyword.put(:region, @region)
      |> Keyword.delete(:public_base_url)
    )

    Application.put_env(:ex_aws, :access_key_id, "AKIAEXAMPLE")
    Application.put_env(:ex_aws, :secret_access_key, "secret")
    Application.put_env(:ex_aws, :region, @region)

    on_exit(fn ->
      Application.put_env(:soundsync, :storage, original)
      Application.delete_env(:soundsync, :s3_req_options)
    end)

    :ok
  end

  defp stub_with(fun) do
    Application.put_env(:soundsync, :s3_req_options, plug: fun)
  end

  describe "upload_url/2" do
    test "hands back a signed PUT aimed at the object" do
      assert {:ok, instruction} =
               S3.upload_url("projects/1/audio/a.wav", content_type: "audio/wav")

      assert instruction.method == "PUT"
      assert instruction.url =~ @bucket
      assert instruction.url =~ "projects/1/audio/a.wav"
      assert instruction.url =~ "X-Amz-Signature="
      assert instruction.headers == %{"content-type" => "audio/wav"}
    end

    test "the URL expires" do
      {:ok, instruction} = S3.upload_url("projects/1/audio/a.wav")

      assert instruction.url =~ "X-Amz-Expires=900"
      assert DateTime.after?(instruction.expires_at, DateTime.utc_now())
    end

    test "the instruction has the same shape the local adapter returns" do
      {:ok, instruction} = S3.upload_url("projects/1/audio/a.wav")

      assert Map.keys(instruction) |> Enum.sort() == [:expires_at, :headers, :method, :url]
    end
  end

  describe "get_url/2" do
    test "signs a GET when the bucket is not public" do
      assert {:ok, url} = S3.get_url("projects/1/audio/a.wav")

      assert url =~ "X-Amz-Signature="
    end

    test "uses the public base url when one is configured" do
      storage = Application.fetch_env!(:soundsync, :storage)

      Application.put_env(
        :soundsync,
        :storage,
        Keyword.put(storage, :public_base_url, "https://cdn.example.com/")
      )

      assert {:ok, "https://cdn.example.com/projects/1/audio/a.wav"} =
               S3.get_url("projects/1/audio/a.wav")
    end
  end

  describe "stat/1" do
    test "reads the size and type out of the response headers" do
      stub_with(fn conn ->
        conn
        |> Plug.Conn.put_resp_header("content-length", "2048")
        |> Plug.Conn.put_resp_header("content-type", "audio/wav")
        |> Plug.Conn.send_resp(200, "")
      end)

      assert {:ok, %{size: 2048, content_type: "audio/wav"}} = S3.stat("projects/1/audio/a.wav")
    end

    test "a missing object is :enoent, matching the local adapter" do
      stub_with(fn conn -> Plug.Conn.send_resp(conn, 404, "") end)

      assert {:error, :enoent} = S3.stat("projects/1/audio/gone.wav")
    end

    test "anything else is reported rather than swallowed" do
      stub_with(fn conn -> Plug.Conn.send_resp(conn, 500, "") end)

      assert {:error, {:unexpected_status, 500}} = S3.stat("projects/1/audio/a.wav")
    end
  end

  describe "put/3 and delete/1" do
    test "put sends the bytes to the object" do
      stub_with(fn conn ->
        {:ok, body, conn} = Plug.Conn.read_body(conn)
        assert body == "RIFF"
        assert conn.request_path == "/projects/1/audio/a.wav"
        Plug.Conn.send_resp(conn, 200, "")
      end)

      assert {:ok, "projects/1/audio/a.wav"} = S3.put("projects/1/audio/a.wav", "RIFF")
    end

    test "delete accepts the 204 S3 answers with" do
      stub_with(fn conn -> Plug.Conn.send_resp(conn, 204, "") end)

      assert :ok = S3.delete("projects/1/audio/a.wav")
    end

    test "a failed delete is an error, not a shrug" do
      stub_with(fn conn -> Plug.Conn.send_resp(conn, 403, "") end)

      assert {:error, {:unexpected_status, 403}} = S3.delete("projects/1/audio/a.wav")
    end
  end
end
