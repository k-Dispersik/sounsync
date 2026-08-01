defmodule SoundsyncWeb.Params do
  @moduledoc """
  One way to validate request parameters.

  Every action that takes a body declares its shape with `Params.defparams/1`
  and runs it through `cast/2`. Pattern matching in the action head, which is
  what most of these used to do, turns a missing field into a
  `FunctionClauseError` — a 500 for what is plainly the caller's mistake.

  Only the keys the caller actually sent come back, so a PATCH stays a partial
  update instead of quietly overwriting untouched fields with nil.
  """

  alias Ecto.Changeset

  @spec cast((map() -> Changeset.t()), map()) :: {:ok, map()} | {:error, Changeset.t()}
  def cast(schema, params) do
    case schema.(params) do
      %Changeset{valid?: true} = changeset -> {:ok, changes(changeset)}
      %Changeset{} = changeset -> {:error, changeset}
    end
  end

  defp changes(%Changeset{changes: changes}) do
    Map.new(changes, fn
      {key, %Changeset{} = nested} -> {key, changes(nested)}
      {key, value} -> {key, value}
    end)
  end
end
