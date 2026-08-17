defmodule Core.Storage.LocalContractTest do
  # Not async: the adapter is chosen through the application environment.
  use ExUnit.Case, async: false
  use Soundsync.StorageContract

  alias Core.Storage.Local

  setup do
    root = Path.join(System.tmp_dir!(), "contract-local-#{System.unique_integer([:positive])}")
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

    :ok
  end
end

defmodule Core.Storage.S3ContractTest do
  # Not async: same reason, plus the stubbed transport is configured globally.
  use ExUnit.Case, async: false
  use Soundsync.StorageContract

  alias Core.Storage.S3
  alias Soundsync.S3Stub

  setup do
    {:ok, store} = S3Stub.start_link()
    original = Application.fetch_env!(:soundsync, :storage)

    Application.put_env(
      :soundsync,
      :storage,
      original
      |> Keyword.put(:adapter, S3)
      |> Keyword.put(:bucket, "soundsync-contract")
      |> Keyword.put(:region, "eu-central-1")
      |> Keyword.delete(:public_base_url)
    )

    Application.put_env(:soundsync, :s3_req_options, plug: S3Stub.plug(store))
    Application.put_env(:ex_aws, :access_key_id, "AKIAEXAMPLE")
    Application.put_env(:ex_aws, :secret_access_key, "secret")
    Application.put_env(:ex_aws, :region, "eu-central-1")

    on_exit(fn ->
      Application.put_env(:soundsync, :storage, original)
      Application.delete_env(:soundsync, :s3_req_options)
    end)

    :ok
  end
end
