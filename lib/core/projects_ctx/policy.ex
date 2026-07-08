defmodule Core.ProjectsCtx.Policy do
  @moduledoc """
  Who may do what with a project.

  Deliberately pure: it takes a role, not a user and a database. That keeps the
  rules exhaustively testable without fixtures, and keeps the "what is this
  person's role" question in one place — `Core.ProjectsCtx.Projects.authorize/3`,
  which looks the role up and calls in here.

  A missing role (`nil`) means "not a member", which is never allowed anything.
  Non-members get `:forbidden` rather than `:not_found`; hiding a project's
  existence would be worth doing only if project ids were secret, and they are
  not — they sit in every URL the owner shares.
  """

  @type action :: :read | :write | :delete
  @type role :: :owner | :editor | :viewer | nil

  @allowed %{
    read: [:owner, :editor, :viewer],
    write: [:owner, :editor],
    delete: [:owner]
  }

  @doc "Actions this module knows about."
  def actions, do: Map.keys(@allowed)

  @doc """
  Returns `:ok` when the role may perform the action, `{:error, :forbidden}`
  otherwise.
  """
  @spec authorize(action(), role()) :: :ok | {:error, :forbidden}
  def authorize(action, role) when is_map_key(@allowed, action) do
    if role in Map.fetch!(@allowed, action), do: :ok, else: {:error, :forbidden}
  end

  @doc "True when the role may perform the action. Handy in guards and views."
  @spec can?(action(), role()) :: boolean()
  def can?(action, role), do: authorize(action, role) == :ok
end
