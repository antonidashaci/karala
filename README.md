# Karala

> 🇹🇷 Türkçe: [README.tr.md](README.tr.md)

Black out / blur personal info (names, IBANs, phone numbers, faces) in screenshots — **100% on-device**. No server, no upload, works offline. Turkish + English UI (auto-detected from device language).

Built as a zero-fixed-cost utility: web app core wrapped with Capacitor for Google Play, monetized with AdMob (banner + interstitial after save/share).

## Run (web)

```bash
npm install
npm run dev      # local dev server
npm run build    # production bundle (dist/) — ~9 KB gzip
```

## Android (Capacitor)

Requires Android Studio / SDK installed.

```bash
npm run build
npx cap sync android
npx cap open android   # build & run from Android Studio
```

### Before Play Store release

1. Replace AdMob **test IDs**:
   - `android/app/src/main/AndroidManifest.xml` → `com.google.android.gms.ads.APPLICATION_ID`
   - `src/ads.ts` → `BANNER_ID`, `INTERSTITIAL_ID`
2. App icon + splash (`npx @capacitor/assets generate`)
3. Signing key + `bundleRelease` in Android Studio
4. Privacy policy URL (required by Play because of AdMob)
5. Share-sheet image handoff: manifest already registers the app as a share target; wire `capacitor-plugin-send-intent` to receive the shared image directly into the editor

## Structure

- `src/main.ts` — UI shell, input handling (picker / drag-drop / paste), export
- `src/editor.ts` — canvas redaction engine (brush + rect; solid / blur / pixelate; undo)
- `src/ads.ts` — AdMob wrapper (no-op on web; never blocks core flow)
- `src/strings.ts` — TR/EN strings
- `capacitor.config.ts`, `android/` — native shell

## Principles

- **Privacy is the product:** image never leaves the device; export re-encodes via canvas → EXIF/location metadata stripped automatically
- **Zero fixed cost:** no backend, no API keys, nothing to maintain except the yearly Play target-SDK bump
- **Ads never break the flow:** offline / no-fill → app works identically
