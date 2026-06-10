# Karala

Ekran görüntüsündeki kişisel bilgileri (isim, IBAN, telefon, adres, yüz) karala veya bulanıklaştır — **%100 cihazda çalışır**. Sunucu yok, yükleme yok, internetsiz bile çalışır. Türkçe + İngilizce arayüz (cihaz diline göre otomatik).

Sıfır sabit maliyetli bir araç olarak tasarlandı: web çekirdeği Capacitor ile Google Play'e sarılır, gelir modeli AdMob (alt banner + kaydet/paylaş sonrası geçiş reklamı).

## Çalıştırma (web)

```bash
npm install
npm run dev      # yerel geliştirme sunucusu
npm run build    # üretim paketi (dist/) — ~9 KB gzip
```

## Android (Capacitor)

Android Studio / SDK kurulu olmalı.

```bash
npm run build
npx cap sync android
npx cap open android   # Android Studio'dan derle ve çalıştır
```

### Play Store yayını öncesi

1. AdMob **test ID'lerini** gerçekleriyle değiştir:
   - `android/app/src/main/AndroidManifest.xml` → `com.google.android.gms.ads.APPLICATION_ID`
   - `src/ads.ts` → `BANNER_ID`, `INTERSTITIAL_ID`
2. Uygulama ikonu + açılış ekranı (`npx @capacitor/assets generate`)
3. İmza anahtarı + Android Studio'da `bundleRelease`
4. Gizlilik politikası URL'i (AdMob nedeniyle Play'de zorunlu)
5. Paylaşım menüsü entegrasyonu: manifest kaydı hazır; paylaşılan görselin doğrudan editöre düşmesi için `capacitor-plugin-send-intent` bağlanacak

## Yapı

- `src/main.ts` — arayüz, girdi yönetimi (seçici / sürükle-bırak / yapıştır), dışa aktarma
- `src/editor.ts` — canvas sansür motoru (fırça + dikdörtgen; karala / bulanık / mozaik; geri al)
- `src/ads.ts` — AdMob sarmalayıcı (web'de devre dışı; ana akışı asla bloklamaz)
- `src/strings.ts` — TR/EN metinler
- `capacitor.config.ts`, `android/` — native kabuk

## İlkeler

- **Mahremiyet ürünün kendisi:** görsel cihazdan asla çıkmaz; canvas üzerinden yeniden kodlandığı için EXIF/konum verisi otomatik silinir
- **Sıfır sabit maliyet:** backend yok, API anahtarı yok; tek bakım yıllık Play hedef-SDK güncellemesi
- **Reklam akışı asla bozmaz:** offline / reklam yoksa uygulama aynen çalışır
