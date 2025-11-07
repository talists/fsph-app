import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, View } from 'react-native';
import 'react-native-reanimated';
import '../global.css';

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  initialRouteName: 'login',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <View style={{ flex: 1 }}>
        <StatusBar
          style="auto"
        />
        <Stack>
          <Stack.Screen name="splash1" options={{ headerShown: false }} />
          <Stack.Screen name="splash2" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="register" options={{ headerShown: false }} />
          <Stack.Screen
            name="profile"
            options={{
              headerShown: true,
              title: 'Perfil',
              headerStyle: { backgroundColor: '#E73645' },
              headerTintColor: 'white',
              headerTitleStyle: { fontWeight: '700' }
            }}
          />
          <Stack.Screen
            name="faq"
            options={{
              headerShown: true,
              title: 'FAQ',
              headerStyle: { backgroundColor: '#E73645' },
              headerTintColor: 'white',
              headerTitleStyle: { fontWeight: '700' }
            }}
          />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
      </View>
    </ThemeProvider>
  );
}
