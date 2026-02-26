import Config

config :soundsync, Soundsync.Repo,
  username: "root",
  password: "root",
  hostname: "localhost",
  database: "soundsync_db",
  stacktrace: true,
  show_sensitive_data_on_connection_error: true,
  pool_size: 10

config :soundsync, SoundsyncWeb.Endpoint,
  http: [ip: {127, 0, 0, 1}],
  check_origin: false,
  code_reloader: true,
  debug_errors: true,
  secret_key_base: "A6/pa9++14SJHHCGDwEQSu0QX12wk/i8UYVw670Eqk7/NZDOQF+Kafr8qQF+kZZX",
  watchers: [
    esbuild: {Esbuild, :install_and_run, [:soundsync, ~w(--sourcemap=inline --watch)]},
    tailwind: {Tailwind, :install_and_run, [:soundsync, ~w(--watch)]}
  ]

config :soundsync, dev_routes: true

config :logger, :default_formatter, format: "[$level] $message\n"

config :phoenix, :stacktrace_depth, 20

config :phoenix, :plug_init_mode, :runtime

config :swoosh, :api_client, false
