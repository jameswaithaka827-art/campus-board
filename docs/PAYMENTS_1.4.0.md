# James AI 1.4 — Payments Architecture

## Web
Stripe remains the web card/subscription path. M-PESA uses Safaricom Daraja server-side APIs; credentials stay server-only. The payment flow records a pending transaction first and only grants Pro after a trusted provider callback/webhook is received.

Safaricom describes Daraja 3.0 as a bridge for M-PESA APIs into web/mobile apps and provides a sandbox for development.

## Mobile stores
Digital Pro access sold inside Google Play or the Apple App Store should use the applicable store billing system. The backend should map a verified store transaction to the same James AI entitlement.

## Payout model
Customer → payment provider → applicable fees/taxes → merchant balance → configured payout account. The exact payout method, timing and fees depend on the provider account and country/merchant setup; do not hard-code a universal fee percentage into product copy.

## Admin finance
Admin Center now has a finance summary for gross paid, pending/failed payment amounts and active Pro accounts. This is operational reporting, not a bank ledger.
