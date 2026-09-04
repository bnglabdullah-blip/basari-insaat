"use client";

import Image from "next/image";
import { useOptimistic, useRef, useState, useTransition } from "react";
import {
  gorselKaydetAction,
  gorselSilAction,
  gorselSiralaAction,
  gorselYuklemeUrlAction,
} from "@/app/admin/(panel)/projeler/actions";
import { gorselKucult } from "@/lib/gorsel-kucult";
import type { ProjeGorsel } from "@/lib/queries";

/*
 * YUKLEME AKISI — dosya sunucudan GECMIYOR.
 *
 *   1. Kullanici dosyalari secer
 *   2. Tarayici her karesi kucultup WebP'ye cevirir (lib/gorsel-kucult.ts).
 *      EXIF ve GPS verisi bu adimda dusuyor.
 *   3. Sunucudan imzali yukleme adresleri istenir (yuklemeHedefleriAction)
 *   4. Blob'lar DOGRUDAN Supabase Storage'a PUT edilir
 *   5. Basarili DOSYA ADLARI sunucuya bildirilir (gorselKaydetAction).
 *      Adlari sunucu uretti (lib/yukleme.ts dosyaAdiUret), istemci yalnizca
 *      hangilerinin gercekten yuklendigini geri soyluyor.
 *
 * Neden: Netlify fonksiyon govde limiti ~6 MB. Fotograflar sunucu uzerinden
 * gecseydi tek bir drone karesi bile bu limiti asar, coklu secim hic
 * calismazdi.
 *
 * Her adim tek tek ilerliyor (es zamanli degil): ayni anda tek bir cozulmus
 * gorsel bellekte durur. 10 fotografin hepsini birden acmak dusuk bellekli
 * bir telefonda sekmeyi dusurur.
 * ponytail: 10-15 fotografta sira sira yukleme yeterince hizli. Yuz fotograf
 * gerekirse 3'lu paralel bir kuyruk eklenir.
 */

type KalemDurum = "bekliyor" | "kucultuluyor" | "yukleniyor" | "bitti" | "hata";

type Kalem = { ad: string; durum: KalemDurum; hata?: string };

const DURUM_METIN: Record<KalemDurum, string> = {
  bekliyor: "sırada",
  kucultuluyor: "küçültülüyor…",
  yukleniyor: "yükleniyor…",
  bitti: "tamam",
  hata: "başarısız",
};

/** Bilinmeyen bir firlatilan degeri okunabilir metne cevirir. */
function hataMetni(e: unknown): string {
  return e instanceof Error ? e.message : "Beklenmeyen bir hata oluştu.";
}

