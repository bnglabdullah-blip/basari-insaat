"use client";

import { useEffect, useRef, useState } from "react";
import { VARSAYILAN } from "@/lib/icerik";

/**
 * Icerik ekrani: solda dar bir form rayi, sagda sitenin canli onizlemesi.
 *
 * Duzenlemenin ASIL yeri onizleme: metne tiklanip yerinde degistiriliyor.
 * Soldaki ray iki is icin duruyor ve bu yuzden kaldirilamaz:
 *   1. Sitede gorunur karsiligi olmayan alanlar (SEO metni, WhatsApp
 *      numarasi, yetkili adlari) baska hicbir yerden girilemez.
 *   2. Bos bir alanin onizlemede tiklanacak yuzeyi yoktur; ilk metin
 *      mecburen formdan giriliyor.
 *
 * Form DOM uzerinden dinleniyor, React state'i uzerinden degil. Sebebi:
 * IcerikFormu KONTROLSUZ bir form (alanlar `defaultValue` ile basiliyor,
 * degerleri gonderim aninda FormData okuyor). Boyle bir formda `input.value`
 * dogrudan atanabilir; React'in haberi olmasi gerekmez, cunku degeri React
 * tutmuyor. Formu kontrollu hale getirmek her alan icin state, her tusa
 * basista yeniden render ve IcerikFormu'nun bastan yazilmasi demekti.
 */

const ONIZLEME_SAYFALARI = [
  { yol: "/", ad: "Ana sayfa" },
  { yol: "/hakkimizda", ad: "Hakkımızda" },
  { yol: "/iletisim", ad: "İletişim" },
  { yol: "/sirket-bilgilerimiz", ad: "Şirket bilgileri" },
];

const GENISLIKLER = [
  { px: 390, ad: "Mobil" },
  { px: 820, ad: "Tablet" },
  { px: 0, ad: "Tam" },
];

/** Panelden gecerli sayilan alan adlari — onizlemeden gelen her sey degil. */
const ALANLAR = new Set(Object.keys(VARSAYILAN));

/**
 * Bir alan acik olan sayfada BULUNAMADIGINDA onizlemenin gececegi sayfa.
 *
 * Kasitli olarak eksik bir harita: burasi "alan hangi sayfalarda var"
 * sorusunu cevaplamiyor, yalnizca "bulunamazsa nereye bakalim" diyor.
 * Asil bilgi sablonlardaki data-alan isaretlerinde ve orada kaliyor —
 * cerceve alani bulamazsa "yok" diye haber veriyor (bkz.
 * components/onizleme-koprusu.tsx). Boylece footer'daki gibi her sayfada
 * gorunen alanlar icin gereksiz sayfa degisimi olmuyor.
 *
 * Listede olmayan alanlarin (metaAciklama, whatsapp, yetkili adlari) sitede
 * gorunur bir karsiligi yok; odaklanildiginda onizleme yerinde kaliyor.
 */
const ALAN_SAYFA: Record<string, string> = {
  slogan: "/",
  ozet: "/",
  hakkindaBaslik: "/hakkimizda",
  hakkindaMetin: "/hakkimizda",
  adres: "/sirket-bilgilerimiz",
  ilce: "/sirket-bilgilerimiz",
  telefonSabit: "/sirket-bilgilerimiz",
  eposta: "/iletisim",
  calismaSaatleri: "/iletisim",
  yetkili1Tel: "/iletisim",
  yetkili2Tel: "/iletisim",
};

