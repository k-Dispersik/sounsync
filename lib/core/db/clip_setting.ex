defmodule Core.DB.ClipSetting do
  @moduledoc """
  Clip settings. No fields yet: either fill it in (gain, pan, fades) or drop it
  along with the `settings` field on `Core.DB.Clip`.
  """

  use Ecto.Schema

  embedded_schema do
  end
end
