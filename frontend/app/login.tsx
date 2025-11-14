import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { useAuth } from "../contexts/AuthContext";

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, signInWithGoogle } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Erro", "Por favor, preencha todos os campos");
      return;
    }

    setIsLoading(true);
    try {
      await signIn(email, password);
      // A navegação será tratada automaticamente pelo AuthContext/_layout
    } catch (error: any) {
      console.error("Erro no login:", error);
      Alert.alert("Erro no Login", error.message || "Email ou senha inválidos");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
    } catch (error: any) {
      console.error("Erro no Google Login:", error);
      if (error.code !== "12501") {
        Alert.alert(
          "Erro",
          error.message || "Erro inesperado ao fazer login com Google"
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    Alert.alert("Esqueceu a senha?", "Funcionalidade em desenvolvimento");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Image
          source={require("../assets/images/logo_hemose.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Login</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Digite seu email"
            placeholderTextColor="#9CA3AF"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!isLoading}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Senha</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Digite sua senha"
              placeholderTextColor="#9CA3AF"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              editable={!isLoading}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
              disabled={isLoading}
            >
              <Ionicons
                name={showPassword ? "eye-off" : "eye"}
                size={20}
                color="#9CA3AF"
              />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity onPress={handleForgotPassword} disabled={isLoading}>
          <Text style={styles.forgotPassword}>Esqueceu sua senha?</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.loginButton}
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.loginButtonText}>Entrar</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.orText}>ou</Text>

        <TouchableOpacity
          style={styles.googleButton}
          onPress={handleGoogleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="logo-google" size={20} color="white" />
              <Text style={styles.googleButtonText}>Entrar com o Google</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.registerContainer}>
          <Text style={styles.registerText}>Não tem uma conta? </Text>
          <TouchableOpacity
            onPress={() => router.push("/register")}
            disabled={isLoading}
          >
            <Text style={styles.registerLink}>Crie uma conta</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F4F4",
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  logo: {
    width: 120,
    height: 60,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#374151",
    textAlign: "center",
    marginBottom: 40,
  },
  form: {
    width: "100%",
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "white",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  eyeButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  forgotPassword: {
    color: "#DC5F5F",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
  },
  loginButton: {
    backgroundColor: "#DC5F5F",
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  loginButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  orText: {
    textAlign: "center",
    color: "#6B7280",
    fontSize: 14,
    marginBottom: 16,
  },
  googleButton: {
    backgroundColor: "#DC5F5F",
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 24,
  },
  googleButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  registerText: {
    color: "#6B7280",
    fontSize: 14,
  },
  registerLink: {
    color: "#DC5F5F",
    fontSize: 16,
    fontWeight: "600",
  },
});
