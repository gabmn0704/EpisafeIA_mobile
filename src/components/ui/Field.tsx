import { useState } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { colors, fonts, radius, space } from '@/theme/tokens';
import { Text } from './Text';

export interface FieldProps extends TextInputProps {
  label: string;
  error?: string | null;
  hint?: string;
}

export function Field({ label, error, hint, style, onFocus, onBlur, ...rest }: FieldProps) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.wrap}>
      <Text variant="label" color={error ? colors.coral : colors.muted}>
        {label}
      </Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.faint}
        selectionColor={colors.lime}
        {...rest}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={[styles.input, focused ? styles.focused : null, error ? styles.errored : null, style]}
      />
      {error ? (
        <Text variant="small" color={colors.coral}>
          {error}
        </Text>
      ) : hint ? (
        <Text variant="small" color={colors.faint}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  input: {
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    paddingHorizontal: space.lg,
    color: colors.ink,
    fontFamily: fonts.body,
    fontSize: 16,
  },
  focused: { borderColor: colors.brand, backgroundColor: colors.surface2 },
  errored: { borderColor: colors.coral },
});
