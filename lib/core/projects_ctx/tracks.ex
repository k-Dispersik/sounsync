defmodule Core.ProjectsCtx.Tracks do
  @moduledoc """
  Project tracks and the clips placed on them.
  """

  use Core.Helpers, schema: Core.DB.Track

  import Ecto.Changeset

  alias Core.DB.Track
  alias Core.ProjectsCtx.Clips
  alias Soundsync.Repo

  def changeset(track, attrs) do
    track
    |> cast(attrs, [:row_index])
    |> validate_required([:row_index])
  end

  def new(attrs \\ %{}), do: %Track{} |> changeset(attrs)

  def create(attrs), do: new(attrs) |> Repo.insert()

  def add_clip(%Track{} = track, clip_attrs) do
    track
    |> Ecto.build_assoc(:clips)
    |> Clips.changeset(clip_attrs)
    |> Repo.insert()
  end

  def update_clip(%Track{clips: clips}, clip_id, attrs) do
    case Enum.find(clips, &(&1.id == clip_id)) do
      nil -> {:error, "Clip not found in this track"}
      clip -> Clips.update(clip, attrs)
    end
  end
end
