/**
 * Catalog of organization-level configuration.
 *
 * Covers the columns the backend actually reads (dbOrganization,
 * compute/pkg/db/auth.go:36 — 68 of them; the physical table has a few more
 * that no read path selects) plus the settings that live outside that row.
 *
 * `settable` tracks UpdateOrganizationSettings, and `surface` tracks
 * google.api.visibility: INTERNAL fields are stripped from the generated
 * OpenAPI spec and therefore from the SDKs.
 */

export type Category =
	| 'identity' // real per-org data: names, keys, integration bindings
	| 'config' // carries a value rather than gating anything
	| 'policy' // boolean, but genuine per-org policy rather than a feature gate
	| 'feature-gate'; // pure on/off for a product capability

export type Storage =
	| 'organization'
	| 'organization.org_meta'
	| 'feature_flags'
	| 'org_default_connectors'
	| 'member_meta';

export type Surface = 'public' | 'internal' | 'not-settable';

export type Enforcement =
	| 'enforced'
	| 'ignored' // accepted by the API and then never read
	| 'deprecated'
	| 'vestigial' // superseded; the column survives but no longer decides anything
	| 'computed'; // rewritten on read, so it will not round-trip

export interface OrgField {
	key: string;
	column?: string;
	category: Category;
	storage: Storage;
	surface: Surface;
	enforcement: Enforcement;
	summary: string;
	/** Behaviour a diffing tool has to special-case. */
	gotcha?: string;
}

