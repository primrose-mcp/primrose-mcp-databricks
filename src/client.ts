/**
 * Databricks API Client
 *
 * Handles all HTTP communication with the Databricks REST API.
 *
 * MULTI-TENANT: This client receives credentials per-request via TenantCredentials,
 * allowing a single server to serve multiple tenants with different workspaces.
 */

import type {
  Catalog,
  Cluster,
  ClusterEvent,
  DbfsFileInfo,
  DbfsReadResponse,
  Experiment,
  ExperimentRun,
  Function,
  GitCredential,
  InstancePool,
  Job,
  ModelVersion,
  Pipeline,
  RegisteredModel,
  Repo,
  Run,
  Schema,
  SecretAcl,
  SecretMetadata,
  SecretScope,
  SqlWarehouse,
  StatementResponse,
  Table,
  TokenInfo,
  Volume,
  WorkspaceObject,
} from './types/databricks.js';
import type { TenantCredentials } from './types/env.js';
import { AuthenticationError, DatabricksApiError, RateLimitError } from './utils/errors.js';

// =============================================================================
// Databricks Client Interface
// =============================================================================

export interface DatabricksClient {
  // Connection
  testConnection(): Promise<{ connected: boolean; message: string }>;

  // SQL Statement Execution
  executeStatement(
    warehouseId: string,
    statement: string,
    options?: {
      catalog?: string;
      schema?: string;
      waitTimeout?: string;
      disposition?: 'INLINE' | 'EXTERNAL_LINKS';
      format?: 'JSON_ARRAY' | 'ARROW_STREAM' | 'CSV';
    }
  ): Promise<StatementResponse>;
  getStatementStatus(statementId: string): Promise<StatementResponse>;
  getStatementResultChunk(statementId: string, chunkIndex: number): Promise<unknown>;
  cancelStatement(statementId: string): Promise<void>;

  // SQL Warehouses
  listWarehouses(): Promise<SqlWarehouse[]>;
  getWarehouse(warehouseId: string): Promise<SqlWarehouse>;
  startWarehouse(warehouseId: string): Promise<void>;
  stopWarehouse(warehouseId: string): Promise<void>;

