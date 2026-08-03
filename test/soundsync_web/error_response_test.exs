defmodule SoundsyncWeb.ErrorResponseTest do
  @moduledoc """
  The error contract is what the client branches on, so it is pinned down here
  rather than inferred from whichever endpoint happens to fail.
  """

  use SoundsyncWeb.ConnCase, async: true

  alias Core.Accounts
  alias SoundsyncWeb.ErrorResponse

  defp body(conn), do: Jason.decode!(conn.resp_body)

  test "D-1: every error has a code, a message and details", %{conn: conn} do
    for {reason, status, code} <- [
          {:unauthorized, 401, "unauthorized"},
          {:forbidden, 403, "forbidden"},
          {:not_found, 404, "not_found"},
          {:invalid_params, 422, "invalid_params"}
        ] do
      response = ErrorResponse.send_error(conn, reason)

      assert response.status == status

      assert %{"error" => %{"code" => ^code, "message" => message, "details" => %{}}} =
               body(response)

      assert is_binary(message)
    end
  end

  test "a caller may replace the message but not the code", %{conn: conn} do
    response = ErrorResponse.send_error(conn, :not_found, "Project not found")

    assert %{"error" => %{"code" => "not_found", "message" => "Project not found"}} =
             body(response)
  end

  test "a changeset becomes 422 with per-field messages", %{conn: conn} do
    {:error, changeset} = Accounts.register_user(%{name: "A", email: "nope", password: "123"})

    response = ErrorResponse.send_error(conn, changeset)

    assert response.status == 422
    assert %{"error" => %{"code" => "validation_failed", "details" => details}} = body(response)
    assert details["email"] == ["has invalid format"]
    assert details["password"] == ["should be at least 6 character(s)"]
  end

  test "S-2: an unexpected failure says nothing about our internals", %{conn: conn} do
    response = ErrorResponse.send_error(conn, %Postgrex.Error{message: "relation does not exist"})

    assert response.status == 500
    assert %{"error" => %{"code" => "internal_error"} = error} = body(response)
    refute error["message"] =~ "relation"
    assert error["details"] == %{}
    assert Map.has_key?(error, "request_id")
  end
end
