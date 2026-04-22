-- SmartNote-AI Production Schema Baseline
-- Scope: Multi-user/team, multi-agent orchestration, RAG memory, workflow automation,
-- audit/billing, and API key governance.
-- Database: PostgreSQL + pgvector

CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ------------------------------------------------------------------
-- 1) Users / Auth / Organization
-- ------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS workspace_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('admin','member','viewer')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (workspace_id, user_id)
);

-- RBAC tables:
-- - roles can be global (system) or workspace-scoped
-- - permissions are global capabilities (e.g. notes.read, agents.run)
-- - role_permissions is the role <-> permission mapping
-- - member_roles supports assigning multiple roles per workspace member
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (workspace_id, name)
);

CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS member_roles (
    workspace_member_id UUID NOT NULL REFERENCES workspace_members(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (workspace_member_id, role_id)
);

-- Optional ABAC resource attributes to complement RBAC
-- Keep common attributes normalized to enable policy checks in service layer.
CREATE TABLE IF NOT EXISTS resource_attributes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    resource_type TEXT NOT NULL,
    resource_id UUID NOT NULL,
    owner_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    project_id UUID,
    attributes JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (workspace_id, resource_type, resource_id)
);

-- ------------------------------------------------------------------
-- 2) Project / Notes / Files
-- ------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (workspace_id, id)
);

CREATE TABLE IF NOT EXISTS notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    project_id UUID NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    FOREIGN KEY (workspace_id, project_id) REFERENCES projects(workspace_id, id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    project_id UUID NOT NULL,
    filename TEXT NOT NULL,
    file_url TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    FOREIGN KEY (workspace_id, project_id) REFERENCES projects(workspace_id, id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    project_id UUID NOT NULL,
    title TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('todo','in_progress','done','blocked')),
    assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
    due_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    FOREIGN KEY (workspace_id, project_id) REFERENCES projects(workspace_id, id) ON DELETE CASCADE
);

-- ------------------------------------------------------------------
-- 3) Chat / AI Interaction
-- ------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (workspace_id, id),
    FOREIGN KEY (workspace_id, user_id) REFERENCES workspace_members(workspace_id, user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user','assistant','agent')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------
-- 4) Agent System
-- ------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    model TEXT NOT NULL,
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (workspace_id, id)
);

CREATE TABLE IF NOT EXISTS agent_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    skill_name TEXT NOT NULL,
    skill_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (agent_id, skill_name)
);

CREATE TABLE IF NOT EXISTS agent_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL,
    session_id UUID NOT NULL,
    input TEXT,
    output TEXT,
    status TEXT NOT NULL CHECK (status IN ('queued','running','completed','failed','cancelled')),
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    CHECK (finished_at IS NULL OR started_at IS NULL OR finished_at >= started_at),
    FOREIGN KEY (workspace_id, agent_id) REFERENCES agents(workspace_id, id) ON DELETE RESTRICT,
    FOREIGN KEY (workspace_id, session_id) REFERENCES sessions(workspace_id, id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS agent_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_run_id UUID NOT NULL REFERENCES agent_runs(id) ON DELETE CASCADE,
    log TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------
-- 5) Tool Calling
-- ------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS tools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    is_custom BOOLEAN NOT NULL DEFAULT false,
    CHECK ((is_custom = true AND workspace_id IS NOT NULL) OR (is_custom = false AND workspace_id IS NULL))
);

CREATE TABLE IF NOT EXISTS tool_calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_run_id UUID NOT NULL REFERENCES agent_runs(id) ON DELETE CASCADE,
    tool_id UUID NOT NULL REFERENCES tools(id) ON DELETE RESTRICT,
    input JSONB NOT NULL DEFAULT '{}'::jsonb,
    output JSONB,
    status TEXT NOT NULL CHECK (status IN ('queued','running','completed','failed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------
-- 6) Memory (RAG + pgvector)
-- ------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    project_id UUID,
    source_type TEXT NOT NULL CHECK (source_type IN ('message','note','file_chunk','kb_doc')),
    source_id UUID NOT NULL,
    chunk_index INTEGER,
    token_count INTEGER,
    embedding_model TEXT,
    content TEXT NOT NULL,
    embedding VECTOR(1536) NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS knowledge_base (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    project_id UUID,
    source_type TEXT NOT NULL CHECK (source_type IN ('message','note','file_chunk','kb_doc')),
    source_id UUID NOT NULL,
    chunk_index INTEGER,
    token_count INTEGER,
    embedding_model TEXT,
    content TEXT NOT NULL,
    embedding VECTOR(1536) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- ------------------------------------------------------------------
-- 7) Workflow Automation
-- ------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (workspace_id, id)
);

