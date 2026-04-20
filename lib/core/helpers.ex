defmodule Core.Helpers do
  @moduledoc """
  Common CRUD macro helpers for context modules.

  ## Usage

      defmodule Core.UsersCtx.Users do
        use Core.Helpers, schema: Core.DB.User

        # Automatically injects:
        #   get/1       - Repo.get by id, returns nil if not found
        #   get!/1      - Repo.get! by id, raises if not found
        #   delete/1    - deletes a record
  """

  defmacro __using__(opts) do
    schema = Keyword.fetch!(opts, :schema)

    quote do
      alias Soundsync.Repo

      @doc "Fetches a single record by id. Returns `nil` if not found."
      def get(id, opts \\ []) do
        case Soundsync.Repo.get(unquote(schema), id) do
          nil -> nil
          record -> Soundsync.Repo.preload(record, Keyword.get(opts, :assoc, []))
        end
      end

      @doc "Fetches a single record by id. Raises `Ecto.NoResultsError` if not found."
      def get!(id, opts \\ []) do
        Soundsync.Repo.get!(unquote(schema), id)
        |> Soundsync.Repo.preload(Keyword.get(opts, :assoc, []))
      end

      @doc "Deletes a record. Returns `{:ok, record}` or `{:error, changeset}`."
      def delete(record), do: Soundsync.Repo.delete(record)

      defoverridable get: 1, get!: 1, delete: 1
    end
  end
end
