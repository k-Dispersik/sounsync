defmodule SoundsyncWeb.Router do
  use SoundsyncWeb, :router

  pipeline :api do
    plug :accepts, ["json"]
  end

  scope "/api", SoundsyncWeb do
    pipe_through :api
  end

  if Application.compile_env(:soundsync, :dev_routes) do
    import Phoenix.LiveDashboard.Router

    scope "/dev" do
      pipe_through [:fetch_session, :protect_from_forgery]

      live_dashboard "/dashboard", metrics: SoundsyncWeb.Telemetry
      forward "/mailbox", Plug.Swoosh.MailboxPreview
    end
  end
end
