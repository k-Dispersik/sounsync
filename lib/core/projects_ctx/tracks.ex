defmodule Core.ProjectsCtx.Tracks do
  use Core.Helpers, schema: Core.DB.Track

  import Ecto.Changeset

  alias Core.DB.Track
  alias Soundsync.Repo
  alias Core.ProjectsCtx.Clips

  def changeset(track, attrs) do
    track
    |> cast(attrs, [:row_index])
    |> validate_required([:row_index])
  end

  def new(attrs \\ %{}), do:  %Track{} |> changeset(attrs)

  def create(attrs), do: new(attrs) |> Repo.insert()

  def add_clip(%Track{} = track, clip_attrs) do
    track
    |> Ecto.build_assoc(:clips)
    |> Clips.changeset(clip_attrs)
    |> Repo.insert()
  end
end
