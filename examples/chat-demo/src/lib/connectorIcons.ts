const iconModules = import.meta.glob('./assets/connectors/**/*.{svg,png}', {
	eager: true,
	query: '?url',
	import: 'default'
}) as Record<string, string>;

/** Path under `assets/connectors/` → served URL, resolved once at module load. */
const iconUrlByAsset = new Map<string, string>();
for (const [path, url] of Object.entries(iconModules)) {
	const normalized = path.replace(/\\/g, '/');
	const asset = normalized.split('/assets/connectors/')[1];
	if (asset) iconUrlByAsset.set(asset, url);
}

/** Maps API `connectorType` values to files under `$lib/assets/connectors`. */
const TYPE_TO_ASSET: Record<string, string> = {
	CONNECTOR_TYPE_UNSPECIFIED: 'api/custom.svg',
	UNKNOWN: 'api/custom.svg',
	REDSHIFT: 'redshift.svg',
	SNOWFLAKE: 'snowflake.svg',
	BIGQUERY: 'bigquery.svg',
	AZURE_SYNAPSE: 'azure.svg',
	AURORA: 'aurora.svg',
	TABLEAU: 'tableau.svg',
	DATABRICKS: 'databricks.svg',
	SUPABASE: 'supabase.svg',
	POSTGRES: 'postgres.svg',
	MOTHERDUCK: 'motherduck.svg',
	CLICKHOUSE: 'clickhouse.svg',
	MYSQL: 'mysql.png',
	ATHENA: 'athena.svg',
	GOOGLE_DRIVE: 'googledrive.svg',
	POWERBI: 'powerbi.svg',
	SQL_SERVER: 'sqlserver.svg',
	MICROSOFT_365: 'microsoft365.svg',
	SAP_HANA: 'sap.svg',
	ORACLE: 'oracle.svg',
	GMAIL: 'gmail.svg',
	ANA_INTERNAL: 'mcp.svg',
	TRINO: 'trino.svg',
	GOOGLE_CALENDAR: 'google_calendar.svg',
	GOOGLE: 'google.svg',
	DREMIO: 'dremio.svg',
	EXASOL: 'exasol.svg',
	FIREBOLT: 'firebolt.svg',
	KDB: 'kdb.svg',
	MONGODB: 'mongodb.svg',
	// Common API / SaaS types if the backend ever returns them
	SLACK: 'api/slack.svg',
	GITHUB: 'api/github.svg',
	NOTION: 'api/notion.svg',
	LINEAR: 'api/linear.svg',
	JIRA: 'api/jira.svg',
	SALESFORCE: 'api/salesforce.svg',
	HUBSPOT: 'api/hubspot.svg',
	OPENAI: 'api/openai.svg',
	ANTHROPIC: 'api/anthropic.svg',
	GEMINI: 'api/gemini.svg',
	AWS: 'api/aws.svg',
	GCP: 'api/gcp.svg',
	AZURE: 'api/azure.svg',
	CLOUDFLARE: 'api/cloudflare.svg',
	SENDGRID: 'api/sendgrid.svg',
	ATTIO: 'api/attio.svg',
	APOLLO: 'api/apollo.svg',
	MERCURY: 'api/mercury.svg',
	PYLON: 'api/pylon.svg',
	RAMP: 'api/ramp.svg',
	ELEVENLABS: 'api/elevenlabs.svg',
	GRAIN: 'api/grain.png',
	CUSTOM: 'api/custom.svg',
	CSV: 'csv.svg',
	PDF: 'pdf.svg',
	MCP: 'mcp.svg'
};

const FALLBACK = iconUrlByAsset.get('api/custom.svg') ?? '';

export function connectorIconSrc(type: string | null | undefined) {
	const key = (type ?? 'UNKNOWN').trim().toUpperCase().replace(/\s+/g, '_');
	const asset = TYPE_TO_ASSET[key] ?? 'api/custom.svg';
	return iconUrlByAsset.get(asset) ?? FALLBACK;
}
