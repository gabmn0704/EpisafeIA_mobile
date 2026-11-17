import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { prefs } from '@/lib/prefs';

/** Punto de entrada: decide si mostrar onboarding, login o la app. */
export default function Index() {
  const { status } = useAuth();
  const [onboarded, setOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    prefs.hasOnboarded().then(setOnboarded);
  }, []);

  if (status === 'signedIn') return <Redirect href="/(tabs)" />;
  if (status === 'loading' || onboarded === null) return null;
  return <Redirect href={onboarded ? '/(auth)/login' : '/onboarding'} />;
}
