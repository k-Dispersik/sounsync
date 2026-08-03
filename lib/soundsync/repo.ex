defmodule Soundsync.Repo do
  use Ecto.Repo,
    otp_app: :soundsync,
    adapter: Ecto.Adapters.Postgres
end
