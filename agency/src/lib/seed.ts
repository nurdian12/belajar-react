import { getStore } from './db/store';
import { ROSTER } from './agents/roster';

const POLICY = { publish_content: true, send_email: true, send_prospect_message: true, run_ads: true, use_ad_budget: true, change_public_info: true, project_delivery: true };
const seeding = new Map<string, Promise<void>>();

/** Idempotent: creates the org row (file store), departments, 12 AI agents, skills, identity + company memory. */
export function ensureOrgSeeded(orgId: string, name: string) {
  if (!seeding.has(orgId)) seeding.set(orgId, doSeed(orgId, name).catch((e) => { seeding.delete(orgId); throw e; }));
  return seeding.get(orgId)!;
}
async function doSeed(orgId: string, name: string) {
  const s = await getStore();
  if (!(await s.get('organizations', orgId, orgId))) {
    await s.insert('organizations', orgId, { id: orgId, name, owner_id: null, approval_policy: POLICY, settings: { monthly_ai_budget_usd: 50 } });
  }
  if ((await s.list('ai_agents', orgId)).length) return;
  const depts = new Map<string, string>();
  for (const d of [...new Set(ROSTER.map((r) => r.department))]) depts.set(d, (await s.insert('departments', orgId, { name: d, description: `${d} department` })).id);
  for (const r of ROSTER) {
    const a = await s.insert('ai_agents', orgId, {
      key: r.key, name: r.name, avatar: r.avatar, job_title: r.job_title, department: r.department, department_id: depts.get(r.department)!,
      personality: r.personality, system_prompt: `[[AGENT:${r.key}]]\n${r.system_prompt}`, tools: r.tools, status: 'available', current_task_id: null, progress: 0,
      last_activity_at: null, metrics: { tasks_completed: 0, tasks_failed: 0, avg_seconds: 0, tokens: 0, cost_usd: 0 }, is_manager: !!r.is_manager,
    });
    for (const [i, sk] of r.skills.entries()) await s.insert('agent_skills', orgId, { agent_id: a.id, skill: sk, level: 5 - Math.min(i, 2) });
    await s.insert('agent_memories', orgId, { agent_id: a.id, client_id: null, project_id: null, kind: 'identity', content: `Saya ${r.name}, ${r.job_title} di ${r.department}. ${r.personality} Keahlian: ${r.skills.join(', ')}.`, tags: ['identity'], importance: 5 });
  }
  await s.insert('agent_memories', orgId, { agent_id: null, client_id: null, project_id: null, kind: 'company', content: 'Perusahaan: AI Digital Marketing Agency. Seluruh karyawan adalah AI Agent; CEO adalah manusia. Tindakan eksternal (publish, email, iklan, anggaran) wajib approval CEO. Standar kualitas: deliverable konkret, siap pakai, tanpa data karangan.', tags: ['company', 'policy'], importance: 5 });
  for (const p of ['instagram', 'tiktok', 'facebook', 'youtube', 'linkedin', 'website', 'meta_ads', 'google_ads', 'email', 'video_generation'])
    await s.insert('integrations', orgId, { provider: p, status: 'not_configured', config: {} });
}
