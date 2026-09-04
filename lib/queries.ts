import { db } from "./db";
import { VARSAYILAN, type AyarAnahtari } from "./icerik";

/**
 * Tum veritabani sorgulari — Supabase Postgres, yalnizca sunucudan.
 *
 * SQLite doneminden tek sozlesme farki: her fonksiyon artik async ve Promise
 * donduruyor. Adlar ve parametreler birebir ayni kaldi; cagiran taraf sadece
 * `await` ekliyor.
 *
 * Supabase istemcisi hata FIRLATMAZ, `{ data, error }` dondurur. better-sqlite3
 * ise firlatiyordu ve tum cagiran kod buna gore yazildi. `kontrol` yardimcisi
 * eski davranisi geri getiriyor: hata varsa firlat, yoksa devam.
 */

function kontrol(
  hata: { message: string } | null,
  islem: string
): void {
  if (hata) throw new Error(`[veritabani] ${islem}: ${hata.message}`);
}

/* ==========================================================================
   Tipler
   ========================================================================== */

export type ProjeDurum = "planlama" | "devam" | "tamamlandi";

export const DURUM_ETIKET: Record<ProjeDurum, string> = {
  planlama: "Planlama aşamasında",
  devam: "Devam ediyor",
  tamamlandi: "Tamamlandı",
};

export type Proje = {
  id: number;
  slug: string;
  baslik: string;
  konum: string;
  durum: ProjeDurum;
  yil: string;
  // DIKKAT: Postgres'te boolean — SQLite'taki 0/1 degil. `p.yayinda === 1`
  // gibi eski karsilastirmalar sessizce false olur; `p.yayinda` yeterli.
  yayinda: boolean;
  ozet: string;
  aciklama: string;
  kapak: string | null;
  sira: number;
  olusturma: string; // timestamptz, ISO bicimli string olarak gelir
  /**
   * Yalnizca projeleriGetir() doldurur: projenin fotograf adedi.
   * Eskiden liste ekrani her proje icin ayri projeGorselleri() cagiriyordu
   * (N+1); sayi artik tek sorguda geliyor.
   */
  gorselSayisi?: number;
};

export type ProjeGorsel = {
  id: number;
  proje_id: number;
  dosya: string;
  sira: number;
};

/* ==========================================================================
   Projeler
   ========================================================================== */

export async function projeleriGetir(sadeceYayinda = true): Promise<Proje[]> {
  // proje_gorseller(count): gorsel adedi ayni sorguda geliyor, proje basina
  // ek sorgu yok.
  let sorgu = db
    .from("projeler")
    .select("*, proje_gorseller(count)")
    .order("sira", { ascending: true })
    .order("id", { ascending: false });
  if (sadeceYayinda) sorgu = sorgu.eq("yayinda", true);

  const { data, error } = await sorgu;
  kontrol(error, "projeleriGetir");

  return (data ?? []).map(({ proje_gorseller, ...p }) => ({
    ...p,
    gorselSayisi: (proje_gorseller as { count: number }[])?.[0]?.count ?? 0,
  })) as Proje[];
}

export async function projeGetir(slug: string): Promise<Proje | undefined> {
  const { data, error } = await db
    .from("projeler")
    .select("*")
    .eq("slug", slug)
    .eq("yayinda", true)
    .maybeSingle();
  kontrol(error, "projeGetir");
  return (data as Proje | null) ?? undefined;
}

export async function projeGetirId(id: number): Promise<Proje | undefined> {
  const { data, error } = await db
    .from("projeler")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  kontrol(error, "projeGetirId");
  return (data as Proje | null) ?? undefined;
}

export async function projeGorselleri(projeId: number): Promise<ProjeGorsel[]> {
  const { data, error } = await db
    .from("proje_gorseller")
    .select("*")
    .eq("proje_id", projeId)
    .order("sira", { ascending: true })
    .order("id", { ascending: true });
  kontrol(error, "projeGorselleri");
  return (data ?? []) as ProjeGorsel[];
}

/**
 * Site genelindeki tum fotograflarin yolu, galeri sirasinda.
 *
 * Vitrin yuvalari (lib/vitrin.ts) bu havuzdan besleniyor: bir sayfada
 * fotograf gereken her yer ayri bir yuva numarasi alir, boylece ayni kare
 * tek ekranda iki kez cikmaz. Yalnizca YAYINDA projelerin fotograflari
 * geliyor — taslak bir projenin karesi ana sayfada belirmemeli.
 */
export async function tumGorseller(): Promise<string[]> {
  // Projelerden asagi dogru tek sorgu: projeler kendi sirasinda, her projenin
  // gorselleri kendi sirasinda gomulu geliyor; duzlestirince galeri sirasi.
  const { data, error } = await db
    .from("projeler")
    .select("proje_gorseller(dosya)")
    .eq("yayinda", true)
    .order("sira", { ascending: true })
    .order("id", { ascending: false })
    .order("sira", { referencedTable: "proje_gorseller", ascending: true })
    .order("id", { referencedTable: "proje_gorseller", ascending: true });
  kontrol(error, "tumGorseller");

  return (data ?? []).flatMap((p) =>
    (p.proje_gorseller as { dosya: string }[]).map((g) => g.dosya)
  );
}

