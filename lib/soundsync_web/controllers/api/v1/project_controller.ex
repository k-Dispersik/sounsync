defmodule SoundsyncWeb.API.V1.ProjectController do
  @moduledoc """
  Projects themselves: `/v1/projects`. Tracks and clips live in their own
  controllers.
  """

  use SoundsyncWeb, :controller

  alias Core.ProjectsCtx.Projects
  alias Core.UsersCtx.Users
  alias SoundsyncWeb.ErrorResponse
  alias SoundsyncWeb.Helpers
  alias SoundsyncWeb.JSON

  require OK

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

  def create(conn, %{"title" => title, "description" => description}) do
    OK.try do
      created <-
        Users.create_project(conn.assigns.current_user, %{
          title: title,
          description: description
        })

      project <- Projects.get(created.id, assoc: [tracks: [:clips]]) |> OK.required()
    after
      JSON.project(project, :full) |> Helpers.response(conn, :created)
    rescue
      e -> ErrorResponse.send_error(conn, e)
    end
  end

  def update_settings(conn, %{"id" => id} = params) do
    OK.try do
      project <- fetch_project(conn, id, :write)
      settings_attrs = project_settings_attrs(params)
      _ <- Projects.update(project, %{settings: settings_attrs})
      updated_project <- Projects.get(id, assoc: [tracks: [:clips]]) |> OK.required()
    after
      JSON.project(updated_project, :full) |> Helpers.response(conn, :ok)
    rescue
      :forbidden ->
        forbidden(conn)

      :value_required ->
        project_not_found(conn)

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

  defp project_settings_attrs(%{"settings" => settings_params}) when is_map(settings_params) do
    %{
      bpm: Map.get(settings_params, "BPM"),
      time_signature: Helpers.parse_time_signature(Map.get(settings_params, "timeSignature")),
      timeline_length_ms: Map.get(settings_params, "timelineLengthMs")
    }
  end

  defp project_settings_attrs(_params), do: nil
end
