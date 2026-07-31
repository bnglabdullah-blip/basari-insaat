#!/usr/bin/env node
/**
 * Admin parolasi ve oturum anahtari uretir.
 *
 * Kullanim:  npm run parola -- "secilen-parola"
 *
 * Ciktiyi .env.local dosyasina yapistirin. Parolanin duz hali hicbir yerde
 * saklanmaz; sadece scrypt ozeti kaydedilir.
 */
import { randomBytes, scryptSync } from "node:crypto";

const parola = process.argv[2];

if (!parola) {
  console.error("\nKullanim:  npm run parola -- \"secilen-parolaniz\"\n");
  process.exit(1);
}

if (parola.length < 10) {
  console.error("\nParola en az 10 karakter olmali. Daha uzun bir parola secin.\n");
  process.exit(1);
}

const tuz = randomBytes(16);
const hash = scryptSync(parola.normalize("NFC"), tuz, 64);

console.log(`
Asagidaki iki satiri .env.local dosyasina yapistirin:
------------------------------------------------------------
ADMIN_PAROLA_HASH=${tuz.toString("hex")}:${hash.toString("hex")}
OTURUM_ANAHTARI=${randomBytes(48).toString("base64url")}
------------------------------------------------------------

Not: .env.local dosyasi .gitignore icinde, versiyon kontrolune girmez.
Parolanin kendisini bir yere kaydetmeyi unutmayin - geri donusu yok.
`);
