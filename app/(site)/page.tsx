import Link from "next/link";
import Gorsel from "@/components/gorsel";
import { HIZMETLER, RAKAMLAR, telLink } from "@/lib/icerik";
import {
  DURUM_ETIKET,
  ayarlariGetir,
  projeleriGetir,
  tumGorseller,
} from "@/lib/queries";
import { YUVA, yuvaGorseli } from "@/lib/vitrin";

/**
 * Ana sayfa.
 *
 * Bölüm sırası bilinçli: ziyaretçinin sorularını sorulma sırasına göre
 * yanıtlıyor — kimsiniz → ne yapıyorsunuz → gösterin → arkanızda kim var →
 * neden güveneyim → size nasıl ulaşırım. Hizmetler bu yüzden projelerin
 * ÜSTÜNDE: yeni bir firmada ilk soru "ne iş yapıyorsunuz" oluyor, "hangi
 * binayı yaptınız" ondan sonra geliyor.
 */
export default function AnaSayfa() {
  const ayarlar = ayarlariGetir();
  const projeler = projeleriGetir();
  const oneCikan = projeler[0]; // sıralamada ilk olan proje
  const digerleri = projeler.slice(1, 4);

  /*
   * Hero slab'ı kapaktan AYRI bir yuvadan besleniyor. Eskiden ikisi de
   * `oneCikan.kapak` kullanıyordu ve aynı fotoğraf tek ekranda iki kez
   * görünüyordu — proje kartı kapağı gösterdiği için hemen altında tekrar.
   */
  const heroGorsel = yuvaGorseli(tumGorseller(), YUVA.anaHero) ?? oneCikan?.kapak;

  const telefonlar = [
    { ad: "Sabit hat", tel: ayarlar.telefonSabit },
    { ad: ayarlar.yetkili1Ad, tel: ayarlar.yetkili1Tel },
    { ad: ayarlar.yetkili2Ad, tel: ayarlar.yetkili2Tel },
  ].filter((t) => t.tel);

  return (
    <>
      {/* ====================================================================
          HERO — sayfanın tek "yüksek sesli" alanı.
         ==================================================================== */}
      <section className="grid-rules mx-auto max-w-[100rem] px-6 pb-20 pt-16 md:px-10 md:pb-28 md:pt-24">
        <p className="eyebrow enter enter-1">
          Eskişehir · Yapı ve Konut Projeleri
        </p>

        <h1 className="font-display enter enter-2 mt-8 text-[length:var(--text-hero)] md:mt-10">
          Yapıyı ayakta
          <br />
          tutan{" "}
          {/* Tek vurgu rengi tek kelimede. Renk azlığı onu güçlü kılıyor. */}
          <span className="text-[var(--color-clay)]">disiplindir</span>.
        </h1>

        <div className="enter enter-3 mt-14 grid gap-10 border-t border-[var(--color-rule)] pt-8 md:mt-20 md:grid-cols-12">
          <p className="max-w-xl text-lg leading-relaxed text-[var(--color-muted)] md:col-span-6 md:col-start-7">
            {ayarlar.ozet}
          </p>

          {/* Hero'da eskiden hiçbir eylem yoktu; ziyaretçi ilk ekranda ne
              yapacağını bilmiyordu. İki net yol: işi gör, ya da bize ulaş. */}
          <div className="flex flex-wrap gap-4 md:col-span-6 md:col-start-7">
            <Link
              href="/projeler"
              className="bg-[var(--color-navy)] px-8 py-4 font-medium text-[var(--color-paper)] transition-colors hover:bg-[var(--color-clay)]"
            >
              Projelerimiz
            </Link>
            <Link
              href="/iletisim"
              className="border border-[var(--color-navy)] px-8 py-4 font-medium transition-colors hover:bg-[var(--color-navy)] hover:text-[var(--color-paper)]"
            >
              İletişime geçin
            </Link>
          </div>
        </div>
      </section>

      {/* ====================================================================
          TAM GENİŞLİK FOTOĞRAF
          Künye YOK: bu kare, adı geçen projeye ait değil — devam eden bir
          çalışmadan. Fotoğrafa yanlış bir proje adı iliştirmektense hiç ad
          vermemek doğru olan.
         ==================================================================== */}
      <section className="wipe relative h-[60vh] w-full overflow-hidden md:h-[85vh]">
        <Gorsel
          src={heroGorsel}
          alt="Başarı İnşaat — devam eden çalışmalardan bina cephesi"
          priority
          sizes="100vw"
        />
      </section>

      {/* ====================================================================
          HİZMETLER — "ne yapıyorsunuz" sorusunun cevabı, sayfanın üst
          yarısında. Her satır kendi detay sayfasına gidiyor.
         ==================================================================== */}
      <section className="relative mx-auto max-w-[100rem] overflow-hidden px-6 py-24 md:px-10 md:py-32">
        <span aria-hidden className="filigran right-4 top-10 md:right-10">
          01
        </span>

        <div className="relative flex flex-wrap items-baseline justify-between gap-4 border-b border-[var(--color-rule)] pb-5">
          <h2 className="eyebrow">Ne yapıyoruz</h2>
          <Link href="/hizmetler" className="link-underline text-sm font-medium">
            Tüm hizmetler →
          </Link>
        </div>

        <ul className="relative">
          {HIZMETLER.map((h) => (
            <li key={h.slug} className="reveal border-b border-[var(--color-rule)]">
              <Link
                href={`/hizmetler/${h.slug}`}
                className="row-link grid gap-4 py-8 md:grid-cols-12 md:items-baseline md:py-10"
              >
                <span className="tabular text-sm font-medium text-[var(--color-clay)] md:col-span-1">
                  {h.no}
                </span>
                <h3 className="font-display text-[length:var(--text-title)] md:col-span-4">
                  {h.ad}
                </h3>
                <p className="max-w-xl leading-relaxed text-[var(--color-muted)] md:col-span-5 md:col-start-7">
                  {h.ozet}
                </p>
                <span
                  aria-hidden
                  className="text-sm text-[var(--color-clay)] md:col-span-1 md:text-right"
                >
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* ====================================================================
          PROJELER — yalnızca yayında proje varsa gösterilir.
          Boş bir "Projeler" başlığı, yeni bir firmada güven kaybettirir.
         ==================================================================== */}
      {projeler.length > 0 && (
        <section className="mx-auto max-w-[100rem] px-6 pb-24 md:px-10 md:pb-32">
          <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-[var(--color-rule)] pb-5">
            <h2 className="eyebrow">Projeler</h2>
            <Link href="/projeler" className="link-underline text-sm font-medium">
              Tümünü gör →
            </Link>
          </div>

          <div className="mt-10 grid gap-x-8 gap-y-14 md:grid-cols-2">
            {[oneCikan, ...digerleri].filter(Boolean).map((p, i) => (
              <Link
                key={p.id}
                href={`/projeler/${p.slug}`}
                className={`reveal group block ${i === 0 ? "md:col-span-2" : ""}`}
              >
                <div
                  className={`relative overflow-hidden bg-[var(--color-paper-dim)] ${
                    i === 0 ? "aspect-[16/9]" : "aspect-[4/3]"
                  }`}
                >
                  <Gorsel
                    src={p.kapak}
                    alt={p.baslik}
                    sizes={i === 0 ? "100vw" : "(max-width: 768px) 100vw, 50vw"}
                    className="transition-transform duration-700 group-hover:scale-[1.03]"
                  />
                </div>
                <div className="mt-5 flex items-baseline justify-between gap-4">
                  <h3 className="font-display text-[length:var(--text-title)]">
                    {p.baslik}
                  </h3>
                  <span className="eyebrow shrink-0">{DURUM_ETIKET[p.durum]}</span>
                </div>
                {p.ozet && (
                  <p className="mt-2 text-[var(--color-muted)]">{p.ozet}</p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ====================================================================
          HAKKINDA ÖZETİ — arkada kim var. Ekip ve sürece buradan dallanıyor.
         ==================================================================== */}
      <section className="relative mx-auto max-w-[100rem] overflow-hidden px-6 pb-24 md:px-10 md:pb-32">
        <span aria-hidden className="filigran right-4 top-0 md:right-10">
          02
        </span>

        <div className="relative border-t border-[var(--color-rule)] pt-16 md:pt-20">
          <div className="grid gap-12 md:grid-cols-12">
            <h2 className="font-display reveal text-[length:var(--text-display)] md:col-span-6">
              {ayarlar.hakkindaBaslik}
            </h2>
            <div className="reveal-late space-y-6 text-lg leading-relaxed text-[var(--color-muted)] md:col-span-5 md:col-start-8">
              {ayarlar.hakkindaMetin
                .split("\n\n")
                .slice(0, 2)
                .map((paragraf, i) => (
                  <p key={i}>{paragraf}</p>
                ))}

              <div className="flex flex-wrap gap-x-8 gap-y-3 pt-2 font-medium text-[var(--color-navy)]">
                <Link href="/hakkimizda" className="link-underline">
                  Hakkımızda →
                </Link>
                <Link href="/ekip" className="link-underline">
                  Ekip →
                </Link>
                <Link href="/surec" className="link-underline">
                  Çalışma sürecimiz →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          RAKAMLAR — lacivert bölüm. Sayfanın ritmini kıran koyu blok:
          sürekli açık zemin gözü yorar, koyu bir ara verir ve sonrasındaki
          içerik yeniden "yeni" hissettirir.
         ==================================================================== */}
      <section className="grain relative overflow-hidden bg-[var(--color-navy)] text-[var(--color-paper)]">
        <span aria-hidden className="filigran filigran-koyu right-4 top-6 md:right-10">
          03
        </span>
        <div className="relative mx-auto max-w-[100rem] px-6 py-24 md:px-10 md:py-32">
          <dl className="grid gap-14 sm:grid-cols-3 sm:gap-10">
            {RAKAMLAR.map((r) => (
              <div key={r.etiket} className="reveal">
                <dt className="sr-only">{r.etiket}</dt>
                <dd className="font-display tabular text-[length:var(--text-display)]">
                  {r.deger}
                </dd>
                <p
                  aria-hidden
                  className="mt-4 border-t border-[var(--color-rule-dark)] pt-4 text-sm text-[var(--color-paper)]/60"
                >
                  {r.etiket}
                </p>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ====================================================================
          İLETİŞİM — numaralar ve adres doğrudan burada.
          Eskiden yalnızca bir buton vardı; telefonu görmek için ziyaretçinin
          bir sayfa daha açması gerekiyordu. Aranmak isteyen bir firma için
          bu gereksiz bir engel.
         ==================================================================== */}
      <section className="mx-auto max-w-[100rem] px-6 py-24 md:px-10 md:py-32">
        <div className="grid gap-14 md:grid-cols-12">
          <div className="md:col-span-6">
            <h2 className="font-display reveal text-[length:var(--text-display)]">
              Projenizi konuşalım.
            </h2>
            <p className="mt-6 max-w-md text-lg text-[var(--color-muted)]">
              Arsanız, dönüşüm süreciniz veya daire talebiniz için bize ulaşın.
              Fizibilite görüşmesi için ücret talep etmiyoruz.
            </p>
            <Link
              href="/iletisim"
              className="mt-10 inline-block bg-[var(--color-navy)] px-8 py-4 font-medium text-[var(--color-paper)] transition-colors hover:bg-[var(--color-clay)]"
            >
              İletişim formu
            </Link>
          </div>

          <div className="reveal-late md:col-span-5 md:col-start-8">
            <h3 className="eyebrow border-b border-[var(--color-rule)] pb-4">
              Doğrudan arayın
            </h3>
            <div className="mb-10">
              {telefonlar.map((t) => (
                <a
                  key={t.tel}
                  href={`tel:${telLink(t.tel)}`}
                  className="row-link flex items-baseline justify-between gap-4 border-b border-[var(--color-rule)] py-4"
                >
                  <span className="text-sm text-[var(--color-muted)]">{t.ad}</span>
                  <span className="tabular font-medium">{t.tel}</span>
                </a>
              ))}
            </div>

            <h3 className="eyebrow border-b border-[var(--color-rule)] pb-4">
              Ofis
            </h3>
            <address className="mt-4 not-italic leading-relaxed text-[var(--color-muted)]">
              {ayarlar.adres}
              <br />
              {ayarlar.ilce}
            </address>
            <p className="mt-4 text-sm text-[var(--color-muted)]">
              {ayarlar.calismaSaatleri}
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
