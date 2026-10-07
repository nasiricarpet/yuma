import { I18nManager } from 'react-native';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  Vazirmatn_400Regular,
  Vazirmatn_700Bold,
  useFonts,
} from '@expo-google-fonts/vazirmatn';
import { enableRTL } from '@yuma/ui/native';
import '../global.css';

// راست‌به‌چپ — باید پیش از رندر درخت کامپوننت فعال شود.
// `forceRTL` فقط پس از یک ری‌استارت کامل اعمال می‌شود؛ مقدار
// `expo.extra.forcesRTL` در app.json این کار را پیش از اولین استارت انجام می‌دهد.
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);
// گارد اضافی برای Runtime (نگاه کنید به @yuma/ui/native)
enableRTL();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Vazirmatn_400Regular,
    Vazirmatn_700Bold,
  });

  // در صورت خطای فونت هم اپ را اجرا می‌کنیم (فونت سیستم جایگزین می‌شود)
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <Slot />
    </SafeAreaProvider>
  );
}