  // Jobs
  listJobs(options?: { limit?: number; offset?: number; name?: string }): Promise<{ jobs: Job[]; has_more: boolean }>;
  getJob(jobId: number): Promise<Job>;
  createJob(settings: Job['settings']): Promise<{ job_id: number }>;
  updateJob(jobId: number, settings: Partial<Job['settings']>): Promise<void>;
  deleteJob(jobId: number): Promise<void>;
  runJobNow(jobId: number, params?: Record<string, unknown>): Promise<{ run_id: number }>;
  listRuns(options?: {
    jobId?: number;
    activeOnly?: boolean;
    completedOnly?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{ runs: Run[]; has_more: boolean }>;
  getRun(runId: number): Promise<Run>;
  getRunOutput(runId: number): Promise<unknown>;
  cancelRun(runId: number): Promise<void>;
  cancelAllRuns(jobId: number): Promise<void>;

  // Clusters
  listClusters(): Promise<Cluster[]>;
  getCluster(clusterId: string): Promise<Cluster>;
  createCluster(spec: Partial<Cluster>): Promise<{ cluster_id: string }>;
  editCluster(clusterId: string, spec: Partial<Cluster>): Promise<void>;
  startCluster(clusterId: string): Promise<void>;
  restartCluster(clusterId: string): Promise<void>;
  terminateCluster(clusterId: string): Promise<void>;
  deleteCluster(clusterId: string): Promise<void>;
  listClusterEvents(clusterId: string, options?: { limit?: number }): Promise<{ events: ClusterEvent[]; next_page?: unknown }>;
  pinCluster(clusterId: string): Promise<void>;
  unpinCluster(clusterId: string): Promise<void>;

  // Workspace
  listWorkspace(path: string): Promise<WorkspaceObject[]>;
  getWorkspaceStatus(path: string): Promise<WorkspaceObject>;
  mkdirs(path: string): Promise<void>;
  deleteWorkspace(path: string, recursive?: boolean): Promise<void>;
  importWorkspace(
    path: string,
    content: string,
    format: 'SOURCE' | 'HTML' | 'JUPYTER' | 'DBC' | 'R_MARKDOWN',
    language?: 'SCALA' | 'PYTHON' | 'SQL' | 'R',
    overwrite?: boolean
  ): Promise<void>;
  exportWorkspace(
    path: string,
    format?: 'SOURCE' | 'HTML' | 'JUPYTER' | 'DBC' | 'R_MARKDOWN'
  ): Promise<{ content: string }>;

  // DBFS
  listDbfs(path: string): Promise<DbfsFileInfo[]>;
  getDbfsStatus(path: string): Promise<DbfsFileInfo>;
  mkdirsDbfs(path: string): Promise<void>;
  deleteDbfs(path: string, recursive?: boolean): Promise<void>;
  readDbfs(path: string, offset?: number, length?: number): Promise<DbfsReadResponse>;
  putDbfs(path: string, contents: string, overwrite?: boolean): Promise<void>;
  moveDbfs(sourcePath: string, destinationPath: string): Promise<void>;

  // Unity Catalog - Catalogs
  listCatalogs(): Promise<Catalog[]>;
  getCatalog(name: string): Promise<Catalog>;
  createCatalog(name: string, options?: { comment?: string; properties?: Record<string, string> }): Promise<Catalog>;
  updateCatalog(name: string, options: { comment?: string; owner?: string }): Promise<Catalog>;
  deleteCatalog(name: string, force?: boolean): Promise<void>;

  // Unity Catalog - Schemas
  listSchemas(catalogName: string): Promise<Schema[]>;
  getSchema(fullName: string): Promise<Schema>;
  createSchema(
    catalogName: string,
    name: string,
    options?: { comment?: string; properties?: Record<string, string> }
  ): Promise<Schema>;
  updateSchema(fullName: string, options: { comment?: string; owner?: string }): Promise<Schema>;
  deleteSchema(fullName: string): Promise<void>;

  // Unity Catalog - Tables
  listTables(catalogName: string, schemaName: string): Promise<Table[]>;
  getTable(fullName: string): Promise<Table>;
  deleteTable(fullName: string): Promise<void>;

  // Unity Catalog - Volumes
  listVolumes(catalogName: string, schemaName: string): Promise<Volume[]>;
  getVolume(fullName: string): Promise<Volume>;
  createVolume(
    catalogName: string,
    schemaName: string,
    name: string,
    volumeType: 'MANAGED' | 'EXTERNAL',
    options?: { storageLocation?: string; comment?: string }
  ): Promise<Volume>;
  updateVolume(fullName: string, options: { comment?: string; owner?: string }): Promise<Volume>;
  deleteVolume(fullName: string): Promise<void>;

  // Unity Catalog - Functions
  listFunctions(catalogName: string, schemaName: string): Promise<Function[]>;
  getFunction(fullName: string): Promise<Function>;

  // MLflow - Experiments
  listExperiments(options?: { maxResults?: number; pageToken?: string }): Promise<{ experiments: Experiment[]; next_page_token?: string }>;
  getExperiment(experimentId: string): Promise<Experiment>;
  getExperimentByName(experimentName: string): Promise<Experiment>;
  createExperiment(name: string, artifactLocation?: string): Promise<{ experiment_id: string }>;
  deleteExperiment(experimentId: string): Promise<void>;
  restoreExperiment(experimentId: string): Promise<void>;
  updateExperiment(experimentId: string, newName: string): Promise<void>;

  // MLflow - Runs
  searchMlflowRuns(options: {
    experimentIds: string[];
    filter?: string;
    maxResults?: number;
    orderBy?: string[];
    pageToken?: string;
  }): Promise<{ runs: ExperimentRun[]; next_page_token?: string }>;
  getMlflowRun(runId: string): Promise<ExperimentRun>;
  createMlflowRun(experimentId: string, options?: {
    runName?: string;
    startTime?: number;
    tags?: Array<{ key: string; value: string }>;
  }): Promise<ExperimentRun>;
  updateMlflowRun(runId: string, status: 'RUNNING' | 'SCHEDULED' | 'FINISHED' | 'FAILED' | 'KILLED', endTime?: number): Promise<void>;
  deleteMlflowRun(runId: string): Promise<void>;
  restoreMlflowRun(runId: string): Promise<void>;
  logMetric(runId: string, key: string, value: number, timestamp?: number, step?: number): Promise<void>;
  logParam(runId: string, key: string, value: string): Promise<void>;
  setTag(runId: string, key: string, value: string): Promise<void>;

  // MLflow - Models (Unity Catalog)
  listRegisteredModels(options?: { maxResults?: number; pageToken?: string }): Promise<{ registered_models: RegisteredModel[]; next_page_token?: string }>;
  getRegisteredModel(name: string): Promise<RegisteredModel>;
  createRegisteredModel(name: string, options?: { description?: string; tags?: Array<{ key: string; value: string }> }): Promise<RegisteredModel>;
  updateRegisteredModel(name: string, description: string): Promise<RegisteredModel>;
  deleteRegisteredModel(name: string): Promise<void>;
  listModelVersions(name: string): Promise<ModelVersion[]>;
  getModelVersion(name: string, version: string): Promise<ModelVersion>;
  deleteModelVersion(name: string, version: string): Promise<void>;

  // Secrets
  listSecretScopes(): Promise<SecretScope[]>;
  createSecretScope(scope: string, options?: { backendType?: 'DATABRICKS' }): Promise<void>;
  deleteSecretScope(scope: string): Promise<void>;
  listSecrets(scope: string): Promise<SecretMetadata[]>;
  putSecret(scope: string, key: string, stringValue: string): Promise<void>;
  deleteSecret(scope: string, key: string): Promise<void>;
  listSecretAcls(scope: string): Promise<SecretAcl[]>;
  getSecretAcl(scope: string, principal: string): Promise<SecretAcl>;
  putSecretAcl(scope: string, principal: string, permission: 'READ' | 'WRITE' | 'MANAGE'): Promise<void>;
  deleteSecretAcl(scope: string, principal: string): Promise<void>;

  // Repos
  listRepos(options?: { pathPrefix?: string; nextPageToken?: string }): Promise<{ repos: Repo[]; next_page_token?: string }>;
  getRepo(repoId: number): Promise<Repo>;
  createRepo(url: string, provider: string, path?: string): Promise<Repo>;
  updateRepo(repoId: number, options: { branch?: string; tag?: string }): Promise<Repo>;
  deleteRepo(repoId: number): Promise<void>;

  // Git Credentials
  listGitCredentials(): Promise<GitCredential[]>;
  createGitCredential(provider: string, username: string, personalAccessToken: string): Promise<GitCredential>;
  updateGitCredential(credentialId: number, username: string, personalAccessToken: string): Promise<void>;
  deleteGitCredential(credentialId: number): Promise<void>;

  // Instance Pools
  listInstancePools(): Promise<InstancePool[]>;
  getInstancePool(instancePoolId: string): Promise<InstancePool>;
  createInstancePool(spec: Partial<InstancePool>): Promise<{ instance_pool_id: string }>;
  editInstancePool(instancePoolId: string, spec: Partial<InstancePool>): Promise<void>;
  deleteInstancePool(instancePoolId: string): Promise<void>;

  // Pipelines (Delta Live Tables)
  listPipelines(options?: { maxResults?: number; pageToken?: string; filter?: string }): Promise<{ statuses: Pipeline[]; next_page_token?: string }>;
  getPipeline(pipelineId: string): Promise<Pipeline>;
  createPipeline(spec: Partial<Pipeline>): Promise<{ pipeline_id: string }>;
  updatePipeline(pipelineId: string, spec: Partial<Pipeline>): Promise<void>;
  deletePipeline(pipelineId: string): Promise<void>;
  startPipelineUpdate(pipelineId: string, options?: { fullRefresh?: boolean }): Promise<{ update_id: string }>;
  stopPipeline(pipelineId: string): Promise<void>;

  // Tokens
  listTokens(): Promise<TokenInfo[]>;
  createToken(comment?: string, lifetimeSeconds?: number): Promise<{ token_value: string; token_info: TokenInfo }>;
  revokeToken(tokenId: string): Promise<void>;
}

// =============================================================================
// Databricks Client Implementation
// =============================================================================

class DatabricksClientImpl implements DatabricksClient {
  private credentials: TenantCredentials;
  private baseUrl: string;

  constructor(credentials: TenantCredentials) {
    this.credentials = credentials;
    // Normalize host URL (remove trailing slash)
    this.baseUrl = credentials.host.replace(/\/$/, '');
  }

  // ===========================================================================
  // HTTP Request Helper
  // ===========================================================================

  private getAuthHeaders(): Record<string, string> {
    if (!this.credentials.token) {
      throw new AuthenticationError(
        'No credentials provided. Include X-Databricks-Token header.'
      );
    }

    return {
      Authorization: `Bearer ${this.credentials.token}`,
      'Content-Type': 'application/json',
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getAuthHeaders(),
        ...(options.headers || {}),
      },
    });

    // Handle rate limiting
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      throw new RateLimitError(
        'Rate limit exceeded',
        retryAfter ? Number.parseInt(retryAfter, 10) : 60
      );
    }

