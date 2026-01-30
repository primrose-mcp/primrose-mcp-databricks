/**
 * Unity Catalog Tools
 *
 * MCP tools for managing Unity Catalog objects (catalogs, schemas, tables, volumes, functions).
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { DatabricksClient } from '../client.js';
import { formatError, formatResponse, formatSuccess } from '../utils/formatters.js';

/**
 * Register all Unity Catalog-related tools
 */
export function registerUnityCatalogTools(server: McpServer, client: DatabricksClient): void {
  // ===========================================================================
  // Catalogs
  // ===========================================================================

  server.tool(
    'databricks_list_catalogs',
    `List all catalogs in Unity Catalog.

Returns:
  List of catalogs with metadata.`,
    {},
    async () => {
      try {
        const catalogs = await client.listCatalogs();
        return formatResponse({ catalogs, count: catalogs.length });
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    'databricks_get_catalog',
    `Get details of a specific catalog.

Args:
  - name: Catalog name

Returns:
  Catalog metadata and properties.`,
    {
      name: z.string().describe('Catalog name'),
    },
    async ({ name }) => {
      try {
        const catalog = await client.getCatalog(name);
        return formatResponse(catalog);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    'databricks_create_catalog',
    `Create a new catalog in Unity Catalog.

Args:
  - name: Catalog name
  - comment: (Optional) Catalog description

Returns:
  Created catalog details.`,
    {
      name: z.string().describe('Catalog name'),
      comment: z.string().optional().describe('Catalog description'),
    },
    async ({ name, comment }) => {
      try {
        const catalog = await client.createCatalog(name, { comment });
        return formatSuccess('Catalog created', catalog);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    'databricks_delete_catalog',
    `Delete a catalog.

Args:
  - name: Catalog name
  - force: (Optional) Force delete even if not empty (default: false)

Returns:
  Confirmation of deletion.`,
    {
      name: z.string().describe('Catalog name'),
      force: z.boolean().optional().describe('Force delete'),
    },
    async ({ name, force }) => {
      try {
        await client.deleteCatalog(name, force);
        return formatSuccess(`Catalog ${name} deleted`);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Schemas
  // ===========================================================================

  server.tool(
    'databricks_list_schemas',
    `List all schemas in a catalog.

Args:
  - catalogName: Catalog name

Returns:
  List of schemas.`,
    {
      catalogName: z.string().describe('Catalog name'),
    },
    async ({ catalogName }) => {
      try {
        const schemas = await client.listSchemas(catalogName);
        return formatResponse({ schemas, count: schemas.length, catalog: catalogName });
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    'databricks_get_schema',
    `Get details of a specific schema.

Args:
  - fullName: Full schema name (catalog.schema)

Returns:
  Schema metadata.`,
    {
      fullName: z.string().describe('Full schema name (catalog.schema)'),
    },
    async ({ fullName }) => {
      try {
        const schema = await client.getSchema(fullName);
        return formatResponse(schema);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    'databricks_create_schema',
    `Create a new schema in a catalog.

Args:
  - catalogName: Catalog name
  - name: Schema name
  - comment: (Optional) Schema description

Returns:
  Created schema details.`,
    {
      catalogName: z.string().describe('Catalog name'),
      name: z.string().describe('Schema name'),
      comment: z.string().optional().describe('Schema description'),
    },
    async ({ catalogName, name, comment }) => {
      try {
        const schema = await client.createSchema(catalogName, name, { comment });
        return formatSuccess('Schema created', schema);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    'databricks_delete_schema',
    `Delete a schema.

Args:
  - fullName: Full schema name (catalog.schema)

Returns:
  Confirmation of deletion.`,
    {
      fullName: z.string().describe('Full schema name (catalog.schema)'),
    },
    async ({ fullName }) => {
      try {
        await client.deleteSchema(fullName);
        return formatSuccess(`Schema ${fullName} deleted`);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Tables
  // ===========================================================================

  server.tool(
    'databricks_list_tables',
    `List all tables in a schema.

Args:
  - catalogName: Catalog name
  - schemaName: Schema name

Returns:
  List of tables.`,
    {
      catalogName: z.string().describe('Catalog name'),
      schemaName: z.string().describe('Schema name'),
    },
    async ({ catalogName, schemaName }) => {
      try {
        const tables = await client.listTables(catalogName, schemaName);
        return formatResponse({ tables, count: tables.length, catalog: catalogName, schema: schemaName });
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    'databricks_get_table',
    `Get details of a specific table.

Args:
  - fullName: Full table name (catalog.schema.table)

Returns:
  Table metadata including columns.`,
    {
      fullName: z.string().describe('Full table name (catalog.schema.table)'),
    },
    async ({ fullName }) => {
      try {
        const table = await client.getTable(fullName);
        return formatResponse(table);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    'databricks_delete_table',
    `Delete a table.

Args:
  - fullName: Full table name (catalog.schema.table)

Returns:
  Confirmation of deletion.`,
    {
      fullName: z.string().describe('Full table name (catalog.schema.table)'),
    },
    async ({ fullName }) => {
      try {
        await client.deleteTable(fullName);
        return formatSuccess(`Table ${fullName} deleted`);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Volumes
  // ===========================================================================

  server.tool(
    'databricks_list_volumes',
    `List all volumes in a schema.

Args:
  - catalogName: Catalog name
  - schemaName: Schema name

Returns:
  List of volumes.`,
    {
      catalogName: z.string().describe('Catalog name'),
      schemaName: z.string().describe('Schema name'),
    },
    async ({ catalogName, schemaName }) => {
      try {
        const volumes = await client.listVolumes(catalogName, schemaName);
        return formatResponse({ volumes, count: volumes.length, catalog: catalogName, schema: schemaName });
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    'databricks_get_volume',
    `Get details of a specific volume.

Args:
  - fullName: Full volume name (catalog.schema.volume)

Returns:
  Volume metadata.`,
    {
      fullName: z.string().describe('Full volume name (catalog.schema.volume)'),
    },
    async ({ fullName }) => {
      try {
        const volume = await client.getVolume(fullName);
        return formatResponse(volume);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    'databricks_create_volume',
    `Create a new volume.

Args:
  - catalogName: Catalog name
  - schemaName: Schema name
  - name: Volume name
  - volumeType: Volume type (MANAGED or EXTERNAL)
  - storageLocation: (Optional) Storage location for external volumes
  - comment: (Optional) Volume description

Returns:
  Created volume details.`,
    {
      catalogName: z.string().describe('Catalog name'),
      schemaName: z.string().describe('Schema name'),
      name: z.string().describe('Volume name'),
      volumeType: z.enum(['MANAGED', 'EXTERNAL']).describe('Volume type'),
      storageLocation: z.string().optional().describe('Storage location'),
      comment: z.string().optional().describe('Volume description'),
    },
    async ({ catalogName, schemaName, name, volumeType, storageLocation, comment }) => {
      try {
        const volume = await client.createVolume(catalogName, schemaName, name, volumeType, {
          storageLocation,
          comment,
        });
        return formatSuccess('Volume created', volume);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    'databricks_delete_volume',
    `Delete a volume.

Args:
  - fullName: Full volume name (catalog.schema.volume)

Returns:
  Confirmation of deletion.`,
    {
      fullName: z.string().describe('Full volume name (catalog.schema.volume)'),
    },
    async ({ fullName }) => {
      try {
        await client.deleteVolume(fullName);
        return formatSuccess(`Volume ${fullName} deleted`);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Functions
  // ===========================================================================

  server.tool(
    'databricks_list_functions',
    `List all functions in a schema.

Args:
  - catalogName: Catalog name
  - schemaName: Schema name

Returns:
  List of functions.`,
    {
      catalogName: z.string().describe('Catalog name'),
      schemaName: z.string().describe('Schema name'),
    },
    async ({ catalogName, schemaName }) => {
      try {
        const functions = await client.listFunctions(catalogName, schemaName);
        return formatResponse({ functions, count: functions.length, catalog: catalogName, schema: schemaName });
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    'databricks_get_function',
    `Get details of a specific function.

Args:
  - fullName: Full function name (catalog.schema.function)

Returns:
  Function metadata.`,
    {
      fullName: z.string().describe('Full function name (catalog.schema.function)'),
    },
    async ({ fullName }) => {
      try {
        const func = await client.getFunction(fullName);
        return formatResponse(func);
      } catch (error) {
        return formatError(error);
      }
    }
  );
}
