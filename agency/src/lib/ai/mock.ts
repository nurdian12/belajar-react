// DEVELOPMENT-ONLY adapter. Used when no API key is configured. Output is explicitly labelled as simulated.
import type { LLMProvider, LLMRequest, LLMResponse, Msg } from './types';

const ROLE: Record<string, { sections: string[]; label: string }> = {
  strategist: { label: 'Marketing Strategist', sections: ['Ringkasan Pasar', 'Target Audiens & Persona', 'Analisis Kompetitor', 'Positioning & Pesan Utama', 'Strategi Kanal', 'Roadmap 30 Hari'] },
  social: { label: 'Social Media Manager', sections: ['Strategi Platform', 'Kalender Posting (4 minggu)', 'Pilar Konten', 'Strategi Engagement', 'Jadwal Terbaik Posting'] },
  content: { label: 'Content Creator', sections: ['Pilar Konten', 'Daftar Ide Konten', 'Format & Angle Viral', 'Rencana Produksi'] },
  copywriter: { label: 'Copywriter', sections: ['Headline & Hook', 'Caption Siap Pakai', 'Copy Iklan', 'CTA Varian'] },
  designer: { label: 'Graphic Designer', sections: ['Arah Kreatif', 'Palet & Tipografi', 'Brief Desain per Aset', 'Daftar Aset'] },
  video: { label: 'Video Producer', sections: ['Konsep Video', 'Script Reels/TikTok', 'Storyboard', 'Brief Produksi'] },
  seo: { label: 'SEO Specialist', sections: ['Riset Keyword', 'Strategi SEO', 'Rencana Blog', 'Checklist On-Page'] },
  ads: { label: 'Ads Specialist', sections: ['Struktur Kampanye', 'Targeting Audiens', 'Copy Iklan', 'Rekomendasi Budget', 'Rencana Uji A/B'] },
  sales: { label: 'Sales Specialist', sections: ['Kualifikasi Lead', 'Script Penjualan', 'Pesan Follow-up', 'Pipeline'] },
  support: { label: 'Customer Service', sections: ['FAQ', 'Template Respons', 'Klasifikasi Keluhan'] },
  analyst: { label: 'Data Analyst', sections: ['KPI Utama', 'Sistem Evaluasi', 'Rumus ROI', 'Jadwal Pelaporan'] },
};
const KEYWORDS: [RegExp, string[]][] = [
  [/riset|research|kompetitor|competitor|pasar/i, ['strategist']],
  [/ide konten|konten|content|instagram|tiktok|caption/i, ['content', 'copywriter']],
  [/kampanye|campaign|strategi|strategy/i, ['strategist', 'social', 'content', 'copywriter', 'designer', 'video', 'ads', 'analyst']],
  [/seo|blog|keyword/i, ['seo']], [/iklan|ads|meta|google/i, ['ads']], [/lead|sales|prospek|penjualan/i, ['sales']],
  [/video|reels|script/i, ['video']], [/desain|design|poster|logo/i, ['designer']],
];
const id = () => Math.random().toString(36).slice(2, 10);
const lastUserText = (m: Msg[]) => m.filter((x) => x.role === 'user').flatMap((x) => x.content).filter((b) => b.type === 'text').map((b: any) => b.text).join('\n');

function plan(instr: string) {
  const picked = new Set<string>(['strategist']);
  for (const [re, keys] of KEYWORDS) if (re.test(instr)) keys.forEach((k) => picked.add(k));
  if (picked.size === 1 && !/riset|research/i.test(instr)) ['content', 'copywriter'].forEach((k) => picked.add(k));
  const order = ['strategist', 'social', 'content', 'copywriter', 'designer', 'video', 'seo', 'ads', 'sales', 'support', 'analyst'].filter((k) => picked.has(k));
  const dep: Record<string, string[]> = { social: ['strategist'], content: ['strategist'], copywriter: ['strategist', 'content'], designer: ['copywriter'], video: ['copywriter'], ads: ['strategist', 'copywriter'], analyst: ['strategist'], seo: ['strategist'], sales: ['strategist'] };
  const have = new Set(order);
  return {
    summary: `[MOCK] Instruksi dipecah menjadi ${order.length} tugas untuk divisi terkait.`,
    tasks: order.map((k) => ({
      key: k, title: `${ROLE[k].label}: ${instr.slice(0, 60)}`, description: `Kerjakan bagian ${ROLE[k].label} untuk instruksi CEO: "${instr}". Hasilkan deliverable lengkap.`,
      agent_key: k, depends_on: (dep[k] ?? []).filter((d) => have.has(d)), deliverable_type: k,
    })),
  };
}