export default function GaleriYonetici({
  projeId,
  gorseller,
}: {
  projeId: number;
  gorseller: ProjeGorsel[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [, gecisBaslat] = useTransition();

  const [kalemler, setKalemler] = useState<Kalem[]>([]);
  const [calisiyor, setCalisiyor] = useState(false);
  const [ozet, setOzet] = useState<{ hata?: string; bilgi?: string }>({});

  /*
   * useOptimistic: siralama degistiginde arayuz sunucu yanitini beklemeden
   * guncellenir. Sunucudan taze veri geldiginde React otomatik olarak gercek
   * degere doner — basarisiz bir istekte elle geri alma kodu yazmaya gerek
   * kalmiyor. Elle tutulan bir useState'te bu senkronizasyon her zaman
   * kacirilan bir ayrinti olur.
   */
  const [liste, iyimserSirala] = useOptimistic(
    gorseller,
    (_mevcut, yeni: ProjeGorsel[]) => yeni
  );

  function tasi(index: number, yon: -1 | 1) {
    const hedef = index + yon;
    if (hedef < 0 || hedef >= liste.length) return;

    const yeni = [...liste];
    [yeni[index], yeni[hedef]] = [yeni[hedef], yeni[index]];

    gecisBaslat(async () => {
      iyimserSirala(yeni);
      await gorselSiralaAction(projeId, yeni.map((g) => g.id));
    });
  }

  function basaAl(index: number) {
    if (index === 0) return;
    const yeni = [...liste];
    const [tasinan] = yeni.splice(index, 1);
    yeni.unshift(tasinan);

    gecisBaslat(async () => {
      iyimserSirala(yeni);
      await gorselSiralaAction(projeId, yeni.map((g) => g.id));
    });
  }

  /* ---------------------------------------------------------------------
     Yukleme
     --------------------------------------------------------------------- */

  async function yukle(dosyalar: File[]) {
    setCalisiyor(true);
    setOzet({});
    setKalemler(dosyalar.map((d) => ({ ad: d.name, durum: "bekliyor" })));

    const isaretle = (i: number, k: Partial<Kalem>) =>
      setKalemler((mevcut) =>
        mevcut.map((m, j) => (j === i ? { ...m, ...k } : m))
      );

    try {
      /*
       * 1) Once izin, sonra is.
       *
       * Imzali hedefler kucultmeden ONCE isteniyor: oturum dusmusse veya
       * adet sinirini asmissa kullanici bunu 20 fotografi kucultmek icin
       * bir dakika bekledikten SONRA degil, hemen ogrenir. Kullanilmayan
       * hedefler bir sey maliyet etmiyor, kendiliklerinden suresi doluyor.
       */
      const izin = await gorselYuklemeUrlAction(projeId, dosyalar.length);
      if (!izin.hedefler) {
        setKalemler((mevcut) =>
          mevcut.map((m) => ({ ...m, durum: "hata" as const }))
        );
        setOzet({ hata: izin.hata ?? "Yükleme izni alınamadı." });
        return;
      }

      /*
       * 2) Her dosya icin: kucult → dogrudan Storage'a PUT.
       *
       * Tek dongu ve sirayla: ayni anda tek bir cozulmus gorsel bellekte
       * durur. Jeton imzali URL'in sorgu dizesinde oldugu icin ayrica
       * apikey/authorization basligi GEREKMIYOR — tarayiciya hicbir
       * Supabase anahtari gonderilmiyor. content-type acikca veriliyor:
       * bucket yalnizca image/webp kabul ediyor.
       */
      const adlar: string[] = [];
      for (let i = 0; i < dosyalar.length; i++) {
        const hedef = izin.hedefler[i];
        try {
          isaretle(i, { durum: "kucultuluyor" });
          const blob = await gorselKucult(dosyalar[i]);

          isaretle(i, { durum: "yukleniyor" });
          const yanit = await fetch(hedef.url, {
            method: "PUT",
            headers: { "content-type": "image/webp" },
            body: blob,
          });
          if (!yanit.ok) throw new Error(`Depolama ${yanit.status} döndü.`);

          adlar.push(hedef.dosyaAdi);
          isaretle(i, { durum: "bitti" });
        } catch (e) {
          isaretle(i, { durum: "hata", hata: hataMetni(e) });
        }
      }

      // 3) Sunucuya bildir. Adini bildirmedigimiz bir dosya Storage'da
      //    yetim kalir — kullaniciya hata gostermekten daha az zararli.
      if (adlar.length === 0) {
        setOzet({ hata: "Hiçbir fotoğraf yüklenemedi." });
        return;
      }

      const sonuc = await gorselKaydetAction(projeId, adlar);
      if (sonuc.hata) {
        setOzet({ hata: sonuc.hata });
        return;
      }

      // Kismi basari gercek bir durum: 10 fotograftan 3'u dustuyse
      // kullanici hem kacinin gectigini hem HANGILERININ kaldigini gormeli
      // (isimler asagidaki listede, kirmizi "başarısız" etiketiyle duruyor).
      const dusen = dosyalar.length - adlar.length;
      setOzet({
        bilgi: sonuc.bilgi,
        hata:
          dusen > 0
            ? `${dusen} fotoğraf yüklenemedi — aşağıdaki listede işaretli.`
            : undefined,
      });
    } finally {
      setCalisiyor(false);
      formRef.current?.reset(); // aynı dosyaların iki kez yüklenmesini önler
    }
  }

  const biten = kalemler.filter(
    (k) => k.durum === "bitti" || k.durum === "hata"
  ).length;

  return (
    <section className="mt-16">
      <h2 className="font-display border-b border-[var(--color-rule)] pb-4 text-2xl">
        Fotoğraflar
        <span className="tabular ml-3 text-base font-normal text-[var(--color-muted)]">
          {liste.length}
        </span>
      </h2>

      {/* --- Yükleme --- */}
      <form
        ref={formRef}
        onSubmit={(e) => {
          e.preventDefault();
          const girdi = e.currentTarget.elements.namedItem(
            "fotograflar"
          ) as HTMLInputElement | null;
          const secilen = Array.from(girdi?.files ?? []);
          if (secilen.length > 0) void yukle(secilen);
        }}
        className="mt-6 flex flex-wrap items-center gap-4"
      >
        <input
          type="file"
          name="fotograflar"
          multiple
          accept="image/jpeg,image/png,image/webp"
          required
          disabled={calisiyor}
          className="max-w-full text-sm file:mr-4 file:cursor-pointer file:border file:border-[var(--color-navy)] file:bg-transparent file:px-4 file:py-2.5 file:text-sm file:font-medium disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={calisiyor}
          className="bg-[var(--color-navy)] px-6 py-3 text-sm font-medium text-[var(--color-paper)] transition-colors hover:bg-[var(--color-clay)] disabled:opacity-50"
        >
          {calisiyor ? "Yükleniyor…" : "Seçilenleri yükle"}
        </button>
      </form>

      <p className="mt-3 text-xs text-[var(--color-muted)]">
        JPG, PNG veya WEBP · birden fazla seçebilirsiniz. Fotoğraflar
        tarayıcınızda küçültülüp WebP'ye çevrilir; konum ve cihaz bilgisi
        (EXIF) siteye çıkmaz.
      </p>

      {/* --- İlerleme --- */}
      {kalemler.length > 0 && (
        <div className="mt-6 border border-[var(--color-rule)] p-4">
          <p
            aria-live="polite"
            className="tabular text-sm font-medium"
          >
            {calisiyor
              ? `İşleniyor — ${biten} / ${kalemler.length}`
              : `Tamamlandı — ${biten} / ${kalemler.length}`}
          </p>

          {/* İlerleme çubuğu görsel destek; asıl bilgi yukarıdaki metinde,
              o yüzden aria-hidden. */}
          <div
            aria-hidden
            className="mt-3 h-1 w-full bg-[var(--color-rule)]"
          >
            <div
              className="h-full bg-[var(--color-navy)] transition-[width] duration-300"
              style={{ width: `${(biten / kalemler.length) * 100}%` }}
            />
          </div>

          <ul className="mt-4 space-y-1.5 text-sm">
            {kalemler.map((k, i) => (
              <li
                key={`${k.ad}-${i}`}
                className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1"
              >
                <span className="min-w-0 break-all">{k.ad}</span>
                <span
                  className={
                    k.durum === "hata"
                      ? "text-[var(--color-clay)]"
                      : "text-[var(--color-muted)]"
                  }
                >
                  {DURUM_METIN[k.durum]}
                </span>
                {k.hata && (
                  <span className="w-full text-xs text-[var(--color-clay)]">
                    {k.hata}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {ozet.hata && (
        <p
          role="alert"
          className="mt-4 border-l-2 border-[var(--color-clay)] bg-[var(--color-clay)]/8 px-4 py-3 text-sm text-[var(--color-clay)]"
        >
          {ozet.hata}
        </p>
      )}
      {ozet.bilgi && (
        <p
          role="status"
          className="mt-4 border-l-2 border-[var(--color-navy)] bg-[var(--color-navy)]/5 px-4 py-3 text-sm"
        >
          {ozet.bilgi}
        </p>
      )}

      {/* --- Liste --- */}
      {liste.length === 0 ? (
        <p className="mt-8 border border-dashed border-[var(--color-rule)] p-10 text-center text-[var(--color-muted)]">
          Bu projede henüz fotoğraf yok.
        </p>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {liste.map((g, i) => (
            <li
              key={g.id}
              className="group relative overflow-hidden border border-[var(--color-rule)] bg-white"
            >
              <div className="relative aspect-[4/3]">
                <Image
                  src={g.dosya}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 100vw, 33vw"
                  className="object-cover"
                />
                {i === 0 && (
                  <span className="absolute left-0 top-0 bg-[var(--color-clay)] px-3 py-1.5 text-xs font-medium text-white">
                    Kapak
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between gap-2 p-2">
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => tasi(i, -1)}
                    disabled={i === 0}
                    aria-label="Yukarı taşı"
                    className="border border-[var(--color-rule)] px-2.5 py-1 text-sm disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => tasi(i, 1)}
                    disabled={i === liste.length - 1}
                    aria-label="Aşağı taşı"
                    className="border border-[var(--color-rule)] px-2.5 py-1 text-sm disabled:opacity-30"
                  >
                    ↓
                  </button>
                  {i !== 0 && (
                    <button
                      type="button"
                      onClick={() => basaAl(i)}
                      className="border border-[var(--color-rule)] px-2.5 py-1 text-xs"
                    >
                      Kapak yap
                    </button>
                  )}
                </div>

                <form action={gorselSilAction}>
                  <input type="hidden" name="gorselId" value={g.id} />
                  <button
                    type="submit"
                    className="px-2 py-1 text-xs text-[var(--color-muted)] hover:text-[var(--color-clay)]"
                  >
                    Sil
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
