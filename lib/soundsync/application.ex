defmodule Soundsync.Application do
  @moduledoc false

  use Application

  @impl true
  def start(_type, _args) do
    children = [
      SoundsyncWeb.Telemetry,
      Soundsync.Repo,
      {DNSCluster, query: Application.get_env(:soundsync, :dns_cluster_query) || :ignore},
      {Phoenix.PubSub, name: Soundsync.PubSub},
      SoundsyncWeb.Endpoint
    ]

    opts = [strategy: :one_for_one, name: Soundsync.Supervisor]
    Supervisor.start_link(children, opts)
  end

  @impl true
  def config_change(changed, _new, removed) do
    SoundsyncWeb.Endpoint.config_change(changed, removed)
    :ok
  end
end
