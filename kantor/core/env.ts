import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Memuat kantor/.env (kunci API) sebagai efek samping saat diimpor. Variabel yang sudah diset di shell tidak ditimpa.
// Diimpor oleh setiap modul yang membaca kunci, supaya skrip tes yang berdiri sendiri juga ikut membacanya.
try { process.loadEnvFile(join(dirname(fileURLToPath(import.meta.url)), "..", ".env")); } catch { /* tidak ada .env */ }
