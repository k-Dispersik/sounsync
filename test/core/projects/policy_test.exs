defmodule Core.ProjectsCtx.PolicyTest do
  @moduledoc """
  Pure rules, so the table is spelled out in full rather than sampled: a
  permission matrix is exactly the kind of thing that quietly grows a hole.
  """

  use ExUnit.Case, async: true

  alias Core.ProjectsCtx.Policy

  @matrix [
    {:read, :owner, :ok},
    {:read, :editor, :ok},
    {:read, :viewer, :ok},
    {:read, nil, :forbidden},
    {:write, :owner, :ok},
    {:write, :editor, :ok},
    {:write, :viewer, :forbidden},
    {:write, nil, :forbidden},
    {:delete, :owner, :ok},
    {:delete, :editor, :forbidden},
    {:delete, :viewer, :forbidden},
    {:delete, nil, :forbidden}
  ]

  for {action, role, expected} <- @matrix do
    test "#{role || "a non-member"} may#{if expected == :ok, do: "", else: " not"} #{action}" do
      expected =
        case unquote(expected) do
          :ok -> :ok
          :forbidden -> {:error, :forbidden}
        end

      assert Policy.authorize(unquote(action), unquote(role)) == expected
    end
  end

  test "can?/2 mirrors authorize/2" do
    for {action, role, expected} <- @matrix do
      assert Policy.can?(action, role) == (expected == :ok)
    end
  end

  test "an unknown action has no answer rather than a permissive one" do
    assert_raise FunctionClauseError, fn -> Policy.authorize(:publish, :owner) end
  end

  test "actions/0 lists every action the matrix covers" do
    assert Enum.sort(Policy.actions()) == [:delete, :read, :write]
  end
end
