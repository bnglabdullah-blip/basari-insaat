/**
 * Sitenin tum duzenlenebilir metinleri ve iletisim bilgileri.
 *
 * Bu dosya VARSAYILANLARI tutar. Admin panelinden bir alan degistirildiginde
 * deger `ayarlar` tablosuna yazilir ve `lib/queries.ts` icindeki ayarlar()
 * fonksiyonu buradaki varsayilanin uzerine biner.
 *
 * Neden ayri bir dosya: veritabani bos oldugunda (ilk kurulum, yeni gelistirici
 * ortami) site yine de dolu ve duzgun gorunur. "Once icerik gir sonra bak"
 * asamasi hic olusmuyor.
 */

export const VARSAYILAN = {
  // --- Kimlik ---
  firma: "Başarı İnşaat",
  slogan: "Yapıyı ayakta tutan disiplindir.",
  ozet:
    "Eskişehir'de konut ve ticari yapı projeleri geliştiriyoruz. " +
    "Yapı denetim kökenimizle, inşa ettiğimiz her binaya denetlediğimiz " +
    "titizlikle yaklaşıyoruz.",

  // --- Iletisim ---
  adres:
    "Eskibağlar Mahallesi, Prof. Dr. Yılmaz Büyükerşen Bulvarı, " +
    "Adil Över Apartmanı, Kat: 1, Daire: 1",
  ilce: "Tepebaşı / Eskişehir",
  telefonSabit: "0222 221 47 45",
  yetkili1Ad: "Taha Bey",
  yetkili1Tel: "0534 590 25 63",
  yetkili2Ad: "Abdullah Bey",
  yetkili2Tel: "0533 593 81 73",
  eposta: "",
  calismaSaatleri: "Pazartesi – Cumartesi · 09:00 – 18:00",

  // --- Hakkimizda ---
  hakkindaBaslik: "Denetleyen gözle inşa etmek.",
  hakkindaMetin:
    "Başarı İnşaat, yılların yapı denetim tecrübesiyle kurulan bir inşaat " +
    "şirketidir. Bir yapının nerede zayıfladığını, hangi kısaltmanın yıllar " +
    "sonra fatura olarak geri döndüğünü sahada görerek öğrendik.\n\n" +
    "Bu yüzden kendi projelerimizde denetim listesi bizim için formalite " +
    "değil, işin kendisi. Beton kalitesinden donatı yerleşimine, yalıtım " +
    "detayından cephe uygulamasına kadar her aşamayı, denetlediğimiz " +
    "yapılara uyguladığımız aynı ölçütlerle kontrol ediyoruz.",

  // --- SEO ---
  metaAciklama:
    "Başarı İnşaat — Eskişehir'de konut ve ticari yapı projeleri. " +
    "Yapı denetim tecrübesiyle inşaat, cephe uygulaması ve kentsel dönüşüm.",
};
/*
 * Burada bilincli olarak `as const` KULLANILMIYOR.
 *
 * `as const` her alani kendi metninin literal tipine sabitler: `eposta`
 * alaninin tipi `string` degil, bos metnin ta kendisi ("") olur. Bu da
 * veritabanindan gelen degerlerin bu tipe atanamamasina ve `eposta && {...}`
 * gibi kaliplarin derleme hatasi vermesine yol acar. `as const` olmadan
 * anahtar isimleri yine korunur, degerler ise dogru sekilde `string` olur.
 */

export type AyarAnahtari = keyof typeof VARSAYILAN;

/**
 * Hizmetler — sabit liste, panelden yonetilmiyor (nadiren degisir).
 *
 * `slug` ELLE yazildi, baslikdan slugla() ile turetilmedi. Sebep: URL kalici
 * bir adrestir. Baslik ileride "Cephe Uygulamasi"ndan "Cephe Sistemleri"ne
 * cevrilirse turetilmis bir slug sessizce degisir, o adrese verilmis her
 * baglanti ve birikmis arama motoru degeri kirilir.
 */
