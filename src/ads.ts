import { Capacitor } from "@capacitor/core";
import {
  AdMob,
  BannerAdPosition,
  BannerAdSize,
  InterstitialAdPluginEvents,
} from "@capacitor-community/admob";

// Google's official test IDs — replace with real ad unit IDs before release.
const BANNER_ID = "ca-app-pub-3940256099942544/6300978111";
const INTERSTITIAL_ID = "ca-app-pub-3940256099942544/1033173712";

let initialized = false;
let interstitialReady = false;

export function isNative(): boolean {
  return Capacitor.isNativePlatform();
}

export async function initAds(): Promise<void> {
  if (!isNative() || initialized) return;
  await AdMob.initialize();
  initialized = true;

  await AdMob.showBanner({
    adId: BANNER_ID,
    adSize: BannerAdSize.ADAPTIVE_BANNER,
    position: BannerAdPosition.BOTTOM_CENTER,
  });

  AdMob.addListener(InterstitialAdPluginEvents.Loaded, () => {
    interstitialReady = true;
  });
  AdMob.addListener(InterstitialAdPluginEvents.Dismissed, () => {
    interstitialReady = false;
    void prepareInterstitial();
  });
  await prepareInterstitial();
}

async function prepareInterstitial(): Promise<void> {
  try {
    await AdMob.prepareInterstitial({ adId: INTERSTITIAL_ID });
  } catch {
    // no fill / offline — app keeps working without ads
  }
}

/** Shown after a successful save/share. Never blocks the core flow. */
export async function maybeShowInterstitial(): Promise<void> {
  if (!isNative() || !interstitialReady) return;
  try {
    await AdMob.showInterstitial();
  } catch {
    // ignore — ads must never break the save flow
  }
}