export class MockProvider implements LLMProvider {
  name = 'mock' as const; simulated = true; defaultModel = 'mock-dev-1';
  async complete(req: LLMRequest): Promise<LLMResponse> {
    await new Promise((r) => setTimeout(r, 120));
    const text = lastUserText(req.messages);
    const res = (o: Partial<LLMResponse>): LLMResponse => ({ text: '', toolCalls: [], usage: { input: Math.ceil((req.system.length + text.length) / 4), output: 200 }, stopReason: 'end_turn', model: this.defaultModel, provider: 'mock', ...o });

    if (req.forceTool === 'submit_plan') {
      const instr = /CEO INSTRUCTION:\s*([\s\S]*?)(?:\n\n|$)/.exec(text)?.[1]?.trim() ?? text.slice(0, 200);
      return res({ toolCalls: [{ id: id(), name: 'submit_plan', input: plan(instr) }], stopReason: 'tool_use' });
    }
    if (req.forceTool === 'submit_review') return res({ toolCalls: [{ id: id(), name: 'submit_review', input: { approved: true, executive_summary: '[MOCK] Seluruh deliverable telah ditinjau dan konsisten dengan instruksi CEO. Aktifkan provider AI nyata untuk review kualitas sesungguhnya.', task_feedback: [] } }], stopReason: 'tool_use' });
    if (req.forceTool === 'submit_revision_plan') return res({ toolCalls: [{ id: id(), name: 'submit_revision_plan', input: { redo: [] } }], stopReason: 'tool_use' });

    const key = /\[\[AGENT:(\w+)\]\]/.exec(req.system)?.[1] ?? 'strategist';
    const role = ROLE[key] ?? ROLE.strategist;
    const hasResult = req.messages.some((m) => m.content.some((b) => b.type === 'tool_result'));
    const names = new Set((req.tools ?? []).map((t) => t.name));
    if (!hasResult && names.has('search_memory') && /TASK:/.test(text))
      return res({ toolCalls: [{ id: id(), name: 'search_memory', input: { query: text.match(/TASK:\s*(.*)/)?.[1] ?? 'brand' } }], stopReason: 'tool_use' });
    if (!hasResult && key === 'social' && names.has('delegate_task') && /TASK:/.test(text))
      return res({ toolCalls: [{ id: id(), name: 'delegate_task', input: { agent_key: 'copywriter', title: 'Contoh caption untuk kalender posting', instructions: 'Buat 3 contoh caption pendek untuk kalender posting.' } }], stopReason: 'tool_use' });

    const task = /TASK:\s*(.*)/.exec(text)?.[1];
    if (!task) return res({ text: `[MOCK] Halo, saya ${role.label}. Saya adalah adapter simulasi — hubungkan ANTHROPIC_API_KEY atau OPENAI_API_KEY untuk jawaban nyata.` });
    const delegated = req.messages.flatMap((m) => m.content).filter((b) => b.type === 'tool_result' && /delegate|Hasil dari/i.test((b as any).content)).map((b: any) => b.content).join('\n');
    const md = [`> ⚠️ **MOCK OUTPUT (simulasi pengembangan)** — bukan hasil model AI sungguhan.`, `# ${task}`, ...role.sections.map((s, i) => `## ${i + 1}. ${s}\n- Poin kunci untuk "${task.slice(0, 50)}" (placeholder simulasi).\n- Ikuti arahan brand & hasil tugas sebelumnya.`), delegated ? `## Bantuan rekan\n${delegated.slice(0, 600)}` : ''].join('\n\n');
    return res({ text: md, usage: { input: Math.ceil(req.system.length / 4) + 300, output: Math.ceil(md.length / 4) } });
  }
}
