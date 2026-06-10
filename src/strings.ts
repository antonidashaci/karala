export type Locale = "tr" | "en";

export interface Strings {
  appName: string;
  tagline: string;
  privacyNote: string;
  dropTitle: string;
  dropSub: string;
  pickBtn: string;
  pasteHint: string;
  toolBrush: string;
  toolRect: string;
  modeSolid: string;
  modeBlur: string;
  modePixelate: string;
  brushSize: string;
  undo: string;
  clearAll: string;
  newImage: string;
  save: string;
  share: string;
  saved: string;
  emptyWarn: string;
  footer: string;
}

const TR: Strings = {
  appName: "Karala",
  tagline: "Ekran görüntüsündeki kişisel bilgileri karala, güvenle paylaş.",
  privacyNote: "🔒 %100 cihazında işlenir — sunucu yok, yükleme yok. Uçak modunda bile çalışır.",
  dropTitle: "Ekran görüntüsünü seç",
  dropSub: "İsim, IBAN, telefon, adres… karala ya da bulanıklaştır, sonra paylaş.",
  pickBtn: "📸 Görsel seç",
  pasteHint: "veya buraya sürükle · Ctrl+V ile yapıştır",
  toolBrush: "Fırça",
  toolRect: "Dikdörtgen",
  modeSolid: "Karala",
  modeBlur: "Bulanık",
  modePixelate: "Mozaik",
  brushSize: "Kalınlık",
  undo: "Geri al",
  clearAll: "Hepsini sil",
  newImage: "Yeni görsel",
  save: "💾 Kaydet",
  share: "↗ Paylaş",
  saved: "Kaydedildi ✓",
  emptyWarn: "Önce bir alanı karala 🙂",
  footer: "Kaydedilen görselde konum ve cihaz bilgisi (EXIF) bulunmaz.",
};

const EN: Strings = {
  appName: "Karala",
  tagline: "Black out personal info in screenshots, share safely.",
  privacyNote: "🔒 100% on-device — no server, no upload. Works in airplane mode.",
  dropTitle: "Pick a screenshot",
  dropSub: "Names, IBANs, phone numbers, addresses… redact or blur, then share.",
  pickBtn: "📸 Choose image",
  pasteHint: "or drag & drop here · paste with Ctrl+V",
  toolBrush: "Brush",
  toolRect: "Rectangle",
  modeSolid: "Black out",
  modeBlur: "Blur",
  modePixelate: "Pixelate",
  brushSize: "Size",
  undo: "Undo",
  clearAll: "Clear all",
  newImage: "New image",
  save: "💾 Save",
  share: "↗ Share",
  saved: "Saved ✓",
  emptyWarn: "Redact an area first 🙂",
  footer: "Saved image contains no location or device metadata (EXIF).",
};

export function detectLocale(): Locale {
  const saved = localStorage.getItem("karala-locale");
  if (saved === "tr" || saved === "en") return saved;
  return navigator.language.toLowerCase().startsWith("tr") ? "tr" : "en";
}

export function getStrings(locale: Locale): Strings {
  return locale === "tr" ? TR : EN;
}
