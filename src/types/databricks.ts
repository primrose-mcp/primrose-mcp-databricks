/**
 * Databricks API Types
 *
 * Type definitions for Databricks API responses and requests.
 */

// =============================================================================
// Common Types
// =============================================================================

export interface PaginatedResponse<T> {
  items: T[];
  count: number;
  hasMore: boolean;
  nextPageToken?: string;
}

// =============================================================================
// SQL Statement Execution
// =============================================================================

export interface StatementExecutionRequest {
  warehouse_id: string;
  statement: string;
  catalog?: string;
  schema?: string;
  wait_timeout?: string;
  on_wait_timeout?: 'CONTINUE' | 'CANCEL';
  disposition?: 'INLINE' | 'EXTERNAL_LINKS';
  format?: 'JSON_ARRAY' | 'ARROW_STREAM' | 'CSV';
  byte_limit?: number;
}

export interface StatementStatus {
  state: 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'CANCELED' | 'CLOSED';
  error?: {
    error_code: string;
    message: string;
  };
}

export interface StatementManifest {
  format: string;
  schema: {
    column_count: number;
    columns: Array<{
      name: string;
      type_text: string;
      type_name: string;
      position: number;
    }>;
  };
  total_chunk_count: number;
  total_row_count: number;
  total_byte_count: number;
  truncated: boolean;
}

export interface StatementResult {
  chunk_index: number;
  row_offset: number;
  row_count: number;
  data_array?: unknown[][];
  external_links?: Array<{
    chunk_index: number;
    row_offset: number;
    row_count: number;
    byte_count: number;
    external_link: string;
    expiration: string;
  }>;
}

export interface StatementResponse {
  statement_id: string;
  status: StatementStatus;
  manifest?: StatementManifest;
  result?: StatementResult;
}

// =============================================================================
// Jobs
// =============================================================================

export interface Job {
  job_id: number;
  creator_user_name?: string;
  settings: JobSettings;
  created_time?: number;
  run_as_user_name?: string;
}

export interface JobSettings {
  name?: string;
  tasks?: JobTask[];
  job_clusters?: JobCluster[];
  email_notifications?: EmailNotifications;
  webhook_notifications?: WebhookNotifications;
  timeout_seconds?: number;
  max_concurrent_runs?: number;
  schedule?: CronSchedule;
  format?: 'SINGLE_TASK' | 'MULTI_TASK';
}

export interface JobTask {
  task_key: string;
  description?: string;
  depends_on?: Array<{ task_key: string }>;
  existing_cluster_id?: string;
  new_cluster?: NewCluster;
  job_cluster_key?: string;
  notebook_task?: NotebookTask;
  spark_jar_task?: SparkJarTask;
  spark_python_task?: SparkPythonTask;
  spark_submit_task?: SparkSubmitTask;
  pipeline_task?: PipelineTask;
  python_wheel_task?: PythonWheelTask;
  sql_task?: SqlTask;
  dbt_task?: DbtTask;
  run_job_task?: RunJobTask;
  timeout_seconds?: number;
  max_retries?: number;
  min_retry_interval_millis?: number;
  retry_on_timeout?: boolean;
}

export interface JobCluster {
  job_cluster_key: string;
  new_cluster: NewCluster;
}

export interface NotebookTask {
  notebook_path: string;
  base_parameters?: Record<string, string>;
  source?: 'WORKSPACE' | 'GIT';
}

export interface SparkJarTask {
  main_class_name: string;
  parameters?: string[];
}

export interface SparkPythonTask {
  python_file: string;
  parameters?: string[];
  source?: 'WORKSPACE' | 'GIT' | 'S3';
}

export interface SparkSubmitTask {
  parameters?: string[];
}

export interface PipelineTask {
  pipeline_id: string;
  full_refresh?: boolean;
}

export interface PythonWheelTask {
  package_name: string;
  entry_point?: string;
  parameters?: string[];
  named_parameters?: Record<string, string>;
}

export interface SqlTask {
  warehouse_id: string;
  query?: { query_id: string };
  dashboard?: { dashboard_id: string };
  alert?: { alert_id: string };
  parameters?: Record<string, string>;
}

export interface DbtTask {
  commands: string[];
  project_directory?: string;
  profiles_directory?: string;
  warehouse_id?: string;
  catalog?: string;
  schema?: string;
}

