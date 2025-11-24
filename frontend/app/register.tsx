import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
  ActivityIndicator,
  Platform,
} from "react-native";

// Importa o nosso hook de autenticação
import { useAuth } from "../contexts/AuthContext";
// Importa o seletor de imagens
import * as ImagePicker from "expo-image-picker";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RegisterScreen() {
  const router = useRouter();
  // Obtém a função de registo do nosso contexto
  const { register } = useAuth();

  // --- Estados do Formulário Alinhados com o Backend ---
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [dataNascimento, setDataNascimento] = useState(""); // Utilizador digita DD/MM/AAAA
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmacaoSenha, setConfirmacaoSenha] = useState("");
  // Estado para guardar a imagem selecionada
  const [image, setImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  // -----------------------------------------------------

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // --- Função para escolher imagem da GALERIA ---
  const pickImageFromGallery = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert(
        "Permissão necessária",
        "É preciso permissão para aceder à galeria."
      );
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1], // Quadrado para foto de perfil
      quality: 0.5, // Comprime a imagem
    });
    if (!result.canceled) {
      setImage(result.assets[0]);
    }
  };

  // --- Nova função para a CÂMARA ---
  const pickImageFromCamera = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert(
        "Permissão necessária",
        "É preciso permissão para aceder à câmara."
      );
      return;
    }
    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (!result.canceled) {
      setImage(result.assets[0]);
    }
  };

  // --- Nova função "principal" para escolher ---
  const selectImage = () => {
    Alert.alert("Selecionar Foto de Perfil", "Escolha uma opção:", [
      { text: "Tirar Foto", onPress: pickImageFromCamera },
      { text: "Escolher da Galeria", onPress: pickImageFromGallery },
      { text: "Cancelar", style: "cancel" },
    ]);
  };

  /**
   * Converte uma data de DD/MM/AAAA para AAAA-MM-DD.
   */
  const formatInputDateToISO = (dateString: string) => {
    const cleaned = dateString.replace(/[^0-9/]/g, "");
    const parts = cleaned.split("/");
    if (parts.length === 3) {
      const [dia, mes, ano] = parts;
      if (ano.length === 4) {
        return `${ano}-${mes}-${dia}`;
      }
    }
    return dateString;
  };

  const handleRegister = async () => {
    if (
      !nome ||
      !email ||
      !senha ||
      !confirmacaoSenha ||
      !cpf ||
      !dataNascimento
    ) {
      Alert.alert("Erro", "Por favor, preencha todos os campos obrigatórios");
      return;
    }
    if (!image) {
      Alert.alert("Erro", "A foto de perfil é obrigatória para o registo.");
      return;
    }
    if (senha !== confirmacaoSenha) {
      Alert.alert("Erro", "As senhas não coincidem");
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      const dataNascimentoISO = formatInputDateToISO(dataNascimento);

      formData.append("nome", nome);
      formData.append("email", email);
      formData.append("cpf", cpf);
      formData.append("senha", senha);
      formData.append("confirmacaoSenha", confirmacaoSenha);
      formData.append("data_nascimento", dataNascimentoISO);

      const fileData = {
        uri: image.uri,
        name: image.fileName || `photo_${Date.now()}.jpg`,
        type: image.mimeType || "image/jpeg",
      };
      formData.append("url_foto_perfil", fileData as any);

      await register(formData);

      // A linha do Alert.alert("Sucesso"...) foi REMOVIDA daqui.
      // O _layout.tsx irá agora tratar do redirecionamento.
    } catch (error: any) {
      console.error("Erro no Registo:", error);
      Alert.alert(
        "Erro no Registo",
        error.message || "Não foi possível criar a conta"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#DC5F5F" />
          </TouchableOpacity>
          <Text style={styles.title}>Cadastro</Text>
        </View>

        <View style={styles.form}>
          {/* --- CAMPO DE UPLOAD DE FOTO (MODIFICADO) --- */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Foto de Perfil (Obrigatória)</Text>
            <TouchableOpacity
              style={styles.imagePicker}
              onPress={selectImage}
              disabled={isLoading}
            >
              {image ? (
                <Image
                  source={{ uri: image.uri }}
                  style={styles.profileImage}
                />
              ) : (
                <Ionicons name="camera" size={30} color="#9CA3AF" />
              )}
              <Text style={styles.imagePickerText}>
                {image ? "Trocar foto" : "Escolher foto"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Campo Nome Completo */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Nome Completo</Text>
            <TextInput
              style={styles.input}
              placeholder="Seu nome"
              placeholderTextColor="#9CA3AF"
              value={nome}
              onChangeText={setNome}
            />
          </View>

          {/* Campo CPF */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>CPF</Text>
            <TextInput
              style={styles.input}
              placeholder="000.000.000-00"
              placeholderTextColor="#9CA3AF"
              value={cpf}
              onChangeText={setCpf}
              keyboardType="numeric"
            />
          </View>

          {/* Campo Data de Nascimento */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Data de Nascimento</Text>
            <TextInput
              style={styles.input}
              placeholder="Formato DD/MM/AAAA"
              placeholderTextColor="#9CA3AF"
              value={dataNascimento}
              onChangeText={setDataNascimento}
              keyboardType="numeric"
              maxLength={10}
            />
          </View>

          {/* Campo Email */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Seu email"
              placeholderTextColor="#9CA3AF"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Campo Senha */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Senha</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Digite sua senha"
                placeholderTextColor="#9CA3AF"
                value={senha}
                onChangeText={setSenha}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? "eye-off" : "eye"}
                  size={20}
                  color="#9CA3AF"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Campo Confirmar Senha */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirmar Senha</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Confirme sua senha"
                placeholderTextColor="#9CA3AF"
                value={confirmacaoSenha}
                onChangeText={setConfirmacaoSenha}
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Ionicons
                  name={showConfirmPassword ? "eye-off" : "eye"}
                  size={20}
                  color="#9CA3AF"
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={styles.registerButton}
            onPress={handleRegister}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.registerButtonText}>Cadastrar</Text>
            )}
          </TouchableOpacity>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Já tem uma conta? </Text>
            <TouchableOpacity
              onPress={() => router.push("/login")}
              disabled={isLoading}
            >
              <Text style={styles.loginLink}>Fazer login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// O seu StyleSheet original
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8F4F4",
  },
  container: {
    flex: 1,
    backgroundColor: "#F8F4F4",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "android" ? 40 : 60,
    paddingBottom: 20,
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#DC5F5F",
  },
  form: {
    paddingHorizontal: 24,
    paddingBottom: 40,
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
  registerButton: {
    backgroundColor: "#DC5F5F",
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 16,
  },
  registerButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  loginText: {
    color: "#6B7280",
    fontSize: 14,
  },
  loginLink: {
    color: "#DC5F5F",
    fontSize: 14,
    fontWeight: "600",
  },
  imagePicker: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  profileImage: {
    width: "100%",
    height: "100%",
  },
  imagePickerText: {
    position: "absolute",
    bottom: 10,
    color: "#374151",
    backgroundColor: "rgba(255,255,255,0.7)",
    paddingHorizontal: 5,
    borderRadius: 5,
    fontSize: 12,
  },
});
