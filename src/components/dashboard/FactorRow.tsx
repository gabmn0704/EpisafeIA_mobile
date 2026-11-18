import { StyleSheet, View } from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { Icon } from '@/components/ui/Icon';
import { Text } from '@/components/ui/Text';
import type { RiskFactor } from '@/lib/api/schemas';
import { colors, radius, space } from '@/theme/tokens';

/** Un factor del modelo: sube el riesgo (coral) o lo baja (verde), con barra proporcional al impacto. */
export function FactorRow({ factor, index }: { factor: RiskFactor; index: number }) {
  const up = factor.direction === 'up';
  const tone = up ? colors.coral : colors.ok;
  const pct = Math.round(Math.min(1, Math.max(0.06, Math.abs(factor.impact))) * 100);
  return (
    <Animated.View entering={FadeInRight.delay(120 + index * 70).duration(380)} style={styles.row}>
      <View style={[styles.icon, { backgroundColor: up ? colors.coralSoft : '#0f2e24' }]}>
        <Icon name={up ? 'zap' : 'shield'} size={16} color={tone} />
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <View style={styles.top}>
          <Text variant="title" style={{ flex: 1, fontSize: 14 }} numberOfLines={1}>
            {factor.name.charAt(0).toUpperCase() + factor.name.slice(1)}
          </Text>
          <Text variant="label" color={tone}>
            {up ? 'Sube' : 'Baja'}
          </Text>
        </View>
        <Text variant="small" color={colors.muted} numberOfLines={2}>
          {factor.detail}
        </Text>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${pct}%`, backgroundColor: tone }]} />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start' },
  icon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  track: { height: 4, borderRadius: radius.pill, backgroundColor: colors.surface3, overflow: 'hidden', marginTop: 2 },
  fill: { height: 4, borderRadius: radius.pill },
});