export interface RunJobTask {
  job_id: number;
  job_parameters?: Record<string, string>;
}

export interface EmailNotifications {
  on_start?: string[];
  on_success?: string[];
  on_failure?: string[];
  no_alert_for_skipped_runs?: boolean;
}

export interface WebhookNotifications {
  on_start?: Array<{ id: string }>;
  on_success?: Array<{ id: string }>;
  on_failure?: Array<{ id: string }>;
}

export interface CronSchedule {
  quartz_cron_expression: string;
  timezone_id: string;
  pause_status?: 'PAUSED' | 'UNPAUSED';
}

export interface Run {
  run_id: number;
  run_name?: string;
  job_id: number;
  creator_user_name?: string;
  number_in_job?: number;
  original_attempt_run_id?: number;
  state?: RunState;
  schedule?: CronSchedule;
  tasks?: RunTask[];
  job_clusters?: JobCluster[];
  cluster_spec?: ClusterSpec;
  cluster_instance?: ClusterInstance;
  start_time?: number;
  setup_duration?: number;
  execution_duration?: number;
  cleanup_duration?: number;
  end_time?: number;
  trigger?: TriggerType;
  run_type?: 'JOB_RUN' | 'WORKFLOW_RUN' | 'SUBMIT_RUN';
  attempt_number?: number;
}

export interface RunState {
  life_cycle_state?:
    | 'PENDING'
    | 'RUNNING'
    | 'TERMINATING'
    | 'TERMINATED'
    | 'SKIPPED'
    | 'INTERNAL_ERROR'
    | 'BLOCKED'
    | 'WAITING_FOR_RETRY';
  result_state?: 'SUCCESS' | 'FAILED' | 'TIMEDOUT' | 'CANCELED' | 'MAXIMUM_CONCURRENT_RUNS_REACHED';
  state_message?: string;
  user_canceled_or_timedout?: boolean;
}

export interface RunTask {
  run_id: number;
  task_key: string;
  description?: string;
  state?: RunState;
  depends_on?: Array<{ task_key: string }>;
  existing_cluster_id?: string;
  new_cluster?: NewCluster;
  job_cluster_key?: string;
  start_time?: number;
  setup_duration?: number;
  execution_duration?: number;
  cleanup_duration?: number;
  end_time?: number;
  attempt_number?: number;
}

export interface ClusterSpec {
  existing_cluster_id?: string;
  new_cluster?: NewCluster;
  libraries?: Library[];
}

export interface ClusterInstance {
  cluster_id?: string;
  spark_context_id?: string;
}

export type TriggerType = 'PERIODIC' | 'ONE_TIME' | 'RETRY' | 'RUN_JOB_TASK' | 'FILE_ARRIVAL';

// =============================================================================
// Clusters
// =============================================================================

export interface Cluster {
  cluster_id: string;
  cluster_name: string;
  spark_version: string;
  spark_conf?: Record<string, string>;
  aws_attributes?: AwsAttributes;
  azure_attributes?: AzureAttributes;
  gcp_attributes?: GcpAttributes;
  node_type_id?: string;
  driver_node_type_id?: string;
  ssh_public_keys?: string[];
  custom_tags?: Record<string, string>;
  cluster_log_conf?: ClusterLogConf;
  init_scripts?: InitScriptInfo[];
  spark_env_vars?: Record<string, string>;
  autotermination_minutes?: number;
  enable_elastic_disk?: boolean;
  instance_pool_id?: string;
  driver_instance_pool_id?: string;
  policy_id?: string;
  enable_local_disk_encryption?: boolean;
  runtime_engine?: 'STANDARD' | 'PHOTON';
  num_workers?: number;
  autoscale?: AutoScale;
  state?:
    | 'PENDING'
    | 'RUNNING'
    | 'RESTARTING'
    | 'RESIZING'
    | 'TERMINATING'
    | 'TERMINATED'
    | 'ERROR'
    | 'UNKNOWN';
  state_message?: string;
  start_time?: number;
  terminated_time?: number;
  last_state_loss_time?: number;
  last_activity_time?: number;
  cluster_memory_mb?: number;
  cluster_cores?: number;
  default_tags?: Record<string, string>;
  cluster_log_status?: ClusterLogStatus;
  termination_reason?: TerminationReason;
  creator_user_name?: string;
  cluster_source?: 'UI' | 'JOB' | 'API' | 'SQL' | 'MODELS' | 'PIPELINE' | 'PIPELINE_MAINTENANCE';
  spec?: ClusterSpec;
}

