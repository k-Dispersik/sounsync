defmodule Core.ProjectsCtx.Projects do
  @moduledoc """
  Projects context: changeset, creation, updates, queries and tracks.
  """

  use Core.Helpers, schema: Core.DB.Project

  import Ecto.Changeset
  import Ecto.Query, only: [from: 2]

  alias Core.DB.Project
  alias Core.DB.ProjectMember
  alias Core.DB.User
  alias Core.ProjectsCtx.Policy
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
    |> Repo.preload(tracks: [:clips])
  end

  @doc """
  Adds a user to the project with the given role. Adding the same user twice is
  a no-op rather than an error: the caller usually does not know whether the
  membership is already there.
  """
  def add_member(%Project{} = project, %User{} = user, role \\ :editor) do
    %ProjectMember{}
    |> ProjectMember.changeset(%{project_id: project.id, user_id: user.id, role: role})
    |> Repo.insert(on_conflict: :nothing, conflict_target: [:project_id, :user_id])
    |> case do
      {:ok, _member} -> {:ok, Repo.preload(project, [:users, :memberships], force: true)}
      {:error, changeset} -> {:error, changeset}
    end
  end

  @doc """
  Checks a user against a project. The only entry point web code should use:
  it resolves the role and hands the decision to `Core.ProjectsCtx.Policy`.
  """
  @spec authorize(Policy.action(), User.t() | nil, Project.t() | nil) ::
          :ok | {:error, :forbidden}
  def authorize(action, %User{} = user, %Project{} = project) do
    Policy.authorize(action, member_role(project, user))
  end

  def authorize(action, _user, _project), do: Policy.authorize(action, nil)

  @doc "Role of the user in the project, or `nil` if they are not a member."
  def member_role(%Project{} = project, %User{} = user) do
    Repo.one(
      from m in ProjectMember,
        where: m.project_id == ^project.id and m.user_id == ^user.id,
        select: m.role
    )
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
