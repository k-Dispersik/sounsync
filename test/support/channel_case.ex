defmodule SoundsyncWeb.ChannelCase do
  @moduledoc """
  Test case for channels and the socket.
  """

  use ExUnit.CaseTemplate

  using do
    quote do
      @endpoint SoundsyncWeb.Endpoint

      import Phoenix.ChannelTest
      import Soundsync.Fixtures
      import SoundsyncWeb.ChannelCase
    end
  end

  setup tags do
    Soundsync.DataCase.setup_sandbox(tags)
    :ok
  end
end
