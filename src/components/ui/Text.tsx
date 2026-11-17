import { Text as RNText, type TextProps, type TextStyle } from 'react-native';
import { colors, fonts } from '@/theme/tokens';

export type TextVariant = 'display' | 'h1' | 'h2' | 'title' | 'body' | 'small' | 'label' | 'num';

const variants: Record<TextVariant, TextStyle> = {
  display: { fontFamily: fonts.displayHeavy, fontSize: 40, lineHeight: 44, letterSpacing: -1.2 },
  h1: { fontFamily: fonts.display, fontSize: 28, lineHeight: 32, letterSpacing: -0.7 },
  h2: { fontFamily: fonts.display, fontSize: 20, lineHeight: 25, letterSpacing: -0.3 },
  title: { fontFamily: fonts.bodySemi, fontSize: 16, lineHeight: 22 },
  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22 },
  small: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18 },
  label: { fontFamily: fonts.bodySemi, fontSize: 12, lineHeight: 16, letterSpacing: 0.4 },
  num: { fontFamily: fonts.displayHeavy, fontSize: 34, lineHeight: 38, letterSpacing: -1 },
};

export interface AppTextProps extends TextProps {
  variant?: TextVariant;
  color?: string;
  center?: boolean;
}

export function Text({ variant = 'body', color = colors.ink, center, style, ...rest }: AppTextProps) {
  return <RNText {...rest} style={[variants[variant], { color }, center ? { textAlign: 'center' } : null, style]} />;
}
