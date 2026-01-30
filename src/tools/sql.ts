/**
 * SQL Statement Execution Tools
 *
 * MCP tools for executing SQL statements on Databricks SQL warehouses.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { DatabricksClient } from '../client.js';
import { formatError, formatResponse, formatSuccess } from '../utils/formatters.js';

/**
 * Register all SQL-related tools
 */
export function registerSqlTools(server: McpServer, client: DatabricksClient): void {
  // ===========================================================================
  // Execute SQL Statement
  // ===========================================================================
  server.tool(
    'databricks_execute_sql',
    `Execute a SQL statement on a Databricks SQL warehouse.

The statement will be executed and results returned inline if they complete within the timeout.
For long-running queries, use databricks_get_sql_status to poll for completion.

Args:
  - warehouseId: SQL warehouse ID to execute on
  - statement: SQL statement to execute
  - catalog: (Optional) Default catalog for the statement
  - schema: (Optional) Default schema for the statement
  - waitTimeout: (Optional) Time to wait for results (e.g., "50s", default: "50s")
  - format: (Optional) Result format: JSON_ARRAY, CSV, or ARROW_STREAM

Returns:
  Statement ID and status. If completed, includes result data.`,
    {
      warehouseId: z.string().describe('SQL warehouse ID'),
      statement: z.string().describe('SQL statement to execute'),
      catalog: z.string().optional().describe('Default catalog'),
      schema: z.string().optional().describe('Default schema'),
      waitTimeout: z.string().optional().describe('Wait timeout (e.g., "50s")'),
      format: z.enum(['JSON_ARRAY', 'CSV', 'ARROW_STREAM']).optional().describe('Result format'),
    },
    async ({ warehouseId, statement, catalog, schema, waitTimeout, format }) => {
      try {
        const result = await client.executeStatement(warehouseId, statement, {
          catalog,
          schema,
          waitTimeout,
          format,
        });
        return formatResponse(result);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Get SQL Statement Status
  // ===========================================================================
  server.tool(
    'databricks_get_sql_status',
    `Get the status and results of a SQL statement.

Use this to poll for completion of long-running queries or to retrieve results.

Args:
  - statementId: Statement ID from executeStatement

Returns:
  Statement status and results if available.`,
    {
      statementId: z.string().describe('Statement ID'),
    },
    async ({ statementId }) => {
      try {
        const result = await client.getStatementStatus(statementId);
        return formatResponse(result);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Get SQL Result Chunk
  // ===========================================================================
  server.tool(
    'databricks_get_sql_result_chunk',
    `Get a specific chunk of SQL statement results.

For large results that are split into multiple chunks, use this to fetch each chunk.

Args:
  - statementId: Statement ID
  - chunkIndex: Chunk index (0-based)

Returns:
  Result data for the specified chunk.`,
    {
      statementId: z.string().describe('Statement ID'),
      chunkIndex: z.number().int().min(0).describe('Chunk index (0-based)'),
    },
    async ({ statementId, chunkIndex }) => {
      try {
        const result = await client.getStatementResultChunk(statementId, chunkIndex);
        return formatResponse(result);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Cancel SQL Statement
  // ===========================================================================
  server.tool(
    'databricks_cancel_sql',
    `Cancel a running SQL statement.

Args:
  - statementId: Statement ID to cancel

Returns:
  Confirmation of cancellation.`,
    {
      statementId: z.string().describe('Statement ID to cancel'),
    },
    async ({ statementId }) => {
      try {
        await client.cancelStatement(statementId);
        return formatSuccess(`Statement ${statementId} cancelled`);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // List SQL Warehouses
  // ===========================================================================
  server.tool(
    'databricks_list_warehouses',
    `List all SQL warehouses in the workspace.

Returns:
  List of SQL warehouses with their status and configuration.`,
    {},
    async () => {
      try {
        const warehouses = await client.listWarehouses();
        return formatResponse({ warehouses, count: warehouses.length });
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Get SQL Warehouse
  // ===========================================================================
  server.tool(
    'databricks_get_warehouse',
    `Get details of a specific SQL warehouse.

Args:
  - warehouseId: SQL warehouse ID

Returns:
  Warehouse configuration and status.`,
    {
      warehouseId: z.string().describe('SQL warehouse ID'),
    },
    async ({ warehouseId }) => {
      try {
        const warehouse = await client.getWarehouse(warehouseId);
        return formatResponse(warehouse);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Start SQL Warehouse
  // ===========================================================================
  server.tool(
    'databricks_start_warehouse',
    `Start a stopped SQL warehouse.

Args:
  - warehouseId: SQL warehouse ID to start

Returns:
  Confirmation that the warehouse is starting.`,
    {
      warehouseId: z.string().describe('SQL warehouse ID'),
    },
    async ({ warehouseId }) => {
      try {
        await client.startWarehouse(warehouseId);
        return formatSuccess(`SQL warehouse ${warehouseId} is starting`);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Stop SQL Warehouse
  // ===========================================================================
  server.tool(
    'databricks_stop_warehouse',
    `Stop a running SQL warehouse.

Args:
  - warehouseId: SQL warehouse ID to stop

Returns:
  Confirmation that the warehouse is stopping.`,
    {
      warehouseId: z.string().describe('SQL warehouse ID'),
    },
    async ({ warehouseId }) => {
      try {
        await client.stopWarehouse(warehouseId);
        return formatSuccess(`SQL warehouse ${warehouseId} is stopping`);
      } catch (error) {
        return formatError(error);
      }
    }
  );
}