export const HIZMETLER = [
  {
    no: "01",
    slug: "konut-projeleri",
    ad: "Konut Projeleri",
    ozet:
      "Arsa değerlendirmesinden anahtar teslimine kadar, projelendirme ve " +
      "inşa süreçlerinin tamamını üstleniyoruz.",
    kapsam: [
      "Arsa ve imar durumu değerlendirmesi",
      "Mimari ve statik projelendirme",
      "Kaba inşaat ve betonarme uygulama",
      "İnce işler, cephe ve peyzaj",
      "İskân ruhsatı ve anahtar teslimi",
    ],
    detay:
      "Bir konut projesinde en pahalı hatalar ilk kazmada değil, ilk çizimde " +
      "yapılır. Yanlış kurgulanmış bir kat planı ya da yetersiz hesaplanmış " +
      "bir temel, yıllar sonra tadilatla düzeltilmeye çalışılır ve asla tam " +
      "düzelmez.\n\n" +
      "Bu yüzden projelendirme aşamasını inşaattan ayrı bir iş olarak " +
      "görmüyoruz. Mimari, statik ve mekanik projeler birbirine oturmadan " +
      "sahaya çıkmıyoruz; sahada çıkan her değişiklik projeye işleniyor. " +
      "Teslim ettiğimiz binanın projesi, gerçekte inşa edilmiş halidir.",
  },
  {
    no: "02",
    slug: "kentsel-donusum",
    ad: "Kentsel Dönüşüm",
    ozet:
      "Riskli yapı tespitinden yeni binanın teslimine kadar hak sahipleriyle " +
      "şeffaf yürütülen dönüşüm süreçleri.",
    kapsam: [
      "Riskli yapı tespiti ve başvuru",
      "Hak sahipleriyle paylaşım görüşmeleri",
      "Yıkım ve hafriyat",
      "Yeni yapının inşası",
      "Kira yardımı ve taşınma süreci takibi",
    ],
    detay:
      "Kentsel dönüşümde teknik iş, işin kolay tarafıdır. Zor olan, aynı " +
      "binada oturan onlarca hak sahibinin aynı masada anlaşmasıdır. " +
      "Süreçlerin çoğu inşaat sorunlarından değil, iletişim eksikliğinden " +
      "tıkanır.\n\n" +
      "Paylaşım oranını, takvimi ve maliyetleri en baştan yazılı olarak " +
      "veriyoruz. Şartlar değişirse — ki bazen değişir — herkesi aynı anda " +
      "bilgilendiriyoruz. Yapı denetim geçmişimiz burada da işe yarıyor: " +
      "riskli yapı raporunun ne anlama geldiğini ve neyi gerektirdiğini " +
      "hak sahibine anlatabiliyoruz.",
  },
  {
    no: "03",
    slug: "cephe-uygulamasi",
    ad: "Cephe Uygulaması",
    ozet:
      "Kompozit, seramik ve tuğla cephe sistemleri; ısı yalıtımı ve su " +
      "yalıtımı detaylarıyla birlikte uygulanır.",
    kapsam: [
      "Havalandırmalı cephe sistemleri",
      "Kompozit ve seramik kaplama",
      "Klinker tuğla uygulaması",
      "Isı yalıtımı (mantolama)",
      "Su yalıtımı ve denizlik detayları",
    ],
    detay:
      "Cephe, binanın hava ile temas eden tek yüzeyidir; bir binanın yaşlanma " +
      "hızını en çok belirleyen katman burasıdır. Yanlış çözülmüş bir " +
      "denizlik detayı, arkasındaki yalıtımı birkaç kışta işe yaramaz hale " +
      "getirir.\n\n" +
      "Kaplamayı ve yalıtımı ayrı işler olarak ihale etmiyoruz. Taşıyıcı " +
      "konstrüksiyon, yalıtım, su tahliyesi ve kaplama tek elden " +
      "kurgulandığında birleşim yerleri açıkta kalmıyor.",
  },
  {
    no: "04",
    slug: "yapi-denetim-danismanligi",
    ad: "Yapı Denetim Danışmanlığı",
    ozet:
      "Kurucu ortaklarımızın yapı denetim tecrübesiyle, süreç boyunca " +
      "bağımsız teknik kontrol ve raporlama.",
    kapsam: [
      "Mevcut yapı durum tespiti",
      "Beton ve donatı kontrolü",
      "Hakediş ve imalat doğrulaması",
      "Fotoğraflı ilerleme raporlaması",
      "Teslim öncesi eksik listesi",
    ],
    detay:
      "Kendi inşaatını kendi denetleyen bir firmanın raporu, ne kadar dürüst " +
      "olursa olsun bağımsız değildir. Bunu biliyoruz — bu yüzden bu hizmeti " +
      "kendi projelerimiz için değil, başkalarının yaptırdığı işler için " +
      "veriyoruz.\n\n" +
      "Yapı sahibi adına sahaya giriyor, imalatı yazılı ve fotoğraflı " +
      "raporluyoruz. Hakedişte istenen ile sahada yapılan arasındaki farkı " +
      "görmek, çoğu zaman danışmanlık bedelinin kendisinden fazlasını " +
      "geri kazandırır.",
  },
] as const;

