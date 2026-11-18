import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors } from '@/theme/tokens';
import { Text } from './Text';

export function Logo({ size = 34, showWord = true }: { size?: number; showWord?: boolean }) {
  return (
    <View style={styles.row} accessibilityRole="image" accessibilityLabel="EpiSafe IA">
      <View style={[styles.mark, { width: size, height: size, borderRadius: size * 0.32 }]}>
        <Svg width={size * 0.64} height={size * 0.64} viewBox="0 0 24 24" fill="none" stroke={colors.limeInk} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M2 12h4l3-8 4 16 3-8h6" />
        </Svg>
      </View>
      {showWord ? (
        <Text variant="h2" style={{ fontSize: size * 0.64 }}>
          EpiSafe <Text variant="h2" color={colors.lime} style={{ fontSize: size * 0.64 }}>IA</Text>
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mark: { backgroundColor: colors.lime, alignItems: 'center', justifyContent: 'center' },
});
