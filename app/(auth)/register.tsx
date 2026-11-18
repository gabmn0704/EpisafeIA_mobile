import { Link } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Logo } from '@/components/ui/Logo';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { friendlyMessage } from '@/lib/api/errors';
import { haptic } from '@/lib/haptics';
import { fieldErrors, registerSchema } from '@/lib/validation';
import { useAuth } from '@/providers/AuthProvider';
import { colors, space } from '@/theme/tokens';

export default function Register() {
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setFormError(null);
    const parsed = registerSchema.safeParse({ fullName, email, password });
    if (!parsed.success) {
      haptic.warning();
      return setErrors(fieldErrors(parsed.error));
    }
    setErrors({});
    setBusy(true);
    try {
      await signUp(parsed.data);
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
        <Animated.View entering={FadeInDown.duration(500)} style={{ marginTop: space.xxl }}>
          <Logo />
          <Text variant="h1" style={{ marginTop: space.xxl, fontSize: 34, lineHeight: 38 }}>
            Crea tu cuenta
          </Text>
          <Text variant="body" color={colors.muted} style={{ marginTop: space.sm }}>
            Tus datos de salud se guardan cifrados en tu sesión y solo tú y tus contactos autorizados los ven.
          </Text>
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(120).duration(500)} style={styles.form}>
          <Field label="Nombre completo" value={fullName} onChangeText={setFullName} autoComplete="name" textContentType="name" error={errors.fullName} placeholder="Ana Gómez" />
          <Field label="Correo" value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="email" keyboardType="email-address" textContentType="emailAddress" error={errors.email} placeholder="tu@correo.com" />
          <Field label="Contraseña" value={password} onChangeText={setPassword} secureTextEntry textContentType="newPassword" error={errors.password} hint="Mínimo 8 caracteres, con letras y números." placeholder="Crea una contraseña" onSubmitEditing={submit} returnKeyType="go" />
          {formError ? (
            <View style={styles.formError} accessibilityLiveRegion="polite">
              <Text variant="small" color={colors.coral}>
                {formError}
              </Text>
            </View>
          ) : null}
          <Button label="Crear cuenta" onPress={submit} loading={busy} size="lg" style={{ marginTop: space.sm }} />
          <Link href="/(auth)/login" style={styles.link}>
            <Text variant="small" color={colors.muted}>
              ¿Ya tienes cuenta? <Text variant="small" color={colors.lime}>Inicia sesión</Text>
            </Text>
          </Link>
        </Animated.View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { marginTop: space.xxl, gap: space.lg },
  formError: { backgroundColor: colors.coralSoft, borderRadius: 12, padding: space.md },
  link: { textAlign: 'center', paddingVertical: space.md },
});
