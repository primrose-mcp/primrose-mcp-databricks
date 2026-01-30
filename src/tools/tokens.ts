/**
 * Tokens Tools
 *
 * MCP tools for managing Databricks personal access tokens.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { DatabricksClient } from '../client.js';
import { formatError, formatResponse, formatSuccess } from '../utils/formatters.js';

/**
 * Register all tokens-related tools
 */
export function registerTokensTools(server: McpServer, client: DatabricksClient): void {
  // ===========================================================================
  // List Tokens
  // ===========================================================================
  server.tool(
    'databricks_list_tokens',
    `List all personal access tokens for the current user.

Returns:
  List of token metadata (not the actual token values).`,
    {},
    async () => {
      try {
        const tokens = await client.listTokens();
        return formatResponse({ tokens, count: tokens.length });
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Create Token
  // ===========================================================================
  server.tool(
    'databricks_create_token',
    `Create a new personal access token.

Args:
  - comment: (Optional) Token description
  - lifetimeSeconds: (Optional) Token lifetime in seconds (default: 90 days)

Returns:
  Token value (shown only once) and metadata.`,
    {
      comment: z.string().optional().describe('Token description'),
      lifetimeSeconds: z.number().int().min(60).optional().describe('Lifetime in seconds'),
    },
    async ({ comment, lifetimeSeconds }) => {
      try {
        const result = await client.createToken(comment, lifetimeSeconds);
        return formatSuccess('Token created (save the token_value - it will not be shown again)', result);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Revoke Token
  // ===========================================================================
  server.tool(
    'databricks_revoke_token',
    `Revoke a personal access token.

Args:
  - tokenId: Token ID to revoke

Returns:
  Confirmation of revocation.`,
    {
      tokenId: z.string().describe('Token ID'),
    },
    async ({ tokenId }) => {
      try {
        await client.revokeToken(tokenId);
        return formatSuccess(`Token ${tokenId} revoked`);
      } catch (error) {
        return formatError(error);
      }
    }
  );
}