export interface NewCluster {
  spark_version: string;
  spark_conf?: Record<string, string>;
  aws_attributes?: AwsAttributes;
  azure_attributes?: AzureAttributes;
  gcp_attributes?: GcpAttributes;
  node_type_id?: string;
  driver_node_type_id?: string;
  ssh_public_keys?: string[];
  custom_tags?: Record<string, string>;
  cluster_log_conf?: ClusterLogConf;
  init_scripts?: InitScriptInfo[];
  spark_env_vars?: Record<string, string>;
  autotermination_minutes?: number;
  enable_elastic_disk?: boolean;
  instance_pool_id?: string;
  driver_instance_pool_id?: string;
  policy_id?: string;
  enable_local_disk_encryption?: boolean;
  runtime_engine?: 'STANDARD' | 'PHOTON';
  num_workers?: number;
  autoscale?: AutoScale;
}

export interface AwsAttributes {
  first_on_demand?: number;
  availability?: 'SPOT' | 'ON_DEMAND' | 'SPOT_WITH_FALLBACK';
  zone_id?: string;
  instance_profile_arn?: string;
  spot_bid_price_percent?: number;
  ebs_volume_type?: 'GENERAL_PURPOSE_SSD' | 'THROUGHPUT_OPTIMIZED_HDD';
  ebs_volume_count?: number;
  ebs_volume_size?: number;
  ebs_volume_iops?: number;
  ebs_volume_throughput?: number;
}

export interface AzureAttributes {
  first_on_demand?: number;
  availability?: 'SPOT_AZURE' | 'ON_DEMAND_AZURE' | 'SPOT_WITH_FALLBACK_AZURE';
  spot_bid_max_price?: number;
}

export interface GcpAttributes {
  use_preemptible_executors?: boolean;
  google_service_account?: string;
  boot_disk_size?: number;
  local_ssd_count?: number;
  zone_id?: string;
  availability?: 'PREEMPTIBLE_GCP' | 'ON_DEMAND_GCP' | 'PREEMPTIBLE_WITH_FALLBACK_GCP';
}

export interface ClusterLogConf {
  dbfs?: { destination: string };
  s3?: {
    destination: string;
    region?: string;
    endpoint?: string;
    enable_encryption?: boolean;
    encryption_type?: string;
    kms_key?: string;
    canned_acl?: string;
  };
}

export interface InitScriptInfo {
  workspace?: { destination: string };
  volumes?: { destination: string };
  dbfs?: { destination: string };
  s3?: { destination: string; region?: string };
  gcs?: { destination: string };
  abfss?: { destination: string };
}

export interface AutoScale {
  min_workers: number;
  max_workers: number;
}

export interface ClusterLogStatus {
  last_attempted?: number;
  last_exception?: string;
}

export interface TerminationReason {
  code?: string;
  type?: string;
  parameters?: Record<string, string>;
}

export interface Library {
  jar?: string;
  egg?: string;
  whl?: string;
  pypi?: { package: string; repo?: string };
  maven?: { coordinates: string; repo?: string; exclusions?: string[] };
  cran?: { package: string; repo?: string };
}

export interface ClusterEvent {
  cluster_id: string;
  timestamp?: number;
  type?:
    | 'CREATING'
    | 'DID_NOT_EXPAND_DISK'
    | 'EXPANDED_DISK'
    | 'FAILED_TO_EXPAND_DISK'
    | 'INIT_SCRIPTS_STARTED'
    | 'INIT_SCRIPTS_FINISHED'
    | 'STARTING'
    | 'RESTARTING'
    | 'TERMINATING'
    | 'EDITED'
    | 'RUNNING'
    | 'RESIZING'
    | 'UPSIZE_COMPLETED'
    | 'NODES_LOST'
    | 'DRIVER_HEALTHY'
    | 'DRIVER_UNAVAILABLE'
    | 'SPARK_EXCEPTION'
    | 'DRIVER_NOT_RESPONDING'
    | 'DBFS_DOWN'
    | 'METASTORE_DOWN'
    | 'NODE_BLACKLISTED'
    | 'PINNED'
    | 'UNPINNED';
  details?: Record<string, unknown>;
}

