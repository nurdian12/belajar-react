import { bacaPengaturan } from "./pipeline.ts";

/**
 * Pengiriman balasan per saluran.
 *  - "simulasi": chat uji di dashboard, tidak mengirim ke mana pun.
 *  - "whatsapp": WhatsApp Cloud API resmi (Meta). BELUM DITES dengan akun asli; mati kecuali cs.kirimNyata = true.
 *    Bentuk request mengikuti dokumentasi Cloud API: POST /{phone-number-id}/messages dengan Bearer token.
 */
export async function kirim(saluran: string, kontak: string, teks: string): Promise<{ dryRun: boolean }> {
  if (saluran === "simulasi") return { dryRun: false };
  if (saluran !== "whatsapp") throw new Error(`Saluran "${saluran}" tidak dikenal`);
  if (!bacaPengaturan().cs?.kirimNyata) return { dryRun: true };

  const { WA_TOKEN, WA_PHONE_NUMBER_ID } = process.env;
  if (!WA_TOKEN || !WA_PHONE_NUMBER_ID) throw new Error("WA_TOKEN dan WA_PHONE_NUMBER_ID belum diisi di kantor/.env");
  const versi = process.env.WA_API_VERSION || "v21.0";
  const res = await fetch(`https://graph.facebook.com/${versi}/${WA_PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    headers: { authorization: `Bearer ${WA_TOKEN}`, "content-type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to: kontak, type: "text", text: { body: teks } }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`WhatsApp ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return { dryRun: false };
}