export async function projeEkle(v: {
  slug: string;
  baslik: string;
  konum: string;
  durum: ProjeDurum;
  yil: string;
  ozet: string;
  aciklama: string;
  yayinda: boolean;
}): Promise<number> {
  /*
   * Yeni proje EN KUCUK sirayi alir (MIN - 1), en buyugunu degil.
   * Listeler "ORDER BY sira ASC" oldugu icin bu, yeni eklenen projeyi
   * listenin BASINA koyar.
   *
   * MIN'i ayri sorguyla okuyoruz; iki admin ayni milisaniyede proje eklerse
   * ayni sirayi alabilirler ama tek adminli bu sitede bu bir sorun degil,
   * esitlik durumunda id zaten siralamayi belirliyor.
   */
  const { data: enUst, error: minHata } = await db
    .from("projeler")
    .select("sira")
    .order("sira", { ascending: true })
    .limit(1)
    .maybeSingle();
  kontrol(minHata, "projeEkle (sira)");

  const { data, error } = await db
    .from("projeler")
    .insert({ ...v, sira: (enUst?.sira ?? 0) - 1 })
    .select("id")
    .single();
  kontrol(error, "projeEkle");
  return (data as { id: number }).id;
}

export async function projeGuncelle(
  id: number,
  v: {
    slug: string;
    baslik: string;
    konum: string;
    durum: ProjeDurum;
    yil: string;
    ozet: string;
    aciklama: string;
    yayinda: boolean;
  }
): Promise<void> {
  const { error } = await db.from("projeler").update(v).eq("id", id);
  kontrol(error, "projeGuncelle");
}

export async function projeSil(id: number): Promise<void> {
  // proje_gorseller kayitlari ON DELETE CASCADE ile otomatik siliniyor
  // (Postgres'te SQLite'in aksine bu her zaman aciktir).
  const { error } = await db.from("projeler").delete().eq("id", id);
  kontrol(error, "projeSil");
}

/** Bir slug'in baska bir projede kullanilip kullanilmadigini kontrol eder. */
export async function slugKullanimda(
  slug: string,
  haricId?: number
): Promise<boolean> {
  let sorgu = db.from("projeler").select("id").eq("slug", slug).limit(1);
  if (haricId) sorgu = sorgu.neq("id", haricId);

  const { data, error } = await sorgu.maybeSingle();
  kontrol(error, "slugKullanimda");
  return data !== null;
}

/* ==========================================================================
   Proje görselleri
   ========================================================================== */

export async function gorselEkle(
  projeId: number,
  dosya: string
): Promise<void> {
  await gorselleriEkle(projeId, [dosya]);
}

/**
 * Birden fazla gorseli tek insert'le sona ekler ve kapagi tazeler.
 *
 * Yukleme akisi N dosyayi birlikte kaydettigi icin toplu hali asil olan;
 * gorselEkle tek elemanli kisayol olarak duruyor.
 */
export async function gorselleriEkle(
  projeId: number,
  dosyalar: string[]
): Promise<void> {
  if (dosyalar.length === 0) return;

  const { data: son, error: maxHata } = await db
    .from("proje_gorseller")
    .select("sira")
    .eq("proje_id", projeId)
    .order("sira", { ascending: false })
    .limit(1)
    .maybeSingle();
  kontrol(maxHata, "gorselleriEkle (sira)");

  const taban = (son?.sira ?? 0) + 1;
  const { error } = await db.from("proje_gorseller").insert(
    dosyalar.map((dosya, i) => ({ proje_id: projeId, dosya, sira: taban + i }))
  );
  kontrol(error, "gorselleriEkle");

  await kapakTazele(projeId);
}

export async function gorselGetir(
  id: number
): Promise<ProjeGorsel | undefined> {
  const { data, error } = await db
    .from("proje_gorseller")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  kontrol(error, "gorselGetir");
  return (data as ProjeGorsel | null) ?? undefined;
}

export async function gorselSil(id: number): Promise<void> {
  const g = await gorselGetir(id);
  if (!g) return;

  const { error } = await db.from("proje_gorseller").delete().eq("id", id);
  kontrol(error, "gorselSil");

  await kapakTazele(g.proje_id);
}

/**
 * Yeni sirayi yazar ve kapagi ayni islemde tazeler — cagiranin ayrica
 * kapakTazele() cagirmasi gerekmez.
 *
 * ponytail: guncellemeler tek transaction degil; PostgREST toplu update
 * sunmuyor ve id sutunu "generated always" oldugu icin upsert de calismiyor.
 * Yarim kalan bir siralama yalnizca gorsel sirasini bozar, veri kaybetmez ve
 * bir sonraki siralamayla duzelir. Gercek atomiklik gerekirse migration'a
 * `gorselleri_sirala(bigint, bigint[])` RPC'si eklenip buradan cagrilir.
 */
