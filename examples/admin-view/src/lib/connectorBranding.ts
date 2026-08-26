/**
 * Connector type -> name + logo, so a connector renders with its real brand
 * mark instead of a generic database glyph.
 *
 * Transcribed from fe/src/lib/shared/Connector/branding.ts. One deliberate
 * change: the app keys this on the numeric ConnectorType enum, while
 * `connectors.getConnectors` returns the enum's *name*
 * ("SNOWFLAKE", "ANA_INTERNAL"), so the table is keyed by string here and no
 * enum import is needed.
 *
 * Logos live in static/connectors/assets, copied from the app's static root.
 */

/** Enum member names of textql.rpc.public.connector.ConnectorType. */
export type ConnectorTypeName = (typeof CONNECTOR_BRANDING)[number]['type'] | 'ANA_INTERNAL' | 'ANA_BILLING';

export interface ConnectorBranding {
	type: string;
	name: string;
	logo: string;
	description: string;
}

export const CONNECTOR_BRANDING = [
	{ type: 'SNOWFLAKE', name: 'Snowflake', logo: '/connectors/assets/snowflake.svg', description: 'Connect to Snowflake' },
	{ type: 'DATABRICKS', name: 'Databricks', logo: '/connectors/assets/databricks.svg', description: 'Connect to Databricks' },
	{ type: 'REDSHIFT', name: 'Redshift', logo: '/connectors/assets/redshift.svg', description: 'Connect to Redshift' },
	{ type: 'BIGQUERY', name: 'BigQuery', logo: '/connectors/assets/bigquery.svg', description: 'Connect to BigQuery' },
	{ type: 'TABLEAU', name: 'Tableau', logo: '/connectors/assets/tableau.svg', description: 'Connect to Tableau' },
	{ type: 'POWERBI', name: 'PowerBI', logo: '/connectors/assets/powerbi.svg', description: 'Connect to PowerBI' },
	{ type: 'POSTGRES', name: 'Postgres', logo: '/connectors/assets/postgres.svg', description: 'Connect to Postgres' },
	{ type: 'SUPABASE', name: 'Supabase', logo: '/connectors/assets/supabase.svg', description: 'Connect to Supabase' },
	{ type: 'CLICKHOUSE', name: 'Clickhouse', logo: '/connectors/assets/clickhouse.svg', description: 'Connect to Clickhouse' },
	{ type: 'AZURE_SYNAPSE', name: 'Azure', logo: '/connectors/assets/azure.svg', description: 'Connect to Azure' },
	{ type: 'AURORA', name: 'Aurora', logo: '/connectors/assets/aurora.svg', description: 'Connect to Aurora' },
	{ type: 'MOTHERDUCK', name: 'Motherduck', logo: '/connectors/assets/motherduck.svg', description: 'Connect to Motherduck' },
	{ type: 'MYSQL', name: 'MySQL', logo: '/connectors/assets/mysql.png', description: 'Connect to MySQL' },
	{ type: 'SQL_SERVER', name: 'SQL Server', logo: '/connectors/assets/sqlserver.svg', description: 'Connect to SQL Server' },
	{ type: 'ORACLE', name: 'Oracle', logo: '/connectors/assets/oracle.svg', description: 'Connect to Oracle' },
	{ type: 'ATHENA', name: 'Athena', logo: '/connectors/assets/athena.svg', description: 'Connect to Athena' },
	{ type: 'SAP_HANA', name: 'SAP HANA', logo: '/connectors/assets/sap.svg', description: 'Connect to SAP HANA' },
	{ type: 'MICROSOFT_365', name: 'Microsoft 365', logo: '/connectors/assets/microsoft365.svg', description: 'Connect to Outlook Emails and Calendar' },
	{ type: 'TRINO', name: 'Trino', logo: '/connectors/assets/trino.svg', description: 'Connect to Trino' },
	{ type: 'DREMIO', name: 'Dremio', logo: '/connectors/assets/dremio.svg', description: 'Connect to Dremio' },
	{ type: 'EXASOL', name: 'Exasol', logo: '/connectors/assets/exasol.svg', description: 'Connect to EXASOL' },
	{ type: 'FIREBOLT', name: 'Firebolt', logo: '/connectors/assets/firebolt.svg', description: 'Connect to Firebolt' },
	{ type: 'KDB', name: 'kdb+', logo: '/connectors/assets/kdb.svg', description: 'Connect to kdb+' },
	{ type: 'MONGODB', name: 'MongoDB', logo: '/connectors/assets/mongodb.svg', description: 'Connect to MongoDB' },
	{ type: 'PROMETHEUS', name: 'Prometheus', logo: '/connectors/assets/prometheus.svg', description: 'Connect to Prometheus, Thanos, Mimir, or Grafana Cloud' },
] as const satisfies readonly ConnectorBranding[];

// The app omits these from the table on purpose — several consumers iterate it
// to build database-only pickers and would leak the API/internal types in. They
// still need a logo when one is rendered by type, so they live in the lookup only.
const EXTRA_LOGOS: Record<string, string> = {
	ANA_INTERNAL: '/logo.svg',
	ANA_BILLING: '/logo.svg'
};

const byType = new Map<string, ConnectorBranding>(
	CONNECTOR_BRANDING.map((entry) => [entry.type, entry])
);

/** Logo URL for a connector type, or "" when none is registered. */
export function connectorLogoForType(type: string | undefined): string {
	if (!type) return '';
	return byType.get(type)?.logo ?? EXTRA_LOGOS[type] ?? '';
}

/** Display name for a connector type, falling back to the raw enum name. */
export function connectorNameForType(type: string | undefined): string {
	if (!type) return '';
	return byType.get(type)?.name ?? type;
}
