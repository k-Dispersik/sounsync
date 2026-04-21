defmodule Core.ProjectsCtx.Clips do
  import Ecto.Changeset

  alias Core.DB.Clip
  alias Soundsync.Repo

  def changeset(clip, attrs) do
    clip
    |> cast(attrs, [:title, :type, :start_time, :duration, :file_path])
    |> validate_required([:type, :start_time, :duration])
  end

  def new(attrs \\ %{}), do:  %Clip{} |> changeset(attrs)

  def create(attrs), do: new(attrs) |> Repo.insert()

  # TODO: implement actual overlap validation
  def validate_overlap(changeset, _track_id), do: changeset
end
