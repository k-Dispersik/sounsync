defmodule Core.ProjectsCtx.Projects do
  @moduledoc """
  Projects context: changeset, creation, updates, queries and tracks.
  """

  use Core.Helpers, schema: Core.DB.Project

  import Ecto.Changeset

  alias Core.DB.Project
  alias Core.ProjectsCtx.Tracks

  alias Soundsync.Repo

  def changeset(project, attrs) do
    project
    |> cast(attrs, [:title, :description])
    |> cast_embed(:settings, with: &project_settings_changeset/2)
    |> validate_required([:title])
  end

  def project_settings_changeset(settings, attrs) do
    settings
    |> cast(attrs, [:bpm, :time_signature, :timeline_length_ms])
    |> validate_number(:bpm, greater_than: 20, less_than: 300)
    |> validate_number(:timeline_length_ms, greater_than: 0)
  end

  def new(attrs \\ %{}), do: %Project{} |> changeset(attrs)

  def create(attrs), do: new(attrs) |> Repo.insert()

  def update(project, attrs) do
    project
    |> changeset(attrs)
    |> put_track(project, attrs[:tracks])
    |> Repo.update()
  end

  def list, do: Project.query() |> Repo.all()

  @doc """
  Lists projects:
  attrs:
    - user_id: filters projects by user association

  """
  def list_by_user(user_id) do
    Project.query()
    |> Project.join_users()
    |> Project.with_user(user_id)
    |> Repo.all()
  end

  def add_track(%Project{} = project, track_attrs) do
    project
    |> Ecto.build_assoc(:tracks)
    |> Tracks.changeset(track_attrs)
    |> Repo.insert()
    |> case do
      {:ok, track} -> {:ok, Repo.preload(track, :clips)}
      error -> error
    end
  end

  def get_tracks(%Project{} = project) do
    project
    |> Repo.preload(:tracks)
    |> Map.get(:tracks, [])
  end

  def get_track_by_id(%Project{} = project, track_id) when is_integer(track_id) do
    project
    |> Repo.preload(:tracks)
    |> Map.get(:tracks, [])
    |> Enum.find(fn track -> track.id == track_id end)
  end

  defp put_track(project_changeset, _, nil), do: project_changeset

  defp put_track(_, %Project{tracks: nil}, _),
    do: raise(ArgumentError, "Tracks must be preloaded in the project struct")

  defp put_track(project_changeset, %Project{tracks: existing_tracks}, tracks) do
    put_assoc(project_changeset, :tracks, existing_tracks ++ tracks)
  end

  defp put_track(_, _, _),
    do: raise(ArgumentError, "Invalid project struct: tracks must be a list or nil")
end
