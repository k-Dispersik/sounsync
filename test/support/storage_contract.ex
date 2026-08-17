defmodule Soundsync.StorageContract do
  @moduledoc """
  One set of tests, run against every adapter.

  This is the part that makes "works locally, works in production" checkable
  rather than hopeful: both adapters answer the same calls with the same
  shapes, including the awkward cases — a key that is not there, a partial
  read, a delete of something already gone.

  Everything goes through `Core.Storage`, exactly as application code does, so
  a difference that only shows up through the facade cannot hide.
  """

  defmacro __using__(_opts) do
    quote do
      alias Core.Storage

      @contract_key "projects/1/audio/contract.wav"
      @contract_bytes "RIFF" <> <<36, 0, 0, 0>> <> "WAVEfmt " <> <<1, 2, 3, 4>>

      describe "adapter contract" do
        test "stores bytes and reads them back unchanged" do
          assert {:ok, @contract_key} = Storage.put(@contract_key, @contract_bytes)
          assert {:ok, @contract_bytes} = Storage.read(@contract_key)
        end

        test "reads only the first bytes when asked" do
          {:ok, _key} = Storage.put(@contract_key, @contract_bytes)

          assert {:ok, head} = Storage.read(@contract_key, length: 4)
          assert head == "RIFF"
        end

        test "reports size and content type" do
          {:ok, _key} = Storage.put(@contract_key, @contract_bytes)

          assert {:ok, %{size: size, content_type: content_type}} = Storage.stat(@contract_key)
          assert size == byte_size(@contract_bytes)
          assert is_binary(content_type)
        end

        test "a key that was never written is :enoent, not an empty file" do
          assert {:error, :enoent} = Storage.stat("projects/1/audio/absent.wav")
          assert {:error, :enoent} = Storage.read("projects/1/audio/absent.wav")
        end

        test "delete removes the object" do
          {:ok, _key} = Storage.put(@contract_key, @contract_bytes)

          assert :ok = Storage.delete(@contract_key)
          assert {:error, :enoent} = Storage.stat(@contract_key)
        end

        test "deleting something that is not there is not an error" do
          assert :ok = Storage.delete("projects/1/audio/never.wav")
        end

        test "an upload instruction has the shape the client expects" do
          assert {:ok, instruction} =
                   Storage.upload_url(@contract_key,
                     content_type: "audio/wav",
                     upload_path: "/v1/uploads/1/data"
                   )

          assert instruction.method == "PUT"
          assert is_binary(instruction.url) and instruction.url != ""
          assert is_map(instruction.headers)
          assert DateTime.after?(instruction.expires_at, DateTime.utc_now())
        end

        test "get_url gives something the browser can fetch" do
          {:ok, _key} = Storage.put(@contract_key, @contract_bytes)

          assert {:ok, url} = Storage.get_url(@contract_key)
          assert is_binary(url) and url =~ "contract.wav"
        end

        test "overwriting a key replaces its contents" do
          {:ok, _key} = Storage.put(@contract_key, @contract_bytes)
          {:ok, _key} = Storage.put(@contract_key, "OggS" <> <<9, 9, 9>>)

          assert {:ok, "OggS" <> _rest} = Storage.read(@contract_key)
        end
      end
    end
  end
end
