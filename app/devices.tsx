import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { Card } from '@/components/ui/Card';
import { Header } from '@/components/ui/Header';
import { Icon } from '@/components/ui/Icon';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { colors, radius, space } from '@/theme/tokens';

/** Ilustración: reloj con una onda de pulso. Solo adorno, sin datos. */
function WatchArt() {
  return (
    <Svg width={220} height={220} viewBox="0 0 220 220" accessibilityElementsHidden>
      <Defs>
        <LinearGradient id="body" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={colors.brand} />
          <Stop offset="1" stopColor={colors.brandDeep} />
        </LinearGradient>
      </Defs>
      <Circle cx={110} cy={110} r={104} fill={colors.brandSoft} />
      <Rect x={84} y={18} width={52} height={40} rx={10} fill={colors.surface3} />
      <Rect x={84} y={162} width={52} height={40} rx={10} fill={colors.surface3} />
      <Rect x={58} y={52} width={104} height={116} rx={30} fill="url(#body)" />
      <Rect x={66} y={60} width={88} height={100} rx={24} fill={colors.bg} />
      <Path d="M76 112h14l7-18 10 34 8-22 5 6h20" stroke={colors.lime} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

export default function Devices() {
  return (
    <Screen glow={colors.lime}>
      <Header title="Reloj inteligente" subtitle="Una forma más de cuidarte" back />
      <Animated.View entering={FadeInDown.duration(450)} style={styles.art}>
        <WatchArt />
        <View style={styles.badge}>
          <Text variant="label" color={colors.limeInk}>
            Próximamente
          </Text>
        </View>
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(120).duration(450)} style={{ gap: space.lg }}>
        <Text variant="h1" center>
          Tu reloj, conectado a EpiSafe
        </Text>
        <Text variant="body" color={colors.muted} center>
          Estamos preparando la integración con relojes y bandas para sumar tu ritmo cardíaco a la predicción de riesgo.
        </Text>
        <Card tone="outline" style={styles.note}>
          <Icon name="info" size={18} color={colors.muted} />
          <Text variant="small" color={colors.muted} style={{ flex: 1 }}>
            Mientras tanto, tu riesgo se calcula con tu registro diario, tu sueño y tu medicación.
          </Text>
        </Card>
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  art: { alignItems: 'center', marginVertical: space.xl },
  badge: { marginTop: -space.md, backgroundColor: colors.lime, paddingHorizontal: 16, paddingVertical: 6, borderRadius: radius.pill },
  note: { flexDirection: 'row', alignItems: 'center', gap: space.md },
});
