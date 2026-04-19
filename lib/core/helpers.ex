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

        # Also imports:
        #   insert_ok?/1  - pipes a valid changeset into Repo.insert
        #   update_ok?/1  - pipes a valid changeset into Repo.update
      end
  """

  @doc """
  Inserts a changeset or passes through an `{:error, changeset}` tuple.

  Asepts a tuple from `apply_action/2` or a changeset directly,
  making it easy to pipe directly from `apply_action/2` results or changesets.

      %Schema{}
      |> Schema.changeset(attrs)
      |> insert_ok?()

      %Schema.changeset(attrs)
      |> apply_action(:validate)
      |> insert_ok?()
  """
  def insert_ok?({:ok, %Ecto.Changeset{} = changeset}), do: Soundsync.Repo.insert(changeset)
  def insert_ok?({:error, _} = error), do: error

  @doc """
  Updates via a changeset or passes through an `{:error, changeset}` tuple.

      user
      |> MySchema.changeset(attrs)
      |> update_ok?()
  """
  def update_ok?({:ok, %Ecto.Changeset{} = changeset}), do: Soundsync.Repo.update(changeset)
  def update_ok?({:error, _} = error), do: error

  defmacro __using__(opts) do
    schema = Keyword.fetch!(opts, :schema)

    quote do
      alias Soundsync.Repo
      import Core.Helpers, only: [insert_ok?: 1, update_ok?: 1]

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
