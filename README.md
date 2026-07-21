# TextQL TypeScript SDK

The official, type-safe TypeScript client for the TextQL API.

[![npm](https://img.shields.io/npm/v/%40textql%2Fsdk)](https://www.npmjs.com/package/@textql/sdk)
[![License: Apache 2.0](https://img.shields.io/badge/license-Apache--2.0-blue)](https://www.apache.org/licenses/LICENSE-2.0)
[![Built by Speakeasy](https://img.shields.io/badge/Built%20by-Speakeasy-6B46C1)](https://www.speakeasy.com/)

## Summary

Use `@textql/sdk` to access TextQL agents, apps, chats, connectors, dashboards,
datasets, and the rest of the public API from Node.js, Bun, or modern edge
runtimes. The SDK includes generated request and response types, authentication,
retries, error handling, and per-operation examples.

- [TextQL documentation](https://docs.textql.com/)
- [API reference](https://docs.textql.com/api-reference/introduction)
- [TypeScript SDK release log](https://docs.textql.com/api-reference/sdk/typescript)
- [Report an issue](https://github.com/TextQLLabs/textql-ts-sdk/issues)
<!-- No Summary [summary] -->

<!-- Start Table of Contents [toc] -->
## Table of Contents
<!-- $toc-max-depth=2 -->
* [TextQL TypeScript SDK](#textql-typescript-sdk)
  * [SDK Installation](#sdk-installation)
  * [Requirements](#requirements)
  * [SDK Example Usage](#sdk-example-usage)
  * [Authentication](#authentication)
  * [Available Resources and Operations](#available-resources-and-operations)
  * [Standalone functions](#standalone-functions)
  * [Retries](#retries)
  * [Error Handling](#error-handling)
  * [Server Selection](#server-selection)
  * [Custom HTTP Client](#custom-http-client)
  * [Debugging](#debugging)
* [Development](#development)
  * [Maturity](#maturity)
  * [Contributions](#contributions)

<!-- End Table of Contents [toc] -->

<!-- Start SDK Installation [installation] -->
## SDK Installation

The SDK can be installed with either [npm](https://www.npmjs.com/), [pnpm](https://pnpm.io/), [bun](https://bun.sh/) or [yarn](https://classic.yarnpkg.com/en/) package managers.

### NPM

```bash
npm add @textql/sdk
```

### PNPM

```bash
pnpm add @textql/sdk
```

### Bun

```bash
bun add @textql/sdk
```

### Yarn

```bash
yarn add @textql/sdk
```

> [!NOTE]
> This package is published as an ES Module (ESM) only. For applications using
> CommonJS, use `await import("@textql/sdk")` to import and use this package.
<!-- End SDK Installation [installation] -->

<!-- Start Requirements [requirements] -->
## Requirements

For supported JavaScript runtimes, please consult [RUNTIMES.md](RUNTIMES.md).
<!-- End Requirements [requirements] -->

<!-- Start SDK Example Usage [usage] -->
## SDK Example Usage

### Example

```typescript
import { Textql } from "@textql/sdk";

const textql = new Textql({
  apiKey: process.env["TEXTQL_API_KEY"] ?? "",
});

async function run() {
  const result = await textql.agents.create({
    body: {},
  });

  console.log(result);
}

run();

```
<!-- End SDK Example Usage [usage] -->

<!-- Start Authentication [security] -->
## Authentication

### Per-Client Security Schemes

This SDK supports the following security scheme globally:

| Name     | Type   | Scheme  | Environment Variable |
| -------- | ------ | ------- | -------------------- |
| `apiKey` | apiKey | API key | `TEXTQL_API_KEY`     |

To authenticate with the API the `apiKey` parameter must be set when initializing the SDK client instance. For example:
```typescript
import { Textql } from "@textql/sdk";

const textql = new Textql({
  apiKey: process.env["TEXTQL_API_KEY"] ?? "",
});

async function run() {
  const result = await textql.agents.create({
    body: {},
  });

  console.log(result);
}

run();

```
<!-- End Authentication [security] -->

<!-- Start Available Resources and Operations [operations] -->
## Available Resources and Operations

<details open>
<summary>Available methods</summary>

### [Agents](docs/sdks/agents/README.md)

* [create](docs/sdks/agents/README.md#create) - CreateAgent
* [delete](docs/sdks/agents/README.md#delete) - DeleteAgent
* [duplicate](docs/sdks/agents/README.md#duplicate) - DuplicateAgent
* [getAgent](docs/sdks/agents/README.md#getagent) - GetAgent
* [getRun](docs/sdks/agents/README.md#getrun) - GetAgentRun
* [listRuns](docs/sdks/agents/README.md#listruns) - ListAgentRuns
* [list](docs/sdks/agents/README.md#list) - ListAgents
* [resetAgentAvatar](docs/sdks/agents/README.md#resetagentavatar) - ResetAgentAvatar
* [triggerAgent](docs/sdks/agents/README.md#triggeragent) - TriggerAgent
* [update](docs/sdks/agents/README.md#update) - UpdateAgent
* [uploadAgentAvatar](docs/sdks/agents/README.md#uploadagentavatar) - UploadAgentAvatar

### [Apps](docs/sdks/apps/README.md)

* [heartbeat](docs/sdks/apps/README.md#heartbeat) - Keeps the viewed app's compute worker alive; first view spawns and pre-warms it (dashboard viewer-TTL parity).
* [createApp](docs/sdks/apps/README.md#createapp) - CreateApp
* [deleteApp](docs/sdks/apps/README.md#deleteapp) - DeleteApp
* [duplicate](docs/sdks/apps/README.md#duplicate) - Duplicates an app the caller can view into a new draft app they own,  named "Copy of <name>". Copies code/files/data sources/compute functions/  schedule; never carries over the source's published state or data snapshot.
* [get](docs/sdks/apps/README.md#get) - GetApp
* [getAppVersion](docs/sdks/apps/README.md#getappversion) - GetAppVersion
* [getAppViewStats](docs/sdks/apps/README.md#getappviewstats) - View analytics: reads the engagement views recorded on app page load.
* [getMembersWithApps](docs/sdks/apps/README.md#getmemberswithapps) - GetMembersWithApps
* [invokeComputeFunction](docs/sdks/apps/README.md#invokecomputefunction) - Executes a declared compute function on a pooled sandbox worker; gated, org-scoped, rate-limited.
* [listVersions](docs/sdks/apps/README.md#listversions) - Version history: a snapshot is recorded on each publish; authors can list and restore.
* [list](docs/sdks/apps/README.md#list) - ListApps
* [moveAppToFolder](docs/sdks/apps/README.md#moveapptofolder) - Moves an app into a library folder (or to root when folder_id is empty).
* [refresh](docs/sdks/apps/README.md#refresh) - Re-fetches data sources, rebuilds the document with a fresh snapshot, re-uploads.
* [restoreAppVersion](docs/sdks/apps/README.md#restoreappversion) - RestoreAppVersion
* [setFavorite](docs/sdks/apps/README.md#setfavorite) - Favorite/unfavorite a library item (app or dashboard) for the calling member.  Per-member, per-org; favorited=false hard-deletes the row. Covers both primitives  since the merged library page pins apps and dashboards through one client.
* [update](docs/sdks/apps/README.md#update) - UpdateApp

### [AppService](docs/sdks/appservice/README.md)

* [appServiceGetAppMemberState](docs/sdks/appservice/README.md#appservicegetappmemberstate) - Staff-only (superadmin gated in-handler): publishes the embedded component  gallery as an app tree and returns its signed viewer URL.
* [appServiceListAppActivitySince](docs/sdks/appservice/README.md#appservicelistappactivitysince) - ListAppActivitySince
* [appServiceListMyAppMemberActivity](docs/sdks/appservice/README.md#appservicelistmyappmemberactivity) - Append-only per-member activity log. Listing is own rows only; no  cross-member reads in this release.
* [appServicePresenceHeartbeat](docs/sdks/appservice/README.md#appservicepresenceheartbeat) - Server stream of live activity batches + presence snapshots, driven by  Valkey nudges over the app_activity:{app_id} channel; Postgres stays SSoT.
* [appServiceRecordAppMemberActivity](docs/sdks/appservice/README.md#appservicerecordappmemberactivity) - RecordAppMemberActivity
* [appServiceSetAppMemberState](docs/sdks/appservice/README.md#appservicesetappmemberstate) - Per-member app state: one JSON blob per (app, member) so apps remember  settings/progress. Member always resolved server-side from auth context;  per-member persistence, so viewers with read access can save their own state.

### [AuditLogs](docs/sdks/auditlogs/README.md)

* [configureOtlpExport](docs/sdks/auditlogs/README.md#configureotlpexport) - ConfigureOtlpExport
* [configureS3Export](docs/sdks/auditlogs/README.md#configures3export) - ConfigureS3Export
* [deleteOtlpExportConfig](docs/sdks/auditlogs/README.md#deleteotlpexportconfig) - DeleteOtlpExportConfig
* [deleteS3ExportConfig](docs/sdks/auditlogs/README.md#deletes3exportconfig) - DeleteS3ExportConfig
* [getOtlpExportConfig](docs/sdks/auditlogs/README.md#getotlpexportconfig) - GetOtlpExportConfig
* [getS3ExportConfig](docs/sdks/auditlogs/README.md#gets3exportconfig) - GetS3ExportConfig
* [list](docs/sdks/auditlogs/README.md#list) - ListAuditLogs
* [testOtlpExportConnection](docs/sdks/auditlogs/README.md#testotlpexportconnection) - TestOtlpExportConnection
* [testS3ExportConnection](docs/sdks/auditlogs/README.md#tests3exportconnection) - TestS3ExportConnection
* [triggerOtlpExport](docs/sdks/auditlogs/README.md#triggerotlpexport) - TriggerOtlpExport
* [triggerS3Export](docs/sdks/auditlogs/README.md#triggers3export) - TriggerS3Export

### [Chats](docs/sdks/chats/README.md)

* [approveContextPromptChange](docs/sdks/chats/README.md#approvecontextpromptchange) - ApproveContextPromptChange
* [approveOntologyChange](docs/sdks/chats/README.md#approveontologychange) - Resolve a halted ask_approval form cell. Submit runs the form's submission  and continues the agent with the outcome; Reject discards it (passive, no  run); Dismiss treats it as a change request (no run, next message says what  to change). All three set the cell's outcome, like the other approve/deny cells.
* [attachAgent](docs/sdks/chats/README.md#attachagent) - External API users
* [attachApp](docs/sdks/chats/README.md#attachapp) - AttachApp
* [attachDashboard](docs/sdks/chats/README.md#attachdashboard) - AttachDashboard
* [attachDataset](docs/sdks/chats/README.md#attachdataset) - AttachDataset
* [bookmark](docs/sdks/chats/README.md#bookmark) - BookmarkChat
* [cancelStream](docs/sdks/chats/README.md#cancelstream) - CancelStream
* [checkPermissions](docs/sdks/chats/README.md#checkpermissions) - CheckChatPermissions
* [checkHealth](docs/sdks/chats/README.md#checkhealth) - CheckHealth
* [checkStreamlitHealth](docs/sdks/chats/README.md#checkstreamlithealth) - CheckStreamlitHealth
* [createChat](docs/sdks/chats/README.md#createchat) - CreateChat
* [delete](docs/sdks/chats/README.md#delete) - DeleteChat
* [dismissQuestions](docs/sdks/chats/README.md#dismissquestions) - DismissQuestions
* [duplicateChat](docs/sdks/chats/README.md#duplicatechat) - DuplicateChat
* [getApiAnswer](docs/sdks/chats/README.md#getapianswer) - GetAPIChatAnswer
* [getArtifact](docs/sdks/chats/README.md#getartifact) - GetArtifact
* [get](docs/sdks/chats/README.md#get) - GetChat
* [getArtifactsSummary](docs/sdks/chats/README.md#getartifactssummary) - GetChatArtifactsSummary
* [getChatExecutionTiming](docs/sdks/chats/README.md#getchatexecutiontiming) - GetChatExecutionTiming
* [getHistory](docs/sdks/chats/README.md#gethistory) - GetChatHistory
* [getAll](docs/sdks/chats/README.md#getall) - GetChats
* [getCompletionParameters](docs/sdks/chats/README.md#getcompletionparameters) - GetCompletionParameters
* [getCompletionParametersBatch](docs/sdks/chats/README.md#getcompletionparametersbatch) - GetCompletionParametersBatch
* [getLlmUsage](docs/sdks/chats/README.md#getllmusage) - GetLlmUsage
* [getMembersWithChats](docs/sdks/chats/README.md#getmemberswithchats) - List distinct chat creators the user can access
* [getPlaybookChats](docs/sdks/chats/README.md#getplaybookchats) - GetPlaybookChats
* [pollEvents](docs/sdks/chats/README.md#pollevents) - PollChatEvents
* [queryOneShot](docs/sdks/chats/README.md#queryoneshot) - QueryOneShot
* [rateCell](docs/sdks/chats/README.md#ratecell) - RateChatCell appends a row to cell_rating for every click; thumbs-down also upserts a user_thumbs_down thread_warning.
* [rejectContextPromptChange](docs/sdks/chats/README.md#rejectcontextpromptchange) - RejectContextPromptChange
* [rejectOntologyChange](docs/sdks/chats/README.md#rejectontologychange) - RejectOntologyChange
* [run](docs/sdks/chats/README.md#run) - RunChat
* [send](docs/sdks/chats/README.md#send) - SendMessage
* [submitContextPromptChange](docs/sdks/chats/README.md#submitcontextpromptchange) - SubmitContextPromptChange
* [submitQuestions](docs/sdks/chats/README.md#submitquestions) - Resolve a halted questions cell. Submit hands the answers to the agent and  resumes it; Dismiss hands over only the answered count and does NOT resume  (the user's next message becomes the dismissal reason).
* [unbookmark](docs/sdks/chats/README.md#unbookmark) - UnbookmarkChat
* [update](docs/sdks/chats/README.md#update) - UpdateChat

### [Connectors](docs/sdks/connectors/README.md)

* [create](docs/sdks/connectors/README.md#create) - CreateConnector
* [delete](docs/sdks/connectors/README.md#delete) - DeleteConnector
* [duplicateConnector](docs/sdks/connectors/README.md#duplicateconnector) - DuplicateConnector
* [executeQuery](docs/sdks/connectors/README.md#executequery) - ExecuteQuery
* [get](docs/sdks/connectors/README.md#get) - GetConnector
* [getConnectorCellDurations](docs/sdks/connectors/README.md#getconnectorcelldurations) - GetConnectorCellDurations
* [getChats](docs/sdks/connectors/README.md#getchats) - GetConnectorChats
* [getDashboards](docs/sdks/connectors/README.md#getdashboards) - GetConnectorDashboards
* [getConnectorStats](docs/sdks/connectors/README.md#getconnectorstats) - GetConnectorStats
* [getUsage](docs/sdks/connectors/README.md#getusage) - GetConnectorUsage
* [getConnectors](docs/sdks/connectors/README.md#getconnectors) - GetConnectors
* [getExampleQueries](docs/sdks/connectors/README.md#getexamplequeries) - GetExampleQueries
* [getTablePreview](docs/sdks/connectors/README.md#gettablepreview) - GetTablePreview
* [listTables](docs/sdks/connectors/README.md#listtables) - ListConnectorTables
* [listQueryTemplates](docs/sdks/connectors/README.md#listquerytemplates) - ListQueryTemplates
* [test](docs/sdks/connectors/README.md#test) - TestConnector
* [update](docs/sdks/connectors/README.md#update) - UpdateConnector

### [Dashboards](docs/sdks/dashboards/README.md)

* [checkHealth](docs/sdks/dashboards/README.md#checkhealth) - CheckDashboardHealth
* [createDashboard](docs/sdks/dashboards/README.md#createdashboard) - CRUD operations
* [createFolder](docs/sdks/dashboards/README.md#createfolder) - Folder management
* [delete](docs/sdks/dashboards/README.md#delete) - DeleteDashboard
* [deleteFolder](docs/sdks/dashboards/README.md#deletefolder) - DeleteDashboardFolder
* [discardChanges](docs/sdks/dashboards/README.md#discardchanges) - DiscardDashboardChanges
* [duplicate](docs/sdks/dashboards/README.md#duplicate) - DuplicateDashboard
* [get](docs/sdks/dashboards/README.md#get) - GetDashboard
* [getVersion](docs/sdks/dashboards/README.md#getversion) - GetDashboardVersion
* [getDashboardViewStats](docs/sdks/dashboards/README.md#getdashboardviewstats) - View analytics
* [getMembersWithDashboards](docs/sdks/dashboards/README.md#getmemberswithdashboards) - Member management
* [listFolders](docs/sdks/dashboards/README.md#listfolders) - ListDashboardFolders
* [listVersions](docs/sdks/dashboards/README.md#listversions) - Version history
* [list](docs/sdks/dashboards/README.md#list) - ListDashboards
* [moveToFolder](docs/sdks/dashboards/README.md#movetofolder) - MoveDashboardToFolder
* [previewConfig](docs/sdks/dashboards/README.md#previewconfig) - Config-managed dashboards: render a `.dashboard` straight from a patch ref before  it merges (ADR-0022). Runs as the file's run_as, gated on the previewer being  authorized for it; persists nothing.
* [publish](docs/sdks/dashboards/README.md#publish) - Publishing workflow
* [regenerateScreenshot](docs/sdks/dashboards/README.md#regeneratescreenshot) - Screenshot management
* [restoreDashboardVersion](docs/sdks/dashboards/README.md#restoredashboardversion) - RestoreDashboardVersion
* [runScheduledDashboard](docs/sdks/dashboards/README.md#runscheduleddashboard) - RunScheduledDashboard
* [spawn](docs/sdks/dashboards/README.md#spawn) - Dashboard execution
* [updateDashboard](docs/sdks/dashboards/README.md#updatedashboard) - UpdateDashboard
* [updateDashboardFolder](docs/sdks/dashboards/README.md#updatedashboardfolder) - UpdateDashboardFolder
* [updateDashboardSchedule](docs/sdks/dashboards/README.md#updatedashboardschedule) - Scheduling

### [Datasets](docs/sdks/datasets/README.md)

* [createFolder](docs/sdks/datasets/README.md#createfolder) - CreateFolder
* [createPowerBIDataset](docs/sdks/datasets/README.md#createpowerbidataset) - CreatePowerBIDataset
* [createTableauDataset](docs/sdks/datasets/README.md#createtableaudataset) - Create Tableau dataset from views/datasources
* [createUploadPresignUrl](docs/sdks/datasets/README.md#createuploadpresignurl) - uploads
* [delete](docs/sdks/datasets/README.md#delete) - Delete a dataset (soft delete)
* [export](docs/sdks/datasets/README.md#export) - export dataset in "raw" format – original if dataset is uploaded, converted format otherwise (defaults to CSV)
* [fetch](docs/sdks/datasets/README.md#fetch) - GetDataset, GetDatasets only return metadata
* [getStats](docs/sdks/datasets/README.md#getstats) - GetDatasetStats
* [getDatasetValues](docs/sdks/datasets/README.md#getdatasetvalues) - GetDatasetValues
* [get](docs/sdks/datasets/README.md#get) - GetDatasets
* [getByIds](docs/sdks/datasets/README.md#getbyids) - GetDatasetsByIds
* [getFolders](docs/sdks/datasets/README.md#getfolders) - for AR: CreateFolderACL, UpdateFolderACL, DeleteFolderACL
* [processUploadPresignUrl](docs/sdks/datasets/README.md#processuploadpresignurl) - ProcessUploadPresignUrl
* [updateDataset](docs/sdks/datasets/README.md#updatedataset) - Update dataset metadata

### [Mcp](docs/sdks/mcp/README.md)

* [clearOAuthToken](docs/sdks/mcp/README.md#clearoauthtoken) - ClearOAuthToken
* [delete](docs/sdks/mcp/README.md#delete) - DeleteMCPServer
* [getServers](docs/sdks/mcp/README.md#getservers) - GetMCPServers
* [handleOAuthCallback](docs/sdks/mcp/README.md#handleoauthcallback) - HandleOAuthCallback
* [initiateOAuthFlow](docs/sdks/mcp/README.md#initiateoauthflow) - InitiateOAuthFlow
* [toggleServer](docs/sdks/mcp/README.md#toggleserver) - ToggleMCPServer
* [upsertMCPServers](docs/sdks/mcp/README.md#upsertmcpservers) - UpsertMCPServers

### [MetricsExports](docs/sdks/metricsexports/README.md)

* [configure](docs/sdks/metricsexports/README.md#configure) - ConfigureMetricsExport
* [deleteConfig](docs/sdks/metricsexports/README.md#deleteconfig) - DeleteMetricsExportConfig
* [getMetricsExportConfig](docs/sdks/metricsexports/README.md#getmetricsexportconfig) - GetMetricsExportConfig
* [testConnection](docs/sdks/metricsexports/README.md#testconnection) - TestMetricsExportConnection
* [triggerPush](docs/sdks/metricsexports/README.md#triggerpush) - TriggerMetricsPush

### [Observability](docs/sdks/observability/README.md)

* [activateCustomTopic](docs/sdks/observability/README.md#activatecustomtopic) - ActivateCustomTopic
* [backfillCustomTopic](docs/sdks/observability/README.md#backfillcustomtopic) - BackfillCustomTopic
* [backfillThreadWarnings](docs/sdks/observability/README.md#backfillthreadwarnings) - BackfillThreadWarnings
* [createCustomTopic](docs/sdks/observability/README.md#createcustomtopic) - CreateCustomTopic
* [deactivateCustomTopic](docs/sdks/observability/README.md#deactivatecustomtopic) - DeactivateCustomTopic
* [deleteCustomTopic](docs/sdks/observability/README.md#deletecustomtopic) - DeleteCustomTopic
* [exportCsv](docs/sdks/observability/README.md#exportcsv) - ExportObservabilityCsv
* [fixCheckRecord](docs/sdks/observability/README.md#fixcheckrecord) - FixCheckRecord
* [fixWarning](docs/sdks/observability/README.md#fixwarning) - FixWarning
* [getAccessMethodStats](docs/sdks/observability/README.md#getaccessmethodstats) - GetAccessMethodStats
* [getActivePeopleStats](docs/sdks/observability/README.md#getactivepeoplestats) - GetActivePeopleStats
* [getActivePeopleTrend](docs/sdks/observability/README.md#getactivepeopletrend) - GetActivePeopleTrend
* [getBackfillPreview](docs/sdks/observability/README.md#getbackfillpreview) - GetBackfillPreview
* [getBackfillStatus](docs/sdks/observability/README.md#getbackfillstatus) - GetBackfillStatus
* [getBillingStats](docs/sdks/observability/README.md#getbillingstats) - GetBillingStats
* [getChatSourceStats](docs/sdks/observability/README.md#getchatsourcestats) - GetChatSourceStats
* [getChatTopics](docs/sdks/observability/README.md#getchattopics) - GetChatTopics
* [getCheckRecordFix](docs/sdks/observability/README.md#getcheckrecordfix) - GetCheckRecordFix
* [getCustomTopic](docs/sdks/observability/README.md#getcustomtopic) - GetCustomTopic
* [getCustomTopicPeople](docs/sdks/observability/README.md#getcustomtopicpeople) - GetCustomTopicPeople
* [getCustomTopicThreads](docs/sdks/observability/README.md#getcustomtopicthreads) - GetCustomTopicThreads
* [getEngagementSpectrum](docs/sdks/observability/README.md#getengagementspectrum) - GetEngagementSpectrum
* [getMemberActivity](docs/sdks/observability/README.md#getmemberactivity) - GetMemberActivity
* [getObservabilityStats](docs/sdks/observability/README.md#getobservabilitystats) - GetObservabilityStats
* [getThreadWarnings](docs/sdks/observability/README.md#getthreadwarnings) - GetThreadWarnings
* [listCustomTopics](docs/sdks/observability/README.md#listcustomtopics) - ListCustomTopics
* [refineDraft](docs/sdks/observability/README.md#refinedraft) - Custom topics
* [setTopicTagFeedback](docs/sdks/observability/README.md#settopictagfeedback) - SetTopicTagFeedback
* [updateCustomTopic](docs/sdks/observability/README.md#updatecustomtopic) - UpdateCustomTopic

### [ObservabilityService](docs/sdks/observabilityservice/README.md)

* [observabilityServiceGetMemberSignalTrend](docs/sdks/observabilityservice/README.md#observabilityservicegetmembersignaltrend) - GetMemberSignalTrend

### [OntologyManagementService](docs/sdks/ontologymanagementservice/README.md)

* [ontologyManagementServiceAddOntologySubmodule](docs/sdks/ontologymanagementservice/README.md#ontologymanagementserviceaddontologysubmodule) - AddOntologySubmodule
* [ontologyManagementServiceApprovePatch](docs/sdks/ontologymanagementservice/README.md#ontologymanagementserviceapprovepatch) - ApprovePatch
* [ontologyManagementServiceConfigureOntologyRemote](docs/sdks/ontologymanagementservice/README.md#ontologymanagementserviceconfigureontologyremote) - ConfigureOntologyRemote
* [ontologyManagementServiceCreateApprovalRule](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicecreateapprovalrule) - CreateApprovalRule
* [ontologyManagementServiceCreateContextPatchAutoApproveRule](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicecreatecontextpatchautoapproverule) - CreateContextPatchAutoApproveRule
* [ontologyManagementServiceCreateOntologyDirectory](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicecreateontologydirectory) - CreateOntologyDirectory
* [ontologyManagementServiceCreateOntologyFileUploadUrl](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicecreateontologyfileuploadurl) - CreateOntologyFileUploadUrl
* [ontologyManagementServiceDeleteApprovalRule](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicedeleteapprovalrule) - DeleteApprovalRule
* [ontologyManagementServiceDeleteContextPatchAutoApproveRule](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicedeletecontextpatchautoapproverule) - DeleteContextPatchAutoApproveRule
* [ontologyManagementServiceDeleteOntologyDirectory](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicedeleteontologydirectory) - DeleteOntologyDirectory
* [ontologyManagementServiceDeleteOntologyFile](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicedeleteontologyfile) - DeleteOntologyFile
* [ontologyManagementServiceDeleteOntologyOwners](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicedeleteontologyowners) - DeleteOntologyOwners
* [ontologyManagementServiceDenyPatch](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicedenypatch) - DenyPatch
* [ontologyManagementServiceExchangeOntologyGithubCode](docs/sdks/ontologymanagementservice/README.md#ontologymanagementserviceexchangeontologygithubcode) - ExchangeOntologyGithubCode
* [ontologyManagementServiceFinalizeOntologyFileUpload](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicefinalizeontologyfileupload) - FinalizeOntologyFileUpload
* [ontologyManagementServiceGetCodeownerCoverage](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicegetcodeownercoverage) - GetCodeownerCoverage
* [ontologyManagementServiceGetConfigExportCapabilities](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicegetconfigexportcapabilities) - GetConfigExportCapabilities
* [ontologyManagementServiceGetEffectiveOntologyOwners](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicegeteffectiveontologyowners) - GetEffectiveOntologyOwners
* [ontologyManagementServiceGetFileUsage](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicegetfileusage) - GetFileUsage
* [ontologyManagementServiceGetFileUsageTimeline](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicegetfileusagetimeline) - GetFileUsageTimeline
* [ontologyManagementServiceGetOntologyAnaConfig](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicegetontologyanaconfig) - GetOntologyAnaConfig
* [ontologyManagementServiceGetOntologyFile](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicegetontologyfile) - GetOntologyFile
* [ontologyManagementServiceGetOntologyGithubOAuthURL](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicegetontologygithuboauthurl) - GetOntologyGithubOAuthURL
* [ontologyManagementServiceGetOntologyHistoryFileDiff](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicegetontologyhistoryfilediff) - GetOntologyHistoryFileDiff
* [ontologyManagementServiceGetOntologyOwners](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicegetontologyowners) - GetOntologyOwners
* [ontologyManagementServiceGetOntologyRemote](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicegetontologyremote) - GetOntologyRemote
* [ontologyManagementServiceGetOntologySizeTimeline](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicegetontologysizetimeline) - GetOntologySizeTimeline
* [ontologyManagementServiceGetOntologySyncConflicts](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicegetontologysyncconflicts) - GetOntologySyncConflicts
* [ontologyManagementServiceGetOntologyUsageSummary](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicegetontologyusagesummary) - GetOntologyUsageSummary
* [ontologyManagementServiceGetPatch](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicegetpatch) - GetPatch
* [ontologyManagementServiceGetPatchByNumber](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicegetpatchbynumber) - GetPatchByNumber
* [ontologyManagementServiceGetPatchCapabilities](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicegetpatchcapabilities) - GetPatchCapabilities
* [ontologyManagementServiceGetRawPatch](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicegetrawpatch) - GetRawPatch
* [ontologyManagementServiceGetUsageDetailsForFile](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicegetusagedetailsforfile) - GetUsageDetailsForFile
* [ontologyManagementServiceListApprovalRules](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicelistapprovalrules) - ListApprovalRules
* [ontologyManagementServiceListChatsForFile](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicelistchatsforfile) - ListChatsForFile
* [ontologyManagementServiceListContextPatchAutoApproveRules](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicelistcontextpatchautoapproverules) - ListContextPatchAutoApproveRules
* [ontologyManagementServiceListGoldenFiles](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicelistgoldenfiles) - ListGoldenFiles
* [ontologyManagementServiceListOntologyEntries](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicelistontologyentries) - ListOntologyEntries
* [ontologyManagementServiceListOntologyHistory](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicelistontologyhistory) - ListOntologyHistory
* [ontologyManagementServiceListOntologyImports](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicelistontologyimports) - ListOntologyImports
* [ontologyManagementServiceListOntologySubmodules](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicelistontologysubmodules) - ListOntologySubmodules
* [ontologyManagementServiceListOntologySyncRuns](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicelistontologysyncruns) - ListOntologySyncRuns
* [ontologyManagementServiceListPatchReviewers](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicelistpatchreviewers) - ListPatchReviewers
* [ontologyManagementServiceListPatches](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicelistpatches) - ListPatches
* [ontologyManagementServiceListSkills](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicelistskills) - Lists the skills under the ontology's flat skills/ root that the caller can  read (OWNERS-filtered). Returns display metadata only — never instruction  bodies — feeding the chat composer's `/` autocomplete.
* [ontologyManagementServicePlanOntologyMerge](docs/sdks/ontologymanagementservice/README.md#ontologymanagementserviceplanontologymerge) - PlanOntologyMerge
* [ontologyManagementServicePreviewOntologyPullFromRemote](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicepreviewontologypullfromremote) - PreviewOntologyPullFromRemote
* [ontologyManagementServicePullOntologyFromRemote](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicepullontologyfromremote) - PullOntologyFromRemote
* [ontologyManagementServicePushOntologyToRemote](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicepushontologytoremote) - PushOntologyToRemote
* [ontologyManagementServiceRecoverOntology](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicerecoverontology) - RecoverOntology
* [ontologyManagementServiceRemoveOntologyRemote](docs/sdks/ontologymanagementservice/README.md#ontologymanagementserviceremoveontologyremote) - RemoveOntologyRemote
* [ontologyManagementServiceRemoveOntologySubmodule](docs/sdks/ontologymanagementservice/README.md#ontologymanagementserviceremoveontologysubmodule) - RemoveOntologySubmodule
* [ontologyManagementServiceRenameOntologyFile](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicerenameontologyfile) - RenameOntologyFile
* [ontologyManagementServiceRequestPatchReview](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicerequestpatchreview) - RequestPatchReview
* [ontologyManagementServiceResolveOntologySyncConflict](docs/sdks/ontologymanagementservice/README.md#ontologymanagementserviceresolveontologysyncconflict) - ResolveOntologySyncConflict
* [ontologyManagementServiceRestorePatch](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicerestorepatch) - RestorePatch
* [ontologyManagementServiceRevertPatch](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicerevertpatch) - RevertPatch
* [ontologyManagementServiceSaveAllObjectsAsConfig](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicesaveallobjectsasconfig) - SaveAllObjectsAsConfig
* [ontologyManagementServiceSaveObjectAsConfig](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicesaveobjectasconfig) - SaveObjectAsConfig
* [ontologyManagementServiceSetOntologyFileGolden](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicesetontologyfilegolden) - SetOntologyFileGolden
* [ontologyManagementServiceTriggerConfigDriftReconcile](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicetriggerconfigdriftreconcile) - TriggerConfigDriftReconcile forces an immediate config-sync catch-up for the  caller's org: if the Ontology repo's live HEAD differs from the last  reconciled commit, it enqueues a reconcile (otherwise no-op). The on-demand  equivalent of waiting for the periodic drift scan.
* [ontologyManagementServiceUpdateApprovalRule](docs/sdks/ontologymanagementservice/README.md#ontologymanagementserviceupdateapprovalrule) - UpdateApprovalRule
* [ontologyManagementServiceUpdateContextPatchAutoApproveRule](docs/sdks/ontologymanagementservice/README.md#ontologymanagementserviceupdatecontextpatchautoapproverule) - UpdateContextPatchAutoApproveRule
* [ontologyManagementServiceUpdateOntologySyncConfig](docs/sdks/ontologymanagementservice/README.md#ontologymanagementserviceupdateontologysyncconfig) - UpdateOntologySyncConfig
* [ontologyManagementServiceUpsertOntologyAnaConfig](docs/sdks/ontologymanagementservice/README.md#ontologymanagementserviceupsertontologyanaconfig) - UpsertOntologyAnaConfig
* [ontologyManagementServiceUpsertOntologyFile](docs/sdks/ontologymanagementservice/README.md#ontologymanagementserviceupsertontologyfile) - UpsertOntologyFile
* [ontologyManagementServiceUpsertOntologyOwners](docs/sdks/ontologymanagementservice/README.md#ontologymanagementserviceupsertontologyowners) - UpsertOntologyOwners
* [ontologyManagementServiceValidateConfig](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicevalidateconfig) - Read-only functional validation of a proposed config: parse + dependency  resolution/reachability, no authorization and no persistence. "ok" means  functionally valid, not "guaranteed to merge" — the merge gate re-checks  authorization at approve time.

### [Playbooks](docs/sdks/playbooks/README.md)

* [attachDashboard](docs/sdks/playbooks/README.md#attachdashboard) - AttachDashboard
* [attachDataset](docs/sdks/playbooks/README.md#attachdataset) - AttachDataset
* [cancelTemplateExecution](docs/sdks/playbooks/README.md#canceltemplateexecution) - Cancel template execution for a specific template header
* [createPlaybook](docs/sdks/playbooks/README.md#createplaybook) - CreatePlaybook
* [deactivate](docs/sdks/playbooks/README.md#deactivate) - DeactivatePlaybook
* [delete](docs/sdks/playbooks/README.md#delete) - DeletePlaybook
* [demoPlaybook](docs/sdks/playbooks/README.md#demoplaybook) - DemoPlaybook
* [deploy](docs/sdks/playbooks/README.md#deploy) - DeployPlaybook
* [duplicate](docs/sdks/playbooks/README.md#duplicate) - DuplicatePlaybook
* [favoriteReport](docs/sdks/playbooks/README.md#favoritereport) - Favorite report management
* [getActiveSubscribedCount](docs/sdks/playbooks/README.md#getactivesubscribedcount) - GetActiveSubscribedPlaybooksCount
* [getChatReportsSummary](docs/sdks/playbooks/README.md#getchatreportssummary) - Lightweight endpoint for chat report drawer - returns summaries without full blocks
* [getMembersWith](docs/sdks/playbooks/README.md#getmemberswith) - GetMembersWithPlaybooks
* [fetch](docs/sdks/playbooks/README.md#fetch) - GetPlaybook
* [getBatchRun](docs/sdks/playbooks/README.md#getbatchrun) - Get a specific batch run
* [getPlaybookLineage](docs/sdks/playbooks/README.md#getplaybooklineage) - GetPlaybookLineage
* [getReports](docs/sdks/playbooks/README.md#getreports) - GetPlaybookReports
* [getPlaybookReportsBatch](docs/sdks/playbooks/README.md#getplaybookreportsbatch) - Get reports for multiple template data IDs in a single batch request
* [get](docs/sdks/playbooks/README.md#get) - GetPlaybooks
* [getPlaybooksPreviews](docs/sdks/playbooks/README.md#getplaybookspreviews) - GetPlaybooksPreviews
* [getReportById](docs/sdks/playbooks/README.md#getreportbyid) - Get a single report by ID
* [getReportsWithFilters](docs/sdks/playbooks/README.md#getreportswithfilters) - GetReportsWithFilters
* [listSlackChannelContextPlaybooks](docs/sdks/playbooks/README.md#listslackchannelcontextplaybooks) - List all Slack channels context playbook mappings for the organization
* [listAllTeamsChannelContextPlaybooks](docs/sdks/playbooks/README.md#listallteamschannelcontextplaybooks) - ListAllTeamsChannelContextPlaybooks
* [listBatchRuns](docs/sdks/playbooks/README.md#listbatchruns) - List batch runs for a playbook
* [listSlackChannelsForContext](docs/sdks/playbooks/README.md#listslackchannelsforcontext) - List Slack channel IDs where the given playbook is set as the context
* [listTeamsChannelsForContextPlaybook](docs/sdks/playbooks/README.md#listteamschannelsforcontextplaybook) - ListTeamsChannelsForContextPlaybook
* [markReportAsRead](docs/sdks/playbooks/README.md#markreportasread) - Report read tracking
* [previewSlackReport](docs/sdks/playbooks/README.md#previewslackreport) - PreviewSlackReport
* [removeDashboard](docs/sdks/playbooks/README.md#removedashboard) - RemoveDashboard
* [removeDataset](docs/sdks/playbooks/README.md#removedataset) - RemoveDataset
* [run](docs/sdks/playbooks/README.md#run) - RunPlaybook
* [setSlackChannelContextPlaybook](docs/sdks/playbooks/README.md#setslackchannelcontextplaybook) - Set the context playbook for a Slack channel. This associates the given  playbook to a Slack channel so that Slack messages in that channel use the  playbook's context by default.
* [setTeamsChannelContext](docs/sdks/playbooks/README.md#setteamschannelcontext) - SetTeamsChannelContextPlaybook
* [subscribe](docs/sdks/playbooks/README.md#subscribe) - SubscribeToPlaybook
* [unsetSlackChannelContextPlaybook](docs/sdks/playbooks/README.md#unsetslackchannelcontextplaybook) - Unset the context playbook for a Slack channel. This clears any association  so that messages in this channel no longer use a specific playbook context.
* [unsetTeamsChannelContext](docs/sdks/playbooks/README.md#unsetteamschannelcontext) - UnsetTeamsChannelContextPlaybook
* [unsubscribe](docs/sdks/playbooks/README.md#unsubscribe) - UnsubscribeFromPlaybook
* [update](docs/sdks/playbooks/README.md#update) - UpdatePlaybook

### [Powerbi](docs/sdks/powerbi/README.md)

* [exportReportImage](docs/sdks/powerbi/README.md#exportreportimage) - ExportPowerBIReportImage
* [generateEmbedToken](docs/sdks/powerbi/README.md#generateembedtoken) - GeneratePowerBIEmbedToken
* [getDatasetPreview](docs/sdks/powerbi/README.md#getdatasetpreview) - GetPowerBIDatasetPreview
* [getSyncedItems](docs/sdks/powerbi/README.md#getsynceditems) - GetSyncedPowerBIItems
* [list](docs/sdks/powerbi/README.md#list) - ListPowerBIDatasets
* [listReports](docs/sdks/powerbi/README.md#listreports) - ListPowerBIReports
* [listWorkspaces](docs/sdks/powerbi/README.md#listworkspaces) - ListPowerBIWorkspaces
* [syncPowerBIItems](docs/sdks/powerbi/README.md#syncpowerbiitems) - SyncPowerBIItems
* [testConnection](docs/sdks/powerbi/README.md#testconnection) - TestPowerBIConnection
* [unsyncItems](docs/sdks/powerbi/README.md#unsyncitems) - UnsyncPowerBIItems

### [Rbac](docs/sdks/rbac/README.md)

* [addGroupMember](docs/sdks/rbac/README.md#addgroupmember) - AddGroupMember
* [approveAccessRequest](docs/sdks/rbac/README.md#approveaccessrequest) - ApproveAccessRequest
* [assignPermissionToRole](docs/sdks/rbac/README.md#assignpermissiontorole) - AssignPermissionToRole
* [assignRoleToMember](docs/sdks/rbac/README.md#assignroletomember) - Member role assignment
* [convertRoleToGroup](docs/sdks/rbac/README.md#convertroletogroup) - ConvertRoleToGroup
* [createApiKey](docs/sdks/rbac/README.md#createapikey) - API Key management
* [createGroup](docs/sdks/rbac/README.md#creategroup) - CreateGroup
* [createRole](docs/sdks/rbac/README.md#createrole) - Role management
* [createServiceAccount](docs/sdks/rbac/README.md#createserviceaccount) - Service account management
* [deleteGroup](docs/sdks/rbac/README.md#deletegroup) - DeleteGroup
* [deleteRole](docs/sdks/rbac/README.md#deleterole) - DeleteRole
* [deleteServiceAccount](docs/sdks/rbac/README.md#deleteserviceaccount) - DeleteServiceAccount
* [generateShareLink](docs/sdks/rbac/README.md#generatesharelink) - GenerateShareLink
* [getCurrentMemberRolesAndPermissions](docs/sdks/rbac/README.md#getcurrentmemberrolesandpermissions) - Get current member roles and permissions
* [getEmbedUserApiKey](docs/sdks/rbac/README.md#getembeduserapikey) - GetEmbedUserApiKey
* [getGroup](docs/sdks/rbac/README.md#getgroup) - GetGroup
* [getMemberGroups](docs/sdks/rbac/README.md#getmembergroups) - GetMemberGroups
* [getMemberRoles](docs/sdks/rbac/README.md#getmemberroles) - GetMemberRoles
* [getObjectAccess](docs/sdks/rbac/README.md#getobjectaccess) - GetObjectAccess
* [getRole](docs/sdks/rbac/README.md#getrole) - GetRole
* [getRolePermissions](docs/sdks/rbac/README.md#getrolepermissions) - GetRolePermissions
* [hasObjectAccess](docs/sdks/rbac/README.md#hasobjectaccess) - HasObjectAccess
* [listAccessRequests](docs/sdks/rbac/README.md#listaccessrequests) - ListAccessRequests
* [listApiKeys](docs/sdks/rbac/README.md#listapikeys) - ListApiKeys
* [listGroupConnectors](docs/sdks/rbac/README.md#listgroupconnectors) - ListGroupConnectors
* [listGroups](docs/sdks/rbac/README.md#listgroups) - ListGroups
* [listPermissions](docs/sdks/rbac/README.md#listpermissions) - Permission management
* [listRoles](docs/sdks/rbac/README.md#listroles) - ListRoles
* [listScimGroupMappings](docs/sdks/rbac/README.md#listscimgroupmappings) - ListScimGroupMappings
* [listServiceAccounts](docs/sdks/rbac/README.md#listserviceaccounts) - ListServiceAccounts
* [migrateAllScimGroupMappings](docs/sdks/rbac/README.md#migrateallscimgroupmappings) - MigrateAllScimGroupMappings
* [migrateScimGroupMappingToGroup](docs/sdks/rbac/README.md#migratescimgroupmappingtogroup) - MigrateScimGroupMappingToGroup
* [rejectAccessRequest](docs/sdks/rbac/README.md#rejectaccessrequest) - RejectAccessRequest
* [removeGroupMember](docs/sdks/rbac/README.md#removegroupmember) - RemoveGroupMember
* [removePermissionFromRole](docs/sdks/rbac/README.md#removepermissionfromrole) - RemovePermissionFromRole
* [removeRoleFromMember](docs/sdks/rbac/README.md#removerolefrommember) - RemoveRoleFromMember
* [requestAccess](docs/sdks/rbac/README.md#requestaccess) - Access request management
* [revertScimGroupMappingToRole](docs/sdks/rbac/README.md#revertscimgroupmappingtorole) - RevertScimGroupMappingToRole
* [revokeApiKey](docs/sdks/rbac/README.md#revokeapikey) - RevokeApiKey
* [revokeObjectAccess](docs/sdks/rbac/README.md#revokeobjectaccess) - RevokeObjectAccess
* [rotateApiKey](docs/sdks/rbac/README.md#rotateapikey) - RotateApiKey
* [shareObject](docs/sdks/rbac/README.md#shareobject) - Object sharing and access control
* [shareWithGroup](docs/sdks/rbac/README.md#sharewithgroup) - ShareObjectWithGroup
* [shareObjectWithRole](docs/sdks/rbac/README.md#shareobjectwithrole) - ShareObjectWithRole
* [updateGroup](docs/sdks/rbac/README.md#updategroup) - UpdateGroup
* [updateObjectAccess](docs/sdks/rbac/README.md#updateobjectaccess) - UpdateObjectAccess
* [updateObjectVisibility](docs/sdks/rbac/README.md#updateobjectvisibility) - UpdateObjectVisibility
* [updateRole](docs/sdks/rbac/README.md#updaterole) - UpdateRole

### [RBACService](docs/sdks/rbacservice/README.md)

* [rbacServiceSetRolePermissions](docs/sdks/rbacservice/README.md#rbacservicesetrolepermissions) - Bulk add/remove permissions on a role in one call, producing a single audit entry for the whole edit.

### [Sandbox](docs/sdks/sandbox/README.md)

* [executeQuery](docs/sdks/sandbox/README.md#executequery) - ExecuteQuery

### [SandboxAdmin](docs/sdks/sandboxadmin/README.md)

* [getSandbox](docs/sdks/sandboxadmin/README.md#getsandbox) - GetSandbox
* [listSandboxEgress](docs/sdks/sandboxadmin/README.md#listsandboxegress) - Outbound HTTP(S) calls a sandbox made (the egress ledger). Durable — reads  the recorded table, so it works for stopped sandboxes too.
* [listExecutions](docs/sdks/sandboxadmin/README.md#listexecutions) - ListSandboxExecutions
* [listSandboxFiles](docs/sdks/sandboxadmin/README.md#listsandboxfiles) - Live filesystem of a running sandbox. Both are NO-OP (read-only) and only  return data while the worker is alive; available=false otherwise.
* [listSandboxSpend](docs/sdks/sandboxadmin/README.md#listsandboxspend) - Per-lease compute usage for a sandbox, computed from lease durations × the  compute rate. Durable (reads the lease table), so it works for stopped  sandboxes. This is usage (ACUs), not the invoiced dollar amount.
* [list](docs/sdks/sandboxadmin/README.md#list) - ListSandboxes
* [readFile](docs/sdks/sandboxadmin/README.md#readfile) - ReadSandboxFile
* [restartSandbox](docs/sdks/sandboxadmin/README.md#restartsandbox) - Restart a stopped/reaped sandbox by re-acquiring a worker for the same  sandbox_id, preserving the original owner. Same scoping as StopSandbox  (owner, or sandbox:write_private for org-wide).
* [stop](docs/sdks/sandboxadmin/README.md#stop) - StopSandbox

### [SandboxCapabilityService](docs/sdks/sandboxcapabilityservice/README.md)

* [sandboxCapabilityServiceExecuteWrite](docs/sdks/sandboxcapabilityservice/README.md#sandboxcapabilityserviceexecutewrite) - ExecuteWrite
* [sandboxCapabilityServicePutAsset](docs/sdks/sandboxcapabilityservice/README.md#sandboxcapabilityserviceputasset) - PutAsset
* [sandboxCapabilityServiceSendNotify](docs/sdks/sandboxcapabilityservice/README.md#sandboxcapabilityservicesendnotify) - SendNotify
* [sandboxCapabilityServiceStateOp](docs/sdks/sandboxcapabilityservice/README.md#sandboxcapabilityservicestateop) - StateOp

### [Scim](docs/sdks/scim/README.md)

* [createOAuthClient](docs/sdks/scim/README.md#createoauthclient) - CreateScimOAuthClient
* [createScimToken](docs/sdks/scim/README.md#createscimtoken) - CreateScimToken
* [listScimOAuthClients](docs/sdks/scim/README.md#listscimoauthclients) - ListScimOAuthClients
* [list](docs/sdks/scim/README.md#list) - ListScimTokens
* [revokeOAuthClient](docs/sdks/scim/README.md#revokeoauthclient) - RevokeScimOAuthClient
* [revokeScimToken](docs/sdks/scim/README.md#revokescimtoken) - RevokeScimToken

### [Secrets](docs/sdks/secrets/README.md)

* [deleteSecret](docs/sdks/secrets/README.md#deletesecret) - DeleteSecret
* [getMembersWithSecrets](docs/sdks/secrets/README.md#getmemberswithsecrets) - GetMembersWithSecrets
* [listSecrets](docs/sdks/secrets/README.md#listsecrets) - ListSecrets
* [putSecret](docs/sdks/secrets/README.md#putsecret) - PutSecret
* [update](docs/sdks/secrets/README.md#update) - UpdateSecret

### [Slack](docs/sdks/slack/README.md)

* [createUuid](docs/sdks/slack/README.md#createuuid) - CreateSlackUuid
* [deleteInstallation](docs/sdks/slack/README.md#deleteinstallation) - DeleteInstallation
* [getCurrentUser](docs/sdks/slack/README.md#getcurrentuser) - GetCurrentUser
* [handleOAuthCallback](docs/sdks/slack/README.md#handleoauthcallback) - HandleSlackOAuthCallback
* [listChannels](docs/sdks/slack/README.md#listchannels) - ListChannels
* [listInstallations](docs/sdks/slack/README.md#listinstallations) - ListInstallations
* [listUsers](docs/sdks/slack/README.md#listusers) - ListUsers
* [syncWorkspace](docs/sdks/slack/README.md#syncworkspace) - SyncWorkspace

### [Tableau](docs/sdks/tableau/README.md)

* [generateEmbedToken](docs/sdks/tableau/README.md#generateembedtoken) - Generate JWT token for embedding views
* [getCollectionThumbnail](docs/sdks/tableau/README.md#getcollectionthumbnail) - Get collection thumbnail (first view image)
* [getConnectedAppStatus](docs/sdks/tableau/README.md#getconnectedappstatus) - GetConnectedAppStatus
* [getStarredItems](docs/sdks/tableau/README.md#getstarreditems) - GetStarredTableauItems
* [listTableauDatasources](docs/sdks/tableau/README.md#listtableaudatasources) - List Tableau datasources
* [listProjects](docs/sdks/tableau/README.md#listprojects) - List Tableau projects
* [listViews](docs/sdks/tableau/README.md#listviews) - List Tableau views
* [listWorkbooks](docs/sdks/tableau/README.md#listworkbooks) - List Tableau workbooks
* [refreshCollection](docs/sdks/tableau/README.md#refreshcollection) - RefreshTableauCollection
* [resetConnectedApp](docs/sdks/tableau/README.md#resetconnectedapp) - ResetConnectedApp
* [starItem](docs/sdks/tableau/README.md#staritem) - Star/unstar items
* [testTableauConnection](docs/sdks/tableau/README.md#testtableauconnection) - Test a Tableau connection
* [unstarTableauItem](docs/sdks/tableau/README.md#unstartableauitem) - UnstarTableauItem

### [Teams](docs/sdks/teams/README.md)

* [createUuid](docs/sdks/teams/README.md#createuuid) - CreateTeamsUuid
* [deleteInstallation](docs/sdks/teams/README.md#deleteinstallation) - DeleteInstallation
* [getCurrentUser](docs/sdks/teams/README.md#getcurrentuser) - GetCurrentUser
* [handleOAuthCallback](docs/sdks/teams/README.md#handleoauthcallback) - HandleTeamsOAuthCallback
* [list](docs/sdks/teams/README.md#list) - ListChannels
* [listInstallations](docs/sdks/teams/README.md#listinstallations) - ListInstallations
* [listUsers](docs/sdks/teams/README.md#listusers) - ListUsers
* [syncWorkspace](docs/sdks/teams/README.md#syncworkspace) - SyncWorkspace

</details>
<!-- End Available Resources and Operations [operations] -->

<!-- Start Standalone functions [standalone-funcs] -->
## Standalone functions

All the methods listed above are available as standalone functions. These
functions are ideal for use in applications running in the browser, serverless
runtimes or other environments where application bundle size is a primary
concern. When using a bundler to build your application, all unused
functionality will be either excluded from the final bundle or tree-shaken away.

To read more about standalone functions, check [FUNCTIONS.md](./FUNCTIONS.md).

<details>

<summary>Available standalone functions</summary>

- [`agentsCreate`](docs/sdks/agents/README.md#create) - CreateAgent
- [`agentsDelete`](docs/sdks/agents/README.md#delete) - DeleteAgent
- [`agentsDuplicate`](docs/sdks/agents/README.md#duplicate) - DuplicateAgent
- [`agentsGetAgent`](docs/sdks/agents/README.md#getagent) - GetAgent
- [`agentsGetRun`](docs/sdks/agents/README.md#getrun) - GetAgentRun
- [`agentsList`](docs/sdks/agents/README.md#list) - ListAgents
- [`agentsListRuns`](docs/sdks/agents/README.md#listruns) - ListAgentRuns
- [`agentsResetAgentAvatar`](docs/sdks/agents/README.md#resetagentavatar) - ResetAgentAvatar
- [`agentsTriggerAgent`](docs/sdks/agents/README.md#triggeragent) - TriggerAgent
- [`agentsUpdate`](docs/sdks/agents/README.md#update) - UpdateAgent
- [`agentsUploadAgentAvatar`](docs/sdks/agents/README.md#uploadagentavatar) - UploadAgentAvatar
- [`appsCreateApp`](docs/sdks/apps/README.md#createapp) - CreateApp
- [`appsDeleteApp`](docs/sdks/apps/README.md#deleteapp) - DeleteApp
- [`appsDuplicate`](docs/sdks/apps/README.md#duplicate) - Duplicates an app the caller can view into a new draft app they own,  named "Copy of <name>". Copies code/files/data sources/compute functions/  schedule; never carries over the source's published state or data snapshot.
- [`appServiceAppServiceGetAppMemberState`](docs/sdks/appservice/README.md#appservicegetappmemberstate) - Staff-only (superadmin gated in-handler): publishes the embedded component  gallery as an app tree and returns its signed viewer URL.
- [`appServiceAppServiceListAppActivitySince`](docs/sdks/appservice/README.md#appservicelistappactivitysince) - ListAppActivitySince
- [`appServiceAppServiceListMyAppMemberActivity`](docs/sdks/appservice/README.md#appservicelistmyappmemberactivity) - Append-only per-member activity log. Listing is own rows only; no  cross-member reads in this release.
- [`appServiceAppServicePresenceHeartbeat`](docs/sdks/appservice/README.md#appservicepresenceheartbeat) - Server stream of live activity batches + presence snapshots, driven by  Valkey nudges over the app_activity:{app_id} channel; Postgres stays SSoT.
- [`appServiceAppServiceRecordAppMemberActivity`](docs/sdks/appservice/README.md#appservicerecordappmemberactivity) - RecordAppMemberActivity
- [`appServiceAppServiceSetAppMemberState`](docs/sdks/appservice/README.md#appservicesetappmemberstate) - Per-member app state: one JSON blob per (app, member) so apps remember  settings/progress. Member always resolved server-side from auth context;  per-member persistence, so viewers with read access can save their own state.
- [`appsGet`](docs/sdks/apps/README.md#get) - GetApp
- [`appsGetAppVersion`](docs/sdks/apps/README.md#getappversion) - GetAppVersion
- [`appsGetAppViewStats`](docs/sdks/apps/README.md#getappviewstats) - View analytics: reads the engagement views recorded on app page load.
- [`appsGetMembersWithApps`](docs/sdks/apps/README.md#getmemberswithapps) - GetMembersWithApps
- [`appsHeartbeat`](docs/sdks/apps/README.md#heartbeat) - Keeps the viewed app's compute worker alive; first view spawns and pre-warms it (dashboard viewer-TTL parity).
- [`appsInvokeComputeFunction`](docs/sdks/apps/README.md#invokecomputefunction) - Executes a declared compute function on a pooled sandbox worker; gated, org-scoped, rate-limited.
- [`appsList`](docs/sdks/apps/README.md#list) - ListApps
- [`appsListVersions`](docs/sdks/apps/README.md#listversions) - Version history: a snapshot is recorded on each publish; authors can list and restore.
- [`appsMoveAppToFolder`](docs/sdks/apps/README.md#moveapptofolder) - Moves an app into a library folder (or to root when folder_id is empty).
- [`appsRefresh`](docs/sdks/apps/README.md#refresh) - Re-fetches data sources, rebuilds the document with a fresh snapshot, re-uploads.
- [`appsRestoreAppVersion`](docs/sdks/apps/README.md#restoreappversion) - RestoreAppVersion
- [`appsSetFavorite`](docs/sdks/apps/README.md#setfavorite) - Favorite/unfavorite a library item (app or dashboard) for the calling member.  Per-member, per-org; favorited=false hard-deletes the row. Covers both primitives  since the merged library page pins apps and dashboards through one client.
- [`appsUpdate`](docs/sdks/apps/README.md#update) - UpdateApp
- [`auditLogsConfigureOtlpExport`](docs/sdks/auditlogs/README.md#configureotlpexport) - ConfigureOtlpExport
- [`auditLogsConfigureS3Export`](docs/sdks/auditlogs/README.md#configures3export) - ConfigureS3Export
- [`auditLogsDeleteOtlpExportConfig`](docs/sdks/auditlogs/README.md#deleteotlpexportconfig) - DeleteOtlpExportConfig
- [`auditLogsDeleteS3ExportConfig`](docs/sdks/auditlogs/README.md#deletes3exportconfig) - DeleteS3ExportConfig
- [`auditLogsGetOtlpExportConfig`](docs/sdks/auditlogs/README.md#getotlpexportconfig) - GetOtlpExportConfig
- [`auditLogsGetS3ExportConfig`](docs/sdks/auditlogs/README.md#gets3exportconfig) - GetS3ExportConfig
- [`auditLogsList`](docs/sdks/auditlogs/README.md#list) - ListAuditLogs
- [`auditLogsTestOtlpExportConnection`](docs/sdks/auditlogs/README.md#testotlpexportconnection) - TestOtlpExportConnection
- [`auditLogsTestS3ExportConnection`](docs/sdks/auditlogs/README.md#tests3exportconnection) - TestS3ExportConnection
- [`auditLogsTriggerOtlpExport`](docs/sdks/auditlogs/README.md#triggerotlpexport) - TriggerOtlpExport
- [`auditLogsTriggerS3Export`](docs/sdks/auditlogs/README.md#triggers3export) - TriggerS3Export
- [`chatsApproveContextPromptChange`](docs/sdks/chats/README.md#approvecontextpromptchange) - ApproveContextPromptChange
- [`chatsApproveOntologyChange`](docs/sdks/chats/README.md#approveontologychange) - Resolve a halted ask_approval form cell. Submit runs the form's submission  and continues the agent with the outcome; Reject discards it (passive, no  run); Dismiss treats it as a change request (no run, next message says what  to change). All three set the cell's outcome, like the other approve/deny cells.
- [`chatsAttachAgent`](docs/sdks/chats/README.md#attachagent) - External API users
- [`chatsAttachApp`](docs/sdks/chats/README.md#attachapp) - AttachApp
- [`chatsAttachDashboard`](docs/sdks/chats/README.md#attachdashboard) - AttachDashboard
- [`chatsAttachDataset`](docs/sdks/chats/README.md#attachdataset) - AttachDataset
- [`chatsBookmark`](docs/sdks/chats/README.md#bookmark) - BookmarkChat
- [`chatsCancelStream`](docs/sdks/chats/README.md#cancelstream) - CancelStream
- [`chatsCheckHealth`](docs/sdks/chats/README.md#checkhealth) - CheckHealth
- [`chatsCheckPermissions`](docs/sdks/chats/README.md#checkpermissions) - CheckChatPermissions
- [`chatsCheckStreamlitHealth`](docs/sdks/chats/README.md#checkstreamlithealth) - CheckStreamlitHealth
- [`chatsCreateChat`](docs/sdks/chats/README.md#createchat) - CreateChat
- [`chatsDelete`](docs/sdks/chats/README.md#delete) - DeleteChat
- [`chatsDismissQuestions`](docs/sdks/chats/README.md#dismissquestions) - DismissQuestions
- [`chatsDuplicateChat`](docs/sdks/chats/README.md#duplicatechat) - DuplicateChat
- [`chatsGet`](docs/sdks/chats/README.md#get) - GetChat
- [`chatsGetAll`](docs/sdks/chats/README.md#getall) - GetChats
- [`chatsGetApiAnswer`](docs/sdks/chats/README.md#getapianswer) - GetAPIChatAnswer
- [`chatsGetArtifact`](docs/sdks/chats/README.md#getartifact) - GetArtifact
- [`chatsGetArtifactsSummary`](docs/sdks/chats/README.md#getartifactssummary) - GetChatArtifactsSummary
- [`chatsGetChatExecutionTiming`](docs/sdks/chats/README.md#getchatexecutiontiming) - GetChatExecutionTiming
- [`chatsGetCompletionParameters`](docs/sdks/chats/README.md#getcompletionparameters) - GetCompletionParameters
- [`chatsGetCompletionParametersBatch`](docs/sdks/chats/README.md#getcompletionparametersbatch) - GetCompletionParametersBatch
- [`chatsGetHistory`](docs/sdks/chats/README.md#gethistory) - GetChatHistory
- [`chatsGetLlmUsage`](docs/sdks/chats/README.md#getllmusage) - GetLlmUsage
- [`chatsGetMembersWithChats`](docs/sdks/chats/README.md#getmemberswithchats) - List distinct chat creators the user can access
- [`chatsGetPlaybookChats`](docs/sdks/chats/README.md#getplaybookchats) - GetPlaybookChats
- [`chatsPollEvents`](docs/sdks/chats/README.md#pollevents) - PollChatEvents
- [`chatsQueryOneShot`](docs/sdks/chats/README.md#queryoneshot) - QueryOneShot
- [`chatsRateCell`](docs/sdks/chats/README.md#ratecell) - RateChatCell appends a row to cell_rating for every click; thumbs-down also upserts a user_thumbs_down thread_warning.
- [`chatsRejectContextPromptChange`](docs/sdks/chats/README.md#rejectcontextpromptchange) - RejectContextPromptChange
- [`chatsRejectOntologyChange`](docs/sdks/chats/README.md#rejectontologychange) - RejectOntologyChange
- [`chatsRun`](docs/sdks/chats/README.md#run) - RunChat
- [`chatsSend`](docs/sdks/chats/README.md#send) - SendMessage
- [`chatsSubmitContextPromptChange`](docs/sdks/chats/README.md#submitcontextpromptchange) - SubmitContextPromptChange
- [`chatsSubmitQuestions`](docs/sdks/chats/README.md#submitquestions) - Resolve a halted questions cell. Submit hands the answers to the agent and  resumes it; Dismiss hands over only the answered count and does NOT resume  (the user's next message becomes the dismissal reason).
- [`chatsUnbookmark`](docs/sdks/chats/README.md#unbookmark) - UnbookmarkChat
- [`chatsUpdate`](docs/sdks/chats/README.md#update) - UpdateChat
- [`connectorsCreate`](docs/sdks/connectors/README.md#create) - CreateConnector
- [`connectorsDelete`](docs/sdks/connectors/README.md#delete) - DeleteConnector
- [`connectorsDuplicateConnector`](docs/sdks/connectors/README.md#duplicateconnector) - DuplicateConnector
- [`connectorsExecuteQuery`](docs/sdks/connectors/README.md#executequery) - ExecuteQuery
- [`connectorsGet`](docs/sdks/connectors/README.md#get) - GetConnector
- [`connectorsGetChats`](docs/sdks/connectors/README.md#getchats) - GetConnectorChats
- [`connectorsGetConnectorCellDurations`](docs/sdks/connectors/README.md#getconnectorcelldurations) - GetConnectorCellDurations
- [`connectorsGetConnectors`](docs/sdks/connectors/README.md#getconnectors) - GetConnectors
- [`connectorsGetConnectorStats`](docs/sdks/connectors/README.md#getconnectorstats) - GetConnectorStats
- [`connectorsGetDashboards`](docs/sdks/connectors/README.md#getdashboards) - GetConnectorDashboards
- [`connectorsGetExampleQueries`](docs/sdks/connectors/README.md#getexamplequeries) - GetExampleQueries
- [`connectorsGetTablePreview`](docs/sdks/connectors/README.md#gettablepreview) - GetTablePreview
- [`connectorsGetUsage`](docs/sdks/connectors/README.md#getusage) - GetConnectorUsage
- [`connectorsListQueryTemplates`](docs/sdks/connectors/README.md#listquerytemplates) - ListQueryTemplates
- [`connectorsListTables`](docs/sdks/connectors/README.md#listtables) - ListConnectorTables
- [`connectorsTest`](docs/sdks/connectors/README.md#test) - TestConnector
- [`connectorsUpdate`](docs/sdks/connectors/README.md#update) - UpdateConnector
- [`dashboardsCheckHealth`](docs/sdks/dashboards/README.md#checkhealth) - CheckDashboardHealth
- [`dashboardsCreateDashboard`](docs/sdks/dashboards/README.md#createdashboard) - CRUD operations
- [`dashboardsCreateFolder`](docs/sdks/dashboards/README.md#createfolder) - Folder management
- [`dashboardsDelete`](docs/sdks/dashboards/README.md#delete) - DeleteDashboard
- [`dashboardsDeleteFolder`](docs/sdks/dashboards/README.md#deletefolder) - DeleteDashboardFolder
- [`dashboardsDiscardChanges`](docs/sdks/dashboards/README.md#discardchanges) - DiscardDashboardChanges
- [`dashboardsDuplicate`](docs/sdks/dashboards/README.md#duplicate) - DuplicateDashboard
- [`dashboardsGet`](docs/sdks/dashboards/README.md#get) - GetDashboard
- [`dashboardsGetDashboardViewStats`](docs/sdks/dashboards/README.md#getdashboardviewstats) - View analytics
- [`dashboardsGetMembersWithDashboards`](docs/sdks/dashboards/README.md#getmemberswithdashboards) - Member management
- [`dashboardsGetVersion`](docs/sdks/dashboards/README.md#getversion) - GetDashboardVersion
- [`dashboardsList`](docs/sdks/dashboards/README.md#list) - ListDashboards
- [`dashboardsListFolders`](docs/sdks/dashboards/README.md#listfolders) - ListDashboardFolders
- [`dashboardsListVersions`](docs/sdks/dashboards/README.md#listversions) - Version history
- [`dashboardsMoveToFolder`](docs/sdks/dashboards/README.md#movetofolder) - MoveDashboardToFolder
- [`dashboardsPreviewConfig`](docs/sdks/dashboards/README.md#previewconfig) - Config-managed dashboards: render a `.dashboard` straight from a patch ref before  it merges (ADR-0022). Runs as the file's run_as, gated on the previewer being  authorized for it; persists nothing.
- [`dashboardsPublish`](docs/sdks/dashboards/README.md#publish) - Publishing workflow
- [`dashboardsRegenerateScreenshot`](docs/sdks/dashboards/README.md#regeneratescreenshot) - Screenshot management
- [`dashboardsRestoreDashboardVersion`](docs/sdks/dashboards/README.md#restoredashboardversion) - RestoreDashboardVersion
- [`dashboardsRunScheduledDashboard`](docs/sdks/dashboards/README.md#runscheduleddashboard) - RunScheduledDashboard
- [`dashboardsSpawn`](docs/sdks/dashboards/README.md#spawn) - Dashboard execution
- [`dashboardsUpdateDashboard`](docs/sdks/dashboards/README.md#updatedashboard) - UpdateDashboard
- [`dashboardsUpdateDashboardFolder`](docs/sdks/dashboards/README.md#updatedashboardfolder) - UpdateDashboardFolder
- [`dashboardsUpdateDashboardSchedule`](docs/sdks/dashboards/README.md#updatedashboardschedule) - Scheduling
- [`datasetsCreateFolder`](docs/sdks/datasets/README.md#createfolder) - CreateFolder
- [`datasetsCreatePowerBIDataset`](docs/sdks/datasets/README.md#createpowerbidataset) - CreatePowerBIDataset
- [`datasetsCreateTableauDataset`](docs/sdks/datasets/README.md#createtableaudataset) - Create Tableau dataset from views/datasources
- [`datasetsCreateUploadPresignUrl`](docs/sdks/datasets/README.md#createuploadpresignurl) - uploads
- [`datasetsDelete`](docs/sdks/datasets/README.md#delete) - Delete a dataset (soft delete)
- [`datasetsExport`](docs/sdks/datasets/README.md#export) - export dataset in "raw" format – original if dataset is uploaded, converted format otherwise (defaults to CSV)
- [`datasetsFetch`](docs/sdks/datasets/README.md#fetch) - GetDataset, GetDatasets only return metadata
- [`datasetsGet`](docs/sdks/datasets/README.md#get) - GetDatasets
- [`datasetsGetByIds`](docs/sdks/datasets/README.md#getbyids) - GetDatasetsByIds
- [`datasetsGetDatasetValues`](docs/sdks/datasets/README.md#getdatasetvalues) - GetDatasetValues
- [`datasetsGetFolders`](docs/sdks/datasets/README.md#getfolders) - for AR: CreateFolderACL, UpdateFolderACL, DeleteFolderACL
- [`datasetsGetStats`](docs/sdks/datasets/README.md#getstats) - GetDatasetStats
- [`datasetsProcessUploadPresignUrl`](docs/sdks/datasets/README.md#processuploadpresignurl) - ProcessUploadPresignUrl
- [`datasetsUpdateDataset`](docs/sdks/datasets/README.md#updatedataset) - Update dataset metadata
- [`mcpClearOAuthToken`](docs/sdks/mcp/README.md#clearoauthtoken) - ClearOAuthToken
- [`mcpDelete`](docs/sdks/mcp/README.md#delete) - DeleteMCPServer
- [`mcpGetServers`](docs/sdks/mcp/README.md#getservers) - GetMCPServers
- [`mcpHandleOAuthCallback`](docs/sdks/mcp/README.md#handleoauthcallback) - HandleOAuthCallback
- [`mcpInitiateOAuthFlow`](docs/sdks/mcp/README.md#initiateoauthflow) - InitiateOAuthFlow
- [`mcpToggleServer`](docs/sdks/mcp/README.md#toggleserver) - ToggleMCPServer
- [`mcpUpsertMCPServers`](docs/sdks/mcp/README.md#upsertmcpservers) - UpsertMCPServers
- [`metricsExportsConfigure`](docs/sdks/metricsexports/README.md#configure) - ConfigureMetricsExport
- [`metricsExportsDeleteConfig`](docs/sdks/metricsexports/README.md#deleteconfig) - DeleteMetricsExportConfig
- [`metricsExportsGetMetricsExportConfig`](docs/sdks/metricsexports/README.md#getmetricsexportconfig) - GetMetricsExportConfig
- [`metricsExportsTestConnection`](docs/sdks/metricsexports/README.md#testconnection) - TestMetricsExportConnection
- [`metricsExportsTriggerPush`](docs/sdks/metricsexports/README.md#triggerpush) - TriggerMetricsPush
- [`observabilityActivateCustomTopic`](docs/sdks/observability/README.md#activatecustomtopic) - ActivateCustomTopic
- [`observabilityBackfillCustomTopic`](docs/sdks/observability/README.md#backfillcustomtopic) - BackfillCustomTopic
- [`observabilityBackfillThreadWarnings`](docs/sdks/observability/README.md#backfillthreadwarnings) - BackfillThreadWarnings
- [`observabilityCreateCustomTopic`](docs/sdks/observability/README.md#createcustomtopic) - CreateCustomTopic
- [`observabilityDeactivateCustomTopic`](docs/sdks/observability/README.md#deactivatecustomtopic) - DeactivateCustomTopic
- [`observabilityDeleteCustomTopic`](docs/sdks/observability/README.md#deletecustomtopic) - DeleteCustomTopic
- [`observabilityExportCsv`](docs/sdks/observability/README.md#exportcsv) - ExportObservabilityCsv
- [`observabilityFixCheckRecord`](docs/sdks/observability/README.md#fixcheckrecord) - FixCheckRecord
- [`observabilityFixWarning`](docs/sdks/observability/README.md#fixwarning) - FixWarning
- [`observabilityGetAccessMethodStats`](docs/sdks/observability/README.md#getaccessmethodstats) - GetAccessMethodStats
- [`observabilityGetActivePeopleStats`](docs/sdks/observability/README.md#getactivepeoplestats) - GetActivePeopleStats
- [`observabilityGetActivePeopleTrend`](docs/sdks/observability/README.md#getactivepeopletrend) - GetActivePeopleTrend
- [`observabilityGetBackfillPreview`](docs/sdks/observability/README.md#getbackfillpreview) - GetBackfillPreview
- [`observabilityGetBackfillStatus`](docs/sdks/observability/README.md#getbackfillstatus) - GetBackfillStatus
- [`observabilityGetBillingStats`](docs/sdks/observability/README.md#getbillingstats) - GetBillingStats
- [`observabilityGetChatSourceStats`](docs/sdks/observability/README.md#getchatsourcestats) - GetChatSourceStats
- [`observabilityGetChatTopics`](docs/sdks/observability/README.md#getchattopics) - GetChatTopics
- [`observabilityGetCheckRecordFix`](docs/sdks/observability/README.md#getcheckrecordfix) - GetCheckRecordFix
- [`observabilityGetCustomTopic`](docs/sdks/observability/README.md#getcustomtopic) - GetCustomTopic
- [`observabilityGetCustomTopicPeople`](docs/sdks/observability/README.md#getcustomtopicpeople) - GetCustomTopicPeople
- [`observabilityGetCustomTopicThreads`](docs/sdks/observability/README.md#getcustomtopicthreads) - GetCustomTopicThreads
- [`observabilityGetEngagementSpectrum`](docs/sdks/observability/README.md#getengagementspectrum) - GetEngagementSpectrum
- [`observabilityGetMemberActivity`](docs/sdks/observability/README.md#getmemberactivity) - GetMemberActivity
- [`observabilityGetObservabilityStats`](docs/sdks/observability/README.md#getobservabilitystats) - GetObservabilityStats
- [`observabilityGetThreadWarnings`](docs/sdks/observability/README.md#getthreadwarnings) - GetThreadWarnings
- [`observabilityListCustomTopics`](docs/sdks/observability/README.md#listcustomtopics) - ListCustomTopics
- [`observabilityRefineDraft`](docs/sdks/observability/README.md#refinedraft) - Custom topics
- [`observabilityServiceObservabilityServiceGetMemberSignalTrend`](docs/sdks/observabilityservice/README.md#observabilityservicegetmembersignaltrend) - GetMemberSignalTrend
- [`observabilitySetTopicTagFeedback`](docs/sdks/observability/README.md#settopictagfeedback) - SetTopicTagFeedback
- [`observabilityUpdateCustomTopic`](docs/sdks/observability/README.md#updatecustomtopic) - UpdateCustomTopic
- [`ontologyManagementServiceOntologyManagementServiceAddOntologySubmodule`](docs/sdks/ontologymanagementservice/README.md#ontologymanagementserviceaddontologysubmodule) - AddOntologySubmodule
- [`ontologyManagementServiceOntologyManagementServiceApprovePatch`](docs/sdks/ontologymanagementservice/README.md#ontologymanagementserviceapprovepatch) - ApprovePatch
- [`ontologyManagementServiceOntologyManagementServiceConfigureOntologyRemote`](docs/sdks/ontologymanagementservice/README.md#ontologymanagementserviceconfigureontologyremote) - ConfigureOntologyRemote
- [`ontologyManagementServiceOntologyManagementServiceCreateApprovalRule`](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicecreateapprovalrule) - CreateApprovalRule
- [`ontologyManagementServiceOntologyManagementServiceCreateContextPatchAutoApproveRule`](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicecreatecontextpatchautoapproverule) - CreateContextPatchAutoApproveRule
- [`ontologyManagementServiceOntologyManagementServiceCreateOntologyDirectory`](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicecreateontologydirectory) - CreateOntologyDirectory
- [`ontologyManagementServiceOntologyManagementServiceCreateOntologyFileUploadUrl`](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicecreateontologyfileuploadurl) - CreateOntologyFileUploadUrl
- [`ontologyManagementServiceOntologyManagementServiceDeleteApprovalRule`](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicedeleteapprovalrule) - DeleteApprovalRule
- [`ontologyManagementServiceOntologyManagementServiceDeleteContextPatchAutoApproveRule`](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicedeletecontextpatchautoapproverule) - DeleteContextPatchAutoApproveRule
- [`ontologyManagementServiceOntologyManagementServiceDeleteOntologyDirectory`](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicedeleteontologydirectory) - DeleteOntologyDirectory
- [`ontologyManagementServiceOntologyManagementServiceDeleteOntologyFile`](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicedeleteontologyfile) - DeleteOntologyFile
- [`ontologyManagementServiceOntologyManagementServiceDeleteOntologyOwners`](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicedeleteontologyowners) - DeleteOntologyOwners
- [`ontologyManagementServiceOntologyManagementServiceDenyPatch`](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicedenypatch) - DenyPatch
- [`ontologyManagementServiceOntologyManagementServiceExchangeOntologyGithubCode`](docs/sdks/ontologymanagementservice/README.md#ontologymanagementserviceexchangeontologygithubcode) - ExchangeOntologyGithubCode
- [`ontologyManagementServiceOntologyManagementServiceFinalizeOntologyFileUpload`](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicefinalizeontologyfileupload) - FinalizeOntologyFileUpload
- [`ontologyManagementServiceOntologyManagementServiceGetCodeownerCoverage`](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicegetcodeownercoverage) - GetCodeownerCoverage
- [`ontologyManagementServiceOntologyManagementServiceGetConfigExportCapabilities`](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicegetconfigexportcapabilities) - GetConfigExportCapabilities
- [`ontologyManagementServiceOntologyManagementServiceGetEffectiveOntologyOwners`](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicegeteffectiveontologyowners) - GetEffectiveOntologyOwners
- [`ontologyManagementServiceOntologyManagementServiceGetFileUsage`](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicegetfileusage) - GetFileUsage
- [`ontologyManagementServiceOntologyManagementServiceGetFileUsageTimeline`](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicegetfileusagetimeline) - GetFileUsageTimeline
- [`ontologyManagementServiceOntologyManagementServiceGetOntologyAnaConfig`](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicegetontologyanaconfig) - GetOntologyAnaConfig
- [`ontologyManagementServiceOntologyManagementServiceGetOntologyFile`](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicegetontologyfile) - GetOntologyFile
- [`ontologyManagementServiceOntologyManagementServiceGetOntologyGithubOAuthURL`](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicegetontologygithuboauthurl) - GetOntologyGithubOAuthURL
- [`ontologyManagementServiceOntologyManagementServiceGetOntologyHistoryFileDiff`](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicegetontologyhistoryfilediff) - GetOntologyHistoryFileDiff
- [`ontologyManagementServiceOntologyManagementServiceGetOntologyOwners`](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicegetontologyowners) - GetOntologyOwners
- [`ontologyManagementServiceOntologyManagementServiceGetOntologyRemote`](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicegetontologyremote) - GetOntologyRemote
- [`ontologyManagementServiceOntologyManagementServiceGetOntologySizeTimeline`](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicegetontologysizetimeline) - GetOntologySizeTimeline
- [`ontologyManagementServiceOntologyManagementServiceGetOntologySyncConflicts`](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicegetontologysyncconflicts) - GetOntologySyncConflicts
- [`ontologyManagementServiceOntologyManagementServiceGetOntologyUsageSummary`](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicegetontologyusagesummary) - GetOntologyUsageSummary
- [`ontologyManagementServiceOntologyManagementServiceGetPatch`](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicegetpatch) - GetPatch
- [`ontologyManagementServiceOntologyManagementServiceGetPatchByNumber`](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicegetpatchbynumber) - GetPatchByNumber
- [`ontologyManagementServiceOntologyManagementServiceGetPatchCapabilities`](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicegetpatchcapabilities) - GetPatchCapabilities
- [`ontologyManagementServiceOntologyManagementServiceGetRawPatch`](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicegetrawpatch) - GetRawPatch
- [`ontologyManagementServiceOntologyManagementServiceGetUsageDetailsForFile`](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicegetusagedetailsforfile) - GetUsageDetailsForFile
- [`ontologyManagementServiceOntologyManagementServiceListApprovalRules`](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicelistapprovalrules) - ListApprovalRules
- [`ontologyManagementServiceOntologyManagementServiceListChatsForFile`](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicelistchatsforfile) - ListChatsForFile
- [`ontologyManagementServiceOntologyManagementServiceListContextPatchAutoApproveRules`](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicelistcontextpatchautoapproverules) - ListContextPatchAutoApproveRules
- [`ontologyManagementServiceOntologyManagementServiceListGoldenFiles`](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicelistgoldenfiles) - ListGoldenFiles
- [`ontologyManagementServiceOntologyManagementServiceListOntologyEntries`](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicelistontologyentries) - ListOntologyEntries
- [`ontologyManagementServiceOntologyManagementServiceListOntologyHistory`](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicelistontologyhistory) - ListOntologyHistory
- [`ontologyManagementServiceOntologyManagementServiceListOntologyImports`](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicelistontologyimports) - ListOntologyImports
- [`ontologyManagementServiceOntologyManagementServiceListOntologySubmodules`](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicelistontologysubmodules) - ListOntologySubmodules
- [`ontologyManagementServiceOntologyManagementServiceListOntologySyncRuns`](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicelistontologysyncruns) - ListOntologySyncRuns
- [`ontologyManagementServiceOntologyManagementServiceListPatches`](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicelistpatches) - ListPatches
- [`ontologyManagementServiceOntologyManagementServiceListPatchReviewers`](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicelistpatchreviewers) - ListPatchReviewers
- [`ontologyManagementServiceOntologyManagementServiceListSkills`](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicelistskills) - Lists the skills under the ontology's flat skills/ root that the caller can  read (OWNERS-filtered). Returns display metadata only — never instruction  bodies — feeding the chat composer's `/` autocomplete.
- [`ontologyManagementServiceOntologyManagementServicePlanOntologyMerge`](docs/sdks/ontologymanagementservice/README.md#ontologymanagementserviceplanontologymerge) - PlanOntologyMerge
- [`ontologyManagementServiceOntologyManagementServicePreviewOntologyPullFromRemote`](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicepreviewontologypullfromremote) - PreviewOntologyPullFromRemote
- [`ontologyManagementServiceOntologyManagementServicePullOntologyFromRemote`](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicepullontologyfromremote) - PullOntologyFromRemote
- [`ontologyManagementServiceOntologyManagementServicePushOntologyToRemote`](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicepushontologytoremote) - PushOntologyToRemote
- [`ontologyManagementServiceOntologyManagementServiceRecoverOntology`](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicerecoverontology) - RecoverOntology
- [`ontologyManagementServiceOntologyManagementServiceRemoveOntologyRemote`](docs/sdks/ontologymanagementservice/README.md#ontologymanagementserviceremoveontologyremote) - RemoveOntologyRemote
- [`ontologyManagementServiceOntologyManagementServiceRemoveOntologySubmodule`](docs/sdks/ontologymanagementservice/README.md#ontologymanagementserviceremoveontologysubmodule) - RemoveOntologySubmodule
- [`ontologyManagementServiceOntologyManagementServiceRenameOntologyFile`](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicerenameontologyfile) - RenameOntologyFile
- [`ontologyManagementServiceOntologyManagementServiceRequestPatchReview`](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicerequestpatchreview) - RequestPatchReview
- [`ontologyManagementServiceOntologyManagementServiceResolveOntologySyncConflict`](docs/sdks/ontologymanagementservice/README.md#ontologymanagementserviceresolveontologysyncconflict) - ResolveOntologySyncConflict
- [`ontologyManagementServiceOntologyManagementServiceRestorePatch`](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicerestorepatch) - RestorePatch
- [`ontologyManagementServiceOntologyManagementServiceRevertPatch`](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicerevertpatch) - RevertPatch
- [`ontologyManagementServiceOntologyManagementServiceSaveAllObjectsAsConfig`](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicesaveallobjectsasconfig) - SaveAllObjectsAsConfig
- [`ontologyManagementServiceOntologyManagementServiceSaveObjectAsConfig`](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicesaveobjectasconfig) - SaveObjectAsConfig
- [`ontologyManagementServiceOntologyManagementServiceSetOntologyFileGolden`](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicesetontologyfilegolden) - SetOntologyFileGolden
- [`ontologyManagementServiceOntologyManagementServiceTriggerConfigDriftReconcile`](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicetriggerconfigdriftreconcile) - TriggerConfigDriftReconcile forces an immediate config-sync catch-up for the  caller's org: if the Ontology repo's live HEAD differs from the last  reconciled commit, it enqueues a reconcile (otherwise no-op). The on-demand  equivalent of waiting for the periodic drift scan.
- [`ontologyManagementServiceOntologyManagementServiceUpdateApprovalRule`](docs/sdks/ontologymanagementservice/README.md#ontologymanagementserviceupdateapprovalrule) - UpdateApprovalRule
- [`ontologyManagementServiceOntologyManagementServiceUpdateContextPatchAutoApproveRule`](docs/sdks/ontologymanagementservice/README.md#ontologymanagementserviceupdatecontextpatchautoapproverule) - UpdateContextPatchAutoApproveRule
- [`ontologyManagementServiceOntologyManagementServiceUpdateOntologySyncConfig`](docs/sdks/ontologymanagementservice/README.md#ontologymanagementserviceupdateontologysyncconfig) - UpdateOntologySyncConfig
- [`ontologyManagementServiceOntologyManagementServiceUpsertOntologyAnaConfig`](docs/sdks/ontologymanagementservice/README.md#ontologymanagementserviceupsertontologyanaconfig) - UpsertOntologyAnaConfig
- [`ontologyManagementServiceOntologyManagementServiceUpsertOntologyFile`](docs/sdks/ontologymanagementservice/README.md#ontologymanagementserviceupsertontologyfile) - UpsertOntologyFile
- [`ontologyManagementServiceOntologyManagementServiceUpsertOntologyOwners`](docs/sdks/ontologymanagementservice/README.md#ontologymanagementserviceupsertontologyowners) - UpsertOntologyOwners
- [`ontologyManagementServiceOntologyManagementServiceValidateConfig`](docs/sdks/ontologymanagementservice/README.md#ontologymanagementservicevalidateconfig) - Read-only functional validation of a proposed config: parse + dependency  resolution/reachability, no authorization and no persistence. "ok" means  functionally valid, not "guaranteed to merge" — the merge gate re-checks  authorization at approve time.
- [`playbooksAttachDashboard`](docs/sdks/playbooks/README.md#attachdashboard) - AttachDashboard
- [`playbooksAttachDataset`](docs/sdks/playbooks/README.md#attachdataset) - AttachDataset
- [`playbooksCancelTemplateExecution`](docs/sdks/playbooks/README.md#canceltemplateexecution) - Cancel template execution for a specific template header
- [`playbooksCreatePlaybook`](docs/sdks/playbooks/README.md#createplaybook) - CreatePlaybook
- [`playbooksDeactivate`](docs/sdks/playbooks/README.md#deactivate) - DeactivatePlaybook
- [`playbooksDelete`](docs/sdks/playbooks/README.md#delete) - DeletePlaybook
- [`playbooksDemoPlaybook`](docs/sdks/playbooks/README.md#demoplaybook) - DemoPlaybook
- [`playbooksDeploy`](docs/sdks/playbooks/README.md#deploy) - DeployPlaybook
- [`playbooksDuplicate`](docs/sdks/playbooks/README.md#duplicate) - DuplicatePlaybook
- [`playbooksFavoriteReport`](docs/sdks/playbooks/README.md#favoritereport) - Favorite report management
- [`playbooksFetch`](docs/sdks/playbooks/README.md#fetch) - GetPlaybook
- [`playbooksGet`](docs/sdks/playbooks/README.md#get) - GetPlaybooks
- [`playbooksGetActiveSubscribedCount`](docs/sdks/playbooks/README.md#getactivesubscribedcount) - GetActiveSubscribedPlaybooksCount
- [`playbooksGetBatchRun`](docs/sdks/playbooks/README.md#getbatchrun) - Get a specific batch run
- [`playbooksGetChatReportsSummary`](docs/sdks/playbooks/README.md#getchatreportssummary) - Lightweight endpoint for chat report drawer - returns summaries without full blocks
- [`playbooksGetMembersWith`](docs/sdks/playbooks/README.md#getmemberswith) - GetMembersWithPlaybooks
- [`playbooksGetPlaybookLineage`](docs/sdks/playbooks/README.md#getplaybooklineage) - GetPlaybookLineage
- [`playbooksGetPlaybookReportsBatch`](docs/sdks/playbooks/README.md#getplaybookreportsbatch) - Get reports for multiple template data IDs in a single batch request
- [`playbooksGetPlaybooksPreviews`](docs/sdks/playbooks/README.md#getplaybookspreviews) - GetPlaybooksPreviews
- [`playbooksGetReportById`](docs/sdks/playbooks/README.md#getreportbyid) - Get a single report by ID
- [`playbooksGetReports`](docs/sdks/playbooks/README.md#getreports) - GetPlaybookReports
- [`playbooksGetReportsWithFilters`](docs/sdks/playbooks/README.md#getreportswithfilters) - GetReportsWithFilters
- [`playbooksListAllTeamsChannelContextPlaybooks`](docs/sdks/playbooks/README.md#listallteamschannelcontextplaybooks) - ListAllTeamsChannelContextPlaybooks
- [`playbooksListBatchRuns`](docs/sdks/playbooks/README.md#listbatchruns) - List batch runs for a playbook
- [`playbooksListSlackChannelContextPlaybooks`](docs/sdks/playbooks/README.md#listslackchannelcontextplaybooks) - List all Slack channels context playbook mappings for the organization
- [`playbooksListSlackChannelsForContext`](docs/sdks/playbooks/README.md#listslackchannelsforcontext) - List Slack channel IDs where the given playbook is set as the context
- [`playbooksListTeamsChannelsForContextPlaybook`](docs/sdks/playbooks/README.md#listteamschannelsforcontextplaybook) - ListTeamsChannelsForContextPlaybook
- [`playbooksMarkReportAsRead`](docs/sdks/playbooks/README.md#markreportasread) - Report read tracking
- [`playbooksPreviewSlackReport`](docs/sdks/playbooks/README.md#previewslackreport) - PreviewSlackReport
- [`playbooksRemoveDashboard`](docs/sdks/playbooks/README.md#removedashboard) - RemoveDashboard
- [`playbooksRemoveDataset`](docs/sdks/playbooks/README.md#removedataset) - RemoveDataset
- [`playbooksRun`](docs/sdks/playbooks/README.md#run) - RunPlaybook
- [`playbooksSetSlackChannelContextPlaybook`](docs/sdks/playbooks/README.md#setslackchannelcontextplaybook) - Set the context playbook for a Slack channel. This associates the given  playbook to a Slack channel so that Slack messages in that channel use the  playbook's context by default.
- [`playbooksSetTeamsChannelContext`](docs/sdks/playbooks/README.md#setteamschannelcontext) - SetTeamsChannelContextPlaybook
- [`playbooksSubscribe`](docs/sdks/playbooks/README.md#subscribe) - SubscribeToPlaybook
- [`playbooksUnsetSlackChannelContextPlaybook`](docs/sdks/playbooks/README.md#unsetslackchannelcontextplaybook) - Unset the context playbook for a Slack channel. This clears any association  so that messages in this channel no longer use a specific playbook context.
- [`playbooksUnsetTeamsChannelContext`](docs/sdks/playbooks/README.md#unsetteamschannelcontext) - UnsetTeamsChannelContextPlaybook
- [`playbooksUnsubscribe`](docs/sdks/playbooks/README.md#unsubscribe) - UnsubscribeFromPlaybook
- [`playbooksUpdate`](docs/sdks/playbooks/README.md#update) - UpdatePlaybook
- [`powerbiExportReportImage`](docs/sdks/powerbi/README.md#exportreportimage) - ExportPowerBIReportImage
- [`powerbiGenerateEmbedToken`](docs/sdks/powerbi/README.md#generateembedtoken) - GeneratePowerBIEmbedToken
- [`powerbiGetDatasetPreview`](docs/sdks/powerbi/README.md#getdatasetpreview) - GetPowerBIDatasetPreview
- [`powerbiGetSyncedItems`](docs/sdks/powerbi/README.md#getsynceditems) - GetSyncedPowerBIItems
- [`powerbiList`](docs/sdks/powerbi/README.md#list) - ListPowerBIDatasets
- [`powerbiListReports`](docs/sdks/powerbi/README.md#listreports) - ListPowerBIReports
- [`powerbiListWorkspaces`](docs/sdks/powerbi/README.md#listworkspaces) - ListPowerBIWorkspaces
- [`powerbiSyncPowerBIItems`](docs/sdks/powerbi/README.md#syncpowerbiitems) - SyncPowerBIItems
- [`powerbiTestConnection`](docs/sdks/powerbi/README.md#testconnection) - TestPowerBIConnection
- [`powerbiUnsyncItems`](docs/sdks/powerbi/README.md#unsyncitems) - UnsyncPowerBIItems
- [`rbacAddGroupMember`](docs/sdks/rbac/README.md#addgroupmember) - AddGroupMember
- [`rbacApproveAccessRequest`](docs/sdks/rbac/README.md#approveaccessrequest) - ApproveAccessRequest
- [`rbacAssignPermissionToRole`](docs/sdks/rbac/README.md#assignpermissiontorole) - AssignPermissionToRole
- [`rbacAssignRoleToMember`](docs/sdks/rbac/README.md#assignroletomember) - Member role assignment
- [`rbacConvertRoleToGroup`](docs/sdks/rbac/README.md#convertroletogroup) - ConvertRoleToGroup
- [`rbacCreateApiKey`](docs/sdks/rbac/README.md#createapikey) - API Key management
- [`rbacCreateGroup`](docs/sdks/rbac/README.md#creategroup) - CreateGroup
- [`rbacCreateRole`](docs/sdks/rbac/README.md#createrole) - Role management
- [`rbacCreateServiceAccount`](docs/sdks/rbac/README.md#createserviceaccount) - Service account management
- [`rbacDeleteGroup`](docs/sdks/rbac/README.md#deletegroup) - DeleteGroup
- [`rbacDeleteRole`](docs/sdks/rbac/README.md#deleterole) - DeleteRole
- [`rbacDeleteServiceAccount`](docs/sdks/rbac/README.md#deleteserviceaccount) - DeleteServiceAccount
- [`rbacGenerateShareLink`](docs/sdks/rbac/README.md#generatesharelink) - GenerateShareLink
- [`rbacGetCurrentMemberRolesAndPermissions`](docs/sdks/rbac/README.md#getcurrentmemberrolesandpermissions) - Get current member roles and permissions
- [`rbacGetEmbedUserApiKey`](docs/sdks/rbac/README.md#getembeduserapikey) - GetEmbedUserApiKey
- [`rbacGetGroup`](docs/sdks/rbac/README.md#getgroup) - GetGroup
- [`rbacGetMemberGroups`](docs/sdks/rbac/README.md#getmembergroups) - GetMemberGroups
- [`rbacGetMemberRoles`](docs/sdks/rbac/README.md#getmemberroles) - GetMemberRoles
- [`rbacGetObjectAccess`](docs/sdks/rbac/README.md#getobjectaccess) - GetObjectAccess
- [`rbacGetRole`](docs/sdks/rbac/README.md#getrole) - GetRole
- [`rbacGetRolePermissions`](docs/sdks/rbac/README.md#getrolepermissions) - GetRolePermissions
- [`rbacHasObjectAccess`](docs/sdks/rbac/README.md#hasobjectaccess) - HasObjectAccess
- [`rbacListAccessRequests`](docs/sdks/rbac/README.md#listaccessrequests) - ListAccessRequests
- [`rbacListApiKeys`](docs/sdks/rbac/README.md#listapikeys) - ListApiKeys
- [`rbacListGroupConnectors`](docs/sdks/rbac/README.md#listgroupconnectors) - ListGroupConnectors
- [`rbacListGroups`](docs/sdks/rbac/README.md#listgroups) - ListGroups
- [`rbacListPermissions`](docs/sdks/rbac/README.md#listpermissions) - Permission management
- [`rbacListRoles`](docs/sdks/rbac/README.md#listroles) - ListRoles
- [`rbacListScimGroupMappings`](docs/sdks/rbac/README.md#listscimgroupmappings) - ListScimGroupMappings
- [`rbacListServiceAccounts`](docs/sdks/rbac/README.md#listserviceaccounts) - ListServiceAccounts
- [`rbacMigrateAllScimGroupMappings`](docs/sdks/rbac/README.md#migrateallscimgroupmappings) - MigrateAllScimGroupMappings
- [`rbacMigrateScimGroupMappingToGroup`](docs/sdks/rbac/README.md#migratescimgroupmappingtogroup) - MigrateScimGroupMappingToGroup
- [`rbacRejectAccessRequest`](docs/sdks/rbac/README.md#rejectaccessrequest) - RejectAccessRequest
- [`rbacRemoveGroupMember`](docs/sdks/rbac/README.md#removegroupmember) - RemoveGroupMember
- [`rbacRemovePermissionFromRole`](docs/sdks/rbac/README.md#removepermissionfromrole) - RemovePermissionFromRole
- [`rbacRemoveRoleFromMember`](docs/sdks/rbac/README.md#removerolefrommember) - RemoveRoleFromMember
- [`rbacRequestAccess`](docs/sdks/rbac/README.md#requestaccess) - Access request management
- [`rbacRevertScimGroupMappingToRole`](docs/sdks/rbac/README.md#revertscimgroupmappingtorole) - RevertScimGroupMappingToRole
- [`rbacRevokeApiKey`](docs/sdks/rbac/README.md#revokeapikey) - RevokeApiKey
- [`rbacRevokeObjectAccess`](docs/sdks/rbac/README.md#revokeobjectaccess) - RevokeObjectAccess
- [`rbacRotateApiKey`](docs/sdks/rbac/README.md#rotateapikey) - RotateApiKey
- [`rbacServiceRBACServiceSetRolePermissions`](docs/sdks/rbacservice/README.md#rbacservicesetrolepermissions) - Bulk add/remove permissions on a role in one call, producing a single audit entry for the whole edit.
- [`rbacShareObject`](docs/sdks/rbac/README.md#shareobject) - Object sharing and access control
- [`rbacShareObjectWithRole`](docs/sdks/rbac/README.md#shareobjectwithrole) - ShareObjectWithRole
- [`rbacShareWithGroup`](docs/sdks/rbac/README.md#sharewithgroup) - ShareObjectWithGroup
- [`rbacUpdateGroup`](docs/sdks/rbac/README.md#updategroup) - UpdateGroup
- [`rbacUpdateObjectAccess`](docs/sdks/rbac/README.md#updateobjectaccess) - UpdateObjectAccess
- [`rbacUpdateObjectVisibility`](docs/sdks/rbac/README.md#updateobjectvisibility) - UpdateObjectVisibility
- [`rbacUpdateRole`](docs/sdks/rbac/README.md#updaterole) - UpdateRole
- [`sandboxAdminGetSandbox`](docs/sdks/sandboxadmin/README.md#getsandbox) - GetSandbox
- [`sandboxAdminList`](docs/sdks/sandboxadmin/README.md#list) - ListSandboxes
- [`sandboxAdminListExecutions`](docs/sdks/sandboxadmin/README.md#listexecutions) - ListSandboxExecutions
- [`sandboxAdminListSandboxEgress`](docs/sdks/sandboxadmin/README.md#listsandboxegress) - Outbound HTTP(S) calls a sandbox made (the egress ledger). Durable — reads  the recorded table, so it works for stopped sandboxes too.
- [`sandboxAdminListSandboxFiles`](docs/sdks/sandboxadmin/README.md#listsandboxfiles) - Live filesystem of a running sandbox. Both are NO-OP (read-only) and only  return data while the worker is alive; available=false otherwise.
- [`sandboxAdminListSandboxSpend`](docs/sdks/sandboxadmin/README.md#listsandboxspend) - Per-lease compute usage for a sandbox, computed from lease durations × the  compute rate. Durable (reads the lease table), so it works for stopped  sandboxes. This is usage (ACUs), not the invoiced dollar amount.
- [`sandboxAdminReadFile`](docs/sdks/sandboxadmin/README.md#readfile) - ReadSandboxFile
- [`sandboxAdminRestartSandbox`](docs/sdks/sandboxadmin/README.md#restartsandbox) - Restart a stopped/reaped sandbox by re-acquiring a worker for the same  sandbox_id, preserving the original owner. Same scoping as StopSandbox  (owner, or sandbox:write_private for org-wide).
- [`sandboxAdminStop`](docs/sdks/sandboxadmin/README.md#stop) - StopSandbox
- [`sandboxCapabilityServiceSandboxCapabilityServiceExecuteWrite`](docs/sdks/sandboxcapabilityservice/README.md#sandboxcapabilityserviceexecutewrite) - ExecuteWrite
- [`sandboxCapabilityServiceSandboxCapabilityServicePutAsset`](docs/sdks/sandboxcapabilityservice/README.md#sandboxcapabilityserviceputasset) - PutAsset
- [`sandboxCapabilityServiceSandboxCapabilityServiceSendNotify`](docs/sdks/sandboxcapabilityservice/README.md#sandboxcapabilityservicesendnotify) - SendNotify
- [`sandboxCapabilityServiceSandboxCapabilityServiceStateOp`](docs/sdks/sandboxcapabilityservice/README.md#sandboxcapabilityservicestateop) - StateOp
- [`sandboxExecuteQuery`](docs/sdks/sandbox/README.md#executequery) - ExecuteQuery
- [`scimCreateOAuthClient`](docs/sdks/scim/README.md#createoauthclient) - CreateScimOAuthClient
- [`scimCreateScimToken`](docs/sdks/scim/README.md#createscimtoken) - CreateScimToken
- [`scimList`](docs/sdks/scim/README.md#list) - ListScimTokens
- [`scimListScimOAuthClients`](docs/sdks/scim/README.md#listscimoauthclients) - ListScimOAuthClients
- [`scimRevokeOAuthClient`](docs/sdks/scim/README.md#revokeoauthclient) - RevokeScimOAuthClient
- [`scimRevokeScimToken`](docs/sdks/scim/README.md#revokescimtoken) - RevokeScimToken
- [`secretsDeleteSecret`](docs/sdks/secrets/README.md#deletesecret) - DeleteSecret
- [`secretsGetMembersWithSecrets`](docs/sdks/secrets/README.md#getmemberswithsecrets) - GetMembersWithSecrets
- [`secretsListSecrets`](docs/sdks/secrets/README.md#listsecrets) - ListSecrets
- [`secretsPutSecret`](docs/sdks/secrets/README.md#putsecret) - PutSecret
- [`secretsUpdate`](docs/sdks/secrets/README.md#update) - UpdateSecret
- [`slackCreateUuid`](docs/sdks/slack/README.md#createuuid) - CreateSlackUuid
- [`slackDeleteInstallation`](docs/sdks/slack/README.md#deleteinstallation) - DeleteInstallation
- [`slackGetCurrentUser`](docs/sdks/slack/README.md#getcurrentuser) - GetCurrentUser
- [`slackHandleOAuthCallback`](docs/sdks/slack/README.md#handleoauthcallback) - HandleSlackOAuthCallback
- [`slackListChannels`](docs/sdks/slack/README.md#listchannels) - ListChannels
- [`slackListInstallations`](docs/sdks/slack/README.md#listinstallations) - ListInstallations
- [`slackListUsers`](docs/sdks/slack/README.md#listusers) - ListUsers
- [`slackSyncWorkspace`](docs/sdks/slack/README.md#syncworkspace) - SyncWorkspace
- [`tableauGenerateEmbedToken`](docs/sdks/tableau/README.md#generateembedtoken) - Generate JWT token for embedding views
- [`tableauGetCollectionThumbnail`](docs/sdks/tableau/README.md#getcollectionthumbnail) - Get collection thumbnail (first view image)
- [`tableauGetConnectedAppStatus`](docs/sdks/tableau/README.md#getconnectedappstatus) - GetConnectedAppStatus
- [`tableauGetStarredItems`](docs/sdks/tableau/README.md#getstarreditems) - GetStarredTableauItems
- [`tableauListProjects`](docs/sdks/tableau/README.md#listprojects) - List Tableau projects
- [`tableauListTableauDatasources`](docs/sdks/tableau/README.md#listtableaudatasources) - List Tableau datasources
- [`tableauListViews`](docs/sdks/tableau/README.md#listviews) - List Tableau views
- [`tableauListWorkbooks`](docs/sdks/tableau/README.md#listworkbooks) - List Tableau workbooks
- [`tableauRefreshCollection`](docs/sdks/tableau/README.md#refreshcollection) - RefreshTableauCollection
- [`tableauResetConnectedApp`](docs/sdks/tableau/README.md#resetconnectedapp) - ResetConnectedApp
- [`tableauStarItem`](docs/sdks/tableau/README.md#staritem) - Star/unstar items
- [`tableauTestTableauConnection`](docs/sdks/tableau/README.md#testtableauconnection) - Test a Tableau connection
- [`tableauUnstarTableauItem`](docs/sdks/tableau/README.md#unstartableauitem) - UnstarTableauItem
- [`teamsCreateUuid`](docs/sdks/teams/README.md#createuuid) - CreateTeamsUuid
- [`teamsDeleteInstallation`](docs/sdks/teams/README.md#deleteinstallation) - DeleteInstallation
- [`teamsGetCurrentUser`](docs/sdks/teams/README.md#getcurrentuser) - GetCurrentUser
- [`teamsHandleOAuthCallback`](docs/sdks/teams/README.md#handleoauthcallback) - HandleTeamsOAuthCallback
- [`teamsList`](docs/sdks/teams/README.md#list) - ListChannels
- [`teamsListInstallations`](docs/sdks/teams/README.md#listinstallations) - ListInstallations
- [`teamsListUsers`](docs/sdks/teams/README.md#listusers) - ListUsers
- [`teamsSyncWorkspace`](docs/sdks/teams/README.md#syncworkspace) - SyncWorkspace

</details>
<!-- End Standalone functions [standalone-funcs] -->

<!-- Start Retries [retries] -->
## Retries

Some of the endpoints in this SDK support retries.  If you use the SDK without any configuration, it will fall back to the default retry strategy provided by the API.  However, the default retry strategy can be overridden on a per-operation basis, or across the entire SDK.

To change the default retry strategy for a single API call, simply provide a retryConfig object to the call:
```typescript
import { Textql } from "@textql/sdk";

const textql = new Textql({
  apiKey: process.env["TEXTQL_API_KEY"] ?? "",
});

async function run() {
  const result = await textql.agents.create({
    body: {},
  }, {
    retries: {
      strategy: "backoff",
      backoff: {
        initialInterval: 1,
        maxInterval: 50,
        exponent: 1.1,
        maxElapsedTime: 100,
      },
      retryConnectionErrors: false,
    },
  });

  console.log(result);
}

run();

```

If you'd like to override the default retry strategy for all operations that support retries, you can provide a retryConfig at SDK initialization:
```typescript
import { Textql } from "@textql/sdk";

const textql = new Textql({
  retryConfig: {
    strategy: "backoff",
    backoff: {
      initialInterval: 1,
      maxInterval: 50,
      exponent: 1.1,
      maxElapsedTime: 100,
    },
    retryConnectionErrors: false,
  },
  apiKey: process.env["TEXTQL_API_KEY"] ?? "",
});

async function run() {
  const result = await textql.agents.create({
    body: {},
  });

  console.log(result);
}

run();

```
<!-- End Retries [retries] -->

<!-- Start Error Handling [errors] -->
## Error Handling

[`TextqlError`](./src/models/errors/textql-error.ts) is the base class for all HTTP error responses. It has the following properties:

| Property            | Type       | Description                                            |
| ------------------- | ---------- | ------------------------------------------------------ |
| `error.message`     | `string`   | Error message                                          |
| `error.statusCode`  | `number`   | HTTP response status code eg `404`                     |
| `error.headers`     | `Headers`  | HTTP response headers                                  |
| `error.body`        | `string`   | HTTP body. Can be empty string if no body is returned. |
| `error.rawResponse` | `Response` | Raw HTTP response                                      |

### Example
```typescript
import { Textql } from "@textql/sdk";
import * as errors from "@textql/sdk/models/errors";

const textql = new Textql({
  apiKey: process.env["TEXTQL_API_KEY"] ?? "",
});

async function run() {
  try {
    const result = await textql.agents.create({
      body: {},
    });

    console.log(result);
  } catch (error) {
    if (error instanceof errors.TextqlError) {
      console.log(error.message);
      console.log(error.statusCode);
      console.log(error.body);
      console.log(error.headers);
    }
  }
}

run();

```

### Error Classes
**Primary error:**
* [`TextqlError`](./src/models/errors/textql-error.ts): The base class for HTTP error responses.

<details><summary>Less common errors (6)</summary>

<br />

**Network errors:**
* [`ConnectionError`](./src/models/errors/http-client-errors.ts): HTTP client was unable to make a request to a server.
* [`RequestTimeoutError`](./src/models/errors/http-client-errors.ts): HTTP request timed out due to an AbortSignal signal.
* [`RequestAbortedError`](./src/models/errors/http-client-errors.ts): HTTP request was aborted by the client.
* [`InvalidRequestError`](./src/models/errors/http-client-errors.ts): Any input used to create a request is invalid.
* [`UnexpectedClientError`](./src/models/errors/http-client-errors.ts): Unrecognised or unexpected error.


**Inherit from [`TextqlError`](./src/models/errors/textql-error.ts)**:
* [`ResponseValidationError`](./src/models/errors/response-validation-error.ts): Type mismatch between the data returned from the server and the structure expected by the SDK. See `error.rawValue` for the raw value and `error.pretty()` for a nicely formatted multi-line string.

</details>
<!-- End Error Handling [errors] -->

<!-- Start Server Selection [server] -->
## Server Selection

### Override Server URL Per-Client

The default server can be overridden globally by passing a URL to the `serverURL: string` optional parameter when initializing the SDK client instance. For example:
```typescript
import { Textql } from "@textql/sdk";

const textql = new Textql({
  serverURL: "https://app.textql.com",
  apiKey: process.env["TEXTQL_API_KEY"] ?? "",
});

async function run() {
  const result = await textql.agents.create({
    body: {},
  });

  console.log(result);
}

run();

```
<!-- End Server Selection [server] -->

<!-- Start Custom HTTP Client [http-client] -->
## Custom HTTP Client

The TypeScript SDK makes API calls using an `HTTPClient` that wraps the native
[Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API). This
client is a thin wrapper around `fetch` and provides the ability to attach hooks
around the request lifecycle that can be used to modify the request or handle
errors and response.

The `HTTPClient` constructor takes an optional `fetcher` argument that can be
used to integrate a third-party HTTP client or when writing tests to mock out
the HTTP client and feed in fixtures.

The following example shows how to:
- route requests through a proxy server using [undici](https://www.npmjs.com/package/undici)'s ProxyAgent
- use the `"beforeRequest"` hook to add a custom header and a timeout to requests
- use the `"requestError"` hook to log errors

```typescript
import { Textql } from "@textql/sdk";
import { ProxyAgent } from "undici";
import { HTTPClient } from "@textql/sdk/lib/http";

const dispatcher = new ProxyAgent("http://proxy.example.com:8080");

const httpClient = new HTTPClient({
  // 'fetcher' takes a function that has the same signature as native 'fetch'.
  fetcher: (input, init) =>
    // 'dispatcher' is specific to undici and not part of the standard Fetch API.
    fetch(input, { ...init, dispatcher } as RequestInit),
});

httpClient.addHook("beforeRequest", (request) => {
  const nextRequest = new Request(request, {
    signal: request.signal || AbortSignal.timeout(5000)
  });

  nextRequest.headers.set("x-custom-header", "custom value");

  return nextRequest;
});

httpClient.addHook("requestError", (error, request) => {
  console.group("Request Error");
  console.log("Reason:", `${error}`);
  console.log("Endpoint:", `${request.method} ${request.url}`);
  console.groupEnd();
});

const sdk = new Textql({ httpClient: httpClient });
```
<!-- End Custom HTTP Client [http-client] -->

<!-- Start Debugging [debug] -->
## Debugging

You can setup your SDK to emit debug logs for SDK requests and responses.

You can pass a logger that matches `console`'s interface as an SDK option.

> [!WARNING]
> Beware that debug logging will reveal secrets, like API tokens in headers, in log messages printed to a console or files. It's recommended to use this feature only during local development and not in production.

```typescript
import { Textql } from "@textql/sdk";

const sdk = new Textql({ debugLogger: console });
```

You can also enable a default debug logger by setting an environment variable `TEXTQL_DEBUG` to true.
<!-- End Debugging [debug] -->

<!-- Placeholder for Future Speakeasy SDK Sections -->

# Development

## Maturity

This SDK is in beta, and there may be breaking changes between versions without a major version update. Therefore, we recommend pinning usage
to a specific package version. This way, you can install the same version each time without breaking changes unless you are intentionally
looking for the latest version.

## Contributions

While we value open-source contributions to this SDK, this library is generated programmatically. Any manual changes added to internal files will be overwritten on the next generation. 
We look forward to hearing your feedback. Feel free to open a PR or an issue with a proof of concept and we'll do our best to include it in a future release. 

### SDK Created by [Speakeasy](https://www.speakeasy.com/?utm_source=textql-sdk&utm_campaign=typescript)
