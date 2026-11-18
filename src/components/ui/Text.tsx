import { Text as RNText, type TextProps, type TextStyle } from 'react-native';
import { colors, fonts } from '@/theme/tokens';

/**
 * Jerarquia tipografica de 5 niveles (tamano): 56 / 26 / 17 / 15 / 13.
 * Los alias (`num`, `title`, `label`) cambian peso o color, no escala.
 */
export type TextVariant = 'display' | 'h1' | 'h2' | 'title' | 'body' | 'small' | 'label' | 'num';

const variants: Record<TextVariant, TextStyle> = {
  display: { fontFamily: fonts.displayHeavy, fontSize: 56, lineHeight: 60, letterSpacing: -2 },
  h1: { fontFamily: fonts.display, fontSize: 26, lineHeight: 31, letterSpacing: -0.6 },
  num: { fontFamily: fonts.displayHeavy, fontSize: 26, lineHeight: 31, letterSpacing: -0.6, fontVariant: ['tabular-nums'] },
  h2: { fontFamily: fonts.displayMedium, fontSize: 17, lineHeight: 23, letterSpacing: -0.2 },
  title: { fontFamily: fonts.bodySemi, fontSize: 17, lineHeight: 23 },
  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22 },
  small: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18 },
  label: { fontFamily: fonts.bodySemi, fontSize: 13, lineHeight: 18, letterSpacing: 0.1 },
};

export interface AppTextProps extends TextProps {
  variant?: TextVariant;
  color?: string;
  center?: boolean;
}

export function Text({ variant = 'body', color = colors.ink, center, style, ...rest }: AppTextProps) {
  return <RNText {...rest} style={[variants[variant], { color }, center ? { textAlign: 'center' } : null, style]} />;
}
