/**
 * DBFS Tools
 *
 * MCP tools for managing Databricks File System (DBFS).
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { DatabricksClient } from '../client.js';
import { formatError, formatResponse, formatSuccess } from '../utils/formatters.js';

/**
 * Register all DBFS-related tools
 */
export function registerDbfsTools(server: McpServer, client: DatabricksClient): void {
  // ===========================================================================
  // List DBFS
  // ===========================================================================
  server.tool(
    'databricks_list_dbfs',
    `List files and directories in DBFS.

Args:
  - path: DBFS path (e.g., "/mnt/data" or "dbfs:/mnt/data")

Returns:
  List of files and directories with metadata.`,
    {
      path: z.string().describe('DBFS path'),
    },
    async ({ path }) => {
      try {
        const files = await client.listDbfs(path);
        return formatResponse({ files, count: files.length, path });
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Get DBFS Status
  // ===========================================================================
  server.tool(
    'databricks_get_dbfs_status',
    `Get status/metadata of a DBFS path.

Args:
  - path: DBFS path

Returns:
  File or directory metadata.`,
    {
      path: z.string().describe('DBFS path'),
    },
    async ({ path }) => {
      try {
        const status = await client.getDbfsStatus(path);
        return formatResponse(status);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Create DBFS Directory
  // ===========================================================================
  server.tool(
    'databricks_mkdirs_dbfs',
    `Create a directory in DBFS.

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
        await client.mkdirsDbfs(path);
        return formatSuccess(`DBFS directory created: ${path}`);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Delete DBFS
  // ===========================================================================
  server.tool(
    'databricks_delete_dbfs',
    `Delete a file or directory in DBFS.

Args:
  - path: Path to delete
  - recursive: (Optional) Delete recursively if directory (default: false)

Returns:
  Confirmation of deletion.`,
    {
      path: z.string().describe('Path to delete'),
      recursive: z.boolean().optional().describe('Delete recursively'),
    },
    async ({ path, recursive }) => {
      try {
        await client.deleteDbfs(path, recursive);
        return formatSuccess(`DBFS deleted: ${path}`);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Read DBFS
  // ===========================================================================
  server.tool(
    'databricks_read_dbfs',
    `Read contents of a file in DBFS.

For files larger than 1MB, use offset and length for chunked reading.

Args:
  - path: File path to read
  - offset: (Optional) Byte offset to start reading (default: 0)
  - length: (Optional) Number of bytes to read (default: 1MB, max: 1MB)

Returns:
  Base64-encoded file content and bytes read.`,
    {
      path: z.string().describe('File path'),
      offset: z.number().int().min(0).optional().describe('Byte offset'),
      length: z.number().int().min(1).max(1048576).optional().describe('Bytes to read'),
    },
    async ({ path, offset, length }) => {
      try {
        const result = await client.readDbfs(path, offset, length);
        return formatResponse({ path, ...result });
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Write DBFS
  // ===========================================================================
  server.tool(
    'databricks_put_dbfs',
    `Write content to a file in DBFS.

For files larger than 1MB, use the streaming API (create, add_block, close).

Args:
  - path: Destination file path
  - contents: Base64-encoded content
  - overwrite: (Optional) Overwrite existing file (default: false)

Returns:
  Confirmation of write.`,
    {
      path: z.string().describe('Destination path'),
      contents: z.string().describe('Base64-encoded content'),
      overwrite: z.boolean().optional().describe('Overwrite existing'),
    },
    async ({ path, contents, overwrite }) => {
      try {
        await client.putDbfs(path, contents, overwrite);
        return formatSuccess(`File written to DBFS: ${path}`);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Move DBFS
  // ===========================================================================
  server.tool(
    'databricks_move_dbfs',
    `Move a file or directory in DBFS.

Args:
  - sourcePath: Source path
  - destinationPath: Destination path

Returns:
  Confirmation of move.`,
    {
      sourcePath: z.string().describe('Source path'),
      destinationPath: z.string().describe('Destination path'),
    },
    async ({ sourcePath, destinationPath }) => {
      try {
        await client.moveDbfs(sourcePath, destinationPath);
        return formatSuccess(`Moved ${sourcePath} to ${destinationPath}`);
      } catch (error) {
        return formatError(error);
      }
    }
  );
}
