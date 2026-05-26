import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

export function useTheme() {
  const scheme = useColorScheme() ?? 'light';
  return Colors[scheme === 'dark' ? 'dark' : 'light'];
}
