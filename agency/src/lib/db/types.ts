export interface Base { id: string; org_id: string; created_at: string; updated_at: string }
type J = Record<string, unknown>;

export type AgentStatus = 'available' | 'working' | 'waiting_approval' | 'offline';
export type TaskStatus = 'pending' | 'blocked' | 'ready' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
export type ProjectStatus = 'planning' | 'in_progress' | 'review' | 'awaiting_ceo' | 'revision' | 'completed' | 'failed';
export type ApprovalStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'published';
export type ApprovalAction =
  | 'publish_content' | 'send_email' | 'send_prospect_message' | 'run_ads' | 'use_ad_budget'
  | 'change_public_info' | 'project_delivery';

export interface Organization extends Base { name: string; owner_id: string | null; approval_policy: Record<string, boolean>; settings: J }
export interface Profile extends Base { full_name: string | null; role: string }
export interface Department extends Base { name: string; description: string }
export interface AiAgent extends Base {
  key: string; name: string; avatar: string; job_title: string; department_id: string | null; department: string;
  personality: string; system_prompt: string; tools: string[]; status: AgentStatus; current_task_id: string | null;
  progress: number; last_activity_at: string | null; metrics: { tasks_completed: number; tasks_failed: number; avg_seconds: number; tokens: number; cost_usd: number };
  is_manager: boolean;
}
export interface AgentSkill extends Base { agent_id: string; skill: string; level: number }
export type MemoryKind = 'identity' | 'company' | 'client' | 'project' | 'task_history' | 'lesson';
export interface AgentMemory extends Base {
  agent_id: string | null; client_id: string | null; project_id: string | null; kind: MemoryKind;
  content: string; tags: string[]; importance: number;
}
export interface AgentConversation extends Base { agent_id: string; user_id: string | null; title: string }
export interface AgentMessage extends Base { conversation_id: string; role: 'user' | 'assistant'; content: string; tokens_in: number; tokens_out: number }
export interface Project extends Base {
  client_id: string | null; campaign_id: string | null; title: string; instruction: string; status: ProjectStatus;
  plan: J | null; final_report: string | null; revision_count: number; created_by: string | null; ceo_feedback: string | null;
}
export interface Task extends Base {
  project_id: string; agent_id: string; parent_task_id: string | null; key: string; title: string; description: string;
  status: TaskStatus; output: string | null; error: string | null; attempts: number; max_attempts: number;
  feedback: string | null; deliverable_type: string | null; started_at: string | null; completed_at: string | null;
}
export interface TaskDependency extends Base { task_id: string; depends_on_task_id: string }
export interface AgentAssignment extends Base { task_id: string; agent_id: string; assigned_by_agent_id: string | null; reason: string }
export interface AgentMessageInternal extends Base {
  project_id: string | null; task_id: string | null; from_agent_id: string; to_agent_id: string;
  kind: 'delegation' | 'request_help' | 'handoff' | 'review' | 'note'; content: string;
}
export interface Campaign extends Base {
  client_id: string | null; name: string; brand: string; objective: string; target_audience: string; budget: number;
  platforms: string[]; start_date: string | null; end_date: string | null; status: 'draft' | 'planning' | 'active' | 'completed';
  project_id: string | null; kpis: J;
}
export interface CampaignDeliverable extends Base { campaign_id: string; task_id: string | null; type: string; title: string; content: string | null; status: ApprovalStatus }
export interface Client extends Base { name: string; industry: string; website: string; contact_email: string; marketing_history: string; competitors: string; products: string; target_audience: string; notes: string }
export interface Brand extends Base { client_id: string; name: string; guidelines: string; tone_of_voice: string; colors: string; keywords: string }
export interface ClientDocument extends Base { client_id: string; title: string; content: string }
export interface ContentItem extends Base {
  client_id: string | null; campaign_id: string | null; project_id: string | null; task_id: string | null; agent_id: string | null;
  platform: string; type: string; title: string; body: string; hashtags: string[]; asset_url: string | null;
  status: ApprovalStatus; is_ai_generated: boolean; published_via: string | null; published_at: string | null;
}
export interface ContentCalendar extends Base { content_item_id: string | null; campaign_id: string | null; client_id: string | null; platform: string; title: string; scheduled_for: string; status: ApprovalStatus }
export interface Approval extends Base {
  action: ApprovalAction; title: string; description: string; status: ApprovalStatus; requested_by_agent_id: string | null;
  project_id: string | null; ref_table: string | null; ref_id: string | null; payload: J; decided_by: string | null;
  decided_at: string | null; decision_note: string | null;
}
export interface Integration extends Base { provider: string; status: 'connected' | 'not_configured' | 'error'; config: J }
export interface AnalyticsEvent extends Base { campaign_id: string | null; client_id: string | null; agent_id: string | null; metric: string; value: number; source: 'real' | 'simulated'; occurred_at: string }
export interface ActivityLog extends Base { agent_id: string | null; project_id: string | null; task_id: string | null; level: 'info' | 'warn' | 'error'; event: string; message: string; meta: J }
export interface Job extends Base { type: string; payload: J; status: 'pending' | 'running' | 'done' | 'failed'; attempts: number; max_attempts: number; run_at: string; last_error: string | null; locked_at: string | null }
export interface AiUsage extends Base { agent_id: string | null; task_id: string | null; provider: string; model: string; tokens_in: number; tokens_out: number; cost_usd: number; simulated: boolean }

export interface Tables {
  organizations: Organization; profiles: Profile; departments: Department; ai_agents: AiAgent; agent_skills: AgentSkill;
  agent_memories: AgentMemory; agent_conversations: AgentConversation; agent_messages: AgentMessage; projects: Project;
  tasks: Task; task_dependencies: TaskDependency; agent_assignments: AgentAssignment; agent_messages_internal: AgentMessageInternal;
  campaigns: Campaign; campaign_deliverables: CampaignDeliverable; clients: Client; brands: Brand; client_documents: ClientDocument;
  content_items: ContentItem; content_calendar: ContentCalendar; approvals: Approval; integrations: Integration;
  analytics_events: AnalyticsEvent; activity_logs: ActivityLog; jobs: Job; ai_usage: AiUsage;
}
export type TableName = keyof Tables;
