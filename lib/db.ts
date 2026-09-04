import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase Postgres istemcisi — service_role anahtariyla, YALNIZCA sunucuda.
 *
 * "server-only" import'u kritik: bu modul yanlislikla bir istemci bilesenine
 * import edilirse derleme HATA verir. service_role anahtari RLS'i bypass
 * eder; tarayiciya sizmasi tum veritabaninin acilmasi demek olurdu.
 *
 * Neden Supabase Auth degil: mevcut scrypt + HMAC cerez duzeni korunuyor.
 * Bu istemci sadece veri katmani — tum sorgular sunucu tarafinda calisiyor,
 * tarayici DB'ye hic baglanmiyor.
 */

/** Storage bucket adi — 0002_storage.sql ile ayni kalmali. */
export const GORSEL_BUCKET = "proje-gorselleri";

function istemciOlustur(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const anahtar = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Eksik ortam degiskeni sessiz bos site degil, aninda anlasilir bir hata
  // uretsin — SQLite doneminde "yanlis cwd'de bos DB acilmasi" gibi sessiz
  // arizalarin teshisi en zorlariydi.
  if (!url || !anahtar) {
    throw new Error(
      "[veritabani] SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY tanimli olmali (.env.local)"
    );
  }

  return createClient(url, anahtar, {
    // Oturum yonetimi bize ait (HMAC cerez); Supabase'in auth durumu
    // tutmasina ve token tazelemesine gerek yok.
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Istemci globalThis uzerinde paylasiliyor.
 *
 * Gelistirmede Next her dosya degisikliginde modulleri yeniden yukler,
 * uretimde de bu modul birden fazla sunucu paketinde ayri ayri degerlendirilir
 * (SQLite doneminde baglantinin iki kez acildigi olculmustu). Tek singleton
 * ile her paket ayni istemciyi kullanir.
 */
const g = globalThis as unknown as { __basariDb?: SupabaseClient };

export const db: SupabaseClient = (g.__basariDb ??= istemciOlustur());
