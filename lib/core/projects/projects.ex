defmodule Core.Projects do
  @moduledoc """
  Projects, their tracks and the clips on them.

  One module for one aggregate. A track means nothing outside its project and
  a clip nothing outside its track, so three modules were three doors into the
  same room — and each door had its own idea of what a changeset was called.
  Callers reach a track through the project they already loaded, which is also
  what makes the access check in `authorize/3` unavoidable.
  """

  import Ecto.Changeset
  import Ecto.Query, only: [from: 2]

  alias Core.Accounts.User
  alias Core.Projects.Clip
  alias Core.Projects.Policy
  alias Core.Projects.Project
  alias Core.Projects.ProjectMember
  alias Core.Projects.Track
  alias Soundsync.Repo

  # ── Projects ───────────────────────────────────────────────────────────────

  @doc """
  Fetches a project, or `nil`. `:assoc` is passed straight to `Repo.preload/2`.
  """
  def get_project(id, opts \\ []) do
    case Repo.get(Project, id) do
      nil -> nil
      project -> Repo.preload(project, Keyword.get(opts, :assoc, []))
    end
  end

  def get_project!(id, opts \\ []) do
    Project |> Repo.get!(id) |> Repo.preload(Keyword.get(opts, :assoc, []))
  end

  def list_projects, do: Project.query() |> Repo.all()

  @doc "Projects the user is a member of, whatever their role."
  def list_projects_for_user(user_id) do
    Project.query()
    |> Project.join_users()
    |> Project.with_user(user_id)
    |> Repo.all()
  end

  @doc "Creates a project with no members. Rarely what you want — see `create_project/2`."
  def create_project(attrs), do: attrs |> new_project() |> Repo.insert()

  @doc """
  Creates a project and makes the given user its owner. The project comes back
  with its (empty) tracks loaded, so a caller can serialise it without a second
  trip to the database.
  """
  def create_project(%User{} = owner, attrs) do
    with {:ok, project} <- create_project(attrs),
         {:ok, project} <- add_member(project, owner, :owner) do
      {:ok, Repo.preload(project, tracks: [:clips])}
    end
  end

  def update_project(%Project{} = project, attrs) do
    project
    |> project_changeset(attrs)
    |> Repo.update()
  end

  def delete_project(%Project{} = project), do: Repo.delete(project)

  def project_changeset(project, attrs) do
    project
    |> cast(attrs, [:title, :description])
    |> cast_embed(:settings, with: &settings_changeset/2)
    |> validate_required([:title])
  end

  def settings_changeset(settings, attrs) do
    settings
    |> cast(attrs, [:bpm, :time_signature, :timeline_length_ms])
    |> validate_number(:bpm, greater_than: 20, less_than: 300)
    |> validate_number(:timeline_length_ms, greater_than: 0)
  end

  defp new_project(attrs), do: project_changeset(%Project{}, attrs)

  # ── Membership and access ──────────────────────────────────────────────────

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

  @doc "Role of the user in the project, or `nil` if they are not a member."
  def member_role(%Project{} = project, %User{} = user) do
    Repo.one(
      from m in ProjectMember,
        where: m.project_id == ^project.id and m.user_id == ^user.id,
        select: m.role
    )
  end

  @doc """
  Checks a user against a project. The only entry point web code should use:
  it resolves the role and hands the decision to `Core.Projects.Policy`.
  """
  @spec authorize(Policy.action(), User.t() | nil, Project.t() | nil) ::
          :ok | {:error, :forbidden}
  def authorize(action, %User{} = user, %Project{} = project) do
    Policy.authorize(action, member_role(project, user))
  end

  def authorize(action, _user, _project), do: Policy.authorize(action, nil)

  # ── Tracks ─────────────────────────────────────────────────────────────────

  def add_track(%Project{} = project, attrs) do
    project
    |> Ecto.build_assoc(:tracks)
    |> track_changeset(attrs)
    |> Repo.insert()
    |> case do
      {:ok, track} -> {:ok, Repo.preload(track, :clips)}
      error -> error
    end
  end

  def list_tracks(%Project{} = project) do
    project |> Repo.preload(:tracks) |> Map.get(:tracks, [])
  end

  @doc "Finds a track that belongs to this project, or `nil`."
  def get_track(%Project{} = project, track_id) when is_integer(track_id) do
    project
    |> list_tracks()
    |> Enum.find(&(&1.id == track_id))
  end

  def delete_track(%Track{} = track), do: Repo.delete(track)

  def track_changeset(track, attrs) do
    track
    |> cast(attrs, [:row_index])
    |> validate_required([:row_index])
  end

  # ── Clips ──────────────────────────────────────────────────────────────────

  def add_clip(%Track{} = track, attrs) do
    track
    |> Ecto.build_assoc(:clips)
    |> clip_changeset(attrs)
    |> validate_required([:type, :start_time, :duration])
    |> Repo.insert()
  end

  @doc """
  Updates a clip that belongs to this track. A clip id from another track is
  `{:error, :not_found}`: without the check, knowing an id would be enough to
  edit a clip in a project you cannot even read.
  """
  def update_clip(%Track{clips: clips}, clip_id, attrs) when is_list(clips) do
    case Enum.find(clips, &(&1.id == clip_id)) do
      nil -> {:error, :not_found}
      clip -> clip |> clip_changeset(attrs) |> Repo.update()
    end
  end

  def delete_clip(%Clip{} = clip), do: Repo.delete(clip)

  def clip_changeset(clip, attrs) do
    cast(clip, attrs, [:title, :type, :start_time, :duration, :file_path])
  end
end
