# Databricks MCP Server

[![Primrose MCP](https://img.shields.io/badge/Primrose-MCP-blue)](https://primrose.dev/mcp/databricks)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A Model Context Protocol (MCP) server for Databricks. Execute SQL queries, manage clusters, run jobs, work with MLflow models, and interact with Unity Catalog through a standardized interface.

## Features

- **SQL Execution** - Run SQL queries on Databricks SQL warehouses
- **Job Management** - Create, run, and monitor Databricks jobs
- **Cluster Operations** - Manage compute clusters
- **Workspace Management** - Navigate and manage workspace objects
- **DBFS Operations** - Interact with Databricks File System
- **Unity Catalog** - Manage catalogs, schemas, and tables
- **MLflow Integration** - Work with ML models and experiments
- **Secrets Management** - Securely manage credentials
- **Git Repos** - Manage Git repositories in workspace
- **Pipelines** - Work with Delta Live Tables pipelines
- **Instance Pools** - Manage compute instance pools
- **Token Management** - Handle personal access tokens

## Quick Start

The recommended way to use this MCP server is through the [Primrose SDK](https://www.npmjs.com/package/primrose-mcp):

```bash
npm install primrose-mcp
```

```typescript
import { PrimroseClient } from 'primrose-mcp';

const client = new PrimroseClient({
  service: 'databricks',
  headers: {
    'X-Databricks-Host': 'https://adb-xxx.azuredatabricks.net',
    'X-Databricks-Token': 'your-personal-access-token'
  }
});

// Execute a SQL query
const result = await client.call('databricks_execute_sql', {
  query: 'SELECT * FROM my_table LIMIT 10'
});
```

## Manual Installation

If you prefer to run the MCP server directly:

```bash
# Clone the repository
git clone https://github.com/primrose-ai/primrose-mcp-databricks.git
cd primrose-mcp-databricks

# Install dependencies
npm install

# Build the project
npm run build

# Start the server
npm start
```

## Configuration

### Required Headers

| Header | Description |
|--------|-------------|
| `X-Databricks-Host` | Your Databricks workspace URL (e.g., https://adb-xxx.azuredatabricks.net) |
| `X-Databricks-Token` | Your personal access token |

### Optional Headers

| Header | Description |
|--------|-------------|
| `X-Databricks-Warehouse-Id` | Default SQL warehouse ID for SQL operations |

### Getting Your Personal Access Token

1. Log in to your Databricks workspace
2. Click your username in the top right
3. Select "Settings"
4. Go to "Developer" > "Access tokens"
5. Click "Generate new token"
6. Copy the token and use it as your `X-Databricks-Token`

## Available Tools

### SQL Tools
- `databricks_execute_sql` - Execute SQL query
- `databricks_list_warehouses` - List SQL warehouses
- `databricks_get_warehouse` - Get warehouse details

### Job Tools
- `databricks_list_jobs` - List all jobs
- `databricks_get_job` - Get job details
- `databricks_run_job` - Run a job
- `databricks_get_run` - Get run status
- `databricks_cancel_run` - Cancel a run
- `databricks_list_runs` - List job runs

### Cluster Tools
- `databricks_list_clusters` - List all clusters
- `databricks_get_cluster` - Get cluster details
- `databricks_start_cluster` - Start a cluster
- `databricks_stop_cluster` - Stop a cluster
- `databricks_restart_cluster` - Restart a cluster

### Workspace Tools
- `databricks_list_workspace` - List workspace objects
- `databricks_get_notebook` - Get notebook content
- `databricks_import_notebook` - Import a notebook
- `databricks_export_notebook` - Export a notebook

### DBFS Tools
- `databricks_dbfs_list` - List files in DBFS
- `databricks_dbfs_read` - Read file content
- `databricks_dbfs_write` - Write file to DBFS
- `databricks_dbfs_delete` - Delete file from DBFS

### Unity Catalog Tools
- `databricks_list_catalogs` - List catalogs
- `databricks_list_schemas` - List schemas
- `databricks_list_tables` - List tables
- `databricks_get_table` - Get table metadata

### MLflow Tools
- `databricks_list_experiments` - List ML experiments
- `databricks_list_models` - List registered models
- `databricks_get_model` - Get model details
- `databricks_list_model_versions` - List model versions

### Secrets Tools
- `databricks_list_secret_scopes` - List secret scopes
- `databricks_list_secrets` - List secrets in scope
- `databricks_put_secret` - Create/update a secret

### Repos Tools
- `databricks_list_repos` - List Git repos
- `databricks_get_repo` - Get repo details
- `databricks_update_repo` - Pull latest changes

### Pipelines Tools
- `databricks_list_pipelines` - List DLT pipelines
- `databricks_get_pipeline` - Get pipeline details
- `databricks_start_pipeline` - Start a pipeline

### Instance Pools Tools
- `databricks_list_instance_pools` - List instance pools
- `databricks_get_instance_pool` - Get pool details

### Tokens Tools
- `databricks_list_tokens` - List personal access tokens
- `databricks_create_token` - Create a new token

## Development

```bash
# Run in development mode with hot reload
npm run dev

# Run tests
npm test

# Lint code
npm run lint

# Type check
npm run typecheck
```

## Related Resources

- [Primrose SDK Documentation](https://primrose.dev/docs)
- [Databricks REST API Documentation](https://docs.databricks.com/api/workspace/introduction)
- [Model Context Protocol](https://modelcontextprotocol.io)