export const ORG_FIELDS: OrgField[] = [
	// ── identity ────────────────────────────────────────────────────────────
	{
		key: 'orgId',
		column: 'org_id',
		category: 'identity',
		storage: 'organization',
		surface: 'public',
		enforcement: 'enforced',
		summary: 'Primary key. Required on every update call.'
	},
	{
		key: 'organizationName',
		column: 'org_meta.name',
		category: 'identity',
		storage: 'organization.org_meta',
		surface: 'internal',
		enforcement: 'enforced',
		summary: 'Workspace name.',
		gotcha: 'Uniqueness-checked; a collision returns AlreadyExists rather than InvalidArgument.'
	},
	{
		key: 'brandName',
		column: 'brand_name',
		category: 'identity',
		storage: 'organization',
		surface: 'internal',
		enforcement: 'enforced',
		summary: 'White-label brand key driving names, logos and email copy.',
		gotcha: 'Empty string means NULL.'
	},
	{
		key: 'warning',
		column: 'warning',
		category: 'identity',
		storage: 'organization',
		surface: 'internal',
		enforcement: 'enforced',
		summary: 'Banner text shown to every member.',
		gotcha: 'Empty string means NULL.'
	},
	{
		key: 'billingAdminId',
		column: 'billing_admin_id',
		category: 'identity',
		storage: 'organization',
		surface: 'internal',
		enforcement: 'enforced',
		summary: 'Member who receives billing correspondence.',
		gotcha: 'Validated to be a member of the target org; empty string means NULL.'
	},
	{
		key: 'addAllowedEmailDomains',
		column: 'org_meta.email_allowed_domains',
		category: 'identity',
		storage: 'organization.org_meta',
		surface: 'internal',
		enforcement: 'enforced',
		summary: 'Domains permitted to self-serve join the org.',
		gotcha: 'Add/remove verbs, not a replace. Rejects public email domains, and cross-domain adds on some deployments.'
	},
	{
		key: 'removeAllowedEmailDomains',
		column: 'org_meta.email_allowed_domains',
		category: 'identity',
		storage: 'organization.org_meta',
		surface: 'internal',
		enforcement: 'enforced',
		summary: 'Removes entries from the allow-list.'
	},
	{
		key: 'clearLogoUrl',
		category: 'identity',
		storage: 'organization.org_meta',
		surface: 'internal',
		enforcement: 'enforced',
		summary: 'Sentinel that removes the org logo.'
	},
	{
		key: 'migrationBannerDismissed',
		column: 'org_meta.migration_banner_dismissed',
		category: 'identity',
		storage: 'organization.org_meta',
		surface: 'internal',
		enforcement: 'enforced',
		summary: 'Dismisses the legacy-context migration banner.',
		gotcha: 'One-way. Sending false is a deliberate no-op, so it can never be un-dismissed.'
	},
	{
		key: 'slackTeamId',
		column: 'slack_team_id',
		category: 'identity',
		storage: 'organization',
		surface: 'not-settable',
		enforcement: 'enforced',
		summary: 'Slack workspace binding. Written by the Slack install flow.'
	},
	{
		key: 'slackKey',
		column: 'slack_key',
		category: 'identity',
		storage: 'organization',
		surface: 'not-settable',
		enforcement: 'enforced',
		summary: 'Slack credential. Written by the Slack install flow.'
	},
	{
		key: 'discoverable',
		column: 'discoverable',
		category: 'identity',
		storage: 'organization',
		surface: 'internal',
		enforcement: 'enforced',
		summary: 'Whether the org surfaces during signup.'
	},

	// ── config values ───────────────────────────────────────────────────────
	{
		key: 'paradigmParams',
		column: 'paradigm_params',
		category: 'config',
		storage: 'organization',
		surface: 'public',
		enforcement: 'enforced',
		summary: 'JSONB. Default agent tool configuration for new chats.',
		gotcha: 'Whole-message replace with no field presence: omitted fields are written as false. Read path calls proto.Reset, so a sparse row loses its defaults.'
	},
	{
		key: 'toolRestrictions',
		column: 'tool_restrictions',
		category: 'config',
		storage: 'organization',
		surface: 'public',
		enforcement: 'enforced',
		summary: 'JSONB. Ceiling on which agent tools may be used at all.',
		gotcha: 'Whole-message replace. multiple_connector_mode is force-set true on every write, so it never round-trips as false.'
	},
	{
		key: 'defaultParadigmMode',
		column: 'default_paradigm_mode',
		category: 'config',
		storage: 'organization',
		surface: 'public',
		enforcement: 'enforced',
		summary: 'Which paradigm new chats open in.'
	},
	{
		key: 'defaultMethodology',
		column: 'default_methodology',
		category: 'config',
		storage: 'organization',
		surface: 'public',
		enforcement: 'enforced',
		summary: 'Org-wide default response methodology.'
	},
	{
		key: 'defaultLlmModel',
		column: 'default_llm_model',
		category: 'config',
		storage: 'organization',
		surface: 'internal',
		enforcement: 'enforced',
		summary: 'Model new chats start on.',
		gotcha: 'Zero means NULL, not "model 0".'
	},
	{
		key: 'preferredProvider',
		column: 'preferred_provider',
		category: 'config',
		storage: 'organization',
		surface: 'internal',
		enforcement: 'enforced',
		summary: 'Preferred inference provider.',
		gotcha: 'Empty string means NULL.'
	},
	{
		key: 'defaultConnectorIds',
		category: 'config',
		storage: 'org_default_connectors',
		surface: 'public',
		enforcement: 'computed',
		summary: 'Connectors auto-attached to new chats.',
		gotcha: 'Join table, delete-then-insert on every write. Derived on read, so it produces phantom drift in a naive diff.'
	},
	{
		key: 'clearDefaultConnectorIds',
		category: 'config',
		storage: 'org_default_connectors',
		surface: 'public',
		enforcement: 'enforced',
		summary: 'Sentinel that empties the default connector list.',
		gotcha: 'Needed because a repeated proto3 field cannot distinguish empty from absent. If sent alongside a non-empty list, the list wins — the opposite of the model-id clear flags.'
	},
	{
		key: 'defaultConnectorId',
		column: 'default_connector_id',
		category: 'config',
		storage: 'organization',
		surface: 'not-settable',
		enforcement: 'vestigial',
		summary: 'Legacy single default connector, superseded by org_default_connectors.'
	},
	{
		key: 'enabledModelIds',
		column: 'enabled_model_ids',
		category: 'config',
		storage: 'organization',
		surface: 'internal',
		enforcement: 'enforced',
		summary: 'Model allow-list.',
		gotcha: 'Only applied when non-empty; use clearEnabledModelIds to empty it. Clear wins over the list here.'
	},
	{
		key: 'restrictedModelIds',
		column: 'restricted_model_ids',
		category: 'config',
		storage: 'organization',
		surface: 'internal',
		enforcement: 'computed',
		summary: 'Model deny-list.',
		gotcha: 'Rewritten on read by restrictedModelIdsWithZDR, so it never round-trips.'
	},
	{
		key: 'restrictedFamilies',
		column: 'restricted_families',
		category: 'config',
		storage: 'organization',
		surface: 'internal',
		enforcement: 'enforced',
		summary: 'Family-level model deny-list.'
	},
	{
		key: 'maxLoopCount',
		column: 'max_loop_count',
		category: 'config',
		storage: 'organization',
		surface: 'not-settable',
		enforcement: 'enforced',
		summary: 'Agent loop ceiling.'
	},
	{
		key: 'sandboxStateRetentionDays',
		column: 'sandbox_state_retention_days',
		category: 'config',
		storage: 'organization',
		surface: 'internal',
		enforcement: 'enforced',
		summary: 'How long sandbox state is kept.',
		gotcha: 'Must be exactly 30, 90, 180 or 365, and cannot exceed thread_retention_days while thread deletion is on.'
	},
	{
		key: 'threadRetentionDays',
		column: 'thread_retention_days',
		category: 'config',
		storage: 'organization',
		surface: 'internal',
		enforcement: 'enforced',
		summary: 'How long inactive threads are kept.',
		gotcha: '1-365, and must be >= the effective sandbox retention. Cross-validated in both directions, so send the retention fields in one request.'
	},
	{
		key: 'threadHardDeleteGraceDays',
		column: 'thread_hard_delete_grace_days',
		category: 'config',
		storage: 'organization',
		surface: 'internal',
		enforcement: 'enforced',
		summary: 'Grace period between soft and hard thread deletion.',
		gotcha: 'Must be 1-90.'
	},
	{
		key: 'assetUrlExpiry',
		column: 'asset_url_expiry',
		category: 'config',
		storage: 'organization',
		surface: 'internal',
		enforcement: 'enforced',
		summary: 'Signed asset URL lifetime.',
		gotcha: 'Validated against the AssetUrlExpiry enum.'
	},
	{
		key: 'scimNewGroupDefaultRoleType',
		column: 'scim_new_group_default_role_type',
		category: 'config',
		storage: 'organization',
		surface: 'internal',
		enforcement: 'enforced',
		summary: 'What a SCIM-provisioned group becomes.',
		gotcha: 'Must be exactly "role" or "group".'
	},

	// ── policy ──────────────────────────────────────────────────────────────
	{
		key: 'trainingMode',
		column: 'training_mode',
		category: 'policy',
		storage: 'organization',
		surface: 'public',
		enforcement: 'enforced',
		summary: 'Training mode for the org.'
	},
	{
		key: 'sharingDisabled',
		column: 'sharing_disabled',
		category: 'policy',
		storage: 'organization',
		surface: 'public',
		enforcement: 'enforced',
		summary: 'Blocks sharing org-wide.'
	},
	{
		key: 'hideExampleConnectors',
		column: 'hide_example_connectors',
		category: 'policy',
		storage: 'organization',
		surface: 'public',
		enforcement: 'enforced',
		summary: 'Hides sample connectors from the picker.'
	},
	{
		key: 'hideApiConnectors',
		column: 'hide_api_connectors',
		category: 'policy',
		storage: 'organization',
		surface: 'public',
		enforcement: 'enforced',
		summary: 'Hides the API connectors section.'
	},
	{
		key: 'defaultDashboardOutput',
		column: 'default_dashboard_output',
		category: 'policy',
		storage: 'organization',
		surface: 'public',
		enforcement: 'enforced',
		summary: 'Agent defaults to producing a dashboard.',
		gotcha: 'Rejected with InvalidArgument if enabled while dashboards are off, and force-cleared when dashboards_enabled goes false.'
	},
	{
		key: 'defaultPlaybookPrivate',
		column: 'default_playbook_private',
		category: 'policy',
		storage: 'organization',
		surface: 'internal',
		enforcement: 'enforced',
		summary: 'New playbooks start private.'
	},
	{
		key: 'defaultRoutingEnabled',
		column: 'default_routing_enabled',
		category: 'policy',
		storage: 'organization',
		surface: 'internal',
		enforcement: 'enforced',
		summary: 'Automatic model routing.'
	},
	{
		key: 'deleteInactiveThreadsEnabled',
		column: 'delete_inactive_threads_enabled',
		category: 'policy',
		storage: 'organization',
		surface: 'internal',
		enforcement: 'enforced',
		summary: 'Turns on the daily inactive-thread deletion job.',
		gotcha: 'Requires thread_retention_days to already be set, or to be set in the same request.'
	},
	{
		key: 'allowLlmDataRetention',
		column: 'allow_llm_data_retention',
		category: 'policy',
		storage: 'organization',
		surface: 'internal',
		enforcement: 'enforced',
		summary: 'Permits provider-side retention of prompts.',
		gotcha: 'Emits its own dedicated audit entry on top of the generic settings one.'
	},
	{
		key: 'contextReviewRequired',
		column: 'context_review_required',
		category: 'policy',
		storage: 'organization',
		surface: 'internal',
		enforcement: 'enforced',
		summary: 'Context changes require review before landing.'
	},
	{
		key: 'allowAllApiAccess',
		column: 'allow_all_api_access',
		category: 'policy',
		storage: 'organization',
		surface: 'internal',
		enforcement: 'enforced',
		summary: 'Org-wide API access.',
		gotcha: 'Also written implicitly whenever secretsEnabled is set — the two move together whether you want that or not.'
	},
	{
		key: 'clientDbOverrideEnabled',
		column: 'client_db_override_enabled',
		category: 'policy',
		storage: 'organization',
		surface: 'internal',
		enforcement: 'enforced',
		summary: 'Allows client-side database overrides.'
	},
	{
		key: 'showTextqlUsage',
		column: 'show_textql_usage',
		category: 'policy',
		storage: 'organization',
		surface: 'internal',
		enforcement: 'enforced',
		summary: 'Includes staff activity in the internal usage connector rather than filtering it out.'
	},
	{
		key: 'scimAssignDefaultRole',
		column: 'scim_assign_default_role',
		category: 'policy',
		storage: 'organization',
		surface: 'internal',
		enforcement: 'enforced',
		summary: 'Assigns a default role on SCIM provision.'
	},
	{
		key: 'disableEmojis',
		column: 'disable_emojis',
		category: 'policy',
		storage: 'organization',
		surface: 'internal',
		enforcement: 'enforced',
		summary: 'Suppresses emoji in agent output.'
	},
	{
		key: 'requireAttached',
		column: 'require_attached',
		category: 'policy',
		storage: 'organization',
		surface: 'internal',
		enforcement: 'enforced',
		summary: 'Requires a connector to be attached before chatting.'
	},
	{
		key: 'injectWholeOntologyDisableSearch',
		column: 'inject_whole_ontology_disable_search',
		category: 'policy',
		storage: 'organization',
		surface: 'internal',
		enforcement: 'enforced',
		summary: 'Injects the full ontology instead of searching it.'
	},
	{
		key: 'limitDataVisibility',
		column: 'limit_data_visibility',
		category: 'policy',
		storage: 'organization',
		surface: 'not-settable',
		enforcement: 'enforced',
		summary: 'Restricts row-level data visibility.'
	},
	{
		key: 'emailReportsLinkOnly',
		column: 'email_reports_link_only',
		category: 'policy',
		storage: 'organization',
		surface: 'not-settable',
		enforcement: 'enforced',
		summary: 'Emailed reports carry a link instead of inline content.'
	},

	// ── feature gates ───────────────────────────────────────────────────────
	{
		key: 'dashboardsEnabled',
		column: 'dashboards_enabled',
		category: 'feature-gate',
		storage: 'organization',
		surface: 'public',
		enforcement: 'enforced',
		summary: 'Dashboards feature.',
		gotcha: 'Setting false also force-clears default_dashboard_output.'
	},
	{
		key: 'feedEnabled',
		column: 'feed_enabled',
		category: 'feature-gate',
		storage: 'organization',
		surface: 'public',
		enforcement: 'enforced',
		summary: 'Feed feature.',
		gotcha: 'A false-to-true transition enqueues a one-time org seeding job when the org has fewer than five posts.'
	},
	{
		key: 'tracesEnabled',
		column: 'traces_enabled',
		category: 'feature-gate',
		storage: 'organization',
		surface: 'public',
		enforcement: 'enforced',
		summary: 'Traces and citations.'
	},
	{
		key: 'observabilityEnabled',
		column: 'observability_enabled',
		category: 'feature-gate',
		storage: 'organization',
		surface: 'public',
		enforcement: 'enforced',
		summary: 'Observability surface.'
	},
	{
		key: 'sandboxObservabilityEnabled',
		column: 'sandbox_observability_enabled',
		category: 'feature-gate',
		storage: 'organization',
		surface: 'public',
		enforcement: 'enforced',
		summary: 'Top-level Sandboxes page.'
	},
	{
		key: 'notificationsEnabled',
		column: 'notifications_enabled',
		category: 'feature-gate',
		storage: 'organization',
		surface: 'public',
		enforcement: 'enforced',
		summary: 'Notifications.'
	},
	{
		key: 'dataAppsEnabled',
		column: 'data_apps_enabled',
		category: 'feature-gate',
		storage: 'organization',
		surface: 'public',
		enforcement: 'enforced',
		summary: 'Data apps: the apps resource and HTML generative dashboards.'
	},
	{
		key: 'issuesEnabled',
		column: 'issues_enabled',
		category: 'feature-gate',
		storage: 'organization',
		surface: 'public',
		enforcement: 'enforced',
		summary: 'Issues feature.'
	},
	{
		key: 'methodologyEnabled',
		column: 'methodology_enabled',
		category: 'feature-gate',
		storage: 'organization',
		surface: 'public',
		enforcement: 'enforced',
		summary: 'Response methodology feature.'
	},
	{
		key: 'contextV3Enabled',
		column: 'context_v3_enabled',
		category: 'feature-gate',
		storage: 'organization',
		surface: 'public',
		enforcement: 'enforced',
		summary: 'Context v3.'
	},
	{
		key: 'secretsEnabled',
		column: 'secrets_enabled',
		category: 'feature-gate',
		storage: 'organization',
		surface: 'public',
		enforcement: 'enforced',
		summary: 'Org secrets store.',
		gotcha: 'Silently writes allow_all_api_access to the same value.'
	},
	{
		key: 'fastModeEnabled',
		column: 'fast_mode_enabled',
		category: 'feature-gate',
		storage: 'organization',
		surface: 'public',
		enforcement: 'enforced',
		summary: 'Fast mode.'
	},
	{
		key: 'maxThinkingEnabled',
		column: 'max_thinking_enabled',
		category: 'feature-gate',
		storage: 'organization',
		surface: 'public',
		enforcement: 'enforced',
		summary: 'Max thinking.'
	},
	{
		key: 'spendTransparencyEnabled',
		column: 'spend_transparency_enabled',
		category: 'feature-gate',
		storage: 'organization',
		surface: 'public',
		enforcement: 'enforced',
		summary: 'Surfaces spend data to members.'
	},
	{
		key: 'subagentsEnabled',
		column: 'subagents_enabled',
		category: 'feature-gate',
		storage: 'organization',
		surface: 'internal',
		enforcement: 'enforced',
		summary: 'Subagent spawning.',
		gotcha: 'Was public until Aug 2026. SDK checkouts generated before then still expose it.'
	},
	{
		key: 'malloyEnabled',
		column: 'malloy_enabled',
		category: 'feature-gate',
		storage: 'organization',
		surface: 'internal',
		enforcement: 'enforced',
		summary: 'Research flag for Malloy ontology support.'
	},
	{
		key: 'groupsFeatureEnabled',
		column: 'groups_feature_enabled',
		category: 'feature-gate',
		storage: 'organization',
		surface: 'internal',
		enforcement: 'enforced',
		summary: 'Groups feature.'
	},
	{
		key: 'googleConnectorEnabled',
		column: 'google_connector_enabled',
		category: 'feature-gate',
		storage: 'organization',
		surface: 'internal',
		enforcement: 'enforced',
		summary: 'Google connector.'
	},
	{
		key: 'smsEnabled',
		column: 'sms_enabled',
		category: 'feature-gate',
		storage: 'organization',
		surface: 'internal',
		enforcement: 'enforced',
		summary: 'SMS delivery.'
	},
	{
		key: 'emailPollingEnabled',
		column: 'email_polling_enabled',
		category: 'feature-gate',
		storage: 'organization',
		surface: 'internal',
		enforcement: 'enforced',
		summary: 'Inbound email polling.'
	},
	{
		key: 'consoleAccess',
		column: 'console_access',
		category: 'feature-gate',
		storage: 'organization',
		surface: 'internal',
		enforcement: 'enforced',
		summary: 'Console access for the org.'
	},
	{
		key: 'publicPreview',
		column: 'public_preview',
		category: 'feature-gate',
		storage: 'organization',
		surface: 'internal',
		enforcement: 'enforced',
		summary: 'Public preview mode.'
	},
	{
		key: 'chatV5Cutover',
		column: 'chat_v5_cutover',
		category: 'feature-gate',
		storage: 'organization',
		surface: 'internal',
		enforcement: 'enforced',
		summary: 'Chat v5 cutover.'
	},
	{
		key: 'bashEnabled',
		column: 'bash_enabled',
		category: 'feature-gate',
		storage: 'organization',
		surface: 'internal',
		enforcement: 'ignored',
		summary: 'Org-level bash column.',
		gotcha: 'Written, read and serialized onto the proto, but no gate consumes it. Bash is actually controlled by paradigm_params and tool_restrictions — three sources of truth, one decorative.'
	},

	// ── feature_flags table ─────────────────────────────────────────────────
	{
		key: 'configObjectsEnabled',
		category: 'feature-gate',
		storage: 'feature_flags',
		surface: 'internal',
		enforcement: 'enforced',
		summary: 'Umbrella switch for all config-managed-object behaviour.',
		gotcha: 'No row defaults to OFF, unlike its sub-toggles.'
	},
	{
		key: 'configObjectsPlaybooksEnabled',
		category: 'feature-gate',
		storage: 'feature_flags',
		surface: 'internal',
		enforcement: 'enforced',
		summary: 'Per-type sub-toggle for playbooks-as-files.',
		gotcha: 'No row means ENABLED. Absence is not off.'
	},
	{
		key: 'configObjectsDashboardsEnabled',
		category: 'feature-gate',
		storage: 'feature_flags',
		surface: 'internal',
		enforcement: 'enforced',
		summary: 'Per-type sub-toggle for dashboards-as-files.',
		gotcha: 'No row means ENABLED.'
	},
	{
		key: 'appWritebackAutoApproveEnabled',
		category: 'feature-gate',
		storage: 'feature_flags',
		surface: 'internal',
		enforcement: 'enforced',
		summary: 'Auto-merges Data App editor writeback config patches.'
	},
	{
		key: 'soxDbSessionMetadataEnabled',
		column: 'sox_db_session_metadata_enabled',
		category: 'feature-gate',
		storage: 'feature_flags',
		surface: 'internal',
		enforcement: 'enforced',
		summary: 'Attaches SOX session metadata to database connections.',
		gotcha: 'Migrated out of the org row. The sox_db_session_metadata_enabled and _rollout_pct columns still exist and are still scanned, but the flag row is what decides.'
	},
	// ── accepted and discarded ──────────────────────────────────────────────
	{
		key: 'emailOutputEnabled',
		category: 'feature-gate',
		storage: 'organization',
		surface: 'internal',
		enforcement: 'ignored',
		summary: 'Formerly gated the EmailCell tool.',
		gotcha: 'The handler has zero references to it. The feature is always on and any value sent is silently dropped; the proto field is slated for removal.'
	},
	{
		key: 'configMigrationsEnabled',
		category: 'feature-gate',
		storage: 'feature_flags',
		surface: 'internal',
		enforcement: 'deprecated',
		summary: 'Predecessor of configObjectsEnabled.',
		gotcha: 'No longer read.'
	},
	{
		key: 'configAutofixEnabled',
		category: 'feature-gate',
		storage: 'feature_flags',
		surface: 'internal',
		enforcement: 'deprecated',
		summary: 'Formerly a per-org opt-in for the autofix sweep.',
		gotcha: 'Ignored entirely. The sweep now runs for every org with the config-object surface on.'
	}
];

