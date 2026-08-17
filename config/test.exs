import Config

config :soundsync, Soundsync.Repo,
  username: "root",
  password: "root",
  hostname: "localhost",
  database: "soundsync_test#{System.get_env("MIX_TEST_PARTITION")}",
  pool: Ecto.Adapters.SQL.Sandbox,
  pool_size: System.schedulers_online() * 2

# A root of its own, wiped between runs, so tests cannot see each other's files.
config :soundsync, :storage,
  adapter: Core.Storage.Local,
  root: Path.expand("../tmp/test_uploads", __DIR__),
  public_prefix: "/uploads",
  # Analysis runs in the calling process so tests can assert on the result
  # without waiting for a task they cannot see.
  analysis: :inline

config :soundsync, SoundsyncWeb.Endpoint,
  http: [ip: {127, 0, 0, 1}, port: 4002],
  secret_key_base: "RHo+AuWNpxGaNnwZ/gDM4qyM2GUi7qGksJ2dPkqSR81OvSkzSJlgpHceoB4zXaG+",
  server: false

config :soundsync, Soundsync.Mailer, adapter: Swoosh.Adapters.Test

config :swoosh, :api_client, false

config :logger, level: :warning

config :phoenix, :plug_init_mode, :runtime

config :phoenix,
  sort_verified_routes_query_params: true
