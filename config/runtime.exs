import Config

if System.get_env("PHX_SERVER") do
  config :soundsync, SoundsyncWeb.Endpoint, server: true
end

config :soundsync, SoundsyncWeb.Endpoint,
  http: [port: String.to_integer(System.get_env("PORT", "4000"))]

if config_env() == :prod do
  # Production writes to S3. Nothing about the bucket lives in the repository.
  config :soundsync, :storage,
    adapter: Core.Storage.S3,
    bucket: System.fetch_env!("S3_BUCKET"),
    region: System.fetch_env!("AWS_REGION"),
    public_base_url: System.get_env("S3_PUBLIC_BASE_URL")

  database_url =
    System.get_env("DATABASE_URL") ||
      raise """
      environment variable DATABASE_URL is missing.
      For example: ecto://USER:PASS@HOST/DATABASE
      """

  maybe_ipv6 = if System.get_env("ECTO_IPV6") in ~w(true 1), do: [:inet6], else: []

  config :soundsync, Soundsync.Repo,
    url: database_url,
    pool_size: String.to_integer(System.get_env("POOL_SIZE") || "10"),
    socket_options: maybe_ipv6

  secret_key_base =
    System.get_env("SECRET_KEY_BASE") ||
      raise """
      environment variable SECRET_KEY_BASE is missing.
      You can generate one by calling: mix phx.gen.secret
      """

  host = System.get_env("PHX_HOST") || "example.com"

  config :soundsync, :dns_cluster_query, System.get_env("DNS_CLUSTER_QUERY")

  config :soundsync, SoundsyncWeb.Endpoint,
    url: [host: host, port: 443, scheme: "https"],
    http: [
      ip: {0, 0, 0, 0, 0, 0, 0, 0}
    ],
    secret_key_base: secret_key_base
end
