import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, space } from '@/theme/tokens';
import { Glow } from './Glow';
import { PendingSyncBanner } from './PendingSyncBanner';

export interface ScreenProps {
  children: ReactNode;
  /** false para pantallas con lista propia (FlatList) o contenido fijo. */
  scroll?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  /** Espacio inferior extra (por la barra de tabs). */
  bottomInset?: number;
  glow?: string;
  contentStyle?: ViewStyle;
}

/** Fondo con degradado violeta, resplandor de acento y margenes seguros. */
export function Screen({ children, scroll = true, refreshing, onRefresh, bottomInset = 0, glow = colors.brandDeep, contentStyle }: ScreenProps) {
  const insets = useSafeAreaInsets();
  const pad: ViewStyle = {
    paddingTop: insets.top + space.md,
    paddingHorizontal: space.xl,
    paddingBottom: insets.bottom + bottomInset + space.xxl,
  };
  return (
    <View style={styles.root}>
      <LinearGradient colors={[colors.bgTop, colors.bg, colors.bg]} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} />
      <Glow color={glow} size={460} opacity={0.42} style={{ top: -220, right: -180 }} />
      <Glow color={colors.lime} size={300} opacity={0.08} style={{ bottom: 60, left: -160 }} />
      {scroll ? (
        <ScrollView
          contentContainerStyle={[pad, contentStyle]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.lime} colors={[colors.lime]} /> : undefined
          }
        >
          <PendingSyncBanner />
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, pad, contentStyle]}>{children}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: colors.bg, overflow: 'hidden' } });
