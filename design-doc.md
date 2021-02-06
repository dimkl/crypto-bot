# Design crypro Bot

## Objective

Create a bot that will monitor for peaks in asset value and
execute a "buy" operation for a negative peak (drop of value)
and a "sell" operation for a positive peak (rise of value).
We consider those peaks on a time window of 1 day and we assume
that each day there will be peaks based on the open price and the
price will be approximately the same by the end of the day.

In the "buy" operation:
- capital should exist
- value should be more than a configured threshold
- recovery percentage will be used after configured threshold is reached
- limit "buy" order will be created after recovery threshold is reached
- limit "buy" value will be the value of the asset when recovery percentage is reached
- activated on negative peak
In the "sell" operation:
- assets should exist
- value should be more than a configured threshold
- recovery percentage will be used after configured threshold is reached
- limit "sell" order will be created after recovery threshold is reached
- limit "sell" value will be the value of the asset when recovery percentage is reached
- activated on positive peak

"Buy" operation
if there is no capital
  => wait capital exists (noop)
else if there is no sell transactions
  => wait for buy conditions based on open value
else if there are sell transactions
  => wait for buy conditions based on the sold value
"Sell" operation
if there are no assets
  => wait until assets exists (noop)
else if there are no buy transactions
  => wait for sell conditions based on open value
else if there are buy transactions
  => wait for sell conditions based on the bought value

## Solution

### ER

balance:
  - currency (eur, btc, xlm, xrp, ...)
  - amount (float number)
  - fee_percentage
  - updated_at
orders:
  - state (buying,bought,selling,sold)
  - created_at
  - updated_at
  - amount
  - capital
  - assets
  - profit_percentage
  - profit_amount
transactions:
  - external_id
  - order_id
  - amount
  - fee_amount
  - capital
  - assets
  - mode (sell, buy)

### Class Diagram

Configuration:
  - currencyPair (btceur, xlmeur, xrpeur)
  - profitThresholdPercentage
  - recoveryPercentage
  - mode (sell, buy, monitor)

### Sequence Diagram


## V1 Implementation

Implement for Bitstamp platform