/** Calisma sureci — /surec sayfasi. */
export const SUREC = [
  {
    no: "01",
    ad: "Görüşme ve fizibilite",
    aciklama:
      "Arsanın imar durumu, emsal ve kat yüksekliği çıkarılır. Kaç metrekare " +
      "yapılabileceği ve bunun ne anlama geldiği ilk görüşmede konuşulur.",
  },
  {
    no: "02",
    ad: "Sözleşme ve paylaşım",
    aciklama:
      "Paylaşım oranı, takvim ve tarafların yükümlülükleri yazılı hale " +
      "getirilir. Sözlü mutabakatla işe başlamıyoruz.",
  },
  {
    no: "03",
    ad: "Projelendirme",
    aciklama:
      "Mimari, statik ve mekanik projeler hazırlanır, belediye onayından " +
      "geçirilir. Ruhsat alınmadan sahaya çıkılmaz.",
  },
  {
    no: "04",
    ad: "Kaba inşaat",
    aciklama:
      "Hafriyat, temel, betonarme ve duvar imalatı. Her beton dökümü öncesi " +
      "donatı kontrolü yapılır ve kayda geçirilir.",
  },
  {
    no: "05",
    ad: "İnce işler ve cephe",
    aciklama:
      "Yalıtım, cephe kaplaması, sıva, şap, mekanik ve elektrik tesisatı, " +
      "doğrama ve son kat imalatlar.",
  },
  {
    no: "06",
    ad: "Teslim",
    aciklama:
      "İskân ruhsatı, eksik listesinin kapatılması ve anahtar teslimi. " +
      "Teslimden sonra da ulaşılabilir olmaya devam ediyoruz.",
  },
] as const;

/**
 * Ekip — /ekip sayfasi.
 *
 * Portre fotografi YOK, tipografik kartlar kullaniliyor. Elimizde portre
 * bulunmadigi icin secilmis bir kisit: stok fotograf veya bos avatar
 * koymaktansa hic gorsel koymamak daha durust duruyor.
 */
export const EKIP = [
  {
    ad: "Taha Bey",
    unvan: "Kurucu Ortak",
    alan: "Saha ve uygulama",
    ozgecmis:
      "Yapı denetim tarafında yıllarca beton dökümü, donatı yerleşimi ve " +
      "cephe uygulaması denetledi. Sahada neyin nerede kısaldığını, o " +
      "kısalmanın kaç yıl sonra hangi faturayla geri döndüğünü gördü.",
  },
  {
    ad: "Abdullah Bey",
    unvan: "Kurucu Ortak",
    alan: "Proje ve süreç",
    ozgecmis:
      "Ruhsat, proje onayı ve hak sahibi görüşmeleri tarafını yürütüyor. " +
      "Kentsel dönüşümde sürecin teknik değil idari nedenlerle tıkandığını " +
      "gördüğü için bu tarafı işin merkezine aldı.",
  },
] as const;

/** Ana sayfadaki rakamlar. */
export const RAKAMLAR = [
  { deger: "15+", etiket: "Yıllık saha tecrübesi" },
  { deger: "100%", etiket: "Deprem yönetmeliğine uyum" },
  { deger: "1", etiket: "Devam eden proje" },
] as const;

/**
 * Gezinme — header ve footer'in TEK kaynagi.
 *
 * Ayni diziden beslenmeleri sart: kullanici footer'da gordugu bir gruplamayi
 * header'da da bulmayi bekler. Iki ayri liste tutulsaydi biri guncellenip
 * digeri unutuldugunda sessizce ayrisirlardi.
 *
 * `alt` tasiyan ogeler header'da acilir menu, footer'da sutun oluyor.
 * Gruplarin kendisi de gercek bir sayfaya isaret ediyor (`yol`): boylece
 * dokunmatik cihazda acilir menu acilmasa bile ustune dokunmak calisir ve
 * klavye kullanicisi icin normal bir baglanti olarak kalirlar.
 */
export const GEZINME = [
  { yol: "/", ad: "Ana Sayfa" },
  {
    yol: "/hakkimizda",
    ad: "Kurumsal",
    alt: [
      { yol: "/hakkimizda", ad: "Hakkımızda" },
      { yol: "/ekip", ad: "Ekip" },
      { yol: "/surec", ad: "Çalışma Sürecimiz" },
    ],
  },
  {
    yol: "/hizmetler",
    ad: "Hizmetler",
    alt: [
      { yol: "/hizmetler", ad: "Tüm Hizmetler" },
      ...HIZMETLER.map((h) => ({ yol: `/hizmetler/${h.slug}`, ad: h.ad })),
    ],
  },
  { yol: "/projeler", ad: "Projeler" },
  { yol: "/iletisim", ad: "İletişim" },
];

/**
 * Siteyi gelistiren firma.
 *
 * `url` bos oldugu surece footer'da duz metin olarak basiliyor; doldurulunca
 * kendiliginden baglantiya donusuyor. Bos bir href veya "#" birakmak, tiklayip
 * hicbir yere gitmeyen bir baglanti uretirdi.
 */
export const GELISTIRICI = {
  ad: "EZ Solutions",
  url: "",
};

/** Telefon numarasini tel: baglantisi icin normalize eder: "0222 221 47 45" -> "+902222214745" */
export function telLink(numara: string): string {
  const rakamlar = numara.replace(/\D/g, "");
  return rakamlar.startsWith("0") ? `+9${rakamlar}` : `+90${rakamlar}`;
}
