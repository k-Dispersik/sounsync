defmodule SoundsyncWeb.ConnCase do
  @moduledoc false

  use ExUnit.CaseTemplate

  using do
    quote do
      @endpoint SoundsyncWeb.Endpoint

      use SoundsyncWeb, :verified_routes

      import Plug.Conn
      import Phoenix.ConnTest
      import SoundsyncWeb.ConnCase
    end
  end

  setup tags do
    Soundsync.DataCase.setup_sandbox(tags)
    {:ok, conn: Phoenix.ConnTest.build_conn()}
  end
end
