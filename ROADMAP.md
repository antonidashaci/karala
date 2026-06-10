# Roadmap

Strateji: sıfır sabit maliyetli, offline, tek sorunu çözen mikro-ürün portföyü.
Gelir: Play Store + AdMob (banner + geçiş reklamı), ileride "reklamları kaldır" tek seferlik satın alma.
Kural: tutmayan ürün 90 günde arşivlenir; bakım bütçesi ayda 4-8 saat.

## Faz 1 — Karala'yı Play Store'a çıkar (mevcut durum: web MVP + Android iskeleti hazır)

- [ ] Android Studio kur, `npx cap sync android` + ilk APK derlemesi, gerçek cihazda test
- [ ] AdMob hesabı aç → gerçek ID'leri koy:
  - `android/app/src/main/AndroidManifest.xml` → `APPLICATION_ID`
  - `src/ads.ts` → `BANNER_ID`, `INTERSTITIAL_ID`
- [ ] İkon + splash: `npx @capacitor/assets generate`
- [ ] Google Play Developer hesabı ($25)
- [ ] Gizlilik politikası sayfası (AdMob için zorunlu) — GitHub Pages, $0
- [ ] İmza anahtarı + `bundleRelease` (AAB) + Play Console'a yükle
- [ ] Mağaza metni TR odaklı ASO: "ekran görüntüsü sansürle", "fotoğraf karalama", "IBAN gizle", "blur"
- [ ] Paylaşım menüsü: `capacitor-plugin-send-intent` ile paylaşılan görsel doğrudan editöre düşsün (manifest kaydı hazır)

## Faz 2 — Karala iyileştirmeleri (indirme gelirse)

- [ ] Otomatik tespit: tesseract.js (yerel OCR) ile TC/IBAN/telefon/e-posta regex'i → tek dokunuşla öner-karala
- [ ] Yüz bulanıklaştırma (yerel model, ör. MediaPipe face detection)
- [ ] "Reklamları kaldır" tek seferlik IAP (~79₺) — Play Billing
- [ ] Zoom/pan, kalıcı ayarlar (son mod/araç)
- [ ] Web sürümünü ücretsiz yayınla (Vercel/GitHub Pages) → SEO kanalı: "ekran görüntüsü sansürleme"

## Faz 3 — Portföy ürün adayları (aynı Capacitor+AdMob iskeletiyle)

Öncelik sırası:

1. **Sesli not → yazı (offline)** — whisper küçük model on-device. Avukat/öğrenci/esnaf, yüksek frekans, ödüllü video reklam (en yüksek eCPM). Teknik eşik = kopyalanması zor.
2. **Toplu görsel küçültücü/temizleyici** — Trendyol/Dolap/sahibinden satıcıları için preset'ler. Yüksek frekans.
3. **Basit Phaser oyunu** — piyango bileti; minimal geometrik asset, aynı iskelet. Ana plan değil, portföyün 3-4. denemesi.
4. **Dilekçe/fatura üretici** — düşük frekans → reklam değil tek seferlik satış modeli. SEO'su ucuz ("dilekçe örneği").

## Bekleyen (WhatDoISay — ayrı repo)

- Sunucu kotası + rate limit (Groq fatura riski — büyüme öncesi şart)
- Groq API anahtarını rotate et (sohbette ifşa oldu)
- Gerçek ödeme (iyzico/Stripe), TWA ile Play Store

## Karar metrikleri

- Karala D7 retention + günlük organik indirme → Faz 2'ye geçiş kararı
- 90 gün sonunda anlamlı indirme yoksa → Faz 3'ün 1. adayına geç
