defmodule Core.StorageTest do
  @moduledoc """
  The facade's job is to read the configuration and get out of the way, so what
  is checked here is exactly that: the call reaches whichever adapter the config
  names, and the key never comes from the client.
  """

  # Not async: these swap the storage adapter in the application environment,
  # which is global. Two of them running at once would read each other's config.
  use ExUnit.Case, async: false

  alias Core.Storage

  defmodule StubAdapter do
    @moduledoc false
    @behaviour Core.Storage.Adapter

    @impl true
    def put(key, _data, opts), do: {:ok, {:put, key, opts}}

    @impl true
    def get_url(key, _opts), do: {:ok, "stub://" <> key}

    @impl true
    def upload_url(key, _opts) do
      {:ok,
       %{
         method: "PUT",
         url: "stub://upload/" <> key,
         headers: %{},
         expires_at: DateTime.utc_now()
       }}
    end

    @impl true
    def delete(_key), do: :ok

    @impl true
    def stat(_key), do: {:ok, %{size: 1, content_type: "audio/wav"}}
  end

  setup do
    original = Application.fetch_env!(:soundsync, :storage)
    Application.put_env(:soundsync, :storage, Keyword.put(original, :adapter, StubAdapter))
    on_exit(fn -> Application.put_env(:soundsync, :storage, original) end)
    :ok
  end

  test "every call goes to the adapter named in the config" do
    assert Storage.adapter() == StubAdapter
    assert {:ok, {:put, "k", []}} = Storage.put("k", "data")
    assert {:ok, "stub://k"} = Storage.get_url("k")
    assert {:ok, %{url: "stub://upload/k"}} = Storage.upload_url("k")
    assert :ok = Storage.delete("k")
    assert {:ok, %{size: 1}} = Storage.stat("k")
  end

  test "limits come from the config, not from each call site" do
    assert Storage.max_upload_bytes() == 50 * 1024 * 1024
    assert "audio/wav" in Storage.allowed_content_types()
    assert Storage.upload_url_ttl_seconds() == 900
  end

  describe "build_key/2" do
    test "the key is generated, and the client's name is not part of it" do
      key = Storage.build_key(42, "my track.wav")

      assert String.starts_with?(key, "projects/42/audio/")
      assert String.ends_with?(key, ".wav")
      refute key =~ "my track"
    end

    test "two uploads of the same name get different keys" do
      refute Storage.build_key(1, "a.wav") == Storage.build_key(1, "a.wav")
    end

    test "a filename that tries to walk out of the directory cannot" do
      key = Storage.build_key(1, "../../etc/passwd")

      assert String.starts_with?(key, "projects/1/audio/")
      refute key =~ ".."
      refute key =~ "passwd"
    end

    test "a hostile extension is dropped rather than escaped" do
      for name <- ["x.wav/../../evil", "x.", "x", "x.é", "x.waaaaaaaaaaav"] do
        key = Storage.build_key(1, name)

        assert String.starts_with?(key, "projects/1/audio/")
        refute key =~ ".."
      end
    end
  end
end
