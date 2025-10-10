import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { Animated, Image, StyleSheet, Text, View } from "react-native";

export default function SplashScreen2() {
  const router = useRouter();
  const slideAnim = new Animated.Value(-300);
  const textAnim = new Animated.Value(0);

  useEffect(() => {
    Animated.sequence([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(textAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setTimeout(() => {
        router.replace("/login");
      }, 2000);
    });
  }, []);

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
  gotaLogo: {
    width: 200,
    height: 120,
  },
  sloganContainer: {
    alignItems: "center",
  },
  salvamosText: {
    fontSize: 20,
    color: "#6B7280",
    fontStyle: "italic",
    marginBottom: 8,
  },
  aGotaText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#374151",
    marginBottom: 32,
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
