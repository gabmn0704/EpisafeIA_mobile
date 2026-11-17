import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, space } from '@/theme/tokens';
import { Icon } from './Icon';
import { PressableScale } from './PressableScale';
import { Text } from './Text';

export interface HeaderProps {
  title: string;
  subtitle?: string;
  /** Muestra flecha para volver (pantallas apiladas). */
  back?: boolean;
  right?: ReactNode;
}

export function Header({ title, subtitle, back, right }: HeaderProps) {
  return (
    <View style={styles.row}>
      {back ? (
        <PressableScale onPress={() => router.back()} accessibilityLabel="Volver" style={styles.back} hitSlop={10}>
          <Icon name="chevronLeft" size={22} />
        </PressableScale>
      ) : null}
      <View style={{ flex: 1 }}>
        <Text variant="h1" accessibilityRole="header">
          {title}
        </Text>
        {subtitle ? (
          <Text variant="body" color={colors.muted} style={{ marginTop: 2 }}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, marginBottom: space.xl },
  back: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' },
});
