import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { BrandLoader } from '@/components/brand/BrandLoader';
import { BrandIntro } from '@/components/brand/BrandIntro';
import { useReminderActions } from '@/hooks/useReminderActions';
import { WakeOverlay } from '@/components/ui/WakeOverlay';
import { SosFloat } from '@/components/ui/SosFloat';
import { AppLockProvider } from '@/providers/AppLockProvider';
import { AuthProvider, useAuth } from '@/providers/AuthProvider';
import { OfflineQueueProvider } from '@/providers/OfflineQueueProvider';
import { QueryProvider } from '@/providers/QueryProvider';
import { ToastProvider } from '@/providers/ToastProvider';
import { colors } from '@/theme/tokens';
import { useAppFonts } from '@/theme/useAppFonts';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

function Routes() {
  const { status } = useAuth();
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg }, animation: 'fade' }}>
      <Stack.Screen name="index" />
      <Stack.Protected guard={status === 'signedIn'}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="emergency" options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom', gestureEnabled: false }} />
        <Stack.Screen name="daily-log" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="insights" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="contacts" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="devices" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="medical-id" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="report" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="calendar" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="settings" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="medication-form" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="seizure-form" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="contact-form" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      </Stack.Protected>
      <Stack.Protected guard={status === 'signedOut'}>
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}

function Shell() {
  const fontsReady = useAppFonts();
  const { status } = useAuth();
  useReminderActions();
  const [introDone, setIntroDone] = useState(false);
  const finishIntro = useCallback(() => setIntroDone(true), []);

  // El splash nativo (mismo fondo) se quita en cuanto la animación de marca puede dibujarse.
  useEffect(() => {
    if (fontsReady) SplashScreen.hideAsync().catch(() => undefined);
  }, [fontsReady]);

  // Seguro: si la animación nativa no avisa que terminó, la capa de entrada (zIndex alto) taparía los toques.
  useEffect(() => {
    const id = setTimeout(finishIntro, 3500);
    return () => clearTimeout(id);
  }, [finishIntro]);

  if (!fontsReady) return null;
  return (
    <>
      <StatusBar style="light" />
      <AppLockProvider>
        {status === 'loading' ? (
          <View style={styles.loading}>
            <BrandLoader />
          </View>
        ) : (
          <Routes />
        )}
      </AppLockProvider>
      <SosFloat />
      <WakeOverlay />
      {!introDone ? <BrandIntro onDone={finishIntro} /> : null}
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <QueryProvider>
          <AuthProvider>
            <OfflineQueueProvider>
              <ToastProvider>
                <Shell />
              </ToastProvider>
            </OfflineQueueProvider>
          </AuthProvider>
        </QueryProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
});
