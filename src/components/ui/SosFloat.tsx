import { router, usePathname } from 'expo-router';
import { StyleSheet } from 'react-native';
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { haptic } from '@/lib/haptics';
import { useAuth } from '@/providers/AuthProvider';
import { colors, shadow } from '@/theme/tokens';
import { Icon } from './Icon';
import { PressableScale } from './PressableScale';
import { Text } from './Text';

/** Rutas que ya tienen su propio acceso a emergencia (barra de tabs) o donde no debe aparecer. */
const HIDDEN = new Set(['/', '/medications', '/crisis', '/more', '/emergency', '/onboarding', '/login', '/register', '/medication-form', '/seizure-form', '/contact-form']);

/** Boton SOS compacto, siempre al alcance en las pantallas apiladas fuera de las tabs. */
export function SosFloat() {
  const { status } = useAuth();
  const path = usePathname();
  const insets = useSafeAreaInsets();
  if (status !== 'signedIn' || HIDDEN.has(path)) return null;
  return (
    <Animated.View entering={FadeInDown.duration(260)} exiting={FadeOut.duration(120)} style={[styles.wrap, { bottom: insets.bottom + 16 }]} pointerEvents="box-none">
      <PressableScale
        onPress={() => {
          haptic.heavy();
          router.push('/emergency');
        }}
        hapticFeedback={false}
        pressedScale={0.92}
        accessibilityLabel="Emergencia"
        accessibilityHint="Abre la pantalla de emergencia con cuenta atrás"
        style={styles.btn}
      >
        <Icon name="alert" size={20} color="#2a0510" strokeWidth={2.4} />
        <Text variant="label" color="#2a0510" style={styles.txt}>
          SOS
        </Text>
      </PressableScale>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', right: 16 },
  btn: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 48, paddingHorizontal: 18, borderRadius: 24, backgroundColor: colors.coral, ...shadow.glow(colors.coral) },
  txt: { fontWeight: '800', letterSpacing: 1 },
});
