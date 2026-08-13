defmodule Core.Storage.LocalTest do
  @moduledoc """
  Runs against a real filesystem in `tmp/`: a mocked one would not catch the
  cases this adapter exists to handle — a missing directory, a key pointing
  outside the root, a file that is not there.
  """

  # Not async: these swap the storage adapter in the application environment,
  # which is global. Two of them running at once would read each other's config.
  use ExUnit.Case, async: false

  alias Core.Storage.Local

  setup do
    root = Path.join(System.tmp_dir!(), "soundsync-local-#{System.unique_integer([:positive])}")
    original = Application.fetch_env!(:soundsync, :storage)

    Application.put_env(
      :soundsync,
      :storage,
      original |> Keyword.put(:adapter, Local) |> Keyword.put(:root, root)
    )

    on_exit(fn ->
      File.rm_rf!(root)
      Application.put_env(:soundsync, :storage, original)
    end)

    %{root: root}
  end

  describe "put/3" do
    test "writes the bytes and creates the directories on the way", %{root: root} do
      assert {:ok, "projects/1/audio/a.wav"} =
               Local.put("projects/1/audio/a.wav", "RIFF....WAVE")

      assert File.read!(Path.join(root, "projects/1/audio/a.wav")) == "RIFF....WAVE"
    end

    test "copies a file when given a path", %{root: root} do
      source = Path.join(root, "source.bin")
      File.mkdir_p!(root)
      File.write!(source, "payload")

      assert {:ok, key} = Local.put("projects/1/audio/b.wav", {:file, source})
      assert File.read!(Path.join(root, key)) == "payload"
    end

    test "refuses a key that would escape the root", %{root: root} do
      assert {:error, :invalid_key} = Local.put("../escaped.wav", "nope")
      refute File.exists?(Path.join(Path.dirname(root), "escaped.wav"))
    end

    test "refuses an absolute key" do
      assert {:error, :invalid_key} = Local.put("/etc/soundsync-test", "nope")
      refute File.exists?("/etc/soundsync-test")
    end
  end

  describe "stat/1" do
    test "reports the size and the type inferred from the extension" do
      {:ok, key} = Local.put("projects/1/audio/c.wav", "1234567890")

      assert {:ok, %{size: 10, content_type: "audio/" <> _}} = Local.stat(key)
    end

    test "a missing file is :enoent, not a crash" do
      assert {:error, :enoent} = Local.stat("projects/1/audio/nothing.wav")
    end
  end

  describe "delete/1" do
    test "removes the file", %{root: root} do
      {:ok, key} = Local.put("projects/1/audio/d.wav", "x")

      assert :ok = Local.delete(key)
      refute File.exists?(Path.join(root, key))
    end

    test "deleting something that is not there is not an error" do
      assert :ok = Local.delete("projects/1/audio/never-existed.wav")
    end
  end

  describe "urls" do
    test "get_url/2 points at the public prefix" do
      assert {:ok, "/uploads/projects/1/audio/e.wav"} =
               Local.get_url("projects/1/audio/e.wav")
    end

    test "upload_url/2 hands back the same shape S3 would" do
      assert {:ok, instruction} =
               Local.upload_url("projects/1/audio/f.wav",
                 upload_path: "/v1/uploads/7/data",
                 content_type: "audio/wav"
               )

      assert instruction.method == "PUT"
      assert instruction.url == "/v1/uploads/7/data"
      assert instruction.headers == %{"content-type" => "audio/wav"}
      assert DateTime.after?(instruction.expires_at, DateTime.utc_now())
    end

    test "an upload instruction without a destination is an error, not a guess" do
      assert {:error, :upload_path_required} = Local.upload_url("projects/1/audio/g.wav")
    end
  end
end
