"""
Fetch Closed Positions from MetaTrader 5
----------------------------------------
Standalone utility to retrieve closed positions (deal history grouped by position)
for a given period. Outputs JSON by default or pretty table.

Usage examples:
  - python fetch_closed_positions.py --days 7
  - python fetch_closed_positions.py --days 1 --symbol EURUSD --pretty
  - python fetch_closed_positions.py --from 2025-01-01 --to 2025-01-31 --json
  - python fetch_closed_positions.py --days 0.5  (last 12 hours)
"""

import argparse
import json
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

import MetaTrader5 as mt5


def parse_args() -> argparse.Namespace:
	"""Parse command-line arguments."""
	parser = argparse.ArgumentParser(description="Load closed positions from MT5")
	date_help = "Date in ISO format YYYY-MM-DD or YYYY-MM-DDTHH:MM"

	time_group = parser.add_mutually_exclusive_group()
	time_group.add_argument("--days", type=float, default=7.0, help="Look back this many days (can be fractional). Default: 7")
	time_group.add_argument("--from", dest="from_date", type=str, help=f"Start date/time. {date_help}")

	parser.add_argument("--to", dest="to_date", type=str, help=f"End date/time. {date_help}. Defaults to now if --from is used.")
	parser.add_argument("--symbol", type=str, default=None, help="Filter by symbol (e.g., EURUSD).")
	parser.add_argument("--json", dest="as_json", action="store_true", help="Output JSON (default).")
	parser.add_argument("--pretty", dest="pretty", action="store_true", help="Pretty table output.")
	parser.add_argument("--login", type=int, help="Account login number (optional).")
	parser.add_argument("--password", type=str, help="Account password (optional).")
	parser.add_argument("--server", type=str, help="Broker server name (optional).")
	return parser.parse_args()


def parse_date(date_str: str) -> datetime:
	"""Parse YYYY-MM-DD or YYYY-MM-DDTHH:MM into datetime."""
	formats = ("%Y-%m-%d", "%Y-%m-%dT%H:%M", "%Y-%m-%d %H:%M", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%d %H:%M:%S")
	for fmt in formats:
		try:
			return datetime.strptime(date_str, fmt)
		except ValueError:
			continue
	raise ValueError(f"Invalid date format: {date_str}")


def ensure_connected(login: Optional[int], password: Optional[str], server: Optional[str]) -> None:
	"""Initialize MT5 and optionally login to an account."""
	if not mt5.initialize():
		raise RuntimeError(f"MT5 initialize failed: {mt5.last_error()}")

	if login and password and server:
		if not mt5.login(login, password, server):
			mt5.shutdown()
			raise RuntimeError(f"MT5 login failed: {mt5.last_error()}")


def fetch_closed_positions(start_date: datetime, end_date: datetime, symbol: Optional[str] = None) -> List[Dict[str, Any]]:
	"""
	Get closed positions grouped by position_id between start_date and end_date.
	Filters to trading deals and optionally by symbol.
	"""
	deals = mt5.history_deals_get(start_date, end_date)
	if deals is None:
		raise RuntimeError("Failed to get deal history from MT5")

	if len(deals) == 0:
		return []

	# Group deals by position ticket
	position_deals: Dict[int, List[Any]] = {}
	for deal in deals:
		if deal.type in (mt5.DEAL_TYPE_BUY, mt5.DEAL_TYPE_SELL):
			if symbol and deal.symbol != symbol:
				continue
			position_ticket = deal.position_id
			if position_ticket not in position_deals:
				position_deals[position_ticket] = []
			position_deals[position_ticket].append(deal)

	closed_positions: List[Dict[str, Any]] = []

	for position_ticket, deals_list in position_deals.items():
		# Need at least open and close deal
		if len(deals_list) < 2:
			continue

		# Sort by time
		deals_list.sort(key=lambda x: x.time)

		open_deal = deals_list[0]
		close_deal = deals_list[-1]

		total_profit = sum(d.profit for d in deals_list)
		total_swap = sum(d.swap for d in deals_list)
		total_commission = sum(d.commission for d in deals_list)
		total_volume = sum(d.volume for d in deals_list if d.entry == mt5.DEAL_ENTRY_IN)

		position_type = "BUY" if open_deal.type == mt5.DEAL_TYPE_BUY else "SELL"

		closed_positions.append({
			"ticket": position_ticket,
			"symbol": open_deal.symbol,
			"type": position_type,
			"volume": total_volume,
			"open_price": open_deal.price,
			"close_price": close_deal.price,
			"open_time": datetime.fromtimestamp(open_deal.time).isoformat(),
			"close_time": datetime.fromtimestamp(close_deal.time).isoformat(),
			"profit": round(total_profit, 2),
			"swap": total_swap,
			"commission": total_commission,
			"comment": close_deal.comment or "",
			"duration_minutes": round((close_deal.time - open_deal.time) / 60, 1),
		})

	# Sort by close time desc
	closed_positions.sort(key=lambda x: x["close_time"], reverse=True)
	return closed_positions


def print_pretty(rows: List[Dict[str, Any]]) -> None:
	"""Render a compact pretty table without extra dependencies."""
	if not rows:
		print("No closed positions found.")
		return

	columns = ["ticket", "symbol", "type", "volume", "open_price", "close_price", "profit", "open_time", "close_time"]
	col_widths: Dict[str, int] = {}
	for col in columns:
		max_len = max(len(str(r.get(col, ""))) for r in rows) if rows else 0
		col_widths[col] = max(max_len, len(col))

	header = " | ".join(col.ljust(col_widths[col]) for col in columns)
	sep = "-+-".join("-" * col_widths[col] for col in columns)
	print(header)
	print(sep)
	for r in rows:
		line = " | ".join(str(r.get(col, "")).ljust(col_widths[col]) for col in columns)
		print(line)


def main() -> None:
	args = parse_args()

	# Determine date range
	if args.from_date:
		start_date = parse_date(args.from_date)
		end_date = parse_date(args.to_date) if args.to_date else datetime.now()
	else:
		end_date = datetime.now()
		start_date = end_date - timedelta(days=args.days)

	# Connect and fetch
	try:
		ensure_connected(args.login, args.password, args.server)
		data = fetch_closed_positions(start_date, end_date, args.symbol)
	finally:
		# Always attempt shutdown to release the terminal handle
		try:
			mt5.shutdown()
		except Exception:
			pass

	# Output
	if args.pretty:
		print_pretty(data)
	else:
		print(json.dumps(data, indent=2, default=str))


if __name__ == "__main__":
	main()


