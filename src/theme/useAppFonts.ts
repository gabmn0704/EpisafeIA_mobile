import { Outfit_600SemiBold, Outfit_700Bold, Outfit_800ExtraBold } from '@expo-google-fonts/outfit';
import { Geist_400Regular, Geist_500Medium, Geist_600SemiBold } from '@expo-google-fonts/geist';
import { useFonts } from 'expo-font';

/** Carga Outfit (titulos) y Geist (texto), igual que la web. */
export function useAppFonts(): boolean {
  const [loaded, error] = useFonts({
    Outfit_600SemiBold,
    Outfit_700Bold,
    Outfit_800ExtraBold,
    Geist_400Regular,
    Geist_500Medium,
    Geist_600SemiBold,
  });
  // Si falla la carga se usa la fuente del sistema en lugar de bloquear la app.
  return loaded || error !== null;
}
