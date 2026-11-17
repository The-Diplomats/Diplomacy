# Upstash (Redis)

One Upstash Redis database per environment, provisioned by hand in the Upstash console. Used by BullMQ (backend queues,
worker) and the Socket.IO Redis adapter. Reasons behind these settings: `MilestoneSubmissions/DESIGN_DOC.md` decision
log.

## Account

- Plan: pay-as-you-go. The free tier allows one database.
- Budget cap, with alerts at 70% and 90%.

## Databases

| Setting  | Value                                                 |
| -------- | ----------------------------------------------------- |
| Names    | `diplomacy-dev`, `diplomacy-stage`, `diplomacy-prod`  |
| Type     | Regional                                              |
| Region   | AWS US-East-1                                         |
| TLS      | On                                                    |
| Eviction | Off: BullMQ jobs must never be dropped to free memory |
