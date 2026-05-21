import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProviders } from '../src/lib/providers';
import { colors } from '../src/lib/theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppProviders>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.bg },
            headerTintColor: colors.fg,
            headerTitleStyle: { fontWeight: '600' },
            contentStyle: { backgroundColor: colors.bg },
          }}
        >
          <Stack.Screen name="index" options={{ title: 'Unofficial Glasto' }} />
          <Stack.Screen name="lineup/[year]" options={{ title: 'Lineup' }} />
          <Stack.Screen name="favourites" options={{ title: 'Favourites' }} />
        </Stack>
      </AppProviders>
    </SafeAreaProvider>
  );
}
