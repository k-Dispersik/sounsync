defmodule SoundsyncWeb.Presence do
  @moduledoc """
  Who is in a workspace right now.

  Tracked per socket rather than per user: the same person with the project
  open in two tabs is two cursors, and pretending otherwise makes one of them
  disappear when the other closes.

  The colour is derived from the user id so that one person looks the same to
  everyone, without anyone having to agree on an assignment.
  """

  use Phoenix.Presence,
    otp_app: :soundsync,
    pubsub_server: Soundsync.PubSub

  alias Core.Accounts.User

  # The golden angle spreads consecutive ids far apart on the colour wheel, so
  # two people who joined one after another do not get near-identical hues.
  @golden_angle 137

  @doc "What is published about a participant."
  def meta(%User{} = user, session_id) do
    %{
      user_id: user.id,
      name: user.name,
      session_id: session_id,
      color_hue: rem(user.id * @golden_angle, 360),
      joined_at: DateTime.utc_now()
    }
  end
end