// =============================================================================
// Workspace
// =============================================================================

export interface WorkspaceObject {
  path: string;
  object_type: 'NOTEBOOK' | 'DIRECTORY' | 'LIBRARY' | 'FILE' | 'REPO' | 'DASHBOARD';
  object_id?: number;
  language?: 'SCALA' | 'PYTHON' | 'SQL' | 'R';
  created_at?: number;
  modified_at?: number;
  size?: number;
}

export interface WorkspaceExportResponse {
  content: string;
  file_type?: string;
}

// =============================================================================
// DBFS
// =============================================================================

export interface DbfsFileInfo {
  path: string;
  is_dir: boolean;
  file_size?: number;
  modification_time?: number;
}

export interface DbfsReadResponse {
  bytes_read: number;
  data: string;
}

export interface DbfsCreateResponse {
  handle: number;
}

// =============================================================================
// Unity Catalog
// =============================================================================

export interface Catalog {
  name: string;
  owner?: string;
  comment?: string;
  metastore_id?: string;
  created_at?: number;
  created_by?: string;
  updated_at?: number;
  updated_by?: string;
  catalog_type?: 'MANAGED_CATALOG' | 'DELTASHARING_CATALOG' | 'SYSTEM_CATALOG';
  storage_root?: string;
  storage_location?: string;
  isolation_mode?: 'ISOLATED' | 'OPEN';
  options?: Record<string, string>;
  properties?: Record<string, string>;
  provider_name?: string;
  share_name?: string;
  full_name?: string;
  securable_type?: string;
  securable_kind?: string;
  browse_only?: boolean;
}

export interface Schema {
  name: string;
  catalog_name: string;
  owner?: string;
  comment?: string;
  metastore_id?: string;
  full_name?: string;
  created_at?: number;
  created_by?: string;
  updated_at?: number;
  updated_by?: string;
  storage_root?: string;
  storage_location?: string;
  properties?: Record<string, string>;
  securable_type?: string;
  securable_kind?: string;
  browse_only?: boolean;
}

export interface Table {
  name: string;
  catalog_name: string;
  schema_name: string;
  table_type: 'MANAGED' | 'EXTERNAL' | 'VIEW' | 'MATERIALIZED_VIEW' | 'STREAMING_TABLE';
  data_source_format?:
    | 'DELTA'
    | 'CSV'
    | 'JSON'
    | 'AVRO'
    | 'PARQUET'
    | 'ORC'
    | 'TEXT'
    | 'UNITY_CATALOG'
    | 'DELTASHARING';
  columns?: TableColumn[];
  storage_location?: string;
  view_definition?: string;
  sql_path?: string;
  owner?: string;
  comment?: string;
  properties?: Record<string, string>;
  storage_credential_name?: string;
  metastore_id?: string;
  full_name?: string;
  data_access_configuration_id?: string;
  created_at?: number;
  created_by?: string;
  updated_at?: number;
  updated_by?: string;
  deleted_at?: number;
  row_filter?: TableRowFilter;
  table_constraints?: TableConstraint[];
  securable_type?: string;
  securable_kind?: string;
  browse_only?: boolean;
}

export interface TableColumn {
  name: string;
  type_text: string;
  type_json: string;
  type_name:
    | 'BOOLEAN'
    | 'BYTE'
    | 'SHORT'
    | 'INT'
    | 'LONG'
    | 'FLOAT'
    | 'DOUBLE'
    | 'DATE'
    | 'TIMESTAMP'
    | 'TIMESTAMP_NTZ'
    | 'STRING'
    | 'BINARY'
    | 'DECIMAL'
    | 'INTERVAL'
    | 'ARRAY'
    | 'STRUCT'
    | 'MAP'
    | 'CHAR'
    | 'NULL'
    | 'USER_DEFINED_TYPE'
    | 'TABLE_TYPE'
    | 'VARIANT';
  type_precision?: number;
  type_scale?: number;
  type_interval_type?: string;
  position: number;
  comment?: string;
  nullable?: boolean;
  partition_index?: number;
  mask?: ColumnMask;
}

export interface ColumnMask {
  function_name: string;
  using_column_names?: string[];
}

export interface TableRowFilter {
  function_name: string;
  input_column_names: string[];
}

