/**
 * Pipelines Tools (Delta Live Tables)
 *
 * MCP tools for managing Databricks Delta Live Tables pipelines.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { DatabricksClient } from '../client.js';
import { formatError, formatResponse, formatSuccess } from '../utils/formatters.js';

/**
 * Register all pipelines-related tools
 */
export function registerPipelinesTools(server: McpServer, client: DatabricksClient): void {
  // ===========================================================================
  // List Pipelines
  // ===========================================================================
  server.tool(
    'databricks_list_pipelines',
    `List Delta Live Tables pipelines.

Args:
  - maxResults: (Optional) Maximum pipelines to return
  - pageToken: (Optional) Pagination token
  - filter: (Optional) Filter expression

Returns:
  List of pipelines.`,
    {
      maxResults: z.number().int().min(1).max(100).optional().describe('Maximum results'),
      pageToken: z.string().optional().describe('Pagination token'),
      filter: z.string().optional().describe('Filter expression'),
    },
    async ({ maxResults, pageToken, filter }) => {
      try {
        const result = await client.listPipelines({ maxResults, pageToken, filter });
        return formatResponse({ pipelines: result.statuses, count: result.statuses.length, next_page_token: result.next_page_token });
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Get Pipeline
  // ===========================================================================
  server.tool(
    'databricks_get_pipeline',
    `Get details of a specific pipeline.

Args:
  - pipelineId: Pipeline ID

Returns:
  Pipeline details including status and configuration.`,
    {
      pipelineId: z.string().describe('Pipeline ID'),
    },
    async ({ pipelineId }) => {
      try {
        const pipeline = await client.getPipeline(pipelineId);
        return formatResponse(pipeline);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Create Pipeline
  // ===========================================================================
  server.tool(
    'databricks_create_pipeline',
    `Create a new Delta Live Tables pipeline.

Args:
  - name: Pipeline name
  - spec: Pipeline specification as JSON string

Returns:
  Created pipeline ID.`,
    {
      name: z.string().describe('Pipeline name'),
      spec: z.string().describe('Pipeline specification as JSON'),
    },
    async ({ name, spec }) => {
      try {
        const parsedSpec = JSON.parse(spec);
        const result = await client.createPipeline({ name, ...parsedSpec });
        return formatSuccess('Pipeline created', result);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Update Pipeline
  // ===========================================================================
  server.tool(
    'databricks_update_pipeline',
    `Update an existing pipeline.

Args:
  - pipelineId: Pipeline ID
  - spec: Updated pipeline specification as JSON string

Returns:
  Confirmation of update.`,
    {
      pipelineId: z.string().describe('Pipeline ID'),
      spec: z.string().describe('Updated specification as JSON'),
    },
    async ({ pipelineId, spec }) => {
      try {
        const parsedSpec = JSON.parse(spec);
        await client.updatePipeline(pipelineId, parsedSpec);
        return formatSuccess(`Pipeline ${pipelineId} updated`);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Delete Pipeline
  // ===========================================================================
  server.tool(
    'databricks_delete_pipeline',
    `Delete a pipeline.

Args:
  - pipelineId: Pipeline ID

Returns:
  Confirmation of deletion.`,
    {
      pipelineId: z.string().describe('Pipeline ID'),
    },
    async ({ pipelineId }) => {
      try {
        await client.deletePipeline(pipelineId);
        return formatSuccess(`Pipeline ${pipelineId} deleted`);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Start Pipeline
  // ===========================================================================
  server.tool(
    'databricks_start_pipeline',
    `Start a pipeline update.

Args:
  - pipelineId: Pipeline ID
  - fullRefresh: (Optional) Perform a full refresh (default: false)

Returns:
  Update ID.`,
    {
      pipelineId: z.string().describe('Pipeline ID'),
      fullRefresh: z.boolean().optional().describe('Perform full refresh'),
    },
    async ({ pipelineId, fullRefresh }) => {
      try {
        const result = await client.startPipelineUpdate(pipelineId, { fullRefresh });
        return formatSuccess('Pipeline update started', result);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Stop Pipeline
  // ===========================================================================
  server.tool(
    'databricks_stop_pipeline',
    `Stop a running pipeline.

Args:
  - pipelineId: Pipeline ID

Returns:
  Confirmation of stop.`,
    {
      pipelineId: z.string().describe('Pipeline ID'),
    },
    async ({ pipelineId }) => {
      try {
        await client.stopPipeline(pipelineId);
        return formatSuccess(`Pipeline ${pipelineId} stopping`);
      } catch (error) {
        return formatError(error);
      }
    }
  );
}
