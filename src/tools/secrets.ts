/**
 * Secrets Tools
 *
 * MCP tools for managing Databricks secrets and secret scopes.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { DatabricksClient } from '../client.js';
import { formatError, formatResponse, formatSuccess } from '../utils/formatters.js';

/**
 * Register all secrets-related tools
 */
export function registerSecretsTools(server: McpServer, client: DatabricksClient): void {
  // ===========================================================================
  // Secret Scopes
  // ===========================================================================

  server.tool(
    'databricks_list_secret_scopes',
    `List all secret scopes.

Returns:
  List of secret scopes.`,
    {},
    async () => {
      try {
        const scopes = await client.listSecretScopes();
        return formatResponse({ scopes, count: scopes.length });
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    'databricks_create_secret_scope',
    `Create a new secret scope.

Args:
  - scope: Scope name

Returns:
  Confirmation of creation.`,
    {
      scope: z.string().describe('Scope name'),
    },
    async ({ scope }) => {
      try {
        await client.createSecretScope(scope);
        return formatSuccess(`Secret scope ${scope} created`);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    'databricks_delete_secret_scope',
    `Delete a secret scope.

This also deletes all secrets and ACLs in the scope.

Args:
  - scope: Scope name

Returns:
  Confirmation of deletion.`,
    {
      scope: z.string().describe('Scope name'),
    },
    async ({ scope }) => {
      try {
        await client.deleteSecretScope(scope);
        return formatSuccess(`Secret scope ${scope} deleted`);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Secrets
  // ===========================================================================

  server.tool(
    'databricks_list_secrets',
    `List secrets in a scope.

Note: This lists secret metadata only, not the actual values.

Args:
  - scope: Scope name

Returns:
  List of secret keys.`,
    {
      scope: z.string().describe('Scope name'),
    },
    async ({ scope }) => {
      try {
        const secrets = await client.listSecrets(scope);
        return formatResponse({ secrets, count: secrets.length, scope });
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    'databricks_put_secret',
    `Create or update a secret.

Args:
  - scope: Scope name
  - key: Secret key
  - value: Secret value (will be stored securely)

Returns:
  Confirmation of storage.`,
    {
      scope: z.string().describe('Scope name'),
      key: z.string().describe('Secret key'),
      value: z.string().describe('Secret value'),
    },
    async ({ scope, key, value }) => {
      try {
        await client.putSecret(scope, key, value);
        return formatSuccess(`Secret ${scope}/${key} stored`);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    'databricks_delete_secret',
    `Delete a secret.

Args:
  - scope: Scope name
  - key: Secret key

Returns:
  Confirmation of deletion.`,
    {
      scope: z.string().describe('Scope name'),
      key: z.string().describe('Secret key'),
    },
    async ({ scope, key }) => {
      try {
        await client.deleteSecret(scope, key);
        return formatSuccess(`Secret ${scope}/${key} deleted`);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Secret ACLs
  // ===========================================================================

  server.tool(
    'databricks_list_secret_acls',
    `List ACLs for a secret scope.

Args:
  - scope: Scope name

Returns:
  List of ACLs.`,
    {
      scope: z.string().describe('Scope name'),
    },
    async ({ scope }) => {
      try {
        const acls = await client.listSecretAcls(scope);
        return formatResponse({ acls, count: acls.length, scope });
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    'databricks_get_secret_acl',
    `Get ACL for a principal on a scope.

Args:
  - scope: Scope name
  - principal: Principal name (user or group)

Returns:
  ACL details.`,
    {
      scope: z.string().describe('Scope name'),
      principal: z.string().describe('Principal name'),
    },
    async ({ scope, principal }) => {
      try {
        const acl = await client.getSecretAcl(scope, principal);
        return formatResponse(acl);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    'databricks_put_secret_acl',
    `Set ACL for a principal on a scope.

Args:
  - scope: Scope name
  - principal: Principal name (user or group)
  - permission: Permission level (READ, WRITE, or MANAGE)

Returns:
  Confirmation of setting.`,
    {
      scope: z.string().describe('Scope name'),
      principal: z.string().describe('Principal name'),
      permission: z.enum(['READ', 'WRITE', 'MANAGE']).describe('Permission level'),
    },
    async ({ scope, principal, permission }) => {
      try {
        await client.putSecretAcl(scope, principal, permission);
        return formatSuccess(`ACL ${permission} granted to ${principal} on ${scope}`);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    'databricks_delete_secret_acl',
    `Delete ACL for a principal on a scope.

Args:
  - scope: Scope name
  - principal: Principal name (user or group)

Returns:
  Confirmation of deletion.`,
    {
      scope: z.string().describe('Scope name'),
      principal: z.string().describe('Principal name'),
    },
    async ({ scope, principal }) => {
      try {
        await client.deleteSecretAcl(scope, principal);
        return formatSuccess(`ACL for ${principal} on ${scope} deleted`);
      } catch (error) {
        return formatError(error);
      }
    }
  );
}