export interface TableConstraint {
  name: string;
  primary_key_constraint?: PrimaryKeyConstraint;
  foreign_key_constraint?: ForeignKeyConstraint;
  named_table_constraint?: NamedTableConstraint;
}

export interface PrimaryKeyConstraint {
  child_columns: string[];
}

export interface ForeignKeyConstraint {
  child_columns: string[];
  parent_table: string;
  parent_columns: string[];
}

export interface NamedTableConstraint {
  name: string;
}

export interface Volume {
  name: string;
  catalog_name: string;
  schema_name: string;
  volume_type: 'MANAGED' | 'EXTERNAL';
  full_name?: string;
  storage_location?: string;
  owner?: string;
  comment?: string;
  metastore_id?: string;
  created_at?: number;
  created_by?: string;
  updated_at?: number;
  updated_by?: string;
  securable_type?: string;
  securable_kind?: string;
  browse_only?: boolean;
}

export interface Function {
  name: string;
  catalog_name: string;
  schema_name: string;
  input_params?: FunctionParameterInfos;
  return_params?: FunctionParameterInfos;
  data_type:
    | 'BOOLEAN'
    | 'BYTE'
    | 'SHORT'
    | 'INT'
    | 'LONG'
    | 'FLOAT'
    | 'DOUBLE'
    | 'DATE'
    | 'TIMESTAMP'
    | 'TIMESTAMP_NTZ'
    | 'STRING'
    | 'BINARY'
    | 'DECIMAL'
    | 'INTERVAL'
    | 'ARRAY'
    | 'STRUCT'
    | 'MAP'
    | 'CHAR'
    | 'NULL'
    | 'USER_DEFINED_TYPE'
    | 'TABLE_TYPE'
    | 'VARIANT';
  full_data_type?: string;
  routine_body: 'SQL' | 'EXTERNAL';
  routine_definition?: string;
  routine_dependencies?: Array<{ table?: { table_full_name: string }; function?: { function_full_name: string } }>;
  parameter_style?: 'S';
  is_deterministic?: boolean;
  sql_data_access?: 'CONTAINS_SQL' | 'READS_SQL_DATA' | 'NO_SQL';
  is_null_call?: boolean;
  security_type?: 'DEFINER';
  specific_name?: string;
  external_name?: string;
  external_language?: string;
  sql_path?: string;
  owner?: string;
  comment?: string;
  properties?: string;
  metastore_id?: string;
  full_name?: string;
  created_at?: number;
  created_by?: string;
  updated_at?: number;
  updated_by?: string;
  securable_type?: string;
  securable_kind?: string;
  browse_only?: boolean;
}

export interface FunctionParameterInfos {
  parameters?: FunctionParameterInfo[];
}

export interface FunctionParameterInfo {
  name: string;
  type_text: string;
  type_json: string;
  type_name: string;
  type_precision?: number;
  type_scale?: number;
  type_interval_type?: string;
  position: number;
  parameter_mode?: 'IN';
  parameter_type?: 'PARAM' | 'COLUMN';
  parameter_default?: string;
  comment?: string;
}

// =============================================================================
// MLflow
// =============================================================================

export interface Experiment {
  experiment_id: string;
  name: string;
  artifact_location?: string;
  lifecycle_stage?: 'active' | 'deleted';
  last_update_time?: number;
  creation_time?: number;
  tags?: Array<{ key: string; value: string }>;
}

export interface ExperimentRun {
  info: RunInfo;
  data?: RunData;
  inputs?: RunInputs;
}

export interface RunInfo {
  run_id: string;
  run_uuid?: string;
  experiment_id: string;
  user_id?: string;
  status: 'RUNNING' | 'SCHEDULED' | 'FINISHED' | 'FAILED' | 'KILLED';
  start_time?: number;
  end_time?: number;
  artifact_uri?: string;
  lifecycle_stage?: 'active' | 'deleted';
}

export interface RunData {
  metrics?: Array<{
    key: string;
    value: number;
    timestamp?: number;
    step?: number;
  }>;
  params?: Array<{ key: string; value: string }>;
  tags?: Array<{ key: string; value: string }>;
}

export interface RunInputs {
  dataset_inputs?: Array<{
    dataset: {
      name: string;
      digest: string;
      source_type?: string;
      source?: string;
    };
    tags?: Array<{ key: string; value: string }>;
  }>;
}

