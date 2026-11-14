import { getStore } from './db/store';
import type { Approval, ApprovalAction } from './db/types';
import { log } from './log';

export const ACTION_LABEL: Record<string, string> = {
  publish_content: 'Publish konten', send_email: 'Kirim email ke klien', send_prospect_message: 'Kirim pesan ke prospek',
  run_ads: 'Jalankan kampanye iklan', use_ad_budget: 'Gunakan anggaran iklan', change_public_info: 'Ubah informasi publik', project_delivery: 'Hasil proyek untuk CEO',
};

/** Create an approval request according to the CEO policy. If the policy waives approval for the action it is auto-approved
 *  (this still never publishes/sends anything: external execution needs a configured integration). */
export async function requestApproval(orgId: string, a: { action: ApprovalAction; title: string; description: string; agentId?: string | null; projectId?: string | null; refTable?: string; refId?: string; payload?: Record<string, unknown> }): Promise<Approval> {
  const s = await getStore();
  const org = await s.get('organizations', orgId, orgId);
  const required = org?.approval_policy?.[a.action] !== false;
  const ap = await s.insert('approvals', orgId, {
    action: a.action, title: a.title, description: a.description, status: required ? 'pending_approval' : 'approved', requested_by_agent_id: a.agentId ?? null,
    project_id: a.projectId ?? null, ref_table: a.refTable ?? null, ref_id: a.refId ?? null, payload: a.payload ?? {}, decided_by: required ? null : 'policy', decided_at: required ? null : new Date().toISOString(), decision_note: required ? null : 'Auto-approved by CEO policy',
  });
  if (a.refTable === 'content_items' && a.refId) await s.update('content_items', orgId, a.refId, { status: ap.status }).catch(() => undefined);
  await log(orgId, { agent_id: a.agentId, project_id: a.projectId, event: 'approval.requested', message: `${ACTION_LABEL[a.action] ?? a.action}: ${a.title} → ${ap.status}` });
  return ap;
}

export async function decideApproval(orgId: string, userId: string | null, id: string, decision: 'approved' | 'rejected', note?: string) {
  const s = await getStore();
  const ap = await s.get('approvals', orgId, id);
  if (!ap || ap.status !== 'pending_approval') throw new Error('Approval is not pending');
  const upd = await s.update('approvals', orgId, id, { status: decision, decided_by: userId ?? 'ceo', decided_at: new Date().toISOString(), decision_note: note ?? null });
  if (ap.ref_table === 'content_items' && ap.ref_id) await s.update('content_items', orgId, ap.ref_id, { status: decision });
  if (ap.action === 'project_delivery' && ap.project_id) {
    const { ceoDecision } = await import('./agents/manager');
    await ceoDecision(orgId, ap.project_id, decision === 'approved' ? 'approve' : 'revise', note);
  }
  await log(orgId, { project_id: ap.project_id, event: `approval.${decision}`, message: `${ap.title} ${decision}${note ? `: ${note}` : ''}` });
  return upd;
}

/** Real publishing requires a connected integration. We do not have platform publishers wired, so this honestly reports it. */
export async function publishContent(orgId: string, contentId: string, opts: { manual?: boolean } = {}) {
  const s = await getStore();
  const c = await s.get('content_items', orgId, contentId);
  if (!c) throw new Error('Content not found');
  if (c.status !== 'approved') throw new Error('Konten harus berstatus Approved sebelum dipublikasikan.');
  if (opts.manual) return s.update('content_items', orgId, contentId, { status: 'published', published_via: 'manual', published_at: new Date().toISOString() });
  const integ = (await s.list('integrations', orgId, { provider: c.platform }))[0];
  if (!integ || integ.status !== 'connected') throw new Error(`Integrasi ${c.platform} belum dikonfigurasi — tidak ada yang dipublikasikan. Gunakan "Tandai terbit manual" setelah Anda memposting sendiri.`);
  throw new Error(`Konektor publish untuk ${c.platform} belum diimplementasikan.`);
}
