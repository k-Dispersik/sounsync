defmodule SoundsyncWeb.Helpers do
  import Plug.Conn
  import Phoenix.Controller

  alias Core.DB.ProjectSetting

  @time_signature_atom_to_string Enum.into(ProjectSetting.get_time_signature_values(), %{})
  @time_signature_string_to_atom Enum.into(@time_signature_atom_to_string, %{}, fn {k, v} ->
                                   {v, k}
                                 end)

  def response(data, conn, status) do
    conn
    |> put_status(status)
    |> json(data)
  end

  def parse_time_signature(nil), do: nil

  def parse_time_signature(time_signature) when is_binary(time_signature) do
    Map.get(@time_signature_string_to_atom, time_signature)
  end

  def parse_time_signature(time_signature) when is_atom(time_signature) do
    Map.get(@time_signature_atom_to_string, time_signature)
  end

  @doc """

  """
  def get_changes?(%Ecto.Changeset{valid?: true, changes: changes}) do
    {:ok, changes}
  end

  def get_changes?(_), do: {:error, :invalid_changeset}
end
