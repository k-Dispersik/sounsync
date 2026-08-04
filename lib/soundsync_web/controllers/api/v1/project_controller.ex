defmodule SoundsyncWeb.API.V1.ProjectController do
  @moduledoc """
  Projects themselves: `/v1/projects`. Tracks and clips live in their own
  controllers.
  """

  use SoundsyncWeb, :controller
  use Params

  alias Core.Projects
  alias SoundsyncWeb.Helpers
  alias SoundsyncWeb.JSON
  alias SoundsyncWeb.Params, as: RequestParams
  alias SoundsyncWeb.ProjectScope

  action_fallback SoundsyncWeb.FallbackController

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
    |> Projects.list_projects_for_user()
    |> Enum.map(&JSON.project(&1, :summary))
    |> Helpers.response(conn, :ok)
  end

  def show(conn, %{"id" => id}) do
    with {:ok, project} <- ProjectScope.fetch(conn, id, :read) do
      project |> JSON.project(:full) |> Helpers.response(conn, :ok)
    end
  end

  def create(conn, params) do
    with {:ok, attrs} <- RequestParams.cast(&create_project_params/1, params),
         {:ok, project} <- Projects.create_project(conn.assigns.current_user, attrs) do
      project |> JSON.project(:full) |> Helpers.response(conn, :created)
    end
  end

  def update_settings(conn, %{"id" => id} = params) do
    with {:ok, attrs} <- RequestParams.cast(&update_settings_params/1, params),
         {:ok, project} <- ProjectScope.fetch(conn, id, :write),
         {:ok, updated} <- Projects.update_project(project, %{settings: settings_attrs(attrs)}) do
      updated |> JSON.project(:full) |> Helpers.response(conn, :ok)
    end
  end

  # The wire format spells the time signature "7/8"; the schema stores it as an
  # atom. Only the keys the caller sent are touched.
  defp settings_attrs(%{settings: settings}) do
    case Map.pop(settings, :time_signature) do
      {nil, rest} -> rest
      {value, rest} -> Map.put(rest, :time_signature, Helpers.parse_time_signature(value))
    end
  end
end
