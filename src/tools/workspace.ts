/**
 * Workspace Tools
 *
 * MCP tools for managing Databricks workspace objects (notebooks, folders, etc.).
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { DatabricksClient } from '../client.js';
import { formatError, formatResponse, formatSuccess } from '../utils/formatters.js';

/**
 * Register all workspace-related tools
 */
export function registerWorkspaceTools(server: McpServer, client: DatabricksClient): void {
  // ===========================================================================
  // List Workspace
  // ===========================================================================
  server.tool(
    'databricks_list_workspace',
    `List contents of a workspace directory.

Args:
  - path: Workspace path (e.g., "/Users/user@example.com")

Returns:
  List of workspace objects (notebooks, folders, etc.).`,
    {
      path: z.string().describe('Workspace path'),
    },
    async ({ path }) => {
      try {
        const objects = await client.listWorkspace(path);
        return formatResponse({ objects, count: objects.length, path });
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Get Workspace Status
  // ===========================================================================
  server.tool(
    'databricks_get_workspace_status',
    `Get status/metadata of a workspace object.

Args:
  - path: Workspace path to the object

Returns:
  Object metadata including type, language, and timestamps.`,
    {
      path: z.string().describe('Workspace path'),
    },
    async ({ path }) => {
      try {
        const status = await client.getWorkspaceStatus(path);
        return formatResponse(status);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Create Directory
  // ===========================================================================
  server.tool(
    'databricks_mkdirs',
    `Create a directory in the workspace.

Creates parent directories as needed.

Args:
  - path: Directory path to create

Returns:
  Confirmation of creation.`,
    {
      path: z.string().describe('Directory path'),
    },
    async ({ path }) => {
      try {
        await client.mkdirs(path);
        return formatSuccess(`Directory created: ${path}`);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Delete Workspace Object
  // ===========================================================================
  server.tool(
    'databricks_delete_workspace',
    `Delete a workspace object (notebook, folder, etc.).

Args:
  - path: Path to delete
  - recursive: (Optional) Delete recursively if folder (default: false)

Returns:
  Confirmation of deletion.`,
    {
      path: z.string().describe('Path to delete'),
      recursive: z.boolean().optional().describe('Delete recursively'),
    },
    async ({ path, recursive }) => {
      try {
        await client.deleteWorkspace(path, recursive);
        return formatSuccess(`Deleted: ${path}`);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Import Notebook
  // ===========================================================================
  server.tool(
    'databricks_import_notebook',
    `Import a notebook into the workspace.

Args:
  - path: Destination path for the notebook
  - content: Base64-encoded content
  - format: Import format (SOURCE, HTML, JUPYTER, DBC, R_MARKDOWN)
  - language: (Optional) Notebook language (PYTHON, SCALA, SQL, R) - required for SOURCE format
  - overwrite: (Optional) Overwrite existing file (default: false)

Returns:
  Confirmation of import.`,
    {
      path: z.string().describe('Destination path'),
      content: z.string().describe('Base64-encoded content'),
      format: z.enum(['SOURCE', 'HTML', 'JUPYTER', 'DBC', 'R_MARKDOWN']).describe('Import format'),
      language: z.enum(['PYTHON', 'SCALA', 'SQL', 'R']).optional().describe('Notebook language'),
      overwrite: z.boolean().optional().describe('Overwrite existing'),
    },
    async ({ path, content, format, language, overwrite }) => {
      try {
        await client.importWorkspace(path, content, format, language, overwrite);
        return formatSuccess(`Notebook imported: ${path}`);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Export Notebook
  // ===========================================================================
  server.tool(
    'databricks_export_notebook',
    `Export a notebook from the workspace.

Args:
  - path: Path to the notebook
  - format: (Optional) Export format (SOURCE, HTML, JUPYTER, DBC, R_MARKDOWN) - default: SOURCE

Returns:
  Base64-encoded notebook content.`,
    {
      path: z.string().describe('Notebook path'),
      format: z.enum(['SOURCE', 'HTML', 'JUPYTER', 'DBC', 'R_MARKDOWN']).optional().describe('Export format'),
    },
    async ({ path, format }) => {
      try {
        const result = await client.exportWorkspace(path, format);
        return formatResponse({ path, format: format || 'SOURCE', content: result.content });
      } catch (error) {
        return formatError(error);
      }
    }
  );
}
