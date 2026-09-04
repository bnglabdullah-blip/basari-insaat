/**
 * Fotograflarin TARAYICIDA kucultulup WebP'ye cevrilmesi.
 *
 * Neden sunucuda degil: fotograflar artik sunucudan hic gecmiyor. Netlify
 * fonksiyon govde limiti ~6 MB oldugu icin dosya, imzali bir URL ile
 * dogrudan tarayicidan Supabase Storage'a yukleniyor. Yani kucultmenin
 * yapilabilecegi TEK yer burasi — sunucu dosyayi hic gormuyor.
 *
 * Bagimlilik yok: kullanilan her sey tarayicinin kendi API'si
 * (createImageBitmap, OffscreenCanvas / <canvas>, toBlob).
 */

/** Uzun kenarin ust siniri. Tam genislik hero alani icin fazlasiyla yeterli. */
export const AZAMI_KENAR = 1920;

/**
 * Storage bucket'i sunucu tarafinda 2 MB ve yalnizca image/webp zorluyor
 * (bkz. supabase/migrations/0002_storage.sql). Bu sinirin ustunde bir dosya
 * gondermek Storage'dan anlasilmaz bir ret alir; o yuzden sinir burada,
 * yuklemeden ONCE uygulaniyor.
 */
export const AZAMI_CIKTI = 2 * 1024 * 1024;

const TUR = "image/webp";

/**
 * Sirayla denenen kaliteler. Ilk deger tipik bir bina fotografini ~200-400 KB'a
 * indiriyor; alt basamaklar yalnizca cok detayli (gurultulu, agacli) karelerde
 * devreye giriyor. Liste bitip hala 2 MB'in ustundeyse hata donuyor —
 * sonsuza kadar kalite dusurmek, taninmaz bir fotograf uretmekten baska ise
 * yaramaz.
 */
const KALITELER = [0.82, 0.7, 0.58, 0.45];

/**
 * Hedef olculeri hesaplar: uzun kenar `azami`yi asmayacak sekilde, en-boy
 * orani korunarak.
 *
 * Zaten kucuk olan bir fotograf BUYUTULMEZ. Buyutmek dosyayi sisirir, detay
 * eklemez.
 *
 * Bu fonksiyon bilincli olarak saf: modulun test edilebilen tek parcasi bu
 * (gerisi tarayici API'si, node:test icinde calismaz). Bkz. gorsel-olcu.test.ts
 */
export function yeniOlcu(
  genislik: number,
  yukseklik: number,
  azami: number = AZAMI_KENAR
): { genislik: number; yukseklik: number } {
  const uzunKenar = Math.max(genislik, yukseklik);
  if (uzunKenar <= azami || uzunKenar === 0) return { genislik, yukseklik };

  const oran = azami / uzunKenar;
  // Yuvarlama 0 uretebilir (ornegin 4000x3 bir panorama seridi); canvas
  // 0 boyutla hata verir, en az 1 piksel garanti ediliyor.
  return {
    genislik: Math.max(1, Math.round(genislik * oran)),
    yukseklik: Math.max(1, Math.round(yukseklik * oran)),
  };
}

/** OffscreenCanvas ve <canvas> ayni isi iki farkli isimle yapiyor. */
function kanvasKur(genislik: number, yukseklik: number) {
  if (typeof OffscreenCanvas !== "undefined") {
    return new OffscreenCanvas(genislik, yukseklik);
  }
  const k = document.createElement("canvas");
  k.width = genislik;
  k.height = yukseklik;
  return k;
}

function kodla(
  kanvas: OffscreenCanvas | HTMLCanvasElement,
  kalite: number
): Promise<Blob | null> {
  if ("convertToBlob" in kanvas) {
    return kanvas.convertToBlob({ type: TUR, quality: kalite });
  }
  return new Promise((coz) => kanvas.toBlob(coz, TUR, kalite));
}

/**
 * Bir fotografi yuklemeye hazir WebP blob'una cevirir.
 *
 * GIZLILIK — tesadufi degil, ozellik: kareyi canvas'a cizip yeniden kodlamak
 * EXIF blogunu tamamen dusurur. Telefonla cekilmis fotograflar GPS
 * koordinati, cekim tarihi ve cihaz modeli tasir; bunlarin bir insaat
 * firmasinin herkese acik sitesine cikmasi istenmez. Metadata'yi ayiklamaya
 * calisan bir kod yazmak yerine, hic tasimayan bir boru hatti kuruluyor.
 *
 * TUZAK — EXIF ile birlikte `Orientation` etiketi de dusuyor. Telefonlar
 * fotografi cogunlukla sensorun dogal yonunde kaydedip "bunu 90 derece
 * cevirerek goster" bilgisini EXIF'e yazar. Etiket dustugu icin yon
 * CIZMEDEN ONCE piksellere uygulanmak zorunda: `imageOrientation:
 * "from-image"` tam olarak bunu yapiyor. Bu satir olmadan telefonla cekilmis
 * her dikey fotograf sitede yan doner.
 */
export async function gorselKucult(dosya: File): Promise<Blob> {
  if (typeof createImageBitmap !== "function") {
    throw new Error(
      "Tarayıcınız fotoğraf işlemeyi desteklemiyor. Güncel bir Chrome, Safari, Edge veya Firefox kullanın."
    );
  }

  let kare: ImageBitmap;
  try {
    kare = await createImageBitmap(dosya, { imageOrientation: "from-image" });
  } catch {
    throw new Error(
      `"${dosya.name}" okunamadı; dosya bozuk olabilir veya desteklenmeyen bir biçimde.`
    );
  }

  const { genislik, yukseklik } = yeniOlcu(kare.width, kare.height);
  const kanvas = kanvasKur(genislik, yukseklik);
  const ctx = kanvas.getContext("2d") as
    | OffscreenCanvasRenderingContext2D
    | CanvasRenderingContext2D
    | null;

  if (!ctx) {
    kare.close();
    throw new Error(
      "Tarayıcı çizim yüzeyi oluşturamadı. Sekmeyi yenileyip tekrar deneyin."
    );
  }

  ctx.drawImage(kare, 0, 0, genislik, yukseklik);
  // Cozulmus kare birkac yuz MB ham piksel olabilir; 10 fotograflik bir
  // secimde bunlarin birikmesi sekmeyi dusurur. Isimiz bitti, hemen birak.
  kare.close();

  for (const kalite of KALITELER) {
    const blob = await kodla(kanvas, kalite);
    if (!blob) continue;

    /*
     * Cikti turu KONTROL EDILIYOR: WebP kodlamayi desteklemeyen eski bir
     * tarayici toBlob'da sessizce PNG'ye duser. Bucket yalnizca image/webp
     * kabul ettigi icin bu dosya yuklemede reddedilir ve sebebi anlasilmaz
     * gorunur. Burada yakalamak, orada sasirmaktan iyi.
     */
    if (blob.type !== TUR) {
      throw new Error(
        "Tarayıcınız WebP kaydetmeyi desteklemiyor. Güncel bir tarayıcı kullanın."
      );
    }

    if (blob.size <= AZAMI_CIKTI) return blob;
  }

  throw new Error(
    `"${dosya.name}" en düşük kalitede bile 2 MB'ın altına inmedi. Fotoğrafı küçültüp tekrar deneyin.`
  );
}
