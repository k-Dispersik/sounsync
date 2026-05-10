defmodule SoundsyncWeb.Router do
  use SoundsyncWeb, :router

  pipeline :browser do
    plug :accepts, ["html"]
    plug :fetch_session
    plug :protect_from_forgery
    plug :put_secure_browser_headers
  end

  pipeline :api do
    plug :accepts, ["json"]
  end

  scope "/v1", SoundsyncWeb.API.V1 do
    pipe_through :api

    get "/users/:id", UserController, :show

    scope "/projects" do
      get "/", ProjectController, :index
      get "/:id", ProjectController, :show
      post "/", ProjectController, :create
      patch "/:id/settings", ProjectController, :update_settings
      post "/:project_id/tracks", ProjectController, :create_track
      post "/:project_id/tracks/:track_id/clips", ProjectController, :create_clip
      patch "/:project_id/tracks/:track_id/clips/:clip_id", ProjectController, :update_clip
      delete "/:project_id/tracks/:track_id", ProjectController, :delete_track
    end
  end

  if Application.compile_env(:soundsync, :dev_routes) do
    import Phoenix.LiveDashboard.Router

    scope "/dev" do
      pipe_through [:fetch_session, :protect_from_forgery]

      live_dashboard "/dashboard", metrics: SoundsyncWeb.Telemetry
      forward "/mailbox", Plug.Swoosh.MailboxPreview
    end
  end

  scope "/", SoundsyncWeb do
    pipe_through :browser

    get "/", PageController, :index
    get "/*path", PageController, :index
  end
end
