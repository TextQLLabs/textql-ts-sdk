/**
 * The icon each capability is drawn with in the product, so a row here reads as
 * the same thing a customer sees in Settings.
 *
 * Keys and glyphs are a transcription of TOOL_COPY in
 * fe/src/routes/(main)/settings/tools/toolCopy.ts — the single source of truth
 * shared by the Capabilities page and the Personal tab. The full ToolKey union
 * is kept, not just the subset FEATURE_GROUPS renders, so this stays a
 * line-by-line diff against that file. Most glyphs are @iconify-json/mdi; the
 * handful that are TextQL-drawn live in ./icons and are copied verbatim.
 */
import type { Component } from 'svelte';

import WebIcon from '~icons/mdi/web';
import SwapHorizontalIcon from '~icons/mdi/swap-horizontal';
import DatabaseIcon from '~icons/mdi/database';
import OntologyIcon from '$lib/icons/FOntologyIcon.svelte';
import VectorPolylineEditIcon from '~icons/mdi/vector-polyline-edit';
import AutoModeIcon from '~icons/mdi/auto-mode';
import AutoFixIcon from '~icons/mdi/auto-fix';
import TextBoxOutlineIcon from '$lib/icons/FContextLibraryIcon.svelte';
import EmailOutlineIcon from '~icons/mdi/email-outline';
import ViewDashboardOutlineIcon from '$lib/icons/FDashboardsIcon.svelte';
import FAppsIcon from '$lib/icons/FAppsIcon.svelte';
import LanguageJavascriptIcon from '~icons/mdi/language-javascript';
import ChartBarIcon from '~icons/mdi/chart-bar';
import ChartAreasplineIcon from '~icons/mdi/chart-areaspline';
import MessageCogOutlineIcon from '~icons/mdi/message-cog-outline';
import FileUploadOutlineIcon from '~icons/mdi/file-upload-outline';
import HistoryIcon from '~icons/mdi/history';
import KeyVariantIcon from '~icons/mdi/key-variant';
import ShareVariantOutlineIcon from '~icons/mdi/share-variant-outline';
import BrainIcon from '~icons/mdi/brain';
import CloudOutlineIcon from '~icons/mdi/cloud-outline';
import GoogleDriveIcon from '~icons/mdi/google-drive';
import FFeedIcon from '$lib/icons/FFeedIcon.svelte';
import SitemapOutlineIcon from '~icons/mdi/sitemap-outline';
import BellOutlineIcon from '~icons/mdi/bell-outline';
import SchoolOutlineIcon from '~icons/mdi/school-outline';
import EmoticonOutlineIcon from '~icons/mdi/emoticon-outline';
import FlaskOutlineIcon from '$lib/icons/FObservabilityIcon.svelte';
import SandcastleIcon from '$lib/icons/SandcastleIcon.svelte';
import TimerOutlineIcon from '~icons/mdi/timer-outline';
import CurrencyUsdIcon from '~icons/mdi/currency-usd';
import LightningBoltIcon from '~icons/mdi/lightning-bolt';
import ArrowSplitVerticalIcon from '~icons/mdi/arrow-split-vertical';
import ConsoleIcon from '~icons/mdi/console';
import FormIcon from '~icons/mdi/file-document-edit-outline';
import CommentQuestionOutlineIcon from '~icons/mdi/comment-question-outline';
import NotebookOutlineIcon from '$lib/icons/FPlaybooksIcon.svelte';
import FileReplaceOutlineIcon from '~icons/mdi/file-replace-outline';
import GoogleIcon from '~icons/mdi/google';
import SmartphoneIcon from '~icons/lucide/smartphone';
import FormatQuoteCloseIcon from '~icons/mdi/format-quote-close';
import AlertCircleOutlineIcon from '~icons/mdi/alert-circle-outline';
import ToggleSwitchOutlineIcon from '~icons/mdi/toggle-switch-outline';

export type ToolKey =
	| 'webSearch'
	| 'sql'
	| 'ontology'
	| 'ontology3'
	| 'tqlQuery'
	| 'ontologyEditing'
	| 'autoApprove'
	| 'context'
	| 'email'
	| 'dashboards'
	| 'defaultDashboardOutput'
	| 'dataApps'
	| 'javascript'
	| 'powerbi'
	| 'tableau'
	| 'methodology'
	| 'fileUpload'
	| 'threadHistory'
	| 'secrets'
	| 'sharing'
	| 'modelSwitching'
	| 'observability'
	| 'traces'
	| 'issues'
	| 'sandboxes'
	| 'sandboxLease'
	| 'spendTransparency'
	| 'apiConnectors'
	| 'googleDrive'
	| 'feed'
	| 'subagents'
	| 'notifications'
	| 'trainingMode'
	| 'emojis'
	| 'exampleConnectors'
	| 'fastMode'
	| 'maxThinking'
	| 'parallelTools'
	| 'bash'
	| 'forms'
	| 'questions'
	| 'playbookTools'
	| 'injectFullOntology'
	| 'googleConnector'
	| 'sms';

type ToolIcon = Component<{ class?: string }>;

export const TOOL_ICONS: Record<ToolKey, ToolIcon> = {
	webSearch: WebIcon,
	sql: DatabaseIcon,
	ontology: OntologyIcon,
	ontology3: AutoFixIcon,
	tqlQuery: OntologyIcon,
	ontologyEditing: VectorPolylineEditIcon,
	autoApprove: AutoModeIcon,
	context: TextBoxOutlineIcon,
	email: EmailOutlineIcon,
	dashboards: ViewDashboardOutlineIcon,
	defaultDashboardOutput: ViewDashboardOutlineIcon,
	dataApps: FAppsIcon,
	javascript: LanguageJavascriptIcon,
	powerbi: ChartBarIcon,
	tableau: ChartAreasplineIcon,
	methodology: MessageCogOutlineIcon,
	fileUpload: FileUploadOutlineIcon,
	threadHistory: HistoryIcon,
	secrets: KeyVariantIcon,
	sharing: ShareVariantOutlineIcon,
	modelSwitching: SwapHorizontalIcon,
	sandboxes: SandcastleIcon,
	observability: FlaskOutlineIcon,
	traces: FormatQuoteCloseIcon,
	issues: AlertCircleOutlineIcon,
	apiConnectors: CloudOutlineIcon,
	googleDrive: GoogleDriveIcon,
	feed: FFeedIcon,
	subagents: SitemapOutlineIcon,
	notifications: BellOutlineIcon,
	trainingMode: SchoolOutlineIcon,
	emojis: EmoticonOutlineIcon,
	exampleConnectors: FlaskOutlineIcon,
	fastMode: LightningBoltIcon,
	spendTransparency: CurrencyUsdIcon,
	sandboxLease: TimerOutlineIcon,
	maxThinking: BrainIcon,
	parallelTools: ArrowSplitVerticalIcon,
	bash: ConsoleIcon,
	forms: FormIcon,
	questions: CommentQuestionOutlineIcon,
	playbookTools: NotebookOutlineIcon,
	injectFullOntology: FileReplaceOutlineIcon,
	googleConnector: GoogleIcon,
	sms: SmartphoneIcon
};

/**
 * FeatureRow.key is a plain string, so a row added here before its copy exists
 * upstream falls back to a generic switch rather than rendering nothing.
 */
export function toolIcon(key: string): ToolIcon {
	return TOOL_ICONS[key as ToolKey] ?? ToggleSwitchOutlineIcon;
}