    // Handle authentication errors
    if (response.status === 401 || response.status === 403) {
      throw new AuthenticationError(
        'Authentication failed. Check your Databricks personal access token.'
      );
    }

    // Handle other errors
    if (!response.ok) {
      const errorBody = await response.text();
      let message = `API error: ${response.status}`;
      let errorCode: string | undefined;
      try {
        const errorJson = JSON.parse(errorBody);
        message = errorJson.message || errorJson.error || message;
        errorCode = errorJson.error_code;
      } catch {
        // Use default message
      }
      throw new DatabricksApiError(message, response.status, errorCode);
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return undefined as T;
    }

    const text = await response.text();
    if (!text) {
      return undefined as T;
    }
    return JSON.parse(text) as T;
  }

  private async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  private async post<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  private async put<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  private async patch<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  private async delete<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  // ===========================================================================
  // Connection
  // ===========================================================================

  async testConnection(): Promise<{ connected: boolean; message: string }> {
    try {
      await this.get<{ user_name: string }>('/api/2.0/preview/scim/v2/Me');
      return { connected: true, message: 'Successfully connected to Databricks workspace' };
    } catch (error) {
      return {
        connected: false,
        message: error instanceof Error ? error.message : 'Connection failed',
      };
    }
  }

  // ===========================================================================
  // SQL Statement Execution
  // ===========================================================================

  async executeStatement(
    warehouseId: string,
    statement: string,
    options?: {
      catalog?: string;
      schema?: string;
      waitTimeout?: string;
      disposition?: 'INLINE' | 'EXTERNAL_LINKS';
      format?: 'JSON_ARRAY' | 'ARROW_STREAM' | 'CSV';
    }
  ): Promise<StatementResponse> {
    return this.post<StatementResponse>('/api/2.0/sql/statements', {
      warehouse_id: warehouseId,
      statement,
      catalog: options?.catalog,
      schema: options?.schema,
      wait_timeout: options?.waitTimeout || '50s',
      disposition: options?.disposition || 'INLINE',
      format: options?.format || 'JSON_ARRAY',
    });
  }

  async getStatementStatus(statementId: string): Promise<StatementResponse> {
    return this.get<StatementResponse>(`/api/2.0/sql/statements/${statementId}`);
  }

  async getStatementResultChunk(statementId: string, chunkIndex: number): Promise<unknown> {
    return this.get(`/api/2.0/sql/statements/${statementId}/result/chunks/${chunkIndex}`);
  }

  async cancelStatement(statementId: string): Promise<void> {
    await this.post(`/api/2.0/sql/statements/${statementId}/cancel`);
  }

  // ===========================================================================
  // SQL Warehouses
  // ===========================================================================

  async listWarehouses(): Promise<SqlWarehouse[]> {
    const response = await this.get<{ warehouses?: SqlWarehouse[] }>('/api/2.0/sql/warehouses');
    return response.warehouses || [];
  }

  async getWarehouse(warehouseId: string): Promise<SqlWarehouse> {
    return this.get<SqlWarehouse>(`/api/2.0/sql/warehouses/${warehouseId}`);
  }

  async startWarehouse(warehouseId: string): Promise<void> {
    await this.post(`/api/2.0/sql/warehouses/${warehouseId}/start`);
  }

  async stopWarehouse(warehouseId: string): Promise<void> {
    await this.post(`/api/2.0/sql/warehouses/${warehouseId}/stop`);
  }

  // ===========================================================================
  // Jobs
  // ===========================================================================

  async listJobs(options?: {
    limit?: number;
    offset?: number;
    name?: string;
  }): Promise<{ jobs: Job[]; has_more: boolean }> {
    const params = new URLSearchParams();
    if (options?.limit) params.set('limit', String(options.limit));
    if (options?.offset) params.set('offset', String(options.offset));
    if (options?.name) params.set('name', options.name);
    const queryString = params.toString();
    const response = await this.get<{ jobs?: Job[]; has_more?: boolean }>(
      `/api/2.1/jobs/list${queryString ? `?${queryString}` : ''}`
    );
    return { jobs: response.jobs || [], has_more: response.has_more || false };
  }

  async getJob(jobId: number): Promise<Job> {
    return this.get<Job>(`/api/2.1/jobs/get?job_id=${jobId}`);
  }

  async createJob(settings: Job['settings']): Promise<{ job_id: number }> {
    return this.post<{ job_id: number }>('/api/2.1/jobs/create', settings);
  }

  async updateJob(jobId: number, settings: Partial<Job['settings']>): Promise<void> {
    await this.post('/api/2.1/jobs/update', { job_id: jobId, new_settings: settings });
  }

  async deleteJob(jobId: number): Promise<void> {
    await this.post('/api/2.1/jobs/delete', { job_id: jobId });
  }

  async runJobNow(jobId: number, params?: Record<string, unknown>): Promise<{ run_id: number }> {
    return this.post<{ run_id: number }>('/api/2.1/jobs/run-now', {
      job_id: jobId,
      ...params,
    });
  }

  async listRuns(options?: {
    jobId?: number;
    activeOnly?: boolean;
    completedOnly?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{ runs: Run[]; has_more: boolean }> {
    const params = new URLSearchParams();
    if (options?.jobId) params.set('job_id', String(options.jobId));
    if (options?.activeOnly) params.set('active_only', 'true');
    if (options?.completedOnly) params.set('completed_only', 'true');
    if (options?.limit) params.set('limit', String(options.limit));
    if (options?.offset) params.set('offset', String(options.offset));
    const queryString = params.toString();
    const response = await this.get<{ runs?: Run[]; has_more?: boolean }>(
      `/api/2.1/jobs/runs/list${queryString ? `?${queryString}` : ''}`
    );
    return { runs: response.runs || [], has_more: response.has_more || false };
  }

  async getRun(runId: number | string): Promise<Run> {
    return this.get<Run>(`/api/2.1/jobs/runs/get?run_id=${runId}`);
  }

  async getRunOutput(runId: number): Promise<unknown> {
    return this.get(`/api/2.1/jobs/runs/get-output?run_id=${runId}`);
  }

  async cancelRun(runId: number): Promise<void> {
    await this.post('/api/2.1/jobs/runs/cancel', { run_id: runId });
  }

  async cancelAllRuns(jobId: number): Promise<void> {
    await this.post('/api/2.1/jobs/runs/cancel-all', { job_id: jobId });
  }

  // ===========================================================================
  // Clusters
  // ===========================================================================

  async listClusters(): Promise<Cluster[]> {
    const response = await this.get<{ clusters?: Cluster[] }>('/api/2.0/clusters/list');
    return response.clusters || [];
  }

  async getCluster(clusterId: string): Promise<Cluster> {
    return this.get<Cluster>(`/api/2.0/clusters/get?cluster_id=${clusterId}`);
  }

  async createCluster(spec: Partial<Cluster>): Promise<{ cluster_id: string }> {
    return this.post<{ cluster_id: string }>('/api/2.0/clusters/create', spec);
  }

  async editCluster(clusterId: string, spec: Partial<Cluster>): Promise<void> {
    await this.post('/api/2.0/clusters/edit', { cluster_id: clusterId, ...spec });
  }

  async startCluster(clusterId: string): Promise<void> {
    await this.post('/api/2.0/clusters/start', { cluster_id: clusterId });
  }

  async restartCluster(clusterId: string): Promise<void> {
    await this.post('/api/2.0/clusters/restart', { cluster_id: clusterId });
  }

  async terminateCluster(clusterId: string): Promise<void> {
    await this.post('/api/2.0/clusters/delete', { cluster_id: clusterId });
  }

  async deleteCluster(clusterId: string): Promise<void> {
    await this.post('/api/2.0/clusters/permanent-delete', { cluster_id: clusterId });
  }

  async listClusterEvents(
    clusterId: string,
    options?: { limit?: number }
  ): Promise<{ events: ClusterEvent[]; next_page?: unknown }> {
    const response = await this.post<{ events?: ClusterEvent[]; next_page?: unknown }>(
      '/api/2.0/clusters/events',
      { cluster_id: clusterId, limit: options?.limit || 50 }
    );
    return { events: response.events || [], next_page: response.next_page };
  }

  async pinCluster(clusterId: string): Promise<void> {
    await this.post('/api/2.0/clusters/pin', { cluster_id: clusterId });
  }

  async unpinCluster(clusterId: string): Promise<void> {
    await this.post('/api/2.0/clusters/unpin', { cluster_id: clusterId });
  }

  // ===========================================================================
  // Workspace
  // ===========================================================================

  async listWorkspace(path: string): Promise<WorkspaceObject[]> {
    const response = await this.get<{ objects?: WorkspaceObject[] }>(
      `/api/2.0/workspace/list?path=${encodeURIComponent(path)}`
    );
    return response.objects || [];
  }

  async getWorkspaceStatus(path: string): Promise<WorkspaceObject> {
    return this.get<WorkspaceObject>(`/api/2.0/workspace/get-status?path=${encodeURIComponent(path)}`);
  }

  async mkdirs(path: string): Promise<void> {
    await this.post('/api/2.0/workspace/mkdirs', { path });
  }

  async deleteWorkspace(path: string, recursive = false): Promise<void> {
    await this.post('/api/2.0/workspace/delete', { path, recursive });
  }

  async importWorkspace(
    path: string,
    content: string,
    format: 'SOURCE' | 'HTML' | 'JUPYTER' | 'DBC' | 'R_MARKDOWN',
    language?: 'SCALA' | 'PYTHON' | 'SQL' | 'R',
    overwrite = false
  ): Promise<void> {
    await this.post('/api/2.0/workspace/import', {
      path,
      content,
      format,
      language,
      overwrite,
    });
  }

  async exportWorkspace(
    path: string,
    format: 'SOURCE' | 'HTML' | 'JUPYTER' | 'DBC' | 'R_MARKDOWN' = 'SOURCE'
  ): Promise<{ content: string }> {
    return this.get<{ content: string }>(
      `/api/2.0/workspace/export?path=${encodeURIComponent(path)}&format=${format}`
    );
  }

  // ===========================================================================
  // DBFS
  // ===========================================================================

  async listDbfs(path: string): Promise<DbfsFileInfo[]> {
    const response = await this.get<{ files?: DbfsFileInfo[] }>(
      `/api/2.0/dbfs/list?path=${encodeURIComponent(path)}`
    );
    return response.files || [];
  }

  async getDbfsStatus(path: string): Promise<DbfsFileInfo> {
    return this.get<DbfsFileInfo>(`/api/2.0/dbfs/get-status?path=${encodeURIComponent(path)}`);
  }

  async mkdirsDbfs(path: string): Promise<void> {
    await this.post('/api/2.0/dbfs/mkdirs', { path });
  }

  async deleteDbfs(path: string, recursive = false): Promise<void> {
    await this.post('/api/2.0/dbfs/delete', { path, recursive });
  }

  async readDbfs(path: string, offset = 0, length = 1048576): Promise<DbfsReadResponse> {
    return this.get<DbfsReadResponse>(
      `/api/2.0/dbfs/read?path=${encodeURIComponent(path)}&offset=${offset}&length=${length}`
    );
  }

  async putDbfs(path: string, contents: string, overwrite = false): Promise<void> {
    await this.post('/api/2.0/dbfs/put', { path, contents, overwrite });
  }

  async moveDbfs(sourcePath: string, destinationPath: string): Promise<void> {
    await this.post('/api/2.0/dbfs/move', {
      source_path: sourcePath,
      destination_path: destinationPath,
    });
  }

  // ===========================================================================
  // Unity Catalog - Catalogs
  // ===========================================================================

  async listCatalogs(): Promise<Catalog[]> {
    const response = await this.get<{ catalogs?: Catalog[] }>('/api/2.1/unity-catalog/catalogs');
    return response.catalogs || [];
  }

  async getCatalog(name: string): Promise<Catalog> {
    return this.get<Catalog>(`/api/2.1/unity-catalog/catalogs/${encodeURIComponent(name)}`);
  }

  async createCatalog(
    name: string,
    options?: { comment?: string; properties?: Record<string, string> }
  ): Promise<Catalog> {
    return this.post<Catalog>('/api/2.1/unity-catalog/catalogs', {
      name,
      comment: options?.comment,
      properties: options?.properties,
    });
  }

  async updateCatalog(
    name: string,
    options: { comment?: string; owner?: string }
  ): Promise<Catalog> {
    return this.patch<Catalog>(`/api/2.1/unity-catalog/catalogs/${encodeURIComponent(name)}`, options);
  }

  async deleteCatalog(name: string, force = false): Promise<void> {
    await this.delete(`/api/2.1/unity-catalog/catalogs/${encodeURIComponent(name)}?force=${force}`);
  }

  // ===========================================================================
  // Unity Catalog - Schemas
  // ===========================================================================

  async listSchemas(catalogName: string): Promise<Schema[]> {
    const response = await this.get<{ schemas?: Schema[] }>(
      `/api/2.1/unity-catalog/schemas?catalog_name=${encodeURIComponent(catalogName)}`
    );
    return response.schemas || [];
  }

  async getSchema(fullName: string): Promise<Schema> {
    return this.get<Schema>(`/api/2.1/unity-catalog/schemas/${encodeURIComponent(fullName)}`);
  }

  async createSchema(
    catalogName: string,
    name: string,
    options?: { comment?: string; properties?: Record<string, string> }
  ): Promise<Schema> {
    return this.post<Schema>('/api/2.1/unity-catalog/schemas', {
      catalog_name: catalogName,
      name,
      comment: options?.comment,
      properties: options?.properties,
    });
  }

  async updateSchema(
    fullName: string,
    options: { comment?: string; owner?: string }
  ): Promise<Schema> {
    return this.patch<Schema>(
      `/api/2.1/unity-catalog/schemas/${encodeURIComponent(fullName)}`,
      options
    );
  }

  async deleteSchema(fullName: string): Promise<void> {
    await this.delete(`/api/2.1/unity-catalog/schemas/${encodeURIComponent(fullName)}`);
  }

  // ===========================================================================
  // Unity Catalog - Tables
  // ===========================================================================

  async listTables(catalogName: string, schemaName: string): Promise<Table[]> {
    const response = await this.get<{ tables?: Table[] }>(
      `/api/2.1/unity-catalog/tables?catalog_name=${encodeURIComponent(catalogName)}&schema_name=${encodeURIComponent(schemaName)}`
    );
    return response.tables || [];
  }

  async getTable(fullName: string): Promise<Table> {
    return this.get<Table>(`/api/2.1/unity-catalog/tables/${encodeURIComponent(fullName)}`);
  }

  async deleteTable(fullName: string): Promise<void> {
    await this.delete(`/api/2.1/unity-catalog/tables/${encodeURIComponent(fullName)}`);
  }

  // ===========================================================================
  // Unity Catalog - Volumes
  // ===========================================================================

  async listVolumes(catalogName: string, schemaName: string): Promise<Volume[]> {
    const response = await this.get<{ volumes?: Volume[] }>(
      `/api/2.1/unity-catalog/volumes?catalog_name=${encodeURIComponent(catalogName)}&schema_name=${encodeURIComponent(schemaName)}`
    );
    return response.volumes || [];
  }

  async getVolume(fullName: string): Promise<Volume> {
    return this.get<Volume>(`/api/2.1/unity-catalog/volumes/${encodeURIComponent(fullName)}`);
  }

  async createVolume(
    catalogName: string,
    schemaName: string,
    name: string,
    volumeType: 'MANAGED' | 'EXTERNAL',
    options?: { storageLocation?: string; comment?: string }
  ): Promise<Volume> {
    return this.post<Volume>('/api/2.1/unity-catalog/volumes', {
      catalog_name: catalogName,
      schema_name: schemaName,
      name,
      volume_type: volumeType,
      storage_location: options?.storageLocation,
      comment: options?.comment,
    });
  }

  async updateVolume(
    fullName: string,
    options: { comment?: string; owner?: string }
  ): Promise<Volume> {
    return this.patch<Volume>(
      `/api/2.1/unity-catalog/volumes/${encodeURIComponent(fullName)}`,
      options
    );
  }

  async deleteVolume(fullName: string): Promise<void> {
    await this.delete(`/api/2.1/unity-catalog/volumes/${encodeURIComponent(fullName)}`);
  }

  // ===========================================================================
  // Unity Catalog - Functions
  // ===========================================================================

  async listFunctions(catalogName: string, schemaName: string): Promise<Function[]> {
    const response = await this.get<{ functions?: Function[] }>(
      `/api/2.1/unity-catalog/functions?catalog_name=${encodeURIComponent(catalogName)}&schema_name=${encodeURIComponent(schemaName)}`
    );
    return response.functions || [];
  }

  async getFunction(fullName: string): Promise<Function> {
    return this.get<Function>(`/api/2.1/unity-catalog/functions/${encodeURIComponent(fullName)}`);
  }

  // ===========================================================================
  // MLflow - Experiments
  // ===========================================================================

  async listExperiments(options?: {
    maxResults?: number;
    pageToken?: string;
  }): Promise<{ experiments: Experiment[]; next_page_token?: string }> {
    const params = new URLSearchParams();
    if (options?.maxResults) params.set('max_results', String(options.maxResults));
    if (options?.pageToken) params.set('page_token', options.pageToken);
    const queryString = params.toString();
    const response = await this.get<{ experiments?: Experiment[]; next_page_token?: string }>(
      `/api/2.0/mlflow/experiments/search${queryString ? `?${queryString}` : ''}`
    );
    return { experiments: response.experiments || [], next_page_token: response.next_page_token };
  }

  async getExperiment(experimentId: string): Promise<Experiment> {
    const response = await this.get<{ experiment: Experiment }>(
      `/api/2.0/mlflow/experiments/get?experiment_id=${experimentId}`
    );
    return response.experiment;
  }

  async getExperimentByName(experimentName: string): Promise<Experiment> {
    const response = await this.get<{ experiment: Experiment }>(
      `/api/2.0/mlflow/experiments/get-by-name?experiment_name=${encodeURIComponent(experimentName)}`
    );
    return response.experiment;
  }

  async createExperiment(
    name: string,
    artifactLocation?: string
  ): Promise<{ experiment_id: string }> {
    return this.post<{ experiment_id: string }>('/api/2.0/mlflow/experiments/create', {
      name,
      artifact_location: artifactLocation,
    });
  }

  async deleteExperiment(experimentId: string): Promise<void> {
    await this.post('/api/2.0/mlflow/experiments/delete', { experiment_id: experimentId });
  }

  async restoreExperiment(experimentId: string): Promise<void> {
    await this.post('/api/2.0/mlflow/experiments/restore', { experiment_id: experimentId });
  }

  async updateExperiment(experimentId: string, newName: string): Promise<void> {
    await this.post('/api/2.0/mlflow/experiments/update', {
      experiment_id: experimentId,
      new_name: newName,
    });
  }

  // ===========================================================================
  // MLflow - Runs
  // ===========================================================================

  async searchMlflowRuns(options: {
    experimentIds: string[];
    filter?: string;
    maxResults?: number;
    orderBy?: string[];
    pageToken?: string;
  }): Promise<{ runs: ExperimentRun[]; next_page_token?: string }> {
    const response = await this.post<{ runs?: ExperimentRun[]; next_page_token?: string }>(
      '/api/2.0/mlflow/runs/search',
      {
        experiment_ids: options.experimentIds,
        filter: options.filter,
        max_results: options.maxResults,
        order_by: options.orderBy,
        page_token: options.pageToken,
      }
    );
    return { runs: response.runs || [], next_page_token: response.next_page_token };
  }

  async getMlflowRun(runId: string): Promise<ExperimentRun> {
    const response = await this.get<{ run: ExperimentRun }>(
      `/api/2.0/mlflow/runs/get?run_id=${encodeURIComponent(runId)}`
    );
    return response.run;
  }

  async createMlflowRun(
    experimentId: string,
    options?: {
      runName?: string;
      startTime?: number;
      tags?: Array<{ key: string; value: string }>;
    }
  ): Promise<ExperimentRun> {
    const response = await this.post<{ run: ExperimentRun }>('/api/2.0/mlflow/runs/create', {
      experiment_id: experimentId,
      run_name: options?.runName,
      start_time: options?.startTime || Date.now(),
      tags: options?.tags,
    });
    return response.run;
  }

  async updateMlflowRun(
    runId: string,
    status: 'RUNNING' | 'SCHEDULED' | 'FINISHED' | 'FAILED' | 'KILLED',
    endTime?: number
  ): Promise<void> {
    await this.post('/api/2.0/mlflow/runs/update', {
      run_id: runId,
      status,
      end_time: endTime,
    });
  }

  async deleteMlflowRun(runId: string): Promise<void> {
    await this.post('/api/2.0/mlflow/runs/delete', { run_id: runId });
  }

  async restoreMlflowRun(runId: string): Promise<void> {
    await this.post('/api/2.0/mlflow/runs/restore', { run_id: runId });
  }

  async logMetric(
    runId: string,
    key: string,
    value: number,
    timestamp?: number,
    step?: number
  ): Promise<void> {
    await this.post('/api/2.0/mlflow/runs/log-metric', {
      run_id: runId,
      key,
      value,
      timestamp: timestamp || Date.now(),
      step,
    });
  }

  async logParam(runId: string, key: string, value: string): Promise<void> {
    await this.post('/api/2.0/mlflow/runs/log-parameter', {
      run_id: runId,
      key,
      value,
    });
  }

  async setTag(runId: string, key: string, value: string): Promise<void> {
    await this.post('/api/2.0/mlflow/runs/set-tag', {
      run_id: runId,
      key,
      value,
    });
  }

  // ===========================================================================
  // MLflow - Models
  // ===========================================================================

  async listRegisteredModels(options?: {
    maxResults?: number;
    pageToken?: string;
  }): Promise<{ registered_models: RegisteredModel[]; next_page_token?: string }> {
    const params = new URLSearchParams();
    if (options?.maxResults) params.set('max_results', String(options.maxResults));
    if (options?.pageToken) params.set('page_token', options.pageToken);
    const queryString = params.toString();
    const response = await this.get<{
      registered_models?: RegisteredModel[];
      next_page_token?: string;
    }>(`/api/2.0/mlflow/registered-models/search${queryString ? `?${queryString}` : ''}`);
    return {
      registered_models: response.registered_models || [],
      next_page_token: response.next_page_token,
    };
  }

  async getRegisteredModel(name: string): Promise<RegisteredModel> {
    const response = await this.get<{ registered_model: RegisteredModel }>(
      `/api/2.0/mlflow/registered-models/get?name=${encodeURIComponent(name)}`
    );
    return response.registered_model;
  }

  async createRegisteredModel(
    name: string,
    options?: { description?: string; tags?: Array<{ key: string; value: string }> }
  ): Promise<RegisteredModel> {
    const response = await this.post<{ registered_model: RegisteredModel }>(
      '/api/2.0/mlflow/registered-models/create',
      {
        name,
        description: options?.description,
        tags: options?.tags,
      }
    );
    return response.registered_model;
  }

  async updateRegisteredModel(name: string, description: string): Promise<RegisteredModel> {
    const response = await this.patch<{ registered_model: RegisteredModel }>(
      '/api/2.0/mlflow/registered-models/update',
      { name, description }
    );
    return response.registered_model;
  }

  async deleteRegisteredModel(name: string): Promise<void> {
    await this.delete(`/api/2.0/mlflow/registered-models/delete?name=${encodeURIComponent(name)}`);
  }

  async listModelVersions(name: string): Promise<ModelVersion[]> {
    const response = await this.get<{ model_versions?: ModelVersion[] }>(
      `/api/2.0/mlflow/model-versions/search?filter=name='${encodeURIComponent(name)}'`
    );
    return response.model_versions || [];
  }

  async getModelVersion(name: string, version: string): Promise<ModelVersion> {
    const response = await this.get<{ model_version: ModelVersion }>(
      `/api/2.0/mlflow/model-versions/get?name=${encodeURIComponent(name)}&version=${version}`
    );
    return response.model_version;
  }

  async deleteModelVersion(name: string, version: string): Promise<void> {
    await this.delete(
      `/api/2.0/mlflow/model-versions/delete?name=${encodeURIComponent(name)}&version=${version}`
    );
  }

  // ===========================================================================
  // Secrets
  // ===========================================================================

  async listSecretScopes(): Promise<SecretScope[]> {
    const response = await this.get<{ scopes?: SecretScope[] }>('/api/2.0/secrets/scopes/list');
    return response.scopes || [];
  }

  async createSecretScope(scope: string, options?: { backendType?: 'DATABRICKS' }): Promise<void> {
    await this.post('/api/2.0/secrets/scopes/create', {
      scope,
      scope_backend_type: options?.backendType || 'DATABRICKS',
    });
  }

  async deleteSecretScope(scope: string): Promise<void> {
    await this.post('/api/2.0/secrets/scopes/delete', { scope });
  }

  async listSecrets(scope: string): Promise<SecretMetadata[]> {
    const response = await this.get<{ secrets?: SecretMetadata[] }>(
      `/api/2.0/secrets/list?scope=${encodeURIComponent(scope)}`
    );
    return response.secrets || [];
  }

  async putSecret(scope: string, key: string, stringValue: string): Promise<void> {
    await this.post('/api/2.0/secrets/put', {
      scope,
      key,
      string_value: stringValue,
    });
  }

  async deleteSecret(scope: string, key: string): Promise<void> {
    await this.post('/api/2.0/secrets/delete', { scope, key });
  }

  async listSecretAcls(scope: string): Promise<SecretAcl[]> {
    const response = await this.get<{ items?: SecretAcl[] }>(
      `/api/2.0/secrets/acls/list?scope=${encodeURIComponent(scope)}`
    );
    return response.items || [];
  }

  async getSecretAcl(scope: string, principal: string): Promise<SecretAcl> {
    return this.get<SecretAcl>(
      `/api/2.0/secrets/acls/get?scope=${encodeURIComponent(scope)}&principal=${encodeURIComponent(principal)}`
    );
  }

  async putSecretAcl(
    scope: string,
    principal: string,
    permission: 'READ' | 'WRITE' | 'MANAGE'
  ): Promise<void> {
    await this.post('/api/2.0/secrets/acls/put', { scope, principal, permission });
  }

  async deleteSecretAcl(scope: string, principal: string): Promise<void> {
    await this.post('/api/2.0/secrets/acls/delete', { scope, principal });
  }

  // ===========================================================================
  // Repos
  // ===========================================================================

  async listRepos(options?: {
    pathPrefix?: string;
    nextPageToken?: string;
  }): Promise<{ repos: Repo[]; next_page_token?: string }> {
    const params = new URLSearchParams();
    if (options?.pathPrefix) params.set('path_prefix', options.pathPrefix);
    if (options?.nextPageToken) params.set('next_page_token', options.nextPageToken);
    const queryString = params.toString();
    const response = await this.get<{ repos?: Repo[]; next_page_token?: string }>(
      `/api/2.0/repos${queryString ? `?${queryString}` : ''}`
    );
    return { repos: response.repos || [], next_page_token: response.next_page_token };
  }

  async getRepo(repoId: number): Promise<Repo> {
    return this.get<Repo>(`/api/2.0/repos/${repoId}`);
  }

  async createRepo(url: string, provider: string, path?: string): Promise<Repo> {
    return this.post<Repo>('/api/2.0/repos', { url, provider, path });
  }

  async updateRepo(repoId: number, options: { branch?: string; tag?: string }): Promise<Repo> {
    return this.patch<Repo>(`/api/2.0/repos/${repoId}`, options);
  }

  async deleteRepo(repoId: number): Promise<void> {
    await this.delete(`/api/2.0/repos/${repoId}`);
  }

  // ===========================================================================
  // Git Credentials
  // ===========================================================================

  async listGitCredentials(): Promise<GitCredential[]> {
    const response = await this.get<{ credentials?: GitCredential[] }>('/api/2.0/git-credentials');
    return response.credentials || [];
  }

  async createGitCredential(
    provider: string,
    username: string,
    personalAccessToken: string
  ): Promise<GitCredential> {
    return this.post<GitCredential>('/api/2.0/git-credentials', {
      git_provider: provider,
      git_username: username,
      personal_access_token: personalAccessToken,
    });
  }

  async updateGitCredential(
    credentialId: number,
    username: string,
    personalAccessToken: string
  ): Promise<void> {
    await this.patch(`/api/2.0/git-credentials/${credentialId}`, {
      git_username: username,
      personal_access_token: personalAccessToken,
    });
  }

  async deleteGitCredential(credentialId: number): Promise<void> {
    await this.delete(`/api/2.0/git-credentials/${credentialId}`);
  }

  // ===========================================================================
  // Instance Pools
  // ===========================================================================

  async listInstancePools(): Promise<InstancePool[]> {
    const response = await this.get<{ instance_pools?: InstancePool[] }>(
      '/api/2.0/instance-pools/list'
    );
    return response.instance_pools || [];
  }

  async getInstancePool(instancePoolId: string): Promise<InstancePool> {
    return this.get<InstancePool>(
      `/api/2.0/instance-pools/get?instance_pool_id=${instancePoolId}`
    );
  }

  async createInstancePool(spec: Partial<InstancePool>): Promise<{ instance_pool_id: string }> {
    return this.post<{ instance_pool_id: string }>('/api/2.0/instance-pools/create', spec);
  }

  async editInstancePool(instancePoolId: string, spec: Partial<InstancePool>): Promise<void> {
    await this.post('/api/2.0/instance-pools/edit', { instance_pool_id: instancePoolId, ...spec });
  }

  async deleteInstancePool(instancePoolId: string): Promise<void> {
    await this.post('/api/2.0/instance-pools/delete', { instance_pool_id: instancePoolId });
  }

  // ===========================================================================
  // Pipelines (Delta Live Tables)
  // ===========================================================================

  async listPipelines(options?: {
    maxResults?: number;
    pageToken?: string;
    filter?: string;
  }): Promise<{ statuses: Pipeline[]; next_page_token?: string }> {
    const params = new URLSearchParams();
    if (options?.maxResults) params.set('max_results', String(options.maxResults));
    if (options?.pageToken) params.set('page_token', options.pageToken);
    if (options?.filter) params.set('filter', options.filter);
    const queryString = params.toString();
    const response = await this.get<{ statuses?: Pipeline[]; next_page_token?: string }>(
      `/api/2.0/pipelines${queryString ? `?${queryString}` : ''}`
    );
    return { statuses: response.statuses || [], next_page_token: response.next_page_token };
  }

  async getPipeline(pipelineId: string): Promise<Pipeline> {
    return this.get<Pipeline>(`/api/2.0/pipelines/${pipelineId}`);
  }

  async createPipeline(spec: Partial<Pipeline>): Promise<{ pipeline_id: string }> {
    return this.post<{ pipeline_id: string }>('/api/2.0/pipelines', spec);
  }

  async updatePipeline(pipelineId: string, spec: Partial<Pipeline>): Promise<void> {
    await this.put(`/api/2.0/pipelines/${pipelineId}`, spec);
  }

  async deletePipeline(pipelineId: string): Promise<void> {
    await this.delete(`/api/2.0/pipelines/${pipelineId}`);
  }

  async startPipelineUpdate(
    pipelineId: string,
    options?: { fullRefresh?: boolean }
  ): Promise<{ update_id: string }> {
    return this.post<{ update_id: string }>(`/api/2.0/pipelines/${pipelineId}/updates`, {
      full_refresh: options?.fullRefresh,
    });
  }

  async stopPipeline(pipelineId: string): Promise<void> {
    await this.post(`/api/2.0/pipelines/${pipelineId}/stop`);
  }

  // ===========================================================================
  // Tokens
  // ===========================================================================

  async listTokens(): Promise<TokenInfo[]> {
    const response = await this.get<{ token_infos?: TokenInfo[] }>('/api/2.0/token/list');
    return response.token_infos || [];
  }

  async createToken(
    comment?: string,
    lifetimeSeconds?: number
  ): Promise<{ token_value: string; token_info: TokenInfo }> {
    return this.post<{ token_value: string; token_info: TokenInfo }>('/api/2.0/token/create', {
      comment,
      lifetime_seconds: lifetimeSeconds,
    });
  }

  async revokeToken(tokenId: string): Promise<void> {
    await this.post('/api/2.0/token/delete', { token_id: tokenId });
  }
}

// =============================================================================
// Factory Function
// =============================================================================

/**
 * Create a Databricks client instance with tenant-specific credentials.
 *
 * @param credentials - Tenant credentials parsed from request headers
 */
export function createDatabricksClient(credentials: TenantCredentials): DatabricksClient {
  return new DatabricksClientImpl(credentials);
}
