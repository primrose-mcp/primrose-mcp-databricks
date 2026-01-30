/**
 * Jobs Tools
 *
 * MCP tools for managing Databricks jobs and runs.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { DatabricksClient } from '../client.js';
import { formatError, formatResponse, formatSuccess } from '../utils/formatters.js';

/**
 * Register all job-related tools
 */
export function registerJobTools(server: McpServer, client: DatabricksClient): void {
  // ===========================================================================
  // List Jobs
  // ===========================================================================
  server.tool(
    'databricks_list_jobs',
    `List all jobs in the workspace.

Args:
  - limit: (Optional) Maximum number of jobs to return (default: 20)
  - offset: (Optional) Offset for pagination
  - name: (Optional) Filter jobs by name (substring match)

Returns:
  List of jobs with their settings and metadata.`,
    {
      limit: z.number().int().min(1).max(100).optional().describe('Maximum jobs to return'),
      offset: z.number().int().min(0).optional().describe('Pagination offset'),
      name: z.string().optional().describe('Filter by job name'),
    },
    async ({ limit, offset, name }) => {
      try {
        const result = await client.listJobs({ limit, offset, name });
        return formatResponse({ ...result, count: result.jobs.length });
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Get Job
  // ===========================================================================
  server.tool(
    'databricks_get_job',
    `Get details of a specific job.

Args:
  - jobId: Job ID

Returns:
  Job configuration and metadata.`,
    {
      jobId: z.number().int().describe('Job ID'),
    },
    async ({ jobId }) => {
      try {
        const job = await client.getJob(jobId);
        return formatResponse(job);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Create Job
  // ===========================================================================
  server.tool(
    'databricks_create_job',
    `Create a new job.

Args:
  - name: Job name
  - tasks: Array of task definitions (JSON)
  - schedule: (Optional) Cron schedule expression
  - timezone: (Optional) Timezone for schedule (default: UTC)

Returns:
  Created job ID.`,
    {
      name: z.string().describe('Job name'),
      tasks: z.string().describe('Tasks configuration as JSON string'),
      schedule: z.string().optional().describe('Cron expression'),
      timezone: z.string().optional().describe('Timezone for schedule'),
    },
    async ({ name, tasks, schedule, timezone }) => {
      try {
        const parsedTasks = JSON.parse(tasks);
        const settings: Record<string, unknown> = {
          name,
          tasks: parsedTasks,
        };
        if (schedule) {
          settings.schedule = {
            quartz_cron_expression: schedule,
            timezone_id: timezone || 'UTC',
          };
        }
        const result = await client.createJob(settings);
        return formatSuccess('Job created', result);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Update Job
  // ===========================================================================
  server.tool(
    'databricks_update_job',
    `Update an existing job.

Args:
  - jobId: Job ID to update
  - settings: New job settings as JSON string

Returns:
  Confirmation of update.`,
    {
      jobId: z.number().int().describe('Job ID'),
      settings: z.string().describe('New settings as JSON string'),
    },
    async ({ jobId, settings }) => {
      try {
        const parsedSettings = JSON.parse(settings);
        await client.updateJob(jobId, parsedSettings);
        return formatSuccess(`Job ${jobId} updated`);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Delete Job
  // ===========================================================================
  server.tool(
    'databricks_delete_job',
    `Delete a job.

Args:
  - jobId: Job ID to delete

Returns:
  Confirmation of deletion.`,
    {
      jobId: z.number().int().describe('Job ID'),
    },
    async ({ jobId }) => {
      try {
        await client.deleteJob(jobId);
        return formatSuccess(`Job ${jobId} deleted`);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Run Job Now
  // ===========================================================================
  server.tool(
    'databricks_run_job',
    `Trigger a job run immediately.

Args:
  - jobId: Job ID to run
  - parameters: (Optional) Runtime parameters as JSON string

Returns:
  Run ID of the triggered run.`,
    {
      jobId: z.number().int().describe('Job ID'),
      parameters: z.string().optional().describe('Runtime parameters as JSON'),
    },
    async ({ jobId, parameters }) => {
      try {
        const params = parameters ? JSON.parse(parameters) : undefined;
        const result = await client.runJobNow(jobId, params);
        return formatSuccess('Job run triggered', result);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // List Runs
  // ===========================================================================
  server.tool(
    'databricks_list_runs',
    `List job runs.

Args:
  - jobId: (Optional) Filter by job ID
  - activeOnly: (Optional) Only return active runs
  - completedOnly: (Optional) Only return completed runs
  - limit: (Optional) Maximum runs to return (default: 20)
  - offset: (Optional) Pagination offset

Returns:
  List of job runs with status.`,
    {
      jobId: z.number().int().optional().describe('Filter by job ID'),
      activeOnly: z.boolean().optional().describe('Only active runs'),
      completedOnly: z.boolean().optional().describe('Only completed runs'),
      limit: z.number().int().min(1).max(100).optional().describe('Maximum runs to return'),
      offset: z.number().int().min(0).optional().describe('Pagination offset'),
    },
    async ({ jobId, activeOnly, completedOnly, limit, offset }) => {
      try {
        const result = await client.listRuns({ jobId, activeOnly, completedOnly, limit, offset });
        return formatResponse({ ...result, count: result.runs.length });
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Get Run
  // ===========================================================================
  server.tool(
    'databricks_get_run',
    `Get details of a specific job run.

Args:
  - runId: Run ID

Returns:
  Run details including status and tasks.`,
    {
      runId: z.number().int().describe('Run ID'),
    },
    async ({ runId }) => {
      try {
        const run = await client.getRun(runId);
        return formatResponse(run);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Get Run Output
  // ===========================================================================
  server.tool(
    'databricks_get_run_output',
    `Get the output of a job run.

Args:
  - runId: Run ID

Returns:
  Run output including notebook output if applicable.`,
    {
      runId: z.number().int().describe('Run ID'),
    },
    async ({ runId }) => {
      try {
        const output = await client.getRunOutput(runId);
        return formatResponse(output);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Cancel Run
  // ===========================================================================
  server.tool(
    'databricks_cancel_run',
    `Cancel a running job run.

Args:
  - runId: Run ID to cancel

Returns:
  Confirmation of cancellation.`,
    {
      runId: z.number().int().describe('Run ID'),
    },
    async ({ runId }) => {
      try {
        await client.cancelRun(runId);
        return formatSuccess(`Run ${runId} cancelled`);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Cancel All Runs
  // ===========================================================================
  server.tool(
    'databricks_cancel_all_runs',
    `Cancel all active runs of a job.

Args:
  - jobId: Job ID

Returns:
  Confirmation of cancellation.`,
    {
      jobId: z.number().int().describe('Job ID'),
    },
    async ({ jobId }) => {
      try {
        await client.cancelAllRuns(jobId);
        return formatSuccess(`All runs of job ${jobId} cancelled`);
      } catch (error) {
        return formatError(error);
      }
    }
  );
}