export interface RegisteredModel {
  name: string;
  creation_timestamp?: number;
  last_updated_timestamp?: number;
  user_id?: string;
  description?: string;
  latest_versions?: ModelVersion[];
  tags?: Array<{ key: string; value: string }>;
  aliases?: Array<{ alias: string; version: string }>;
}

export interface ModelVersion {
  name: string;
  version: string;
  creation_timestamp?: number;
  last_updated_timestamp?: number;
  user_id?: string;
  current_stage?: string;
  description?: string;
  source?: string;
  run_id?: string;
  status?: 'PENDING_REGISTRATION' | 'FAILED_REGISTRATION' | 'READY';
  status_message?: string;
  run_link?: string;
  tags?: Array<{ key: string; value: string }>;
  aliases?: string[];
}

// =============================================================================
// Secrets
// =============================================================================

export interface SecretScope {
  name: string;
  backend_type?: 'DATABRICKS' | 'AZURE_KEYVAULT';
  keyvault_metadata?: {
    resource_id: string;
    dns_name: string;
  };
}

export interface SecretMetadata {
  key: string;
  last_updated_timestamp?: number;
}

export interface SecretAcl {
  principal: string;
  permission: 'READ' | 'WRITE' | 'MANAGE';
}

// =============================================================================
// SQL Warehouses
// =============================================================================

export interface SqlWarehouse {
  id: string;
  name: string;
  cluster_size?: string;
  min_num_clusters?: number;
  max_num_clusters?: number;
  auto_stop_mins?: number;
  auto_resume?: boolean;
  creator_name?: string;
  creator_id?: number;
  tags?: {
    custom_tags?: Array<{ key: string; value: string }>;
  };
  spot_instance_policy?: 'COST_OPTIMIZED' | 'RELIABILITY_OPTIMIZED' | 'POLICY_UNSPECIFIED';
  enable_photon?: boolean;
  channel?: { name: 'CHANNEL_NAME_UNSPECIFIED' | 'CHANNEL_NAME_CURRENT' | 'CHANNEL_NAME_PREVIEW' };
  enable_serverless_compute?: boolean;
  warehouse_type?: 'CLASSIC' | 'PRO' | 'TYPE_UNSPECIFIED';
  num_clusters?: number;
  num_active_sessions?: number;
  state?:
    | 'STARTING'
    | 'RUNNING'
    | 'STOPPING'
    | 'STOPPED'
    | 'DELETING'
    | 'DELETED'
    | 'STATE_UNSPECIFIED';
  jdbc_url?: string;
  odbc_params?: {
    hostname?: string;
    path?: string;
    protocol?: string;
    port?: number;
  };
  health?: {
    status?: 'STATUS_UNSPECIFIED' | 'HEALTHY' | 'DEGRADED' | 'FAILED';
    message?: string;
    failure_reason?: {
      code?: string;
      type?: string;
      parameters?: Record<string, string>;
    };
    summary?: string;
    details?: string;
  };
}

// =============================================================================
// Pipelines (Delta Live Tables)
// =============================================================================

export interface Pipeline {
  pipeline_id: string;
  name?: string;
  state?:
    | 'DEPLOYING'
    | 'STARTING'
    | 'RUNNING'
    | 'STOPPING'
    | 'IDLE'
    | 'FAILED'
    | 'RESETTING'
    | 'DELETING';
  cluster_id?: string;
  creator_user_name?: string;
  run_as_user_name?: string;
  latest_updates?: PipelineStateInfo[];
  last_modified?: number;
  catalog?: string;
  target?: string;
  storage?: string;
  continuous?: boolean;
  development?: boolean;
  photon?: boolean;
  edition?: string;
  channel?: string;
  clusters?: PipelineCluster[];
  libraries?: PipelineLibrary[];
  filters?: { include?: string[]; exclude?: string[] };
  configuration?: Record<string, string>;
  spec?: PipelineSpec;
}

export interface PipelineStateInfo {
  update_id?: string;
  state?:
    | 'QUEUED'
    | 'INITIALIZING'
    | 'WAITING_FOR_RESOURCES'
    | 'RUNNING'
    | 'STOPPING'
    | 'COMPLETED'
    | 'FAILED'
    | 'CANCELED'
    | 'RESETTING';
  creation_time?: string;
}

