# Azure Container Apps (backend and worker)

One resource group and one Container Apps environment per environment, created with the Azure CLI; secrets are set in
the portal. Architecture and the reasons behind these settings: `MilestoneSubmissions/DESIGN_DOC.md` and the decision
log.

## Subscription

| Setting   | Value                                                          |
| --------- | -------------------------------------------------------------- |
| Offer     | Pay-As-You-Go                                                  |
| Budget    | `Diplomacy`, monthly, email alerts at 80% and 95%              |
| Providers | `Microsoft.App` and `Microsoft.OperationalInsights` registered |
| Region    | East US (next to Neon in AWS us-east-1)                        |
| Quota     | Managed Environment Count in East US of at least 3             |

## Resources

| Resource                | dev                            | stage                            | prod                       |
| ----------------------- | ------------------------------ | -------------------------------- | -------------------------- |
| Resource group          | `rg-diplomacy-dev`             | `rg-diplomacy-stage`             | `rg-diplomacy-prod`        |
| Log Analytics workspace | `log-diplomacy-dev`            | `log-diplomacy-stage`            | `log-diplomacy-prod`       |
| Daily log cap           | 0.05 GB                        | 0.05 GB                          | 0.1 GB                     |
| Environment             | `cae-diplomacy-dev`            | `cae-diplomacy-stage`            | `cae-diplomacy-prod`       |
| Backend min replicas    | 0                              | 0                                | 1                          |
| API host                | `api.dev.diplomacy.gg`         | `api.stage.diplomacy.gg`         | `api.diplomacy.gg`         |
| Admin host              | `admin.dev.diplomacy.gg`       | `admin.stage.diplomacy.gg`       | `admin.diplomacy.gg`       |
| Frontend origin         | `https://app.dev.diplomacy.gg` | `https://app.stage.diplomacy.gg` | `https://app.diplomacy.gg` |

Workspaces keep logs for 30 days. Environments use the Consumption workload profile. Each environment holds two apps:
`ca-backend` and `ca-worker`, both 0.25 vCPU and 0.5 GiB, with images from `ghcr.io/the-diplomats/diplomacy-<app>`
(public, no registry credentials).

| App          | Ingress                             | Replicas                   |
| ------------ | ----------------------------------- | -------------------------- |
| `ca-backend` | external, port 3001, transport auto | min per table above, max 1 |
| `ca-worker`  | none                                | min 1, max 1               |

The worker never scales to zero because BullMQ delayed jobs need a running worker to fire. The backend stays at max 1
because rate limits are kept in memory.

## Checks

| Request                                                           | Expected                             |
| ----------------------------------------------------------------- | ------------------------------------ |
| `GET https://<api host>/health`                                   | 200 `{"status":"ok"}`                |
| `POST https://<api host>/auth/login` with an unknown `identifier` | 401 (proves the database connection) |
| `GET https://<admin host>/queues`                                 | 403                                  |
| `GET` on the default `*.azurecontainerapps.io` FQDN               | 404 (unknown host)                   |

The backend routes by host name, so anything calling it, including health probes, must send an `api.*` or `admin.*`
`Host` header. With min replicas 0, the first request after an idle period takes several seconds while a replica starts.

## Logs

Console output goes to the environment's workspace. In the portal: workspace → **Logs**:

```kusto
ContainerAppConsoleLogs_CL
| where ContainerAppName_s == "ca-backend"
| project TimeGenerated, Log_s
| order by TimeGenerated desc
```

Live tail: `az containerapp logs show -g $RG -n ca-backend --follow`.
