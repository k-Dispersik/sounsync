defmodule Core.Storage.Adapter do
  @moduledoc """
  What a storage backend has to be able to do.

  The shapes are identical for every adapter on purpose: the client is told
  where to send a file and how, and cannot tell a presigned S3 URL from a local
  endpoint. That is what makes "works locally, works in production" a claim the
  shared adapter test suite can actually check, rather than a hope.
  """

  @typedoc "Server-generated path inside the store, e.g. `projects/42/audio/01J….wav`."
  @type key :: String.t()

  @type opts :: keyword()

  @typedoc "Everything the client needs in order to send the bytes itself."
  @type upload_instruction :: %{
          method: String.t(),
          url: String.t(),
          headers: %{optional(String.t()) => String.t()},
          expires_at: DateTime.t()
        }

  @type stat :: %{size: pos_integer(), content_type: String.t()}

  @doc "Stores data (iodata or a path to a file) under the key."
  @callback put(key(), data :: iodata() | {:file, Path.t()}, opts()) ::
              {:ok, key()} | {:error, term()}

  @doc "A URL the file can be read from."
  @callback get_url(key(), opts()) :: {:ok, String.t()} | {:error, term()}

  @doc "Where and how the client should upload the file."
  @callback upload_url(key(), opts()) :: {:ok, upload_instruction()} | {:error, term()}

  @doc """
  Reads the object back. `opts[:length]` asks for only the first N bytes, which
  is how the upload check avoids pulling fifty megabytes to look at twelve.
  """
  @callback read(key(), opts()) :: {:ok, binary()} | {:error, :enoent | term()}

  @callback delete(key()) :: :ok | {:error, term()}

  @callback stat(key()) :: {:ok, stat()} | {:error, :enoent | term()}
end
