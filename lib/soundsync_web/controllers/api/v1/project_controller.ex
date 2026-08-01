defmodule SoundsyncWeb.API.V1.ProjectController do
  @moduledoc """
  Projects themselves: `/v1/projects`. Tracks and clips live in their own
  controllers.
  """

  use SoundsyncWeb, :controller
  use Params

  alias Core.ProjectsCtx.Projects
  alias Core.UsersCtx.Users
  alias SoundsyncWeb.ErrorResponse
  alias SoundsyncWeb.Helpers
  alias SoundsyncWeb.JSON
  alias SoundsyncWeb.Params, as: RequestParams

  require OK

  defparams(
    create_project_params(%{
      title!: :string,
      description: :string
    })
  )

  defparams(
    update_settings_params(%{
      settings!: %{
        bpm: :integer,
        time_signature: :string,
        timeline_length_ms: :integer
      }
    })
  )

  def index(conn, _params) do
    conn.assigns.current_user.id
    |> Projects.list_by_user()
    |> Enum.map(&JSON.project(&1, :summary))
    |> Helpers.response(conn, :ok)
  end

  def show(conn, %{"id" => id}) do
    OK.try do
      project <- fetch_project(conn, id, :read)
    after
      JSON.project(project, :full) |> Helpers.response(conn, :ok)
    rescue
      :forbidden -> forbidden(conn)
      _e -> project_not_found(conn)
    end
  end

  def create(conn, params) do
    OK.try do
      attrs <- RequestParams.cast(&create_project_params/1, params)
      created <- Users.create_project(conn.assigns.current_user, attrs)
      project <- Projects.get(created.id, assoc: [tracks: [:clips]]) |> OK.required()
    after
      JSON.project(project, :full) |> Helpers.response(conn, :created)
    rescue
      %Ecto.Changeset{} = changeset -> ErrorResponse.send_error(conn, changeset)
      e -> ErrorResponse.send_error(conn, e)
    end
  end

  def update_settings(conn, %{"id" => id} = params) do
    OK.try do
      attrs <- RequestParams.cast(&update_settings_params/1, params)
      project <- fetch_project(conn, id, :write)
      _ <- Projects.update(project, %{settings: settings_attrs(attrs)})
      updated_project <- Projects.get(id, assoc: [tracks: [:clips]]) |> OK.required()
    after
      JSON.project(updated_project, :full) |> Helpers.response(conn, :ok)
    rescue
      :forbidden ->
        forbidden(conn)

      :value_required ->
        project_not_found(conn)

      %Ecto.Changeset{} = changeset ->
        ErrorResponse.send_error(conn, changeset)

      reason ->
        ErrorResponse.send_error(conn, reason, "Failed to update project settings")
    end
  end

  # Loading and authorising always travel together: a project fetched without
  # an access check is exactly the bug this pair exists to prevent.
  defp fetch_project(conn, id, action) do
    with {:ok, project} <- Projects.get(id, assoc: [tracks: [:clips]]) |> OK.required(),
         :ok <- Projects.authorize(action, conn.assigns.current_user, project) do
      {:ok, project}
    end
  end

  defp forbidden(conn), do: ErrorResponse.send_error(conn, :forbidden)

  defp project_not_found(conn),
    do: ErrorResponse.send_error(conn, :not_found, "Project not found")

  # The wire format spells the time signature "7/8"; the schema stores it as an
  # atom. Only the keys the caller sent are touched.
  defp settings_attrs(%{settings: settings}) do
    case Map.pop(settings, :time_signature) do
      {nil, rest} -> rest
      {value, rest} -> Map.put(rest, :time_signature, Helpers.parse_time_signature(value))
    end
  end
end
