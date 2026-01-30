/**
 * MLflow Tools
 *
 * MCP tools for managing MLflow experiments, runs, and models.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { DatabricksClient } from '../client.js';
import { formatError, formatResponse, formatSuccess } from '../utils/formatters.js';

/**
 * Register all MLflow-related tools
 */
export function registerMlflowTools(server: McpServer, client: DatabricksClient): void {
  // ===========================================================================
  // Experiments
  // ===========================================================================

  server.tool(
    'databricks_list_experiments',
    `List MLflow experiments.

Args:
  - maxResults: (Optional) Maximum experiments to return
  - pageToken: (Optional) Pagination token

Returns:
  List of experiments.`,
    {
      maxResults: z.number().int().min(1).max(1000).optional().describe('Maximum results'),
      pageToken: z.string().optional().describe('Pagination token'),
    },
    async ({ maxResults, pageToken }) => {
      try {
        const result = await client.listExperiments({ maxResults, pageToken });
        return formatResponse({ ...result, count: result.experiments.length });
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    'databricks_get_experiment',
    `Get details of an MLflow experiment.

Args:
  - experimentId: Experiment ID

Returns:
  Experiment metadata.`,
    {
      experimentId: z.string().describe('Experiment ID'),
    },
    async ({ experimentId }) => {
      try {
        const experiment = await client.getExperiment(experimentId);
        return formatResponse(experiment);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    'databricks_get_experiment_by_name',
    `Get an MLflow experiment by name.

Args:
  - experimentName: Experiment name/path

Returns:
  Experiment metadata.`,
    {
      experimentName: z.string().describe('Experiment name'),
    },
    async ({ experimentName }) => {
      try {
        const experiment = await client.getExperimentByName(experimentName);
        return formatResponse(experiment);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    'databricks_create_experiment',
    `Create a new MLflow experiment.

Args:
  - name: Experiment name (workspace path)
  - artifactLocation: (Optional) Location to store artifacts

Returns:
  Created experiment ID.`,
    {
      name: z.string().describe('Experiment name'),
      artifactLocation: z.string().optional().describe('Artifact location'),
    },
    async ({ name, artifactLocation }) => {
      try {
        const result = await client.createExperiment(name, artifactLocation);
        return formatSuccess('Experiment created', result);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    'databricks_delete_experiment',
    `Delete an MLflow experiment.

Args:
  - experimentId: Experiment ID

Returns:
  Confirmation of deletion.`,
    {
      experimentId: z.string().describe('Experiment ID'),
    },
    async ({ experimentId }) => {
      try {
        await client.deleteExperiment(experimentId);
        return formatSuccess(`Experiment ${experimentId} deleted`);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    'databricks_restore_experiment',
    `Restore a deleted MLflow experiment.

Args:
  - experimentId: Experiment ID

Returns:
  Confirmation of restoration.`,
    {
      experimentId: z.string().describe('Experiment ID'),
    },
    async ({ experimentId }) => {
      try {
        await client.restoreExperiment(experimentId);
        return formatSuccess(`Experiment ${experimentId} restored`);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Runs
  // ===========================================================================

  server.tool(
    'databricks_search_runs',
    `Search for MLflow runs.

Args:
  - experimentIds: Array of experiment IDs to search
  - filter: (Optional) Filter string (e.g., "metrics.accuracy > 0.9")
  - maxResults: (Optional) Maximum results to return
  - orderBy: (Optional) Order by fields (e.g., ["metrics.accuracy DESC"])
  - pageToken: (Optional) Pagination token

Returns:
  List of matching runs.`,
    {
      experimentIds: z.array(z.string()).describe('Experiment IDs'),
      filter: z.string().optional().describe('Filter expression'),
      maxResults: z.number().int().min(1).max(50000).optional().describe('Maximum results'),
      orderBy: z.array(z.string()).optional().describe('Order by fields'),
      pageToken: z.string().optional().describe('Pagination token'),
    },
    async ({ experimentIds, filter, maxResults, orderBy, pageToken }) => {
      try {
        const result = await client.searchMlflowRuns({
          experimentIds,
          filter,
          maxResults,
          orderBy,
          pageToken,
        });
        return formatResponse({ ...result, count: result.runs.length });
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    'databricks_create_run',
    `Create a new MLflow run.

Args:
  - experimentId: Experiment ID
  - runName: (Optional) Run name
  - tags: (Optional) Tags as JSON array [{key, value}]

Returns:
  Created run details.`,
    {
      experimentId: z.string().describe('Experiment ID'),
      runName: z.string().optional().describe('Run name'),
      tags: z.string().optional().describe('Tags as JSON array'),
    },
    async ({ experimentId, runName, tags }) => {
      try {
        const parsedTags = tags ? JSON.parse(tags) : undefined;
        const run = await client.createMlflowRun(experimentId, { runName, tags: parsedTags });
        return formatSuccess('Run created', run);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    'databricks_update_run',
    `Update an MLflow run status.

Args:
  - runId: Run ID
  - status: New status (RUNNING, SCHEDULED, FINISHED, FAILED, KILLED)
  - endTime: (Optional) End timestamp in milliseconds

Returns:
  Confirmation of update.`,
    {
      runId: z.string().describe('Run ID'),
      status: z.enum(['RUNNING', 'SCHEDULED', 'FINISHED', 'FAILED', 'KILLED']).describe('Status'),
      endTime: z.number().int().optional().describe('End timestamp (ms)'),
    },
    async ({ runId, status, endTime }) => {
      try {
        await client.updateMlflowRun(runId, status, endTime);
        return formatSuccess(`Run ${runId} updated to ${status}`);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    'databricks_delete_run',
    `Delete an MLflow run.

Args:
  - runId: Run ID

Returns:
  Confirmation of deletion.`,
    {
      runId: z.string().describe('Run ID'),
    },
    async ({ runId }) => {
      try {
        await client.deleteMlflowRun(runId);
        return formatSuccess(`Run ${runId} deleted`);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    'databricks_log_metric',
    `Log a metric to an MLflow run.

Args:
  - runId: Run ID
  - key: Metric name
  - value: Metric value
  - timestamp: (Optional) Timestamp in milliseconds
  - step: (Optional) Step number

Returns:
  Confirmation of logging.`,
    {
      runId: z.string().describe('Run ID'),
      key: z.string().describe('Metric name'),
      value: z.number().describe('Metric value'),
      timestamp: z.number().int().optional().describe('Timestamp (ms)'),
      step: z.number().int().optional().describe('Step number'),
    },
    async ({ runId, key, value, timestamp, step }) => {
      try {
        await client.logMetric(runId, key, value, timestamp, step);
        return formatSuccess(`Metric ${key}=${value} logged to run ${runId}`);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    'databricks_log_param',
    `Log a parameter to an MLflow run.

Args:
  - runId: Run ID
  - key: Parameter name
  - value: Parameter value

Returns:
  Confirmation of logging.`,
    {
      runId: z.string().describe('Run ID'),
      key: z.string().describe('Parameter name'),
      value: z.string().describe('Parameter value'),
    },
    async ({ runId, key, value }) => {
      try {
        await client.logParam(runId, key, value);
        return formatSuccess(`Parameter ${key}=${value} logged to run ${runId}`);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    'databricks_set_tag',
    `Set a tag on an MLflow run.

Args:
  - runId: Run ID
  - key: Tag name
  - value: Tag value

Returns:
  Confirmation of setting.`,
    {
      runId: z.string().describe('Run ID'),
      key: z.string().describe('Tag name'),
      value: z.string().describe('Tag value'),
    },
    async ({ runId, key, value }) => {
      try {
        await client.setTag(runId, key, value);
        return formatSuccess(`Tag ${key}=${value} set on run ${runId}`);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Models
  // ===========================================================================

  server.tool(
    'databricks_list_models',
    `List registered MLflow models.

Args:
  - maxResults: (Optional) Maximum models to return
  - pageToken: (Optional) Pagination token

Returns:
  List of registered models.`,
    {
      maxResults: z.number().int().min(1).max(1000).optional().describe('Maximum results'),
      pageToken: z.string().optional().describe('Pagination token'),
    },
    async ({ maxResults, pageToken }) => {
      try {
        const result = await client.listRegisteredModels({ maxResults, pageToken });
        return formatResponse({ ...result, count: result.registered_models.length });
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    'databricks_get_model',
    `Get details of a registered model.

Args:
  - name: Model name

Returns:
  Model metadata including versions.`,
    {
      name: z.string().describe('Model name'),
    },
    async ({ name }) => {
      try {
        const model = await client.getRegisteredModel(name);
        return formatResponse(model);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    'databricks_create_model',
    `Create a new registered model.

Args:
  - name: Model name
  - description: (Optional) Model description
  - tags: (Optional) Tags as JSON array [{key, value}]

Returns:
  Created model details.`,
    {
      name: z.string().describe('Model name'),
      description: z.string().optional().describe('Model description'),
      tags: z.string().optional().describe('Tags as JSON array'),
    },
    async ({ name, description, tags }) => {
      try {
        const parsedTags = tags ? JSON.parse(tags) : undefined;
        const model = await client.createRegisteredModel(name, { description, tags: parsedTags });
        return formatSuccess('Model created', model);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    'databricks_delete_model',
    `Delete a registered model.

Args:
  - name: Model name

Returns:
  Confirmation of deletion.`,
    {
      name: z.string().describe('Model name'),
    },
    async ({ name }) => {
      try {
        await client.deleteRegisteredModel(name);
        return formatSuccess(`Model ${name} deleted`);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    'databricks_list_model_versions',
    `List versions of a registered model.

Args:
  - name: Model name

Returns:
  List of model versions.`,
    {
      name: z.string().describe('Model name'),
    },
    async ({ name }) => {
      try {
        const versions = await client.listModelVersions(name);
        return formatResponse({ versions, count: versions.length, model: name });
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    'databricks_get_model_version',
    `Get details of a model version.

Args:
  - name: Model name
  - version: Version number

Returns:
  Model version details.`,
    {
      name: z.string().describe('Model name'),
      version: z.string().describe('Version number'),
    },
    async ({ name, version }) => {
      try {
        const modelVersion = await client.getModelVersion(name, version);
        return formatResponse(modelVersion);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    'databricks_delete_model_version',
    `Delete a model version.

Args:
  - name: Model name
  - version: Version number

Returns:
  Confirmation of deletion.`,
    {
      name: z.string().describe('Model name'),
      version: z.string().describe('Version number'),
    },
    async ({ name, version }) => {
      try {
        await client.deleteModelVersion(name, version);
        return formatSuccess(`Model ${name} version ${version} deleted`);
      } catch (error) {
        return formatError(error);
      }
    }
  );
}
