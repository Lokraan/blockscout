defmodule BlockScoutWeb.Chain.TransactionHistoryChartController do
  use BlockScoutWeb, :controller

  alias Explorer.Chain

  @history_length 30

  defp history_length do
    @history_length
  end

  @spec show(Plug.Conn.t(), any()) :: false | Plug.Conn.t()
  def show(conn, _params) do
    with true <- ajax?(conn) do
      tpd_data =
        Enum.map(0..history_length(), fn x ->
          day = Timex.shift(Timex.beginning_of_day(Timex.now()), days: -1 * x)
          transaction_count = Chain.transaction_count_on_day(day)

          %{day: day, transactions: transaction_count}
        end)
        |> encode_data()

      json(conn, %{
        tpd_data: tpd_data,
      })
    end
  end

  defp encode_data(tpd_data) do
    tpd_data
    |> Jason.encode()
    |> case do
      {:ok, data} -> data
      _ -> []
    end
  end
end
