import React, { useEffect, useState } from "react";
import { Animated, Image, StyleSheet, View } from "react-native";
import { useSplash } from './_layout';

export default function SplashScreen() {
  const [animationStep, setAnimationStep] = useState(1); 
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(-300);
  const textAnim = new Animated.Value(0);
  
  const { setAnimationFinished } = useSplash();

  // ====================================================
  // ANIMAÇÃO DO SPLASH 1 (Logo Hemose com Fade In)
  // ====================================================
  useEffect(() => {
    console.log("🎬 [SPLASH] Iniciando Splash 1...");
    
    // Fade in do logo
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000, // 1 segundo para aparecer
      useNativeDriver: true,
    }).start(() => {
      console.log("✅ [SPLASH] Fade in completo");
      
      // Aguarda 2 segundos antes de ir para o Splash 2
      setTimeout(() => {
        console.log("🎬 [SPLASH] Iniciando Splash 2...");
        setAnimationStep(2);
      }, 2000); // TOTAL: 3 segundos no Splash 1
    });
  }, []); 

  // ====================================================
  // ANIMAÇÃO DO SPLASH 2 (Gota + Logo)
  // ====================================================
  useEffect(() => {
    if (animationStep !== 2) return;

    Animated.sequence([
      // Slide da gota
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800, // 0.8 segundo
        useNativeDriver: true,
      }),
      // Fade do texto/logo embaixo
      Animated.timing(textAnim, {
        toValue: 1,
        duration: 600, // 0.6 segundo
        useNativeDriver: true,
      }),
    ]).start(() => {
      console.log("✅ [SPLASH] Animações completas");
      
      // Aguarda 2 segundos antes de sinalizar que terminou
      setTimeout(() => {
        console.log("🏁 [SPLASH] Splashes finalizadas, liberando navegação");
        setAnimationFinished(true); 
      }, 2000); // TOTAL: ~4.4 segundos no Splash 2
    });
  }, [animationStep]);

  // ====================================================
  // RENDERIZAÇÃO
  // ====================================================
  
  // SPLASH 1: Logo Hemose com fade in
  if (animationStep === 1) {
    return (
      <View style={styles.container}>
        <Animated.View style={[styles.logoContainer, { opacity: fadeAnim }]}>
          <Image
            source={require("../assets/images/logo_hemose.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>
      </View>
    );
  }

  // SPLASH 2: Gota + Logo embaixo
  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.logoContainer, 
          { transform: [{ translateX: slideAnim }] },
        ]}
      >
        <Image
          source={require("../assets/images/gota_a_gota.png")}
          style={styles.gotaLogo}
          resizeMode="contain"
        />
      </Animated.View>

      <Animated.View style={[styles.sloganContainer, { opacity: textAnim }]}>
        <View style={styles.bottomBrand}>
          <Image
            source={require("../assets/images/logo_hemose.png")}
            style={styles.hemoseLogo}
            resizeMode="contain"
          />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F4F4",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  logo: {
    width: 200,
    height: 100,
  },
  gotaLogo: {
    width: 200,
    height: 120,
  },
  sloganContainer: {
    alignItems: "center",
  },
  bottomBrand: {
    alignItems: "center",
    marginTop: 32,
  },
  hemoseLogo: {
    width: 150,
    height: 80,
  },
});