export interface PipelineCluster {
  label?: string;
  node_type_id?: string;
  driver_node_type_id?: string;
  spark_conf?: Record<string, string>;
  aws_attributes?: AwsAttributes;
  azure_attributes?: AzureAttributes;
  gcp_attributes?: GcpAttributes;
  custom_tags?: Record<string, string>;
  spark_env_vars?: Record<string, string>;
  autoscale?: AutoScale;
  num_workers?: number;
  init_scripts?: InitScriptInfo[];
  instance_pool_id?: string;
  driver_instance_pool_id?: string;
  policy_id?: string;
  enable_local_disk_encryption?: boolean;
}

export interface PipelineLibrary {
  notebook?: { path: string };
  jar?: string;
  maven?: { coordinates: string; repo?: string; exclusions?: string[] };
  whl?: string;
  file?: { path: string };
}

export interface PipelineSpec {
  id?: string;
  name?: string;
  storage?: string;
  configuration?: Record<string, string>;
  clusters?: PipelineCluster[];
  libraries?: PipelineLibrary[];
  target?: string;
  filters?: { include?: string[]; exclude?: string[] };
  continuous?: boolean;
  development?: boolean;
  photon?: boolean;
  edition?: string;
  channel?: string;
  catalog?: string;
  notifications?: Array<{
    alerts?: string[];
    email_recipients?: string[];
  }>;
}

// =============================================================================
// Repos
// =============================================================================

export interface Repo {
  id: number;
  path?: string;
  url?: string;
  provider?: 'gitHub' | 'bitbucketCloud' | 'gitLab' | 'azureDevOpsServices' | 'gitHubEnterprise' | 'bitbucketServer' | 'gitLabEnterpriseEdition' | 'awsCodeCommit';
  branch?: string;
  head_commit_id?: string;
  sparse_checkout?: {
    patterns?: string[];
  };
}

// =============================================================================
// Git Credentials
// =============================================================================

export interface GitCredential {
  credential_id: number;
  git_username?: string;
  git_provider:
    | 'gitHub'
    | 'bitbucketCloud'
    | 'gitLab'
    | 'azureDevOpsServices'
    | 'gitHubEnterprise'
    | 'bitbucketServer'
    | 'gitLabEnterpriseEdition'
    | 'awsCodeCommit';
}

// =============================================================================
// Instance Pools
// =============================================================================

export interface InstancePool {
  instance_pool_id: string;
  instance_pool_name: string;
  node_type_id: string;
  idle_instance_autotermination_minutes?: number;
  min_idle_instances?: number;
  max_capacity?: number;
  aws_attributes?: InstancePoolAwsAttributes;
  azure_attributes?: InstancePoolAzureAttributes;
  gcp_attributes?: InstancePoolGcpAttributes;
  preloaded_spark_versions?: string[];
  preloaded_docker_images?: Array<{ url: string; basic_auth?: { username: string; password: string } }>;
  custom_tags?: Record<string, string>;
  state?: 'ACTIVE' | 'DELETED';
  stats?: {
    used_count?: number;
    idle_count?: number;
    pending_used_count?: number;
    pending_idle_count?: number;
  };
  status?: {
    pending_instance_errors?: Array<{
      instance_id?: string;
      message?: string;
    }>;
  };
  default_tags?: Record<string, string>;
}

export interface InstancePoolAwsAttributes {
  availability?: 'SPOT' | 'ON_DEMAND' | 'SPOT_WITH_FALLBACK';
  zone_id?: string;
  spot_bid_price_percent?: number;
}

export interface InstancePoolAzureAttributes {
  availability?: 'SPOT_AZURE' | 'ON_DEMAND_AZURE' | 'SPOT_WITH_FALLBACK_AZURE';
  spot_bid_max_price?: number;
}

export interface InstancePoolGcpAttributes {
  gcp_availability?: 'PREEMPTIBLE_GCP' | 'ON_DEMAND_GCP' | 'PREEMPTIBLE_WITH_FALLBACK_GCP';
  local_ssd_count?: number;
}

// =============================================================================
// Token Management
// =============================================================================

export interface TokenInfo {
  token_id: string;
  creation_time?: number;
  expiry_time?: number;
  comment?: string;
  created_by_id?: number;
  created_by_username?: string;
}
