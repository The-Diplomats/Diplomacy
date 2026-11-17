# Neon (Postgres)

One Neon project per environment, provisioned by hand in the Neon console. Architecture and the reasons behind these
settings: `MilestoneSubmissions/DESIGN_DOC.md` §14 and the decision log.

## Projects

| Setting        | Value                                                    |
| -------------- | -------------------------------------------------------- |
| Project names  | `diplomacy-dev`, `diplomacy-stage`, `diplomacy-prod`     |
| Postgres       | 16                                                       |
| Region         | AWS US East 1 (N. Virginia)                              |
| Database       | `diplomacy`                                              |
| Default branch | `main`                                                   |
| Compute        | 0.25 CU min and max (Branches → main → Compute)          |
| Extras         | Off: Realtime, Neon Auth, Functions, Object Storage, AIG |

## Roles

| Role                   | Used by          | Connection | Privileges                        |
| ---------------------- | ---------------- | ---------- | --------------------------------- |
| Owner (Neon's default) | migrations in CI | direct     | everything                        |
| `diplomacy_app`        | backend, worker  | pooled     | read and write rows, nothing else |

## Connection strings

From the project's **Connect** dialog (branch `main`, database `diplomacy`, owner role):

| Secret                   | Pooling | User                                          |
| ------------------------ | ------- | --------------------------------------------- |
| `MIGRATION_DATABASE_URL` | off     | owner, as copied                              |
| `DATABASE_URL`           | on      | replace with `diplomacy_app` and its password |

The pooled host contains `-pooler`. Both URLs end in `?sslmode=verify-full&channel_binding=require`; `pg` treats
`require` as `verify-full` and warns about it on every connection.

## Free plan limits

100 CU-hours per project per month (about 400 hours at 0.25 CU), 1 GB storage per project, 10 branches per project
including `main`, 6 hours of instant-restore history. When CU-hours run out, the compute suspends until the next billing
month; data is kept. Current limits: <https://neon.com/docs/introduction/plans>.
