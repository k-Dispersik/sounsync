defmodule SoundsyncWeb.API.V1.UserControllerTest do
  use SoundsyncWeb.ConnCase, async: true

  alias Core.Accounts

  defp as(conn, user) do
    put_req_header(conn, "authorization", "Bearer " <> Accounts.create_session_token(user))
  end

  test "B-2: GET /v1/users/:id reaches the action", %{conn: conn} do
    user = user_fixture()

    body = conn |> as(user) |> get(~p"/v1/users/#{user.id}") |> json_response(200)

    assert body["email"] == user.email
    refute Map.has_key?(body, "password")
  end

  test "an unknown user is 404, not a crash", %{conn: conn} do
    conn = conn |> as(user_fixture()) |> get(~p"/v1/users/0")

    assert %{"error" => %{"code" => "not_found"}} = json_response(conn, 404)
  end
end
