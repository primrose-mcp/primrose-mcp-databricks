/**
 * Repos Tools
 *
 * MCP tools for managing Databricks Repos and Git credentials.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { DatabricksClient } from '../client.js';
import { formatError, formatResponse, formatSuccess } from '../utils/formatters.js';

/**
 * Register all repos-related tools
 */
export function registerReposTools(server: McpServer, client: DatabricksClient): void {
  // ===========================================================================
  // Repos
  // ===========================================================================

  server.tool(
    'databricks_list_repos',
    `List Git repos in the workspace.

Args:
  - pathPrefix: (Optional) Filter by path prefix
  - pageToken: (Optional) Pagination token

Returns:
  List of repos.`,
    {
      pathPrefix: z.string().optional().describe('Filter by path prefix'),
      pageToken: z.string().optional().describe('Pagination token'),
    },
    async ({ pathPrefix, pageToken }) => {
      try {
        const result = await client.listRepos({ pathPrefix, nextPageToken: pageToken });
        return formatResponse({ ...result, count: result.repos.length });
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    'databricks_get_repo',
    `Get details of a specific repo.

Args:
  - repoId: Repo ID

Returns:
  Repo details including branch info.`,
    {
      repoId: z.number().int().describe('Repo ID'),
    },
    async ({ repoId }) => {
      try {
        const repo = await client.getRepo(repoId);
        return formatResponse(repo);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    'databricks_create_repo',
    `Create a new Git repo in the workspace.

Args:
  - url: Git repository URL
  - provider: Git provider (e.g., gitHub, bitbucketCloud, gitLab)
  - path: (Optional) Workspace path for the repo

Returns:
  Created repo details.`,
    {
      url: z.string().describe('Git repository URL'),
      provider: z.string().describe('Git provider'),
      path: z.string().optional().describe('Workspace path'),
    },
    async ({ url, provider, path }) => {
      try {
        const repo = await client.createRepo(url, provider, path);
        return formatSuccess('Repo created', repo);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    'databricks_update_repo',
    `Update a repo (switch branch or tag).

Args:
  - repoId: Repo ID
  - branch: (Optional) Branch to checkout
  - tag: (Optional) Tag to checkout

Returns:
  Updated repo details.`,
    {
      repoId: z.number().int().describe('Repo ID'),
      branch: z.string().optional().describe('Branch to checkout'),
      tag: z.string().optional().describe('Tag to checkout'),
    },
    async ({ repoId, branch, tag }) => {
      try {
        const repo = await client.updateRepo(repoId, { branch, tag });
        return formatSuccess('Repo updated', repo);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    'databricks_delete_repo',
    `Delete a repo from the workspace.

Args:
  - repoId: Repo ID

Returns:
  Confirmation of deletion.`,
    {
      repoId: z.number().int().describe('Repo ID'),
    },
    async ({ repoId }) => {
      try {
        await client.deleteRepo(repoId);
        return formatSuccess(`Repo ${repoId} deleted`);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Git Credentials
  // ===========================================================================

  server.tool(
    'databricks_list_git_credentials',
    `List Git credentials for the current user.

Returns:
  List of Git credentials.`,
    {},
    async () => {
      try {
        const credentials = await client.listGitCredentials();
        return formatResponse({ credentials, count: credentials.length });
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    'databricks_create_git_credential',
    `Create a new Git credential.

Args:
  - provider: Git provider (e.g., gitHub, bitbucketCloud, gitLab)
  - username: Git username
  - personalAccessToken: Personal access token

Returns:
  Created credential details.`,
    {
      provider: z.string().describe('Git provider'),
      username: z.string().describe('Git username'),
      personalAccessToken: z.string().describe('Personal access token'),
    },
    async ({ provider, username, personalAccessToken }) => {
      try {
        const credential = await client.createGitCredential(provider, username, personalAccessToken);
        return formatSuccess('Git credential created', credential);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    'databricks_delete_git_credential',
    `Delete a Git credential.

Args:
  - credentialId: Credential ID

Returns:
  Confirmation of deletion.`,
    {
      credentialId: z.number().int().describe('Credential ID'),
    },
    async ({ credentialId }) => {
      try {
        await client.deleteGitCredential(credentialId);
        return formatSuccess(`Git credential ${credentialId} deleted`);
      } catch (error) {
        return formatError(error);
      }
    }
  );
}
