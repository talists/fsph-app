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
import { notificationService } from "../services/notificacao.service";
import AsyncStorage from "@react-native-async-storage/async-storage";

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

  // Inicializa o serviço de notificações
  useEffect(() => {
    const initNotifications = async () => {
      try {
        await notificationService.initialize();
        console.log("✅ Serviço de notificações inicializado");

        // Envia uma notificação de campanha mockada aleatoriamente (1x por dia)
        const lastCampaignNotif = await AsyncStorage.getItem("lastCampaignNotif");
        const today = new Date().toDateString();

        if (lastCampaignNotif !== today && Math.random() > 0.7) {
          await notificationService.sendMockCampaignNotifications();
          await AsyncStorage.setItem("lastCampaignNotif", today);
        }
      } catch (error) {
        console.error("Erro ao inicializar notificações:", error);
      }
    };

    initNotifications();
  }, []);

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
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="splash1" options={{ headerShown: false }} />
          <Stack.Screen name="splash2" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="register" options={{ headerShown: false }} />
          <Stack.Screen
            name="meus-agendamentos"
            options={{
              headerShown: false,
              presentation: "card",
            }}
          />
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
          <Stack.Screen
            name="notifications"
            options={{ headerShown: false }}
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
