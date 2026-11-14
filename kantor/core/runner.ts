import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { db, DATA } from "./db.ts";
import { loadAgent } from "./agents.ts";

export type RunResult = { jobId: number; text: string; biayaUsd: number | null };

/** Jalankan satu agent lewat Claude Code headless (`claude -p`) dan catat sebagai job. */
export async function runAgent(agentId: string, prompt: string): Promise<RunResult> {
  const agent = loadAgent(agentId);
  const { lastInsertRowid } = db
    .prepare("INSERT INTO jobs (agent, status, input) VALUES (?, 'berjalan', ?)")
    .run(agentId, prompt);
  const jobId = Number(lastInsertRowid);

  try {
    const { text, biayaUsd } =
      process.env.KANTOR_MOCK === "1" ? await mock(agentId, prompt)
      : process.env.KANTOR_OTAK === "api" ? await panggilApi(agent, prompt)
      : await panggilClaude(agent, prompt);
    db.prepare("UPDATE jobs SET status='selesai', output=?, biaya_usd=?, selesai=datetime('now') WHERE id=?")
      .run(text, biayaUsd, jobId);
    return { jobId, text, biayaUsd };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    db.prepare("UPDATE jobs SET status='gagal', error=?, selesai=datetime('now') WHERE id=?").run(msg, jobId);
    throw e;
  }
}

function panggilClaude(agent: ReturnType<typeof loadAgent>, prompt: string) {
  const { config } = agent;
  // System prompt lewat file & prompt lewat stdin: aman dari batas panjang/quoting baris perintah Windows.
  const sysFile = join(DATA, `sys-${agent.id}.md`);
  writeFileSync(sysFile, agent.systemPrompt);
  const args = [
    "-p",
    "--output-format", "json",
    "--append-system-prompt-file", sysFile,
    "--max-turns", String(config.maxTurns ?? 3),
    "--no-session-persistence",
  ];
  // Tanpa tools = agent hanya berpikir/menulis. Tools hanya yang diizinkan di config.json.
  if (config.tools?.length) args.push("--allowedTools", ...config.tools);
  else args.push("--tools", "");
  if (config.model) args.push("--model", config.model);

  return new Promise<{ text: string; biayaUsd: number | null }>((resolve, reject) => {
    const bin = process.env.KANTOR_CLAUDE_BIN || "claude";
    // claude.cmd (hasil `npm i -g` di Windows) hanya bisa dijalankan lewat shell.
    const p = spawn(bin, args, { stdio: ["pipe", "pipe", "pipe"], shell: /\.(cmd|bat)$/i.test(bin) });
    p.stdin.on("error", () => {});
    p.stdin.end(prompt);
    let out = "", err = "";
    p.stdout.on("data", (d) => (out += d));
    p.stderr.on("data", (d) => (err += d));
    const timer = setTimeout(() => { p.kill(); reject(new Error("Timeout 5 menit")); }, 5 * 60_000);
    p.on("error", (e) => { clearTimeout(timer); reject(e); });
    p.on("close", (code) => {
      clearTimeout(timer);
      if (code !== 0) return reject(new Error(`claude keluar dengan kode ${code}: ${err || out}`.slice(0, 2000)));
      try {
        const j = JSON.parse(out);
        if (j.is_error) return reject(new Error(String(j.result ?? "error dari claude")));
        resolve({ text: String(j.result ?? ""), biayaUsd: j.total_cost_usd ?? null });
      } catch {
        reject(new Error(`Output claude bukan JSON: ${out.slice(0, 500)}`));
      }
    });
  });
}

/**
 * Otak alternatif: Anthropic API langsung (KANTOR_OTAK=api + ANTHROPIC_API_KEY).
 * Untuk mesin yang tidak bisa menjalankan Claude Code (mis. CPU tanpa SSE4.2). Biaya per pemakaian.
 * Agent dengan tool "WebSearch" memakai server tool web_search milik API.
 */
async function panggilApi(agent: ReturnType<typeof loadAgent>, prompt: string) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("KANTOR_OTAK=api tetapi ANTHROPIC_API_KEY belum diisi di kantor/.env");
  const base = (process.env.ANTHROPIC_BASE_URL || "https://api.anthropic.com").replace(/\/$/, "");
  const model = agent.config.model || process.env.KANTOR_MODEL || "claude-sonnet-5-5";
  const tools = agent.config.tools?.includes("WebSearch")
    ? [{ type: "web_search_20250305", name: "web_search", max_uses: 5 }] : undefined;

  const messages: any[] = [{ role: "user", content: prompt }];
  for (let putaran = 0; putaran < 5; putaran++) {
    const res = await fetch(`${base}/v1/messages`, {
      method: "POST",
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model, max_tokens: 4096, system: agent.systemPrompt, messages, ...(tools && { tools }) }),
      signal: AbortSignal.timeout(5 * 60_000),
    });
    const raw = await res.text();
    if (!res.ok) throw new Error(`Anthropic API ${res.status}: ${raw.slice(0, 500)}`);
    const j = JSON.parse(raw);
    if (j.stop_reason === "pause_turn") {   // pencarian web panjang: lanjutkan giliran yang sama
      messages.push({ role: "assistant", content: j.content });
      continue;
    }
    // Ambil teks setelah blok non-teks terakhir (abaikan narasi sebelum/selama pencarian).
    let teks = "";
    for (const b of j.content ?? []) teks = b.type === "text" ? teks + b.text : "";
    if (!teks.trim()) throw new Error("Balasan API kosong");
    return { text: teks, biayaUsd: null as number | null };
  }
  throw new Error("Pencarian web terlalu panjang (5 putaran)");
}

async function mock(agentId: string, prompt: string) {
  await new Promise((r) => setTimeout(r, 600));
  if (agentId === "penulis") {
    return {
      biayaUsd: 0,
      text: JSON.stringify({
        judul: "[MOCK] " + prompt.slice(0, 40),
        naskah: "Ini naskah contoh. Hook singkat. Isi inti dalam beberapa kalimat pendek. Penutup ajakan menyimpan video.",
        rencana_visual: ["Teks besar hook", "Ilustrasi isi inti", "Logo + ajakan simpan"],
      }),
    };
  }
  if (agentId === "periset") {
    return {
      biayaUsd: 0,
      text: JSON.stringify({
        topik: ["Kenapa tanggal tua terasa lebih panjang", "Kebiasaan pagi yang diam-diam menguras energi", "Antre di warung: hitungan waktu yang tidak kita sadari"]
          .map((judul) => ({ judul: `[MOCK] ${judul}`, ringkasan: "Ringkasan contoh.", sumber: ["https://example.com"] })),
      }),
    };
  }
  return { biayaUsd: 0, text: "{}" };
}

/** Ambil objek JSON dari balasan agent (toleran terhadap code fence / teks sekitar). */
export function ekstrakJson<T = unknown>(text: string): T {
  const t = text.trim().replace(/^```(?:json)?\s*|\s*```$/g, "");
  try { return JSON.parse(t) as T; } catch { /* lanjut */ }
  const a = t.indexOf("{"), b = t.lastIndexOf("}");
  if (a >= 0 && b > a) return JSON.parse(t.slice(a, b + 1)) as T;
  throw new Error("Balasan agent tidak berisi JSON");
}
