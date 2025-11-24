import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack, useRouter, SplashScreen } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import "../global.css";
import { View } from "react-native";
import { useColorScheme } from "../hooks/useColorScheme";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import React, { useEffect, useState, createContext, useContext } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

SplashScreen.preventAutoHideAsync();

interface SplashContextData {
  isAnimationFinished: boolean;
  setAnimationFinished: (finished: boolean) => void;
}
const SplashContext = createContext<SplashContextData>({} as SplashContextData);
export const useSplash = () => useContext(SplashContext);
// ---------------------------------------------

/**
 * Componente que gere a navegação.
 */
function RootLayoutNav() {
  const { user, isLoading } = useAuth();
  const { isAnimationFinished } = useSplash();
  const router = useRouter();
  const colorScheme = useColorScheme();

  useEffect(() => {
    console.log(
      `[AUTH REDIRECT] isLoading: ${isLoading}, isAnimationFinished: ${isAnimationFinished}, user exists: ${!!user}`
    );
    if (isLoading || !isAnimationFinished) {
      return;
    }

    SplashScreen.hideAsync();

    // Lógica de Redirecionamento
    if (user) {
      router.replace("/(tabs)");
    } else {
      router.replace("/login");
    }
  }, [isLoading, isAnimationFinished, user, router]);

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <View style={{ flex: 1 }}>
        <StatusBar style="auto" />
        <Stack>
          <Stack.Screen name="splash1" options={{ headerShown: false }} />
          <Stack.Screen name="splash2" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="register" options={{ headerShown: false }} />
          <Stack.Screen
            name="profile"
            options={{
              headerShown: true,
              title: "Perfil",
              headerStyle: { backgroundColor: "#E73645" },
              headerTintColor: "white",
              headerTitleStyle: { fontWeight: "700" },
            }}
          />
          <Stack.Screen
            name="faq"
            options={{
              headerShown: true,
              title: "FAQ",
              headerStyle: { backgroundColor: "#E73645" },
              headerTintColor: "white",
              headerTitleStyle: { fontWeight: "700" },
            }}
          />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="modal"
            options={{ presentation: "modal", title: "Modal" }}
          />
        </Stack>
      </View>
    </ThemeProvider>
  );
}

/**
 * Componente que providencia o estado de Splash para todos os filhos
 */
const SplashProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isAnimationFinished, setAnimationFinished] = useState(false);

  return (
    <SplashContext.Provider
      value={{ isAnimationFinished, setAnimationFinished }}
    >
      {children}
    </SplashContext.Provider>
  );
};

/**
 * Este é o componente raiz da aplicação.
 * Ele envolve tudo no AuthProvider e no SplashProvider.
 */
export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* O SplashProvider deve envolver o AuthProvider */}
      <SplashProvider>
        <AuthProvider>
          <RootLayoutNav />
        </AuthProvider>
      </SplashProvider>
    </GestureHandlerRootView>
  );
}
