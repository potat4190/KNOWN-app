/** The session: a full-screen stack with no tab bar (focus). Each screen draws its own header with step dots. */
import { Stack } from 'expo-router';
import { useTheme } from '@/theme';

export default function SessionLayout() {
  const { c, reduceMotion } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: c.background },
        animation: reduceMotion ? 'none' : 'default',
      }}
    >
      <Stack.Screen name="thinking" options={{ gestureEnabled: false }} />
      <Stack.Screen name="crisis" options={{ gestureEnabled: false }} />
    </Stack>
  );
}
