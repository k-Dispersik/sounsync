defmodule Core.ProjectsCtx.Tracks do
  use Core.Helpers, schema: Core.DB.Track

  import Ecto.Changeset

  alias Core.DB.Track
  alias Soundsync.Repo

  def changeset(track, attrs) do
    track
    |> cast(attrs, [:title, :row_index, :category])
    |> validate_required([:title, :row_index, :category])
  end

  def new(attrs \\ %{}), do:  %Track{} |> changeset(attrs)

  def create(attrs), do: new(attrs) |> Repo.insert()
end
