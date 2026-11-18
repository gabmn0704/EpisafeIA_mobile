import { Link } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Logo } from '@/components/ui/Logo';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { ensureServerAwake } from '@/lib/api/serverWake';
import { ApiError, friendlyMessage } from '@/lib/api/errors';
import { fieldErrors, loginSchema } from '@/lib/validation';
import { useAuth } from '@/providers/AuthProvider';
import { colors, space } from '@/theme/tokens';
import { haptic } from '@/lib/haptics';

export default function Login() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setFormError(null);
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      haptic.warning();
      return setErrors(fieldErrors(parsed.error));
    }
    setErrors({});
    setBusy(true);
    try {
      if (!(await ensureServerAwake())) throw new ApiError(0, 'NETWORK_ERROR', 'No se pudo conectar con el servidor.');
      await signIn(parsed.data.email, parsed.data.password);
    } catch (e) {
      haptic.error();
      setFormError(friendlyMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen glow={colors.brand}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Animated.View entering={FadeInDown.duration(500)} style={styles.head}>
          <Logo />
          <Text variant="display" style={{ marginTop: space.huge }}>
            Tu día,{'\n'}
            <Text variant="display" color={colors.lime}>
              bajo control.
            </Text>
          </Text>
          <Text variant="body" color={colors.muted} style={{ marginTop: space.md }}>
            Inicia sesión para ver tu riesgo, tus medicamentos y tu historial.
          </Text>
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(120).duration(500)} style={styles.form}>
          <Field label="Correo" value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="email" keyboardType="email-address" textContentType="emailAddress" error={errors.email} placeholder="tu@correo.com" />
          <Field label="Contraseña" value={password} onChangeText={setPassword} secureTextEntry autoComplete="password" textContentType="password" error={errors.password} placeholder="Tu contraseña" onSubmitEditing={submit} returnKeyType="go" />
          {formError ? (
            <View style={styles.formError} accessibilityLiveRegion="polite">
              <Text variant="small" color={colors.coral}>
                {formError}
              </Text>
            </View>
          ) : null}
          <Button label="Entrar" onPress={submit} loading={busy} size="lg" style={{ marginTop: space.sm }} />
          <Link href="/(auth)/register" style={styles.link}>
            <Text variant="small" color={colors.muted}>
              ¿Primera vez? <Text variant="small" color={colors.lime}>Crea tu cuenta</Text>
            </Text>
          </Link>
        </Animated.View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { marginTop: space.xxl },
  form: { marginTop: space.huge, gap: space.lg },
  formError: { backgroundColor: colors.coralSoft, borderRadius: 12, padding: space.md },
  link: { textAlign: 'center', paddingVertical: space.md },
});
