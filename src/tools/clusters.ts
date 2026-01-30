/**
 * Clusters Tools
 *
 * MCP tools for managing Databricks clusters.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { DatabricksClient } from '../client.js';
import { formatError, formatResponse, formatSuccess } from '../utils/formatters.js';

/**
 * Register all cluster-related tools
 */
export function registerClusterTools(server: McpServer, client: DatabricksClient): void {
  // ===========================================================================
  // List Clusters
  // ===========================================================================
  server.tool(
    'databricks_list_clusters',
    `List all clusters in the workspace.

Returns:
  List of clusters with their configuration and status.`,
    {},
    async () => {
      try {
        const clusters = await client.listClusters();
        return formatResponse({ clusters, count: clusters.length });
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Get Cluster
  // ===========================================================================
  server.tool(
    'databricks_get_cluster',
    `Get details of a specific cluster.

Args:
  - clusterId: Cluster ID

Returns:
  Cluster configuration and status.`,
    {
      clusterId: z.string().describe('Cluster ID'),
    },
    async ({ clusterId }) => {
      try {
        const cluster = await client.getCluster(clusterId);
        return formatResponse(cluster);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Create Cluster
  // ===========================================================================
  server.tool(
    'databricks_create_cluster',
    `Create a new cluster.

Args:
  - clusterName: Name for the cluster
  - sparkVersion: Spark version (e.g., "13.3.x-scala2.12")
  - nodeTypeId: Node type ID (e.g., "i3.xlarge")
  - numWorkers: Number of worker nodes (for fixed-size clusters)
  - minWorkers: (Optional) Minimum workers for autoscaling
  - maxWorkers: (Optional) Maximum workers for autoscaling
  - autoterminationMinutes: (Optional) Auto-terminate after idle minutes

Returns:
  Created cluster ID.`,
    {
      clusterName: z.string().describe('Cluster name'),
      sparkVersion: z.string().describe('Spark version'),
      nodeTypeId: z.string().describe('Node type ID'),
      numWorkers: z.number().int().min(0).optional().describe('Number of workers'),
      minWorkers: z.number().int().min(0).optional().describe('Min workers for autoscale'),
      maxWorkers: z.number().int().min(1).optional().describe('Max workers for autoscale'),
      autoterminationMinutes: z.number().int().min(0).optional().describe('Auto-termination minutes'),
    },
    async ({ clusterName, sparkVersion, nodeTypeId, numWorkers, minWorkers, maxWorkers, autoterminationMinutes }) => {
      try {
        const spec: Record<string, unknown> = {
          cluster_name: clusterName,
          spark_version: sparkVersion,
          node_type_id: nodeTypeId,
        };

        if (minWorkers !== undefined && maxWorkers !== undefined) {
          spec.autoscale = { min_workers: minWorkers, max_workers: maxWorkers };
        } else if (numWorkers !== undefined) {
          spec.num_workers = numWorkers;
        }

        if (autoterminationMinutes !== undefined) {
          spec.autotermination_minutes = autoterminationMinutes;
        }

        const result = await client.createCluster(spec);
        return formatSuccess('Cluster created', result);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Start Cluster
  // ===========================================================================
  server.tool(
    'databricks_start_cluster',
    `Start a terminated cluster.

Args:
  - clusterId: Cluster ID to start

Returns:
  Confirmation that the cluster is starting.`,
    {
      clusterId: z.string().describe('Cluster ID'),
    },
    async ({ clusterId }) => {
      try {
        await client.startCluster(clusterId);
        return formatSuccess(`Cluster ${clusterId} is starting`);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Restart Cluster
  // ===========================================================================
  server.tool(
    'databricks_restart_cluster',
    `Restart a running cluster.

Args:
  - clusterId: Cluster ID to restart

Returns:
  Confirmation that the cluster is restarting.`,
    {
      clusterId: z.string().describe('Cluster ID'),
    },
    async ({ clusterId }) => {
      try {
        await client.restartCluster(clusterId);
        return formatSuccess(`Cluster ${clusterId} is restarting`);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Terminate Cluster
  // ===========================================================================
  server.tool(
    'databricks_terminate_cluster',
    `Terminate a running cluster.

The cluster configuration is preserved and can be restarted later.

Args:
  - clusterId: Cluster ID to terminate

Returns:
  Confirmation that the cluster is terminating.`,
    {
      clusterId: z.string().describe('Cluster ID'),
    },
    async ({ clusterId }) => {
      try {
        await client.terminateCluster(clusterId);
        return formatSuccess(`Cluster ${clusterId} is terminating`);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Delete Cluster
  // ===========================================================================
  server.tool(
    'databricks_delete_cluster',
    `Permanently delete a cluster.

This removes the cluster completely. Use terminate_cluster to just stop it.

Args:
  - clusterId: Cluster ID to delete

Returns:
  Confirmation of deletion.`,
    {
      clusterId: z.string().describe('Cluster ID'),
    },
    async ({ clusterId }) => {
      try {
        await client.deleteCluster(clusterId);
        return formatSuccess(`Cluster ${clusterId} permanently deleted`);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // List Cluster Events
  // ===========================================================================
  server.tool(
    'databricks_list_cluster_events',
    `List recent events for a cluster.

Args:
  - clusterId: Cluster ID
  - limit: (Optional) Maximum events to return (default: 50)

Returns:
  List of cluster events.`,
    {
      clusterId: z.string().describe('Cluster ID'),
      limit: z.number().int().min(1).max(500).optional().describe('Maximum events'),
    },
    async ({ clusterId, limit }) => {
      try {
        const result = await client.listClusterEvents(clusterId, { limit });
        return formatResponse({ events: result.events, count: result.events.length });
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Pin Cluster
  // ===========================================================================
  server.tool(
    'databricks_pin_cluster',
    `Pin a cluster to ensure it appears in the cluster list.

Args:
  - clusterId: Cluster ID to pin

Returns:
  Confirmation of pinning.`,
    {
      clusterId: z.string().describe('Cluster ID'),
    },
    async ({ clusterId }) => {
      try {
        await client.pinCluster(clusterId);
        return formatSuccess(`Cluster ${clusterId} pinned`);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Unpin Cluster
  // ===========================================================================
  server.tool(
    'databricks_unpin_cluster',
    `Unpin a cluster.

Args:
  - clusterId: Cluster ID to unpin

Returns:
  Confirmation of unpinning.`,
    {
      clusterId: z.string().describe('Cluster ID'),
    },
    async ({ clusterId }) => {
      try {
        await client.unpinCluster(clusterId);
        return formatSuccess(`Cluster ${clusterId} unpinned`);
      } catch (error) {
        return formatError(error);
      }
    }
  );
}
