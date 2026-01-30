/**
 * Instance Pools Tools
 *
 * MCP tools for managing Databricks instance pools.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { DatabricksClient } from '../client.js';
import { formatError, formatResponse, formatSuccess } from '../utils/formatters.js';

/**
 * Register all instance pools-related tools
 */
export function registerInstancePoolsTools(server: McpServer, client: DatabricksClient): void {
  // ===========================================================================
  // List Instance Pools
  // ===========================================================================
  server.tool(
    'databricks_list_instance_pools',
    `List all instance pools.

Returns:
  List of instance pools.`,
    {},
    async () => {
      try {
        const pools = await client.listInstancePools();
        return formatResponse({ instance_pools: pools, count: pools.length });
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Get Instance Pool
  // ===========================================================================
  server.tool(
    'databricks_get_instance_pool',
    `Get details of a specific instance pool.

Args:
  - instancePoolId: Instance pool ID

Returns:
  Instance pool details.`,
    {
      instancePoolId: z.string().describe('Instance pool ID'),
    },
    async ({ instancePoolId }) => {
      try {
        const pool = await client.getInstancePool(instancePoolId);
        return formatResponse(pool);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Create Instance Pool
  // ===========================================================================
  server.tool(
    'databricks_create_instance_pool',
    `Create a new instance pool.

Args:
  - instancePoolName: Pool name
  - nodeTypeId: Node type ID
  - minIdleInstances: (Optional) Minimum idle instances
  - maxCapacity: (Optional) Maximum capacity
  - idleInstanceAutoterminationMinutes: (Optional) Auto-termination minutes

Returns:
  Created instance pool ID.`,
    {
      instancePoolName: z.string().describe('Pool name'),
      nodeTypeId: z.string().describe('Node type ID'),
      minIdleInstances: z.number().int().min(0).optional().describe('Minimum idle instances'),
      maxCapacity: z.number().int().min(1).optional().describe('Maximum capacity'),
      idleInstanceAutoterminationMinutes: z.number().int().min(0).optional().describe('Auto-termination minutes'),
    },
    async ({ instancePoolName, nodeTypeId, minIdleInstances, maxCapacity, idleInstanceAutoterminationMinutes }) => {
      try {
        const spec: Record<string, unknown> = {
          instance_pool_name: instancePoolName,
          node_type_id: nodeTypeId,
        };
        if (minIdleInstances !== undefined) spec.min_idle_instances = minIdleInstances;
        if (maxCapacity !== undefined) spec.max_capacity = maxCapacity;
        if (idleInstanceAutoterminationMinutes !== undefined) {
          spec.idle_instance_autotermination_minutes = idleInstanceAutoterminationMinutes;
        }
        const result = await client.createInstancePool(spec);
        return formatSuccess('Instance pool created', result);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Edit Instance Pool
  // ===========================================================================
  server.tool(
    'databricks_edit_instance_pool',
    `Edit an existing instance pool.

Args:
  - instancePoolId: Instance pool ID
  - instancePoolName: New pool name
  - nodeTypeId: Node type ID
  - minIdleInstances: (Optional) Minimum idle instances
  - maxCapacity: (Optional) Maximum capacity

Returns:
  Confirmation of update.`,
    {
      instancePoolId: z.string().describe('Instance pool ID'),
      instancePoolName: z.string().describe('Pool name'),
      nodeTypeId: z.string().describe('Node type ID'),
      minIdleInstances: z.number().int().min(0).optional().describe('Minimum idle instances'),
      maxCapacity: z.number().int().min(1).optional().describe('Maximum capacity'),
    },
    async ({ instancePoolId, instancePoolName, nodeTypeId, minIdleInstances, maxCapacity }) => {
      try {
        const spec: Record<string, unknown> = {
          instance_pool_name: instancePoolName,
          node_type_id: nodeTypeId,
        };
        if (minIdleInstances !== undefined) spec.min_idle_instances = minIdleInstances;
        if (maxCapacity !== undefined) spec.max_capacity = maxCapacity;
        await client.editInstancePool(instancePoolId, spec);
        return formatSuccess(`Instance pool ${instancePoolId} updated`);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Delete Instance Pool
  // ===========================================================================
  server.tool(
    'databricks_delete_instance_pool',
    `Delete an instance pool.

Args:
  - instancePoolId: Instance pool ID

Returns:
  Confirmation of deletion.`,
    {
      instancePoolId: z.string().describe('Instance pool ID'),
    },
    async ({ instancePoolId }) => {
      try {
        await client.deleteInstancePool(instancePoolId);
        return formatSuccess(`Instance pool ${instancePoolId} deleted`);
      } catch (error) {
        return formatError(error);
      }
    }
  );
}
