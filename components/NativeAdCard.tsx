import { useEffect, useState } from "react";
import { View, Text, Image } from "react-native";
import {
  NativeAd,
  NativeAdView,
  NativeAsset,
  NativeAssetType,
  NativeMediaView,
  NativeAdEventType,
  TestIds,
} from "react-native-google-mobile-ads";

const CARD_WIDTH = 340;
const CARD_HEIGHT = 520;

export default function NativeAdCard() {
  const [nativeAd, setNativeAd] = useState<NativeAd | null>(null);

  useEffect(() => {
    NativeAd.createForAdRequest(TestIds.NATIVE)
      .then(setNativeAd)
      .catch(console.error);

    return () => {
      nativeAd?.destroy();
    };
  }, []);

  useEffect(() => {
    if (!nativeAd) return;
    const listener = nativeAd.addAdEventListener(
      NativeAdEventType.CLICKED,
      () => {
        console.log("Ad clicked");
      },
    );
    return () => listener.remove();
  }, [nativeAd]);

  if (!nativeAd) return null;

  return (
    <NativeAdView nativeAd={nativeAd}>
      <View
        style={{
          width: CARD_WIDTH,
          height: CARD_HEIGHT,
          backgroundColor: "#fff",
          borderRadius: 12,
          padding: 16,
          alignSelf: "center",
          justifyContent: "space-between",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 4,
        }}
      >
        {nativeAd.icon && (
          <NativeAsset assetType={NativeAssetType.ICON}>
            <Image
              source={{ uri: nativeAd.icon.url }}
              style={{ width: 50, height: 50, borderRadius: 8 }}
            />
          </NativeAsset>
        )}

        <NativeAsset assetType={NativeAssetType.HEADLINE}>
          <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 4 }}>
            {nativeAd.headline}
          </Text>
        </NativeAsset>

        <Text style={{ fontSize: 12, color: "#999" }}>Sponsored</Text>

        <NativeMediaView
          style={{ height: 180, marginTop: 10 }}
          resizeMode="cover"
        />

        <NativeAsset assetType={NativeAssetType.BODY}>
          <Text style={{ fontSize: 14, marginTop: 10 }}>{nativeAd.body}</Text>
        </NativeAsset>

        <NativeAsset assetType={NativeAssetType.CALL_TO_ACTION}>
          <Text
            style={{
              backgroundColor: "#2563eb",
              color: "#fff",
              padding: 10,
              textAlign: "center",
              marginTop: 12,
              borderRadius: 6,
            }}
          >
            {nativeAd.callToAction}
          </Text>
        </NativeAsset>
      </View>
    </NativeAdView>
  );
}
