import Config

config :soundsync,
  ecto_repos: [Soundsync.Repo],
  generators: [timestamp_type: :utc_datetime]

config :soundsync, SoundsyncWeb.Endpoint,
  url: [host: "localhost"],
  adapter: Bandit.PhoenixAdapter,
  render_errors: [
    formats: [json: SoundsyncWeb.ErrorJSON],
    layout: false
  ],
  pubsub_server: Soundsync.PubSub,
  live_view: [signing_salt: "IMUbmaYK"]

config :soundsync, Soundsync.Mailer, adapter: Swoosh.Adapters.Local

# Storage limits are the same everywhere; where the bytes land is not.
config :soundsync, :storage,
  adapter: Core.Storage.Local,
  max_upload_bytes: 50 * 1024 * 1024,
  allowed_content_types: ~w(audio/wav audio/mpeg audio/flac audio/ogg audio/mp4),
  upload_url_ttl_seconds: 900

config :esbuild,
  version: "0.25.4",
  soundsync: [
    args:
      ~w(js/app.tsx --bundle --platform=browser --target=es2022 --outdir=../priv/static/assets/js --external:/fonts/* --external:/images/* --alias:@=./js),
    cd: Path.expand("../assets", __DIR__),
    env: %{"NODE_PATH" => Path.expand("../assets/node_modules", __DIR__)}
  ]

config :tailwind,
  version: "4.1.12",
  soundsync: [
    args: ~w(
      --input=assets/css/app.css
      --output=priv/static/assets/css/app.css
    ),
    cd: Path.expand("..", __DIR__)
  ]

config :logger, :default_formatter,
  format: "$time $metadata[$level] $message\n",
  metadata: [:request_id, :reason]

config :phoenix, :json_library, Jason

import_config "#{config_env()}.exs"
