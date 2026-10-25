import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AuthProvider, useAuth } from '@/contexts/auth-context';

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { user, initializing } = useAuth();

  if (initializing) {
    return null;
  }

  return (
    <>
      <AnimatedSplashOverlay />

      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected
          guard={!user}
          redirectTo='/'
        >
          <Stack.Screen name='sign-in' />
          <Stack.Screen name='sign-up' />
        </Stack.Protected>

        <Stack.Protected
          guard={!!user}
          redirectTo='/sign-in'
        >
          <Stack.Screen name='(tabs)' />
          <Stack.Screen name='chat/[conversationId]' />
        </Stack.Protected>
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </ThemeProvider>
  );
}
