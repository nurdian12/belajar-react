import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "./db.ts";

export type AgentConfig = {
  nama: string;
  jabatan: string;
  model?: string | null;
  maxTurns?: number;
  tools?: string[];
  aktif?: boolean;
};

export type Agent = { id: string; config: AgentConfig; systemPrompt: string };

const dir = (id: string) => join(ROOT, "agents", id);

/** Muat agent: AGENT.md + semua skills/*.md digabung jadi system prompt. */
export function loadAgent(id: string): Agent {
  const d = dir(id);
  if (!existsSync(join(d, "AGENT.md"))) throw new Error(`Agent "${id}" tidak ditemukan`);
  const config: AgentConfig = JSON.parse(readFileSync(join(d, "config.json"), "utf8"));
  const parts = [readFileSync(join(d, "AGENT.md"), "utf8")];
  const sk = join(d, "skills");
  if (existsSync(sk)) {
    for (const f of readdirSync(sk).filter((f) => f.endsWith(".md")).sort()) {
      parts.push(readFileSync(join(sk, f), "utf8"));
    }
  }
  return { id, config, systemPrompt: parts.join("\n\n---\n\n") };
}

export function listAgents() {
  return readdirSync(join(ROOT, "agents"), { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => loadAgent(e.name))
    .map(({ id, config }) => ({ id, ...config, aktif: config.aktif !== false }));
}

/** Isi job desk (AGENT.md) dan skill-nya, untuk ditampilkan di dashboard. */
export function detailAgent(id: string) {
  const d = dir(id);
  if (!existsSync(join(d, "AGENT.md"))) throw new Error(`Agent "${id}" tidak ditemukan`);
  const sk = join(d, "skills");
  const skills = existsSync(sk)
    ? readdirSync(sk).filter((f) => f.endsWith(".md")).sort().map((f) => ({ nama: f.replace(/\.md$/, ""), isi: readFileSync(join(sk, f), "utf8") }))
    : [];
  return { id, jobdesk: readFileSync(join(d, "AGENT.md"), "utf8"), skills };
}
