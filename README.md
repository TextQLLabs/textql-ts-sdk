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
* [getDBSchema](docs/sdks/agents/README.md#getdbschema) - GetAgentDBSchema
* [getDBTablePreview](docs/sdks/agents/README.md#getdbtablepreview) - GetAgentDBTablePreview
* [getRun](docs/sdks/agents/README.md#getrun) - GetAgentRun
* [listRuns](docs/sdks/agents/README.md#listruns) - ListAgentRuns
* [list](docs/sdks/agents/README.md#list) - ListAgents
* [resetAgentAvatar](docs/sdks/agents/README.md#resetagentavatar) - ResetAgentAvatar
* [triggerAgent](docs/sdks/agents/README.md#triggeragent) - TriggerAgent
* [update](docs/sdks/agents/README.md#update) - UpdateAgent
* [uploadAgentAvatar](docs/sdks/agents/README.md#uploadagentavatar) - UploadAgentAvatar

### [Apps](docs/sdks/apps/README.md)

* [heartbeat](docs/sdks/apps/README.md#heartbeat) - Executes a declared compute function on a pooled sandbox worker; gated, org-scoped, rate-limited.
* [createApp](docs/sdks/apps/README.md#createapp) - CreateApp
* [deleteApp](docs/sdks/apps/README.md#deleteapp) - DeleteApp
* [duplicate](docs/sdks/apps/README.md#duplicate) - Duplicates an app the caller can view into a new app they own,  named "Copy of <name>". Copies code/files/data sources/compute functions/  schedule; never carries over the source's data snapshot.
* [get](docs/sdks/apps/README.md#get) - GetApp
* [getDBSchema](docs/sdks/apps/README.md#getdbschema) - Append-only per-member activity log. Listing is own rows only; no  cross-member reads in this release.
* [getDBTablePreview](docs/sdks/apps/README.md#getdbtablepreview) - GetAppDBTablePreview
* [getMemberState](docs/sdks/apps/README.md#getmemberstate) - Lists the calling member's favorited library items (apps, dashboards,  agents) for the sidebar Pinned section: id, type, name, preview screenshot.
* [getAppVersion](docs/sdks/apps/README.md#getappversion) - Version history: git-backed, one version per save (plus legacy publish-era snapshots); authors can list and restore.
* [getAppViewStats](docs/sdks/apps/README.md#getappviewstats) - Favorite/unfavorite a library item (app or dashboard) for the calling member.  Per-member, per-org; favorited=false hard-deletes the row. Covers both primitives  since the merged library page pins apps and dashboards through one client.
* [getMembersWithApps](docs/sdks/apps/README.md#getmemberswithapps) - GetMembersWithApps
* [invokeComputeFunction](docs/sdks/apps/README.md#invokecomputefunction) - InvokeAppComputeFunction
* [listActivitySince](docs/sdks/apps/README.md#listactivitysince) - Staff-only (superadmin gated in-handler): publishes the embedded component  gallery as an app tree and returns its signed viewer URL.
* [listVersions](docs/sdks/apps/README.md#listversions) - Overwrites the published tree's pinned _runtime/ana-1.js with the platform's current copy so host-driven affordances (comment hit-testing) work on older documents; never touches authored content or data. repinned=false for legacy pre-tree documents.
* [list](docs/sdks/apps/README.md#list) - ListApps
* [listMyMemberActivity](docs/sdks/apps/README.md#listmymemberactivity) - View analytics: reads the engagement views recorded on app page load.
* [moveAppToFolder](docs/sdks/apps/README.md#moveapptofolder) - Moves an app into a library folder (or to root when folder_id is empty).
* [presenceHeartbeat](docs/sdks/apps/README.md#presenceheartbeat) - PresenceHeartbeat
* [recordMemberActivity](docs/sdks/apps/README.md#recordmemberactivity) - Replaces the calling member's entire ordering; capped server-side.
* [refresh](docs/sdks/apps/README.md#refresh) - Re-fetches data sources, rebuilds the document with a fresh snapshot, re-uploads.
* [restoreAppVersion](docs/sdks/apps/README.md#restoreappversion) - RestoreAppVersion
* [setMemberState](docs/sdks/apps/README.md#setmemberstate) - Ordering overlay for the sidebar Bookmarks section: one position list per  member covering favorites and thread bookmarks ('<kind>:<id>' keys).  Membership truth stays in library_favorite / chat bookmarks; this persists  only the drag-and-drop order.
* [setFavorite](docs/sdks/apps/README.md#setfavorite) - Keeps the viewed app's compute worker alive; first view spawns and pre-warms it (dashboard viewer-TTL parity).
* [update](docs/sdks/apps/README.md#update) - UpdateApp

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
* [approveOntologyChange](docs/sdks/chats/README.md#approveontologychange) - ApproveOntologyChange
* [attachAgent](docs/sdks/chats/README.md#attachagent) - AttachAgentToChat
* [attachApp](docs/sdks/chats/README.md#attachapp) - AttachApp
* [attachDashboard](docs/sdks/chats/README.md#attachdashboard) - AttachDashboard
* [attachDataset](docs/sdks/chats/README.md#attachdataset) - RateChatCell appends a row to cell_rating for every click; thumbs-down also upserts a user_thumbs_down thread_warning.
* [bookmark](docs/sdks/chats/README.md#bookmark) - BookmarkChat
* [cancelStream](docs/sdks/chats/README.md#cancelstream) - CancelStream
* [checkPermissions](docs/sdks/chats/README.md#checkpermissions) - CheckChatPermissions
* [checkHealth](docs/sdks/chats/README.md#checkhealth) - CheckHealth
* [checkStreamlitHealth](docs/sdks/chats/README.md#checkstreamlithealth) - CheckStreamlitHealth
* [createChat](docs/sdks/chats/README.md#createchat) - CreateChat
* [delete](docs/sdks/chats/README.md#delete) - DeleteChat
* [dismissQuestions](docs/sdks/chats/README.md#dismissquestions) - Resolve a halted questions cell. Submit hands the answers to the agent and  resumes it; Dismiss hands over only the answered count and does NOT resume  (the user's next message becomes the dismissal reason).
* [duplicateChat](docs/sdks/chats/README.md#duplicatechat) - DuplicateChat
* [getApiAnswer](docs/sdks/chats/README.md#getapianswer) - GetAPIChatAnswer
* [getArtifact](docs/sdks/chats/README.md#getartifact) - GetArtifact
* [get](docs/sdks/chats/README.md#get) - GetChat
* [getArtifactsSummary](docs/sdks/chats/README.md#getartifactssummary) - GetChatArtifactsSummary
* [getChatExecutionTiming](docs/sdks/chats/README.md#getchatexecutiontiming) - GetChatExecutionTiming
* [getHistory](docs/sdks/chats/README.md#gethistory) - GetChatHistory
* [getAll](docs/sdks/chats/README.md#getall) - GetChats
* [getCompletionParameters](docs/sdks/chats/README.md#getcompletionparameters) - List distinct chat creators the user can access
* [getCompletionParametersBatch](docs/sdks/chats/README.md#getcompletionparametersbatch) - GetCompletionParametersBatch
* [getLlmUsage](docs/sdks/chats/README.md#getllmusage) - GetLlmUsage
* [getMembersWithChats](docs/sdks/chats/README.md#getmemberswithchats) - GetMembersWithChats
* [getPlaybookChats](docs/sdks/chats/README.md#getplaybookchats) - GetPlaybookChats
* [pollEvents](docs/sdks/chats/README.md#pollevents) - PollChatEvents
* [queryOneShot](docs/sdks/chats/README.md#queryoneshot) - QueryOneShot
* [rateCell](docs/sdks/chats/README.md#ratecell) - RateChatCell
* [rejectContextPromptChange](docs/sdks/chats/README.md#rejectcontextpromptchange) - RejectContextPromptChange
* [rejectOntologyChange](docs/sdks/chats/README.md#rejectontologychange) - Resolve a halted ask_approval form cell. Submit runs the form's submission  and continues the agent with the outcome; Reject discards it (passive, no  run); Dismiss treats it as a change request (no run, next message says what  to change). All three set the cell's outcome, like the other approve/deny cells.
* [run](docs/sdks/chats/README.md#run) - RunChat
* [send](docs/sdks/chats/README.md#send) - SendMessage
* [submitContextPromptChange](docs/sdks/chats/README.md#submitcontextpromptchange) - SubmitContextPromptChange
* [submitQuestions](docs/sdks/chats/README.md#submitquestions) - SubmitQuestions
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
* [createCustomTopic](docs/sdks/observability/README.md#createcustomtopic) - Custom topics
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
* [getMemberSignalTrend](docs/sdks/observability/README.md#getmembersignaltrend) - GetMemberSignalTrend
* [getObservabilityStats](docs/sdks/observability/README.md#getobservabilitystats) - GetObservabilityStats
* [getThreadWarnings](docs/sdks/observability/README.md#getthreadwarnings) - GetThreadWarnings
* [listCustomTopics](docs/sdks/observability/README.md#listcustomtopics) - ListCustomTopics
* [refineDraft](docs/sdks/observability/README.md#refinedraft) - RefineTopicDraft
* [setTopicTagFeedback](docs/sdks/observability/README.md#settopictagfeedback) - SetTopicTagFeedback
* [updateCustomTopic](docs/sdks/observability/README.md#updatecustomtopic) - UpdateCustomTopic

### [Ontology](docs/sdks/ontology/README.md)

* [addSubmodule](docs/sdks/ontology/README.md#addsubmodule) - AddOntologySubmodule
* [approvePatch](docs/sdks/ontology/README.md#approvepatch) - ApprovePatch
* [configureRemote](docs/sdks/ontology/README.md#configureremote) - Lists the skills under the ontology's flat skills/ root that the caller can  read (OWNERS-filtered). Returns display metadata only — never instruction  bodies — feeding the chat composer's `/` autocomplete. Unlisted skills are  omitted unless include_unlisted is set.
* [createApprovalRule](docs/sdks/ontology/README.md#createapprovalrule) - CreateApprovalRule
* [createContextPatchAutoApproveRule](docs/sdks/ontology/README.md#createcontextpatchautoapproverule) - CreateContextPatchAutoApproveRule
* [createDirectory](docs/sdks/ontology/README.md#createdirectory) - CreateOntologyDirectory
* [createFileUploadUrl](docs/sdks/ontology/README.md#createfileuploadurl) - Streams how many folders and files a subtree holds, so the UI can report the  size of the whole Ontology rather than only the directories it has lazily  listed. Counts rise monotonically across frames; the last frame sets  `final`. A cache hit emits a single `final` frame with `from_cache` set.
* [deleteApprovalRule](docs/sdks/ontology/README.md#deleteapprovalrule) - DeleteApprovalRule
* [deleteContextPatchAutoApproveRule](docs/sdks/ontology/README.md#deletecontextpatchautoapproverule) - DeleteContextPatchAutoApproveRule
* [deleteDirectory](docs/sdks/ontology/README.md#deletedirectory) - DeleteOntologyDirectory
* [deleteFile](docs/sdks/ontology/README.md#deletefile) - DeleteOntologyFile
* [deleteOwners](docs/sdks/ontology/README.md#deleteowners) - DeleteOntologyOwners
* [denyPatch](docs/sdks/ontology/README.md#denypatch) - DenyPatch
* [exchangeGithubCode](docs/sdks/ontology/README.md#exchangegithubcode) - ExchangeOntologyGithubCode
* [finalizeFileUpload](docs/sdks/ontology/README.md#finalizefileupload) - FinalizeOntologyFileUpload
* [getCodeownerCoverage](docs/sdks/ontology/README.md#getcodeownercoverage) - GetCodeownerCoverage
* [getConfigExportCapabilities](docs/sdks/ontology/README.md#getconfigexportcapabilities) - GetConfigExportCapabilities
* [getEffectiveOwners](docs/sdks/ontology/README.md#geteffectiveowners) - GetEffectiveOntologyOwners
* [getFileUsage](docs/sdks/ontology/README.md#getfileusage) - GetFileUsage
* [getFileUsageTimeline](docs/sdks/ontology/README.md#getfileusagetimeline) - GetFileUsageTimeline
* [getAnaConfig](docs/sdks/ontology/README.md#getanaconfig) - GetOntologyAnaConfig
* [getFile](docs/sdks/ontology/README.md#getfile) - GetOntologyFile
* [getGithubOAuthURL](docs/sdks/ontology/README.md#getgithuboauthurl) - GetOntologyGithubOAuthURL
* [getHistoryFileDiff](docs/sdks/ontology/README.md#gethistoryfilediff) - GetOntologyHistoryFileDiff
* [getOwners](docs/sdks/ontology/README.md#getowners) - GetOntologyOwners
* [getRemote](docs/sdks/ontology/README.md#getremote) - GetOntologyRemote
* [getSizeTimeline](docs/sdks/ontology/README.md#getsizetimeline) - GetOntologySizeTimeline
* [getSyncConflicts](docs/sdks/ontology/README.md#getsyncconflicts) - GetOntologySyncConflicts
* [getUsageSummary](docs/sdks/ontology/README.md#getusagesummary) - GetOntologyUsageSummary
* [getPatch](docs/sdks/ontology/README.md#getpatch) - GetPatch
* [getPatchByNumber](docs/sdks/ontology/README.md#getpatchbynumber) - GetPatchByNumber
* [getPatchCapabilities](docs/sdks/ontology/README.md#getpatchcapabilities) - PlanConfigMigration reports what the lazy config migration WOULD do to this  org's objects, and writes nothing. Admin-only, internal: it exists so a  release manager can warn the specific orgs a rollout will affect — notably  the objects that will stop running because adoption binds a Runner who can  no longer run them.
* [getRawPatch](docs/sdks/ontology/README.md#getrawpatch) - GetRawPatch
* [getUsageDetailsForFile](docs/sdks/ontology/README.md#getusagedetailsforfile) - GetUsageDetailsForFile
* [listApprovalRules](docs/sdks/ontology/README.md#listapprovalrules) - ListApprovalRules
* [listChatsForFile](docs/sdks/ontology/README.md#listchatsforfile) - ListChatsForFile
* [listContextPatchAutoApproveRules](docs/sdks/ontology/README.md#listcontextpatchautoapproverules) - ListContextPatchAutoApproveRules
* [listGoldenFiles](docs/sdks/ontology/README.md#listgoldenfiles) - ListGoldenFiles
* [listEntries](docs/sdks/ontology/README.md#listentries) - ListOntologyEntries
* [listHistory](docs/sdks/ontology/README.md#listhistory) - ListOntologyHistory
* [listImports](docs/sdks/ontology/README.md#listimports) - ListOntologyImports
* [listSubmodules](docs/sdks/ontology/README.md#listsubmodules) - ListOntologySubmodules
* [listSyncRuns](docs/sdks/ontology/README.md#listsyncruns) - ListOntologySyncRuns
* [listPatchObjects](docs/sdks/ontology/README.md#listpatchobjects) - ListPatchObjects parses the config objects present at a patch's git ref and  returns each object's Library path, resolved display name, and granular type  (e.g. "playbook", "dashboard/streamlit", "dashboard/dash"). Parse-only: it  reuses the snapshot-at-ref + parse steps the preview path performs before  spawning — no sandbox spawn, no run_as authorization, no persistence. The  frontend uses the dashboard subtype to decide previewability (streamlit/dash).
* [listPatchReviewers](docs/sdks/ontology/README.md#listpatchreviewers) - ListPatchReviewers
* [listPatches](docs/sdks/ontology/README.md#listpatches) - ListPatches
* [listSkills](docs/sdks/ontology/README.md#listskills) - ListSkills
* [planMerge](docs/sdks/ontology/README.md#planmerge) - PlanOntologyMerge
* [previewPullFromRemote](docs/sdks/ontology/README.md#previewpullfromremote) - PreviewOntologyPullFromRemote
* [pullFromRemote](docs/sdks/ontology/README.md#pullfromremote) - PullOntologyFromRemote
* [pushToRemote](docs/sdks/ontology/README.md#pushtoremote) - PushOntologyToRemote
* [recover](docs/sdks/ontology/README.md#recover) - RecoverOntology
* [removeRemote](docs/sdks/ontology/README.md#removeremote) - RemoveOntologyRemote
* [removeSubmodule](docs/sdks/ontology/README.md#removesubmodule) - RemoveOntologySubmodule
* [renameFile](docs/sdks/ontology/README.md#renamefile) - RenameOntologyFile
* [requestPatchReview](docs/sdks/ontology/README.md#requestpatchreview) - RequestPatchReview
* [resolveSyncConflict](docs/sdks/ontology/README.md#resolvesyncconflict) - ResolveOntologySyncConflict
* [restorePatch](docs/sdks/ontology/README.md#restorepatch) - RestorePatch
* [revertPatch](docs/sdks/ontology/README.md#revertpatch) - RevertPatch
* [saveAllObjectsAsConfig](docs/sdks/ontology/README.md#saveallobjectsasconfig) - SaveAllObjectsAsConfig
* [saveObjectAsConfig](docs/sdks/ontology/README.md#saveobjectasconfig) - SaveObjectAsConfig
* [setFileGolden](docs/sdks/ontology/README.md#setfilegolden) - SetOntologyFileGolden
* [triggerConfigDriftReconcile](docs/sdks/ontology/README.md#triggerconfigdriftreconcile) - TriggerConfigDriftReconcile
* [updateApprovalRule](docs/sdks/ontology/README.md#updateapprovalrule) - UpdateApprovalRule
* [updateContextPatchAutoApproveRule](docs/sdks/ontology/README.md#updatecontextpatchautoapproverule) - UpdateContextPatchAutoApproveRule
* [updateSyncConfig](docs/sdks/ontology/README.md#updatesyncconfig) - TriggerConfigDriftReconcile forces an immediate config-sync catch-up for the  caller's org: if the Ontology repo's live HEAD differs from the last  reconciled commit, it enqueues a reconcile (otherwise no-op). The on-demand  equivalent of waiting for the periodic drift scan.
* [upsertAnaConfig](docs/sdks/ontology/README.md#upsertanaconfig) - UpsertOntologyAnaConfig
* [upsertFile](docs/sdks/ontology/README.md#upsertfile) - UpsertOntologyFile
* [upsertOwners](docs/sdks/ontology/README.md#upsertowners) - UpsertOntologyOwners
* [validateConfig](docs/sdks/ontology/README.md#validateconfig) - Read-only functional validation of a proposed config: parse + dependency  resolution/reachability, no authorization and no persistence. "ok" means  functionally valid, not "guaranteed to merge" — the merge gate re-checks  authorization at approve time.

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

* [approveAccessRequest](docs/sdks/rbac/README.md#approveaccessrequest) - SCIM group-mapping migration tooling: one-time role<->group conversion,  internal only.
* [assignPermissionToRole](docs/sdks/rbac/README.md#assignpermissiontorole) - AssignPermissionToRole
* [assignRoleToMember](docs/sdks/rbac/README.md#assignroletomember) - Member role assignment
* [createApiKey](docs/sdks/rbac/README.md#createapikey) - CreateApiKey
* [createRole](docs/sdks/rbac/README.md#createrole) - Role management
* [createServiceAccount](docs/sdks/rbac/README.md#createserviceaccount) - CreateServiceAccount
* [deleteRole](docs/sdks/rbac/README.md#deleterole) - DeleteRole
* [deleteServiceAccount](docs/sdks/rbac/README.md#deleteserviceaccount) - DeleteServiceAccount
* [generateShareLink](docs/sdks/rbac/README.md#generatesharelink) - GenerateShareLink
* [getCurrentMemberRolesAndPermissions](docs/sdks/rbac/README.md#getcurrentmemberrolesandpermissions) - Get current member roles and permissions
* [getEmbedUserApiKey](docs/sdks/rbac/README.md#getembeduserapikey) - GetEmbedUserApiKey
* [getMemberRoles](docs/sdks/rbac/README.md#getmemberroles) - GetMemberRoles
* [getObjectAccess](docs/sdks/rbac/README.md#getobjectaccess) - GetObjectAccess
* [getRole](docs/sdks/rbac/README.md#getrole) - GetRole
* [getRolePermissions](docs/sdks/rbac/README.md#getrolepermissions) - GetRolePermissions
* [hasObjectAccess](docs/sdks/rbac/README.md#hasobjectaccess) - HasObjectAccess
* [listAccessRequests](docs/sdks/rbac/README.md#listaccessrequests) - ListAccessRequests
* [listApiKeys](docs/sdks/rbac/README.md#listapikeys) - ListApiKeys
* [listPermissions](docs/sdks/rbac/README.md#listpermissions) - Permission management
* [listRoles](docs/sdks/rbac/README.md#listroles) - ListRoles
* [listServiceAccounts](docs/sdks/rbac/README.md#listserviceaccounts) - ListServiceAccounts
* [rejectAccessRequest](docs/sdks/rbac/README.md#rejectaccessrequest) - RejectAccessRequest
* [removePermissionFromRole](docs/sdks/rbac/README.md#removepermissionfromrole) - RemovePermissionFromRole
* [removeRoleFromMember](docs/sdks/rbac/README.md#removerolefrommember) - RemoveRoleFromMember
* [requestAccess](docs/sdks/rbac/README.md#requestaccess) - RequestAccess
* [revokeApiKey](docs/sdks/rbac/README.md#revokeapikey) - RevokeApiKey
* [revokeObjectAccess](docs/sdks/rbac/README.md#revokeobjectaccess) - RevokeObjectAccess
* [rotateApiKey](docs/sdks/rbac/README.md#rotateapikey) - Object sharing and access control
* [setRolePermissions](docs/sdks/rbac/README.md#setrolepermissions) - Bulk add/remove permissions on a role in one call, producing a single audit entry for the whole edit.
* [shareObject](docs/sdks/rbac/README.md#shareobject) - Group management. Internal only.
* [shareObjectWithRole](docs/sdks/rbac/README.md#shareobjectwithrole) - ShareObjectWithRole
* [updateObjectAccess](docs/sdks/rbac/README.md#updateobjectaccess) - UpdateObjectAccess
* [updateObjectVisibility](docs/sdks/rbac/README.md#updateobjectvisibility) - UpdateObjectVisibility
* [updateRole](docs/sdks/rbac/README.md#updaterole) - UpdateRole
* [whoAmI](docs/sdks/rbac/README.md#whoami) - Describe what a key is allowed to do.

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

### [SandboxCapabilities](docs/sdks/sandboxcapabilities/README.md)

* [executeWrite](docs/sdks/sandboxcapabilities/README.md#executewrite) - ExecuteWrite
* [pollAsk](docs/sdks/sandboxcapabilities/README.md#pollask) - PollAsk
* [putAsset](docs/sdks/sandboxcapabilities/README.md#putasset) - PutAsset
* [sendNotify](docs/sdks/sandboxcapabilities/README.md#sendnotify) - SendNotify
* [startAsk](docs/sdks/sandboxcapabilities/README.md#startask) - StartAsk
* [stateOp](docs/sdks/sandboxcapabilities/README.md#stateop) - StateOp

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

### [Settings](docs/sdks/settings/README.md)

* [checkMemberStatus](docs/sdks/settings/README.md#checkmemberstatus) - CheckMemberStatus
* [deleteMember](docs/sdks/settings/README.md#deletemember) - DeleteOrganizationMember
* [inviteMember](docs/sdks/settings/README.md#invitemember) - InviteOrganizationMember
* [listMembers](docs/sdks/settings/README.md#listmembers) - ListOrganizationMembers
* [update](docs/sdks/settings/README.md#update) - UpdateOrganizationSettings

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
- [`agentsGetDBSchema`](docs/sdks/agents/README.md#getdbschema) - GetAgentDBSchema
- [`agentsGetDBTablePreview`](docs/sdks/agents/README.md#getdbtablepreview) - GetAgentDBTablePreview
- [`agentsGetRun`](docs/sdks/agents/README.md#getrun) - GetAgentRun
- [`agentsList`](docs/sdks/agents/README.md#list) - ListAgents
- [`agentsListRuns`](docs/sdks/agents/README.md#listruns) - ListAgentRuns
- [`agentsResetAgentAvatar`](docs/sdks/agents/README.md#resetagentavatar) - ResetAgentAvatar
- [`agentsTriggerAgent`](docs/sdks/agents/README.md#triggeragent) - TriggerAgent
- [`agentsUpdate`](docs/sdks/agents/README.md#update) - UpdateAgent
- [`agentsUploadAgentAvatar`](docs/sdks/agents/README.md#uploadagentavatar) - UploadAgentAvatar
- [`appsCreateApp`](docs/sdks/apps/README.md#createapp) - CreateApp
- [`appsDeleteApp`](docs/sdks/apps/README.md#deleteapp) - DeleteApp
- [`appsDuplicate`](docs/sdks/apps/README.md#duplicate) - Duplicates an app the caller can view into a new app they own,  named "Copy of <name>". Copies code/files/data sources/compute functions/  schedule; never carries over the source's data snapshot.
- [`appsGet`](docs/sdks/apps/README.md#get) - GetApp
- [`appsGetAppVersion`](docs/sdks/apps/README.md#getappversion) - Version history: git-backed, one version per save (plus legacy publish-era snapshots); authors can list and restore.
- [`appsGetAppViewStats`](docs/sdks/apps/README.md#getappviewstats) - Favorite/unfavorite a library item (app or dashboard) for the calling member.  Per-member, per-org; favorited=false hard-deletes the row. Covers both primitives  since the merged library page pins apps and dashboards through one client.
- [`appsGetDBSchema`](docs/sdks/apps/README.md#getdbschema) - Append-only per-member activity log. Listing is own rows only; no  cross-member reads in this release.
- [`appsGetDBTablePreview`](docs/sdks/apps/README.md#getdbtablepreview) - GetAppDBTablePreview
- [`appsGetMemberState`](docs/sdks/apps/README.md#getmemberstate) - Lists the calling member's favorited library items (apps, dashboards,  agents) for the sidebar Pinned section: id, type, name, preview screenshot.
- [`appsGetMembersWithApps`](docs/sdks/apps/README.md#getmemberswithapps) - GetMembersWithApps
- [`appsHeartbeat`](docs/sdks/apps/README.md#heartbeat) - Executes a declared compute function on a pooled sandbox worker; gated, org-scoped, rate-limited.
- [`appsInvokeComputeFunction`](docs/sdks/apps/README.md#invokecomputefunction) - InvokeAppComputeFunction
- [`appsList`](docs/sdks/apps/README.md#list) - ListApps
- [`appsListActivitySince`](docs/sdks/apps/README.md#listactivitysince) - Staff-only (superadmin gated in-handler): publishes the embedded component  gallery as an app tree and returns its signed viewer URL.
- [`appsListMyMemberActivity`](docs/sdks/apps/README.md#listmymemberactivity) - View analytics: reads the engagement views recorded on app page load.
- [`appsListVersions`](docs/sdks/apps/README.md#listversions) - Overwrites the published tree's pinned _runtime/ana-1.js with the platform's current copy so host-driven affordances (comment hit-testing) work on older documents; never touches authored content or data. repinned=false for legacy pre-tree documents.
- [`appsMoveAppToFolder`](docs/sdks/apps/README.md#moveapptofolder) - Moves an app into a library folder (or to root when folder_id is empty).
- [`appsPresenceHeartbeat`](docs/sdks/apps/README.md#presenceheartbeat) - PresenceHeartbeat
- [`appsRecordMemberActivity`](docs/sdks/apps/README.md#recordmemberactivity) - Replaces the calling member's entire ordering; capped server-side.
- [`appsRefresh`](docs/sdks/apps/README.md#refresh) - Re-fetches data sources, rebuilds the document with a fresh snapshot, re-uploads.
- [`appsRestoreAppVersion`](docs/sdks/apps/README.md#restoreappversion) - RestoreAppVersion
- [`appsSetFavorite`](docs/sdks/apps/README.md#setfavorite) - Keeps the viewed app's compute worker alive; first view spawns and pre-warms it (dashboard viewer-TTL parity).
- [`appsSetMemberState`](docs/sdks/apps/README.md#setmemberstate) - Ordering overlay for the sidebar Bookmarks section: one position list per  member covering favorites and thread bookmarks ('<kind>:<id>' keys).  Membership truth stays in library_favorite / chat bookmarks; this persists  only the drag-and-drop order.
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
- [`chatsApproveOntologyChange`](docs/sdks/chats/README.md#approveontologychange) - ApproveOntologyChange
- [`chatsAttachAgent`](docs/sdks/chats/README.md#attachagent) - AttachAgentToChat
- [`chatsAttachApp`](docs/sdks/chats/README.md#attachapp) - AttachApp
- [`chatsAttachDashboard`](docs/sdks/chats/README.md#attachdashboard) - AttachDashboard
- [`chatsAttachDataset`](docs/sdks/chats/README.md#attachdataset) - RateChatCell appends a row to cell_rating for every click; thumbs-down also upserts a user_thumbs_down thread_warning.
- [`chatsBookmark`](docs/sdks/chats/README.md#bookmark) - BookmarkChat
- [`chatsCancelStream`](docs/sdks/chats/README.md#cancelstream) - CancelStream
- [`chatsCheckHealth`](docs/sdks/chats/README.md#checkhealth) - CheckHealth
- [`chatsCheckPermissions`](docs/sdks/chats/README.md#checkpermissions) - CheckChatPermissions
- [`chatsCheckStreamlitHealth`](docs/sdks/chats/README.md#checkstreamlithealth) - CheckStreamlitHealth
- [`chatsCreateChat`](docs/sdks/chats/README.md#createchat) - CreateChat
- [`chatsDelete`](docs/sdks/chats/README.md#delete) - DeleteChat
- [`chatsDismissQuestions`](docs/sdks/chats/README.md#dismissquestions) - Resolve a halted questions cell. Submit hands the answers to the agent and  resumes it; Dismiss hands over only the answered count and does NOT resume  (the user's next message becomes the dismissal reason).
- [`chatsDuplicateChat`](docs/sdks/chats/README.md#duplicatechat) - DuplicateChat
- [`chatsGet`](docs/sdks/chats/README.md#get) - GetChat
- [`chatsGetAll`](docs/sdks/chats/README.md#getall) - GetChats
- [`chatsGetApiAnswer`](docs/sdks/chats/README.md#getapianswer) - GetAPIChatAnswer
- [`chatsGetArtifact`](docs/sdks/chats/README.md#getartifact) - GetArtifact
- [`chatsGetArtifactsSummary`](docs/sdks/chats/README.md#getartifactssummary) - GetChatArtifactsSummary
- [`chatsGetChatExecutionTiming`](docs/sdks/chats/README.md#getchatexecutiontiming) - GetChatExecutionTiming
- [`chatsGetCompletionParameters`](docs/sdks/chats/README.md#getcompletionparameters) - List distinct chat creators the user can access
- [`chatsGetCompletionParametersBatch`](docs/sdks/chats/README.md#getcompletionparametersbatch) - GetCompletionParametersBatch
- [`chatsGetHistory`](docs/sdks/chats/README.md#gethistory) - GetChatHistory
- [`chatsGetLlmUsage`](docs/sdks/chats/README.md#getllmusage) - GetLlmUsage
- [`chatsGetMembersWithChats`](docs/sdks/chats/README.md#getmemberswithchats) - GetMembersWithChats
- [`chatsGetPlaybookChats`](docs/sdks/chats/README.md#getplaybookchats) - GetPlaybookChats
- [`chatsPollEvents`](docs/sdks/chats/README.md#pollevents) - PollChatEvents
- [`chatsQueryOneShot`](docs/sdks/chats/README.md#queryoneshot) - QueryOneShot
- [`chatsRateCell`](docs/sdks/chats/README.md#ratecell) - RateChatCell
- [`chatsRejectContextPromptChange`](docs/sdks/chats/README.md#rejectcontextpromptchange) - RejectContextPromptChange
- [`chatsRejectOntologyChange`](docs/sdks/chats/README.md#rejectontologychange) - Resolve a halted ask_approval form cell. Submit runs the form's submission  and continues the agent with the outcome; Reject discards it (passive, no  run); Dismiss treats it as a change request (no run, next message says what  to change). All three set the cell's outcome, like the other approve/deny cells.
- [`chatsRun`](docs/sdks/chats/README.md#run) - RunChat
- [`chatsSend`](docs/sdks/chats/README.md#send) - SendMessage
- [`chatsSubmitContextPromptChange`](docs/sdks/chats/README.md#submitcontextpromptchange) - SubmitContextPromptChange
- [`chatsSubmitQuestions`](docs/sdks/chats/README.md#submitquestions) - SubmitQuestions
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
- [`observabilityCreateCustomTopic`](docs/sdks/observability/README.md#createcustomtopic) - Custom topics
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
- [`observabilityGetMemberSignalTrend`](docs/sdks/observability/README.md#getmembersignaltrend) - GetMemberSignalTrend
- [`observabilityGetObservabilityStats`](docs/sdks/observability/README.md#getobservabilitystats) - GetObservabilityStats
- [`observabilityGetThreadWarnings`](docs/sdks/observability/README.md#getthreadwarnings) - GetThreadWarnings
- [`observabilityListCustomTopics`](docs/sdks/observability/README.md#listcustomtopics) - ListCustomTopics
- [`observabilityRefineDraft`](docs/sdks/observability/README.md#refinedraft) - RefineTopicDraft
- [`observabilitySetTopicTagFeedback`](docs/sdks/observability/README.md#settopictagfeedback) - SetTopicTagFeedback
- [`observabilityUpdateCustomTopic`](docs/sdks/observability/README.md#updatecustomtopic) - UpdateCustomTopic
- [`ontologyAddSubmodule`](docs/sdks/ontology/README.md#addsubmodule) - AddOntologySubmodule
- [`ontologyApprovePatch`](docs/sdks/ontology/README.md#approvepatch) - ApprovePatch
- [`ontologyConfigureRemote`](docs/sdks/ontology/README.md#configureremote) - Lists the skills under the ontology's flat skills/ root that the caller can  read (OWNERS-filtered). Returns display metadata only — never instruction  bodies — feeding the chat composer's `/` autocomplete. Unlisted skills are  omitted unless include_unlisted is set.
- [`ontologyCreateApprovalRule`](docs/sdks/ontology/README.md#createapprovalrule) - CreateApprovalRule
- [`ontologyCreateContextPatchAutoApproveRule`](docs/sdks/ontology/README.md#createcontextpatchautoapproverule) - CreateContextPatchAutoApproveRule
- [`ontologyCreateDirectory`](docs/sdks/ontology/README.md#createdirectory) - CreateOntologyDirectory
- [`ontologyCreateFileUploadUrl`](docs/sdks/ontology/README.md#createfileuploadurl) - Streams how many folders and files a subtree holds, so the UI can report the  size of the whole Ontology rather than only the directories it has lazily  listed. Counts rise monotonically across frames; the last frame sets  `final`. A cache hit emits a single `final` frame with `from_cache` set.
- [`ontologyDeleteApprovalRule`](docs/sdks/ontology/README.md#deleteapprovalrule) - DeleteApprovalRule
- [`ontologyDeleteContextPatchAutoApproveRule`](docs/sdks/ontology/README.md#deletecontextpatchautoapproverule) - DeleteContextPatchAutoApproveRule
- [`ontologyDeleteDirectory`](docs/sdks/ontology/README.md#deletedirectory) - DeleteOntologyDirectory
- [`ontologyDeleteFile`](docs/sdks/ontology/README.md#deletefile) - DeleteOntologyFile
- [`ontologyDeleteOwners`](docs/sdks/ontology/README.md#deleteowners) - DeleteOntologyOwners
- [`ontologyDenyPatch`](docs/sdks/ontology/README.md#denypatch) - DenyPatch
- [`ontologyExchangeGithubCode`](docs/sdks/ontology/README.md#exchangegithubcode) - ExchangeOntologyGithubCode
- [`ontologyFinalizeFileUpload`](docs/sdks/ontology/README.md#finalizefileupload) - FinalizeOntologyFileUpload
- [`ontologyGetAnaConfig`](docs/sdks/ontology/README.md#getanaconfig) - GetOntologyAnaConfig
- [`ontologyGetCodeownerCoverage`](docs/sdks/ontology/README.md#getcodeownercoverage) - GetCodeownerCoverage
- [`ontologyGetConfigExportCapabilities`](docs/sdks/ontology/README.md#getconfigexportcapabilities) - GetConfigExportCapabilities
- [`ontologyGetEffectiveOwners`](docs/sdks/ontology/README.md#geteffectiveowners) - GetEffectiveOntologyOwners
- [`ontologyGetFile`](docs/sdks/ontology/README.md#getfile) - GetOntologyFile
- [`ontologyGetFileUsage`](docs/sdks/ontology/README.md#getfileusage) - GetFileUsage
- [`ontologyGetFileUsageTimeline`](docs/sdks/ontology/README.md#getfileusagetimeline) - GetFileUsageTimeline
- [`ontologyGetGithubOAuthURL`](docs/sdks/ontology/README.md#getgithuboauthurl) - GetOntologyGithubOAuthURL
- [`ontologyGetHistoryFileDiff`](docs/sdks/ontology/README.md#gethistoryfilediff) - GetOntologyHistoryFileDiff
- [`ontologyGetOwners`](docs/sdks/ontology/README.md#getowners) - GetOntologyOwners
- [`ontologyGetPatch`](docs/sdks/ontology/README.md#getpatch) - GetPatch
- [`ontologyGetPatchByNumber`](docs/sdks/ontology/README.md#getpatchbynumber) - GetPatchByNumber
- [`ontologyGetPatchCapabilities`](docs/sdks/ontology/README.md#getpatchcapabilities) - PlanConfigMigration reports what the lazy config migration WOULD do to this  org's objects, and writes nothing. Admin-only, internal: it exists so a  release manager can warn the specific orgs a rollout will affect — notably  the objects that will stop running because adoption binds a Runner who can  no longer run them.
- [`ontologyGetRawPatch`](docs/sdks/ontology/README.md#getrawpatch) - GetRawPatch
- [`ontologyGetRemote`](docs/sdks/ontology/README.md#getremote) - GetOntologyRemote
- [`ontologyGetSizeTimeline`](docs/sdks/ontology/README.md#getsizetimeline) - GetOntologySizeTimeline
- [`ontologyGetSyncConflicts`](docs/sdks/ontology/README.md#getsyncconflicts) - GetOntologySyncConflicts
- [`ontologyGetUsageDetailsForFile`](docs/sdks/ontology/README.md#getusagedetailsforfile) - GetUsageDetailsForFile
- [`ontologyGetUsageSummary`](docs/sdks/ontology/README.md#getusagesummary) - GetOntologyUsageSummary
- [`ontologyListApprovalRules`](docs/sdks/ontology/README.md#listapprovalrules) - ListApprovalRules
- [`ontologyListChatsForFile`](docs/sdks/ontology/README.md#listchatsforfile) - ListChatsForFile
- [`ontologyListContextPatchAutoApproveRules`](docs/sdks/ontology/README.md#listcontextpatchautoapproverules) - ListContextPatchAutoApproveRules
- [`ontologyListEntries`](docs/sdks/ontology/README.md#listentries) - ListOntologyEntries
- [`ontologyListGoldenFiles`](docs/sdks/ontology/README.md#listgoldenfiles) - ListGoldenFiles
- [`ontologyListHistory`](docs/sdks/ontology/README.md#listhistory) - ListOntologyHistory
- [`ontologyListImports`](docs/sdks/ontology/README.md#listimports) - ListOntologyImports
- [`ontologyListPatches`](docs/sdks/ontology/README.md#listpatches) - ListPatches
- [`ontologyListPatchObjects`](docs/sdks/ontology/README.md#listpatchobjects) - ListPatchObjects parses the config objects present at a patch's git ref and  returns each object's Library path, resolved display name, and granular type  (e.g. "playbook", "dashboard/streamlit", "dashboard/dash"). Parse-only: it  reuses the snapshot-at-ref + parse steps the preview path performs before  spawning — no sandbox spawn, no run_as authorization, no persistence. The  frontend uses the dashboard subtype to decide previewability (streamlit/dash).
- [`ontologyListPatchReviewers`](docs/sdks/ontology/README.md#listpatchreviewers) - ListPatchReviewers
- [`ontologyListSkills`](docs/sdks/ontology/README.md#listskills) - ListSkills
- [`ontologyListSubmodules`](docs/sdks/ontology/README.md#listsubmodules) - ListOntologySubmodules
- [`ontologyListSyncRuns`](docs/sdks/ontology/README.md#listsyncruns) - ListOntologySyncRuns
- [`ontologyPlanMerge`](docs/sdks/ontology/README.md#planmerge) - PlanOntologyMerge
- [`ontologyPreviewPullFromRemote`](docs/sdks/ontology/README.md#previewpullfromremote) - PreviewOntologyPullFromRemote
- [`ontologyPullFromRemote`](docs/sdks/ontology/README.md#pullfromremote) - PullOntologyFromRemote
- [`ontologyPushToRemote`](docs/sdks/ontology/README.md#pushtoremote) - PushOntologyToRemote
- [`ontologyRecover`](docs/sdks/ontology/README.md#recover) - RecoverOntology
- [`ontologyRemoveRemote`](docs/sdks/ontology/README.md#removeremote) - RemoveOntologyRemote
- [`ontologyRemoveSubmodule`](docs/sdks/ontology/README.md#removesubmodule) - RemoveOntologySubmodule
- [`ontologyRenameFile`](docs/sdks/ontology/README.md#renamefile) - RenameOntologyFile
- [`ontologyRequestPatchReview`](docs/sdks/ontology/README.md#requestpatchreview) - RequestPatchReview
- [`ontologyResolveSyncConflict`](docs/sdks/ontology/README.md#resolvesyncconflict) - ResolveOntologySyncConflict
- [`ontologyRestorePatch`](docs/sdks/ontology/README.md#restorepatch) - RestorePatch
- [`ontologyRevertPatch`](docs/sdks/ontology/README.md#revertpatch) - RevertPatch
- [`ontologySaveAllObjectsAsConfig`](docs/sdks/ontology/README.md#saveallobjectsasconfig) - SaveAllObjectsAsConfig
- [`ontologySaveObjectAsConfig`](docs/sdks/ontology/README.md#saveobjectasconfig) - SaveObjectAsConfig
- [`ontologySetFileGolden`](docs/sdks/ontology/README.md#setfilegolden) - SetOntologyFileGolden
- [`ontologyTriggerConfigDriftReconcile`](docs/sdks/ontology/README.md#triggerconfigdriftreconcile) - TriggerConfigDriftReconcile
- [`ontologyUpdateApprovalRule`](docs/sdks/ontology/README.md#updateapprovalrule) - UpdateApprovalRule
- [`ontologyUpdateContextPatchAutoApproveRule`](docs/sdks/ontology/README.md#updatecontextpatchautoapproverule) - UpdateContextPatchAutoApproveRule
- [`ontologyUpdateSyncConfig`](docs/sdks/ontology/README.md#updatesyncconfig) - TriggerConfigDriftReconcile forces an immediate config-sync catch-up for the  caller's org: if the Ontology repo's live HEAD differs from the last  reconciled commit, it enqueues a reconcile (otherwise no-op). The on-demand  equivalent of waiting for the periodic drift scan.
- [`ontologyUpsertAnaConfig`](docs/sdks/ontology/README.md#upsertanaconfig) - UpsertOntologyAnaConfig
- [`ontologyUpsertFile`](docs/sdks/ontology/README.md#upsertfile) - UpsertOntologyFile
- [`ontologyUpsertOwners`](docs/sdks/ontology/README.md#upsertowners) - UpsertOntologyOwners
- [`ontologyValidateConfig`](docs/sdks/ontology/README.md#validateconfig) - Read-only functional validation of a proposed config: parse + dependency  resolution/reachability, no authorization and no persistence. "ok" means  functionally valid, not "guaranteed to merge" — the merge gate re-checks  authorization at approve time.
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
- [`rbacApproveAccessRequest`](docs/sdks/rbac/README.md#approveaccessrequest) - SCIM group-mapping migration tooling: one-time role<->group conversion,  internal only.
- [`rbacAssignPermissionToRole`](docs/sdks/rbac/README.md#assignpermissiontorole) - AssignPermissionToRole
- [`rbacAssignRoleToMember`](docs/sdks/rbac/README.md#assignroletomember) - Member role assignment
- [`rbacCreateApiKey`](docs/sdks/rbac/README.md#createapikey) - CreateApiKey
- [`rbacCreateRole`](docs/sdks/rbac/README.md#createrole) - Role management
- [`rbacCreateServiceAccount`](docs/sdks/rbac/README.md#createserviceaccount) - CreateServiceAccount
- [`rbacDeleteRole`](docs/sdks/rbac/README.md#deleterole) - DeleteRole
- [`rbacDeleteServiceAccount`](docs/sdks/rbac/README.md#deleteserviceaccount) - DeleteServiceAccount
- [`rbacGenerateShareLink`](docs/sdks/rbac/README.md#generatesharelink) - GenerateShareLink
- [`rbacGetCurrentMemberRolesAndPermissions`](docs/sdks/rbac/README.md#getcurrentmemberrolesandpermissions) - Get current member roles and permissions
- [`rbacGetEmbedUserApiKey`](docs/sdks/rbac/README.md#getembeduserapikey) - GetEmbedUserApiKey
- [`rbacGetMemberRoles`](docs/sdks/rbac/README.md#getmemberroles) - GetMemberRoles
- [`rbacGetObjectAccess`](docs/sdks/rbac/README.md#getobjectaccess) - GetObjectAccess
- [`rbacGetRole`](docs/sdks/rbac/README.md#getrole) - GetRole
- [`rbacGetRolePermissions`](docs/sdks/rbac/README.md#getrolepermissions) - GetRolePermissions
- [`rbacHasObjectAccess`](docs/sdks/rbac/README.md#hasobjectaccess) - HasObjectAccess
- [`rbacListAccessRequests`](docs/sdks/rbac/README.md#listaccessrequests) - ListAccessRequests
- [`rbacListApiKeys`](docs/sdks/rbac/README.md#listapikeys) - ListApiKeys
- [`rbacListPermissions`](docs/sdks/rbac/README.md#listpermissions) - Permission management
- [`rbacListRoles`](docs/sdks/rbac/README.md#listroles) - ListRoles
- [`rbacListServiceAccounts`](docs/sdks/rbac/README.md#listserviceaccounts) - ListServiceAccounts
- [`rbacRejectAccessRequest`](docs/sdks/rbac/README.md#rejectaccessrequest) - RejectAccessRequest
- [`rbacRemovePermissionFromRole`](docs/sdks/rbac/README.md#removepermissionfromrole) - RemovePermissionFromRole
- [`rbacRemoveRoleFromMember`](docs/sdks/rbac/README.md#removerolefrommember) - RemoveRoleFromMember
- [`rbacRequestAccess`](docs/sdks/rbac/README.md#requestaccess) - RequestAccess
- [`rbacRevokeApiKey`](docs/sdks/rbac/README.md#revokeapikey) - RevokeApiKey
- [`rbacRevokeObjectAccess`](docs/sdks/rbac/README.md#revokeobjectaccess) - RevokeObjectAccess
- [`rbacRotateApiKey`](docs/sdks/rbac/README.md#rotateapikey) - Object sharing and access control
- [`rbacSetRolePermissions`](docs/sdks/rbac/README.md#setrolepermissions) - Bulk add/remove permissions on a role in one call, producing a single audit entry for the whole edit.
- [`rbacShareObject`](docs/sdks/rbac/README.md#shareobject) - Group management. Internal only.
- [`rbacShareObjectWithRole`](docs/sdks/rbac/README.md#shareobjectwithrole) - ShareObjectWithRole
- [`rbacUpdateObjectAccess`](docs/sdks/rbac/README.md#updateobjectaccess) - UpdateObjectAccess
- [`rbacUpdateObjectVisibility`](docs/sdks/rbac/README.md#updateobjectvisibility) - UpdateObjectVisibility
- [`rbacUpdateRole`](docs/sdks/rbac/README.md#updaterole) - UpdateRole
- [`rbacWhoAmI`](docs/sdks/rbac/README.md#whoami) - Describe what a key is allowed to do.
- [`sandboxAdminGetSandbox`](docs/sdks/sandboxadmin/README.md#getsandbox) - GetSandbox
- [`sandboxAdminList`](docs/sdks/sandboxadmin/README.md#list) - ListSandboxes
- [`sandboxAdminListExecutions`](docs/sdks/sandboxadmin/README.md#listexecutions) - ListSandboxExecutions
- [`sandboxAdminListSandboxEgress`](docs/sdks/sandboxadmin/README.md#listsandboxegress) - Outbound HTTP(S) calls a sandbox made (the egress ledger). Durable — reads  the recorded table, so it works for stopped sandboxes too.
- [`sandboxAdminListSandboxFiles`](docs/sdks/sandboxadmin/README.md#listsandboxfiles) - Live filesystem of a running sandbox. Both are NO-OP (read-only) and only  return data while the worker is alive; available=false otherwise.
- [`sandboxAdminListSandboxSpend`](docs/sdks/sandboxadmin/README.md#listsandboxspend) - Per-lease compute usage for a sandbox, computed from lease durations × the  compute rate. Durable (reads the lease table), so it works for stopped  sandboxes. This is usage (ACUs), not the invoiced dollar amount.
- [`sandboxAdminReadFile`](docs/sdks/sandboxadmin/README.md#readfile) - ReadSandboxFile
- [`sandboxAdminRestartSandbox`](docs/sdks/sandboxadmin/README.md#restartsandbox) - Restart a stopped/reaped sandbox by re-acquiring a worker for the same  sandbox_id, preserving the original owner. Same scoping as StopSandbox  (owner, or sandbox:write_private for org-wide).
- [`sandboxAdminStop`](docs/sdks/sandboxadmin/README.md#stop) - StopSandbox
- [`sandboxCapabilitiesExecuteWrite`](docs/sdks/sandboxcapabilities/README.md#executewrite) - ExecuteWrite
- [`sandboxCapabilitiesPollAsk`](docs/sdks/sandboxcapabilities/README.md#pollask) - PollAsk
- [`sandboxCapabilitiesPutAsset`](docs/sdks/sandboxcapabilities/README.md#putasset) - PutAsset
- [`sandboxCapabilitiesSendNotify`](docs/sdks/sandboxcapabilities/README.md#sendnotify) - SendNotify
- [`sandboxCapabilitiesStartAsk`](docs/sdks/sandboxcapabilities/README.md#startask) - StartAsk
- [`sandboxCapabilitiesStateOp`](docs/sdks/sandboxcapabilities/README.md#stateop) - StateOp
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
- [`settingsCheckMemberStatus`](docs/sdks/settings/README.md#checkmemberstatus) - CheckMemberStatus
- [`settingsDeleteMember`](docs/sdks/settings/README.md#deletemember) - DeleteOrganizationMember
- [`settingsInviteMember`](docs/sdks/settings/README.md#invitemember) - InviteOrganizationMember
- [`settingsListMembers`](docs/sdks/settings/README.md#listmembers) - ListOrganizationMembers
- [`settingsUpdate`](docs/sdks/settings/README.md#update) - UpdateOrganizationSettings
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
  serverURL: "https://app.textql.com/rpc/public",
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