CREATE TABLE IF NOT EXISTS workflow_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('trigger','condition','action','agent')),
    config JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS workflow_edges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_node UUID NOT NULL REFERENCES workflow_nodes(id) ON DELETE CASCADE,
    to_node UUID NOT NULL REFERENCES workflow_nodes(id) ON DELETE CASCADE,
    CHECK (from_node <> to_node)
);

CREATE TABLE IF NOT EXISTS workflow_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    workflow_id UUID NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('queued','running','completed','failed','cancelled')),
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    CHECK (finished_at IS NULL OR started_at IS NULL OR finished_at >= started_at),
    FOREIGN KEY (workspace_id, workflow_id) REFERENCES workflows(workspace_id, id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS workflow_run_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_run_id UUID NOT NULL REFERENCES workflow_runs(id) ON DELETE CASCADE,
    node_id UUID NOT NULL REFERENCES workflow_nodes(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('queued','running','success','failed','skipped')),
    input JSONB,
    output JSONB,
    error TEXT,
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    attempt INTEGER NOT NULL DEFAULT 1 CHECK (attempt >= 1),
    CHECK (finished_at IS NULL OR started_at IS NULL OR finished_at >= started_at),
    UNIQUE (workflow_run_id, node_id, attempt)
);

-- ------------------------------------------------------------------
-- 8) Audit / Billing / API Keys
-- ------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    session_id UUID NOT NULL,
    agent_run_id UUID NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    agent_id UUID,
    provider TEXT NOT NULL,
    model TEXT NOT NULL,
    model_version TEXT NOT NULL,
    input_tokens INT NOT NULL DEFAULT 0 CHECK (input_tokens >= 0),
    output_tokens INT NOT NULL DEFAULT 0 CHECK (output_tokens >= 0),
    cached_tokens INT CHECK (cached_tokens IS NULL OR cached_tokens >= 0),
    unit_price_input NUMERIC(18, 8) NOT NULL CHECK (unit_price_input >= 0),
    unit_price_output NUMERIC(18, 8) NOT NULL CHECK (unit_price_output >= 0),
    currency CHAR(3) NOT NULL,
    cost_micro BIGINT NOT NULL DEFAULT 0 CHECK (cost_micro >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    FOREIGN KEY (workspace_id, agent_id) REFERENCES agents(workspace_id, id) ON DELETE SET NULL,
    FOREIGN KEY (workspace_id, session_id) REFERENCES sessions(workspace_id, id) ON DELETE CASCADE,
    FOREIGN KEY (workspace_id, agent_run_id) REFERENCES agent_runs(workspace_id, id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    key_hash TEXT NOT NULL,
    key_prefix TEXT NOT NULL,
    scopes TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ
);

-- ------------------------------------------------------------------
-- 9) Performance Indexes
-- ------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace_user ON workspace_members(workspace_id, user_id);
CREATE INDEX IF NOT EXISTS idx_roles_workspace_name ON roles(workspace_id, name);
CREATE UNIQUE INDEX IF NOT EXISTS uq_roles_system_name ON roles(name) WHERE workspace_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_permissions_code ON permissions(code);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_member_roles_member ON member_roles(workspace_member_id);
CREATE INDEX IF NOT EXISTS idx_member_roles_role ON member_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_resource_attributes_owner ON resource_attributes(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_resource_attributes_project ON resource_attributes(project_id);
CREATE INDEX IF NOT EXISTS idx_resource_attributes_lookup ON resource_attributes(workspace_id, resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_projects_workspace ON projects(workspace_id);
CREATE INDEX IF NOT EXISTS idx_notes_workspace_project ON notes(workspace_id, project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_workspace_project_status ON tasks(workspace_id, project_id, status);
CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id);
CREATE INDEX IF NOT EXISTS idx_agent_runs_workspace_session ON agent_runs(workspace_id, session_id);
CREATE INDEX IF NOT EXISTS idx_tool_calls_run ON tool_calls(agent_run_id);
CREATE INDEX IF NOT EXISTS idx_workflow_nodes_workflow ON workflow_nodes(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_workspace_workflow_status ON workflow_runs(workspace_id, workflow_id, status);
CREATE INDEX IF NOT EXISTS idx_workflow_run_nodes_run_status ON workflow_run_nodes(workflow_run_id, status);
CREATE INDEX IF NOT EXISTS idx_usage_logs_workspace_user_created_at ON usage_logs(workspace_id, user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_logs_workspace_daily ON usage_logs(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_logs_workspace_model_daily ON usage_logs(workspace_id, provider, model, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_logs_workspace_session ON usage_logs(workspace_id, session_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_workspace_agent_run ON usage_logs(workspace_id, agent_run_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_created_at ON audit_logs(user_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS uq_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_workspace_user ON api_keys(workspace_id, user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_active_lookup ON api_keys(workspace_id, revoked_at, expires_at);
CREATE UNIQUE INDEX IF NOT EXISTS uq_tools_global_name ON tools(name) WHERE is_custom = false;
CREATE UNIQUE INDEX IF NOT EXISTS uq_tools_workspace_name ON tools(workspace_id, name) WHERE is_custom = true;
CREATE INDEX IF NOT EXISTS idx_agents_workspace ON agents(workspace_id);
CREATE INDEX IF NOT EXISTS idx_embeddings_workspace ON embeddings(workspace_id);
CREATE INDEX IF NOT EXISTS idx_embeddings_workspace_source_lookup ON embeddings(workspace_id, source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_embeddings_workspace_created_at_desc ON embeddings(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_workspace ON knowledge_base(workspace_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_workspace_source_lookup ON knowledge_base(workspace_id, source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_workspace_created_at_desc ON knowledge_base(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workflows_workspace ON workflows(workspace_id);

-- NOTE:
-- If workspace cardinality is high or tenant data is large, prefer LIST partitioning by workspace_id
-- and create one vector index per partition for better maintenance and predictable recall latency.
CREATE INDEX IF NOT EXISTS idx_embeddings_ivfflat_cosine
  ON embeddings USING ivfflat (embedding vector_cosine_ops);

CREATE INDEX IF NOT EXISTS idx_knowledge_base_ivfflat_cosine
  ON knowledge_base USING ivfflat (embedding vector_cosine_ops);

-- ------------------------------------------------------------------
-- 10) RLS Workspace Guards
-- ------------------------------------------------------------------

CREATE OR REPLACE FUNCTION app_current_user_id() RETURNS UUID AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_user_id', true), '')::uuid;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION app_workspace_access(target_workspace UUID) RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM workspace_members wm
        WHERE wm.workspace_id = target_workspace
          AND wm.user_id = app_current_user_id()
    );
END;
$$ LANGUAGE plpgsql STABLE;

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY projects_workspace_isolation ON projects
    USING (app_workspace_access(workspace_id))
    WITH CHECK (app_workspace_access(workspace_id));

CREATE POLICY notes_workspace_isolation ON notes
    USING (app_workspace_access(workspace_id))
    WITH CHECK (app_workspace_access(workspace_id));

CREATE POLICY files_workspace_isolation ON files
    USING (app_workspace_access(workspace_id))
    WITH CHECK (app_workspace_access(workspace_id));

CREATE POLICY tasks_workspace_isolation ON tasks
    USING (app_workspace_access(workspace_id))
    WITH CHECK (app_workspace_access(workspace_id));

CREATE POLICY sessions_workspace_isolation ON sessions
    USING (
        app_workspace_access(workspace_id)
        AND user_id = app_current_user_id()
    )
    WITH CHECK (
        app_workspace_access(workspace_id)
        AND user_id = app_current_user_id()
    );

CREATE POLICY agents_workspace_isolation ON agents
    USING (app_workspace_access(workspace_id))
    WITH CHECK (app_workspace_access(workspace_id));

CREATE POLICY agent_runs_workspace_isolation ON agent_runs
    USING (app_workspace_access(workspace_id))
    WITH CHECK (app_workspace_access(workspace_id));

CREATE POLICY tools_workspace_isolation ON tools
    USING (
        (is_custom = false)
        OR app_workspace_access(workspace_id)
    )
    WITH CHECK (
        (is_custom = false AND workspace_id IS NULL)
        OR (is_custom = true AND app_workspace_access(workspace_id))
    );

CREATE POLICY embeddings_workspace_isolation ON embeddings
    USING (app_workspace_access(workspace_id))
    WITH CHECK (app_workspace_access(workspace_id));

CREATE POLICY knowledge_base_workspace_isolation ON knowledge_base
    USING (app_workspace_access(workspace_id))
    WITH CHECK (app_workspace_access(workspace_id));

CREATE POLICY workflows_workspace_isolation ON workflows
    USING (app_workspace_access(workspace_id))
    WITH CHECK (app_workspace_access(workspace_id));

CREATE POLICY workflow_runs_workspace_isolation ON workflow_runs
    USING (app_workspace_access(workspace_id))
    WITH CHECK (app_workspace_access(workspace_id));

CREATE POLICY usage_logs_workspace_isolation ON usage_logs
    USING (app_workspace_access(workspace_id))
    WITH CHECK (app_workspace_access(workspace_id));

ANALYZE;
