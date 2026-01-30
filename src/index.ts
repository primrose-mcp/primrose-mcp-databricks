/**
 * Databricks MCP Server - Main Entry Point
 *
 * This file sets up the MCP server using Cloudflare's Agents SDK.
 *
 * MULTI-TENANT ARCHITECTURE:
 * Tenant credentials (workspace URL, personal access token) are parsed from request headers,
 * allowing a single server deployment to serve multiple customers.
 *
 * Required Headers:
 * - X-Databricks-Host: Databricks workspace URL (e.g., https://adb-xxx.azuredatabricks.net)
 * - X-Databricks-Token: Personal access token
 *
 * Optional Headers:
 * - X-Databricks-Warehouse-Id: Default SQL warehouse ID for SQL operations
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { McpAgent } from 'agents/mcp';
import { createDatabricksClient } from './client.js';
import {
  registerClusterTools,
  registerDbfsTools,
  registerInstancePoolsTools,
  registerJobTools,
  registerMlflowTools,
  registerPipelinesTools,
  registerReposTools,
  registerSecretsTools,
  registerSqlTools,
  registerTokensTools,
  registerUnityCatalogTools,
  registerWorkspaceTools,
} from './tools/index.js';
import {
  type Env,
  type TenantCredentials,
  parseTenantCredentials,
  validateCredentials,
} from './types/env.js';

// =============================================================================
// MCP Server Configuration
// =============================================================================

const SERVER_NAME = 'primrose-mcp-databricks';
const SERVER_VERSION = '1.0.0';

// =============================================================================
// MCP Agent (Stateful - uses Durable Objects)
// =============================================================================

/**
 * McpAgent provides stateful MCP sessions backed by Durable Objects.
 *
 * NOTE: For multi-tenant deployments, use the stateless mode (Option 2) instead.
 */
export class DatabricksMcpAgent extends McpAgent<Env> {
  server = new McpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION,
  });

  async init() {
    throw new Error(
      'Stateful mode (McpAgent) is not supported for multi-tenant deployments. ' +
        'Use the stateless /mcp endpoint with X-Databricks-Host and X-Databricks-Token headers instead.'
    );
  }
}

// =============================================================================
// Stateless MCP Server (Recommended - no Durable Objects needed)
// =============================================================================

/**
 * Creates a stateless MCP server instance with tenant-specific credentials.
 */