export const MEMBER_FIELDS = [
	{
		key: 'paradigmParams',
		column: 'member_meta.paradigm_params',
		summary: 'Per-member default tool configuration.',
		gotcha: 'Replaces the org default wholesale when non-null — not a field merge. Written with no clamp against tool_restrictions, so it can hold values the org forbids.'
	},
	{
		key: 'selectedConnectorId',
		column: 'member_meta.selected_connector_id',
		summary: 'Personal default connector.'
	},
	{
		key: 'defaultMethodology',
		column: 'member_meta.default_methodology',
		summary: 'Personal default methodology.'
	},
	{
		key: 'defaultLlmModel',
		column: 'member_meta.default_llm_model',
		summary: 'Personal default model.'
	},
	{
		key: 'defaultFastMode',
		column: 'member_meta.default_fast_mode',
		summary: 'Personal fast-mode preference.'
	},
	{ key: 'themeMode', column: 'member_meta.theme_mode', summary: 'Light / dark / system.' },
	{ key: 'steering', column: 'member_meta.steering', summary: 'Steering preference.' },
	{
		key: 'shareAppBuilderChat',
		column: 'member_meta.share_app_builder_chat',
		summary: 'Shares app-builder chats with the org.'
	}
];

export const CATEGORY_LABELS: Record<Category, string> = {
	identity: 'Identity & integration',
	config: 'Configuration values',
	policy: 'Policy defaults',
	'feature-gate': 'Feature gates'
};

export const CATEGORY_BLURBS: Record<Category, string> = {
	identity: 'Real per-org data — names, keys, integration bindings. Nothing flag-shaped.',
	config: 'Carries a value rather than gating anything. Enums, counts, JSONB blobs, id lists.',
	policy:
		'Boolean, but genuine per-org policy rather than a feature gate. These configure how the product behaves, not whether a capability exists.',
	'feature-gate':
		'Pure on/off for a product capability. Functionally identical to a feature_flags row — most of these are hand-rolled flags that predate the flag table.'
};

export const ENFORCEMENT_LABELS: Record<Enforcement, string> = {
	enforced: 'Enforced',
	ignored: 'Ignored',
	deprecated: 'Deprecated',
	vestigial: 'Vestigial',
	computed: 'Computed on read'
};
