# Azure (backend, worker and frontend)

One resource group per environment holding a Container Apps environment (backend and worker) and a Static Web App
(frontend), created with the Azure CLI; secrets are set in the portal. Architecture and the reasons behind these
settings: `MilestoneSubmissions/DESIGN_DOC.md` and the decision log.

## Subscription

| Setting   | Value                                                                                       |
| --------- | ------------------------------------------------------------------------------------------- |
| Offer     | Pay-As-You-Go                                                                               |
| Budget    | `Diplomacy`, monthly, email alerts at 80% and 95%                                           |
| Providers | `Microsoft.App`, `Microsoft.OperationalInsights` and `Microsoft.Web` registered             |
| Region    | East US (next to Neon in AWS us-east-1); Static Web Apps in East US 2, which has no East US |
| Quota     | Managed Environment Count in East US of at least 3                                          |

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
| Static Web App          | `swa-diplomacy-dev`            | `swa-diplomacy-stage`            | `swa-diplomacy-prod`       |
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

## Static Web Apps

| Setting        | Value                                                                                 |
| -------------- | ------------------------------------------------------------------------------------- |
| Plan           | Free                                                                                  |
| Source         | Other (not linked to GitHub, so Azure never commits a workflow or adds a repo secret) |
| Deploys        | `deploy-frontend-<env>.yml`, using the app's deployment token                         |
| GitHub secret  | `AZURE_STATIC_WEB_APPS_API_TOKEN` in the matching environment, which allows `main`    |
| Custom domain  | `app.<env>` CNAME to the app's default hostname, DNS only, no TXT record              |
| Build variable | `VITE_API_URL` set to the env's API host at build time                                |

`apps/frontend/public/staticwebapp.config.json` holds the SPA fallback, asset caching and security headers. A leaked
token is reset under **Overview → Manage deployment token**, then replaced in the GitHub environment.

## Checks

| Request                                                           | Expected                                         |
| ----------------------------------------------------------------- | ------------------------------------------------ |
| `GET https://<api host>/health`                                   | 200 `{"status":"ok"}`                            |
| `POST https://<api host>/auth/login` with an unknown `identifier` | 401 (proves the database connection)             |
| `GET https://<admin host>/queues`                                 | 403                                              |
| `GET` on the default `*.azurecontainerapps.io` FQDN               | 404 (unknown host)                               |
| `GET https://<app host>/auth/login`                               | 200 HTML (SPA fallback)                          |
| `GET https://<app host>/assets/missing.js`                        | 404                                              |
| Register, log in, reload in a browser                             | still logged in (session cookie reaches the API) |

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