function createStatelessServer(credentials: TenantCredentials): McpServer {
  const server = new McpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION,
  });

  // Create client with tenant-specific credentials
  const client = createDatabricksClient(credentials);

  // Register all tools
  registerSqlTools(server, client);
  registerJobTools(server, client);
  registerClusterTools(server, client);
  registerWorkspaceTools(server, client);
  registerDbfsTools(server, client);
  registerUnityCatalogTools(server, client);
  registerMlflowTools(server, client);
  registerSecretsTools(server, client);
  registerReposTools(server, client);
  registerPipelinesTools(server, client);
  registerInstancePoolsTools(server, client);
  registerTokensTools(server, client);

  // Test connection tool
  server.tool(
    'databricks_test_connection',
    'Test the connection to the Databricks workspace',
    {},
    async () => {
      try {
        const result = await client.testConnection();
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  return server;
}

// =============================================================================
// Worker Export
// =============================================================================

export default {
  /**
   * Main fetch handler for the Worker
   */
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Health check endpoint
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok', server: SERVER_NAME }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // ==========================================================================
    // Stateless MCP with Streamable HTTP (Recommended for multi-tenant)
    // ==========================================================================
    if (url.pathname === '/mcp' && request.method === 'POST') {
      // Parse tenant credentials from request headers
      const credentials = parseTenantCredentials(request);

      // Validate credentials are present
      try {
        validateCredentials(credentials);
      } catch (error) {
        return new Response(
          JSON.stringify({
            error: 'Unauthorized',
            message: error instanceof Error ? error.message : 'Invalid credentials',
            required_headers: {
              'X-Databricks-Host': 'Your Databricks workspace URL',
              'X-Databricks-Token': 'Your personal access token',
            },
          }),
          {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // Create server with tenant-specific credentials
      const server = createStatelessServer(credentials);

      // Import and use createMcpHandler for streamable HTTP
      const { createMcpHandler } = await import('agents/mcp');
      const handler = createMcpHandler(server);
      return handler(request, env, ctx);
    }

    // SSE endpoint for legacy clients
    if (url.pathname === '/sse') {
      return new Response('SSE endpoint requires Durable Objects. Enable in wrangler.jsonc.', {
        status: 501,
      });
    }

    // Default response
    return new Response(
      JSON.stringify({
        name: SERVER_NAME,
        version: SERVER_VERSION,
        description: 'Multi-tenant Databricks MCP Server',
        endpoints: {
          mcp: '/mcp (POST) - Streamable HTTP MCP endpoint',
          health: '/health - Health check',
        },
        authentication: {
          description: 'Pass Databricks credentials via request headers',
          required_headers: {
            'X-Databricks-Host': 'Databricks workspace URL (e.g., https://adb-xxx.azuredatabricks.net)',
            'X-Databricks-Token': 'Personal access token',
          },
          optional_headers: {
            'X-Databricks-Warehouse-Id': 'Default SQL warehouse ID for SQL operations',
          },
        },
        tools: {
          sql: [
            'databricks_execute_sql',
            'databricks_get_sql_status',
            'databricks_get_sql_result_chunk',
            'databricks_cancel_sql',
            'databricks_list_warehouses',
            'databricks_get_warehouse',
            'databricks_start_warehouse',
            'databricks_stop_warehouse',
          ],
          jobs: [
            'databricks_list_jobs',
            'databricks_get_job',
            'databricks_create_job',
            'databricks_update_job',
            'databricks_delete_job',
            'databricks_run_job',
            'databricks_list_runs',
            'databricks_get_run',
            'databricks_get_run_output',
            'databricks_cancel_run',
            'databricks_cancel_all_runs',
          ],
          clusters: [
            'databricks_list_clusters',
            'databricks_get_cluster',
            'databricks_create_cluster',
            'databricks_start_cluster',
            'databricks_restart_cluster',
            'databricks_terminate_cluster',
            'databricks_delete_cluster',
            'databricks_list_cluster_events',
            'databricks_pin_cluster',
            'databricks_unpin_cluster',
          ],
          workspace: [
            'databricks_list_workspace',
            'databricks_get_workspace_status',
            'databricks_mkdirs',
            'databricks_delete_workspace',
            'databricks_import_notebook',
            'databricks_export_notebook',
          ],
          dbfs: [
            'databricks_list_dbfs',
            'databricks_get_dbfs_status',
            'databricks_mkdirs_dbfs',
            'databricks_delete_dbfs',
            'databricks_read_dbfs',
            'databricks_put_dbfs',
            'databricks_move_dbfs',
          ],
          unity_catalog: [
            'databricks_list_catalogs',
            'databricks_get_catalog',
            'databricks_create_catalog',
            'databricks_delete_catalog',
            'databricks_list_schemas',
            'databricks_get_schema',
            'databricks_create_schema',
            'databricks_delete_schema',
            'databricks_list_tables',
            'databricks_get_table',
            'databricks_delete_table',
            'databricks_list_volumes',
            'databricks_get_volume',
            'databricks_create_volume',
            'databricks_delete_volume',
            'databricks_list_functions',
            'databricks_get_function',
          ],
          mlflow: [
            'databricks_list_experiments',
            'databricks_get_experiment',
            'databricks_get_experiment_by_name',
            'databricks_create_experiment',
            'databricks_delete_experiment',
            'databricks_restore_experiment',
            'databricks_search_runs',
            'databricks_create_run',
            'databricks_update_run',
            'databricks_delete_run',
            'databricks_log_metric',
            'databricks_log_param',
            'databricks_set_tag',
            'databricks_list_models',
            'databricks_get_model',
            'databricks_create_model',
            'databricks_delete_model',
            'databricks_list_model_versions',
            'databricks_get_model_version',
            'databricks_delete_model_version',
          ],
          secrets: [
            'databricks_list_secret_scopes',
            'databricks_create_secret_scope',
            'databricks_delete_secret_scope',
            'databricks_list_secrets',
            'databricks_put_secret',
            'databricks_delete_secret',
            'databricks_list_secret_acls',
            'databricks_get_secret_acl',
            'databricks_put_secret_acl',
            'databricks_delete_secret_acl',
          ],
          repos: [
            'databricks_list_repos',
            'databricks_get_repo',
            'databricks_create_repo',
            'databricks_update_repo',
            'databricks_delete_repo',
            'databricks_list_git_credentials',
            'databricks_create_git_credential',
            'databricks_delete_git_credential',
          ],
          pipelines: [
            'databricks_list_pipelines',
            'databricks_get_pipeline',
            'databricks_create_pipeline',
            'databricks_update_pipeline',
            'databricks_delete_pipeline',
            'databricks_start_pipeline',
            'databricks_stop_pipeline',
          ],
          instance_pools: [
            'databricks_list_instance_pools',
            'databricks_get_instance_pool',
            'databricks_create_instance_pool',
            'databricks_edit_instance_pool',
            'databricks_delete_instance_pool',
          ],
          tokens: [
            'databricks_list_tokens',
            'databricks_create_token',
            'databricks_revoke_token',
          ],
          connection: ['databricks_test_connection'],
        },
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  },
};