export default function IcerikDuzenleyici({
  children,
}: {
  children: React.ReactNode;
}) {
  const sarmalayici = useRef<HTMLDivElement>(null);
  const cerceve = useRef<HTMLIFrameElement>(null);
  const [sayfa, setSayfa] = useState("/");
  const [genislik, setGenislik] = useState(0);
  const [tazele, setTazele] = useState(0);

  /*
   * Sayfa degisimi bir cerceve yenilenmesi demek; kaydirma istegi ancak yeni
   * sayfa hazir olunca gonderilebilir. Istek o ana kadar burada bekliyor.
   */
  const bekleyen = useRef<string | null>(null);
  // Mesaj dinleyicisi bir kez baglaniyor; state'i kapanistan degil buradan
  // okumali, yoksa hep ilk render'daki sayfayi gorurdu.
  const acikSayfa = useRef(sayfa);
  useEffect(() => {
    acikSayfa.current = sayfa;
  }, [sayfa]);

  /* ---------------- form -> onizleme ---------------- */

  useEffect(() => {
    const kok = sarmalayici.current;
    if (!kok) return;

    function gonder(mesaj: object) {
      cerceve.current?.contentWindow?.postMessage(mesaj, window.location.origin);
    }

    function degisti(e: Event) {
      const alan = e.target as HTMLInputElement | HTMLTextAreaElement | null;
      if (!alan?.name || !ALANLAR.has(alan.name)) return;
      gonder({ tip: "deger", alan: alan.name, deger: alan.value });
    }

    // Bir alana odaklanmak "bunu duzenliyorum" demek; onizleme de oraya baksin.
    function odaklandi(e: FocusEvent) {
      const alan = e.target as HTMLInputElement | null;
      if (!alan?.name || !ALANLAR.has(alan.name)) return;
      gonder({ tip: "git", alan: alan.name });
    }

    // Yakalama asamasinda degil, normal kabarma ile: form alanlarinin
    // hepsi bu dugumun altinda.
    kok.addEventListener("input", degisti);
    kok.addEventListener("focusin", odaklandi);
    return () => {
      kok.removeEventListener("input", degisti);
      kok.removeEventListener("focusin", odaklandi);
    };
  }, []);

  /* ---------------- onizleme -> form ---------------- */

  useEffect(() => {
    /**
     * Formdaki TUM degerleri cerceveye basar.
     *
     * Onizleme sayfasi degistirildiginde sunucu veritabanindaki KAYITLI
     * degerleri render eder; kaydedilmemis duzenlemeler onizlemede geri
     * alinmis gibi gorunur, formda ise durmaya devam ederdi. Kullanicinin
     * neyin gecerli oldugunu bilemedigi en kotu durum bu.
     */
    function hepsiniGonder(pencere: Window) {
      sarmalayici.current
        ?.querySelectorAll<HTMLInputElement>("[name]")
        .forEach((alan) => {
          if (!ALANLAR.has(alan.name)) return;
          pencere.postMessage(
            { tip: "deger", alan: alan.name, deger: alan.value },
            window.location.origin
          );
        });
    }

    function mesaj(e: MessageEvent) {
      if (e.origin !== window.location.origin) return;
      const d = e.data;
      if (!d) return;

      // Cerceve dinlemeye hazir olduğunu bildirdi (iframe'in load olayi bunun
      // icin guvenilir degil — bkz. onizleme-koprusu.tsx).
      if (d.tip === "hazir") {
        const pencere = cerceve.current?.contentWindow;
        if (!pencere) return;
        hepsiniGonder(pencere);
        if (bekleyen.current) {
          pencere.postMessage(
            { tip: "git", alan: bekleyen.current },
            window.location.origin
          );
          bekleyen.current = null;
        }
        return;
      }

      if (typeof d.alan !== "string" || !ALANLAR.has(d.alan)) return;

      // Alan acik sayfada bulunamadi: gorunur oldugu sayfaya gec, kaydirma
      // istegini yeni sayfa hazir olunca tekrarla.
      if (d.tip === "yok") {
        const yol = ALAN_SAYFA[d.alan];
        if (!yol || yol === acikSayfa.current) return;
        bekleyen.current = d.alan;
        setSayfa(yol);
        return;
      }

      if (d.tip !== "duzenle") return;
      const alan = sarmalayici.current?.querySelector<HTMLInputElement>(
        `[name="${d.alan}"]`
      );
      if (!alan) return;
      alan.value = String(d.deger ?? "");
    }

    window.addEventListener("message", mesaj);
    return () => window.removeEventListener("message", mesaj);
  }, []);

  const dugmeSinif =
    "px-3 py-1.5 text-xs transition-colors rounded-full whitespace-nowrap";

  return (
    <div ref={sarmalayici} className="flex h-full flex-col lg:flex-row">
      {/* Sol ray: form. Kendi icinde kayiyor, onizleme yerinde kaliyor. */}
      <div className="w-full shrink-0 overflow-y-auto border-[var(--color-rule)] lg:w-[26rem] lg:border-r xl:w-[29rem]">
        {children}
      </div>

      {/*
        Onizleme ekranin geri kalanini kapliyor ve dar ekranda hic basilmiyor:
        390 piksellik bir telefonda hem formu hem siteyi yan yana gostermek
        ikisini de kullanilamaz hale getirirdi.
      */}
      <div className="relative hidden min-w-0 flex-1 flex-col bg-[var(--color-paper)] lg:flex">
        <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-[var(--color-rule)] bg-white px-4 py-2.5">
          <select
            value={sayfa}
            onChange={(e) => setSayfa(e.target.value)}
            aria-label="Önizlenecek sayfa"
            className="border border-[var(--color-rule)] bg-white px-2.5 py-1.5 text-sm"
          >
            {ONIZLEME_SAYFALARI.map((s) => (
              <option key={s.yol} value={s.yol}>
                {s.ad}
              </option>
            ))}
          </select>

          {/*
            Yenile, kaydettikten sonra sunucunun gercekten ne bastigini
            gormek icin. Kaydedilmemis duzenlemeler kaybolmuyor: cerceve
            yeniden "hazir" dediginde form degerleri bastan gonderiliyor.
          */}
          <button
            type="button"
            onClick={() => setTazele((n) => n + 1)}
            className="border border-[var(--color-rule)] px-3 py-1.5 text-xs text-[var(--color-muted)] transition-colors hover:border-[var(--color-navy)] hover:text-[var(--color-navy)]"
          >
            Yenile
          </button>

          <p className="ml-auto text-xs text-[var(--color-muted)]">
            Yazıya tıklayıp düzenleyin · çıkmak için <strong>Esc</strong>
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-hidden">
          {/*
            key: sayfa degisiminde de Yenile'de de cerceve bastan kuruluyor.
            src degistirmek yerine remount, cunku onizlemede yapilan
            duzenlemeler DOM'da; temiz bir sayfa istedigimizde gercekten
            temiz baslamasi gerekiyor.
          */}
          <iframe
            key={`${sayfa}-${tazele}`}
            ref={cerceve}
            src={sayfa}
            title="Site önizlemesi"
            className="h-full border-0 bg-white"
            style={
              genislik
                ? { width: genislik, margin: "0 auto" }
                : { width: "100%" }
            }
          />
        </div>

        {/* Genislik secici cercevenin UZERINDE yuzuyor: arac cubugunda yer
            kaplamiyor ve baktiginiz yere yakin duruyor. */}
        <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center">
          <div className="pointer-events-auto flex gap-1 rounded-full border border-[var(--color-rule)] bg-white/95 p-1 shadow-sm backdrop-blur">
            {GENISLIKLER.map((g) => (
              <button
                key={g.px}
                type="button"
                onClick={() => setGenislik(g.px)}
                className={`${dugmeSinif} ${
                  genislik === g.px
                    ? "bg-[var(--color-navy)] text-white"
                    : "text-[var(--color-muted)] hover:bg-[var(--color-paper)]"
                }`}
              >
                {g.ad}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
