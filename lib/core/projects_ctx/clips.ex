defmodule Core.ProjectsCtx.Clips do
  @moduledoc """
  Clips on a track: changeset, creation and updates.
  """

  import Ecto.Changeset

  alias Core.DB.Clip
  alias Soundsync.Repo

  def changeset(clip, attrs) do
    clip
    |> cast(attrs, [:title, :type, :start_time, :duration, :file_path])
  end

  def new(attrs \\ %{}),
    do:
      %Clip{}
      |> changeset(attrs)
      |> validate_required([:type, :start_time, :duration])

  def create(attrs), do: new(attrs) |> Repo.insert()

  def update(clip, attrs) do
    clip
    |> changeset(attrs)
    |> Repo.update()
  end
end