export async function gorselleriSirala(
  projeId: number,
  sirali: number[]
): Promise<void> {
  const sonuclar = await Promise.all(
    sirali.map((gorselId, i) =>
      db
        .from("proje_gorseller")
        .update({ sira: i })
        .eq("id", gorselId)
        // proje_id kosulu: baska projeye ait bir id sizarsa etkisiz kalir.
        .eq("proje_id", projeId)
    )
  );
  for (const { error } of sonuclar) kontrol(error, "gorselleriSirala");

  await kapakTazele(projeId);
}

/**
 * Kapak gorselini her zaman siradaki ILK gorsele esitler.
 *
 * Panelde "Kapak yap" dugmesi gorseli listenin basina tasir; ayri bir kapak
 * alani tutulmuyor. "Birinci fotograf kapaktir" tek kural olarak kaliyor,
 * ogrenilmesi gereken ikinci bir kavram olusmuyor.
 */
export async function kapakTazele(projeId: number): Promise<void> {
  const { data: ilk, error } = await db
    .from("proje_gorseller")
    .select("dosya")
    .eq("proje_id", projeId)
    .order("sira", { ascending: true })
    .order("id", { ascending: true })
    .limit(1)
    .maybeSingle();
  kontrol(error, "kapakTazele");

  const { error: guncelleHata } = await db
    .from("projeler")
    .update({ kapak: ilk?.dosya ?? null })
    .eq("id", projeId);
  kontrol(guncelleHata, "kapakTazele (kapak)");
}

/* ==========================================================================
   Ayarlar (site metinleri + iletişim bilgileri)
   ========================================================================== */

/**
 * Varsayilanlarin uzerine veritabanindaki degerleri bindirir.
 *
 * Bos string'ler kasitli olarak atlaniyor: admin bir alani temizlediginde
 * sitede o alanin bos gorunmesi degil, varsayilanina donmesi isteniyor.
 * Aksi halde yanlislikla silinen bir telefon numarasi siteden tamamen
 * kaybolurdu.
 */
export async function ayarlariGetir(): Promise<typeof VARSAYILAN> {
  const { data, error } = await db.from("ayarlar").select("anahtar, deger");
  kontrol(error, "ayarlariGetir");

  const sonuc = { ...VARSAYILAN } as Record<string, string>;
  for (const s of (data ?? []) as { anahtar: string; deger: string }[]) {
    if (s.anahtar in VARSAYILAN && s.deger.trim() !== "") {
      sonuc[s.anahtar] = s.deger;
    }
  }
  return sonuc as typeof VARSAYILAN;
}

export async function ayarlariKaydet(
  degerler: Partial<Record<AyarAnahtari, string>>
): Promise<void> {
  const satirlar = Object.entries(degerler).map(([anahtar, deger]) => ({
    anahtar,
    deger: deger ?? "",
  }));
  if (satirlar.length === 0) return;

  // Tek upsert: ya hepsi yazilir ya hicbiri — SQLite donemindeki transaction
  // ile ayni garanti.
  const { error } = await db
    .from("ayarlar")
    .upsert(satirlar, { onConflict: "anahtar" });
  kontrol(error, "ayarlariKaydet");
}

/* ==========================================================================
   Admin parolasi
   ========================================================================== */

/**
 * Parola ozeti `ayarlar` tablosunda tutuluyor ama VARSAYILAN icinde DEGIL.
 *
 * Bu ayrim KASITLI ve guvenlik acisindan kritik: ayarlariGetir() yalnizca
 * VARSAYILAN'da bulunan anahtarlari donduruyor (bkz. yukaridaki filtre) ve o
 * sonuc IcerikFormu gibi ISTEMCI bilesenlerine kadar gidiyor. Anahtari
 * VARSAYILAN'a eklemek, parola ozetini her sayfa render'inda tarayiciya
 * gondermek anlamina gelirdi. Buradaki filtre, o sizintiyi engelleyen sey.
 */
const PAROLA_ANAHTARI = "admin_parola_hash";

/** Panelden belirlenmis parola ozeti; hic belirlenmediyse null. */
export async function parolaHashGetir(): Promise<string | null> {
  const { data, error } = await db
    .from("ayarlar")
    .select("deger")
    .eq("anahtar", PAROLA_ANAHTARI)
    .maybeSingle();
  kontrol(error, "parolaHashGetir");
  return data && data.deger.trim() !== "" ? data.deger : null;
}

export async function parolaHashKaydet(hash: string): Promise<void> {
  const { error } = await db
    .from("ayarlar")
    .upsert({ anahtar: PAROLA_ANAHTARI, deger: hash }, { onConflict: "anahtar" });
  kontrol(error, "parolaHashKaydet");
}
