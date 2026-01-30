/**
 * Environment Bindings
 *
 * Type definitions for Cloudflare Worker environment variables and bindings.
 *
 * MULTI-TENANT ARCHITECTURE:
 * This server supports multiple tenants. Tenant-specific credentials (workspace URL,
 * personal access tokens, etc.) are passed via request headers, NOT stored in wrangler
 * secrets. This allows a single server instance to serve multiple customers.
 *
 * Request Headers:
 * - X-Databricks-Host: Databricks workspace URL (e.g., https://adb-xxx.azuredatabricks.net)
 * - X-Databricks-Token: Personal access token for authentication
 * - X-Databricks-Warehouse-Id: (Optional) Default SQL warehouse ID
 */

// =============================================================================
// Tenant Credentials (parsed from request headers)
// =============================================================================

export interface TenantCredentials {
  /** Databricks workspace URL (from X-Databricks-Host header) */
  host: string;

  /** Personal access token (from X-Databricks-Token header) */
  token: string;

  /** Default SQL warehouse ID (from X-Databricks-Warehouse-Id header) */
  warehouseId?: string;
}

/**
 * Parse tenant credentials from request headers
 */
export function parseTenantCredentials(request: Request): TenantCredentials {
  const headers = request.headers;

  return {
    host: headers.get('X-Databricks-Host') || '',
    token: headers.get('X-Databricks-Token') || '',
    warehouseId: headers.get('X-Databricks-Warehouse-Id') || undefined,
  };
}

/**
 * Validate that required credentials are present
 */
export function validateCredentials(credentials: TenantCredentials): void {
  if (!credentials.host) {
    throw new Error('Missing X-Databricks-Host header. Provide your Databricks workspace URL.');
  }
  if (!credentials.token) {
    throw new Error(
      'Missing X-Databricks-Token header. Provide your Databricks personal access token.'
    );
  }
}

// =============================================================================
// Environment Configuration (from wrangler.jsonc vars and bindings)
// =============================================================================

export interface Env {
  // ===========================================================================
  // Environment Variables (from wrangler.jsonc vars)
  // ===========================================================================

  /** Maximum character limit for responses */
  CHARACTER_LIMIT: string;

  /** Default page size for list operations */
  DEFAULT_PAGE_SIZE: string;

  /** Maximum page size allowed */
  MAX_PAGE_SIZE: string;

  // ===========================================================================
  // Bindings
  // ===========================================================================

  /** KV namespace for caching */
  CACHE_KV?: KVNamespace;

  /** Durable Object namespace for MCP sessions */
  MCP_SESSIONS?: DurableObjectNamespace;

  /** Cloudflare AI binding (optional) */
  AI?: Ai;
}

// ===========================================================================
// Helper Functions
// ===========================================================================

/**
 * Get a numeric environment value with a default
 */
export function getEnvNumber(env: Env, key: keyof Env, defaultValue: number): number {
  const value = env[key];
  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? defaultValue : parsed;
  }
  return defaultValue;
}

/**
 * Get the character limit from environment
 */
export function getCharacterLimit(env: Env): number {
  return getEnvNumber(env, 'CHARACTER_LIMIT', 50000);
}

/**
 * Get the default page size from environment
 */
export function getDefaultPageSize(env: Env): number {
  return getEnvNumber(env, 'DEFAULT_PAGE_SIZE', 20);
}

/**
 * Get the maximum page size from environment
 */
export function getMaxPageSize(env: Env): number {
  return getEnvNumber(env, 'MAX_PAGE_SIZE', 100);
}
