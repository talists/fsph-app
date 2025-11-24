import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ImageSourcePropType,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
interface Post {
  id: number;
  usuario: {
    id: number;
    nome: string;
    url_foto_perfil?: string;
  };
  legenda: string;
  url_imagem: string | ImageSourcePropType;
  criado_em: string;
}

// Componente separado para o post
const PostItem = React.memo(
  ({
    item,
    onImageError,
  }: {
    item: Post;
    onImageError: (id: number) => void;
  }) => {
    const [imageError, setImageError] = useState(false);

    const handleImageError = () => {
      console.log("Erro ao carregar imagem:", item.url_imagem);
      setImageError(true);
      onImageError(item.id);
    };

    const handleImageLoad = () => {
      console.log("Imagem carregada com sucesso:", item.url_imagem);
    };

    return (
      <View style={styles.postCard}>
        <View style={styles.postHeader}>
          <Ionicons
            name="person-circle-outline"
            size={40}
            color="#666"
            style={styles.avatar}
          />
          <View style={styles.userInfo}>
            <Text style={styles.username}>{item.usuario.nome}</Text>
            <Text style={styles.postTime}>
              {new Date(item.criado_em).toLocaleDateString("pt-BR")}
            </Text>
          </View>
        </View>

        {item.legenda && (
          <Text style={styles.postDescription}>{item.legenda}</Text>
        )}

        {!imageError ? (
          <Image
            source={
              typeof item.url_imagem === "string"
                ? { uri: item.url_imagem }
                : item.url_imagem
            }
            style={styles.postImage}
            resizeMode="cover"
            onError={handleImageError}
            onLoad={handleImageLoad}
          />
        ) : (
          <View style={[styles.postImage, styles.imageErrorContainer]}>
            <Ionicons name="heart" size={40} color="#E73645" />
            <Text style={styles.imageErrorText}>Foto da doação</Text>
            <Text style={styles.imageErrorSubtext}>Imagem não disponível</Text>
          </View>
        )}
      </View>
    );
  }
);

export default function FeedScreen() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [description, setDescription] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<{ [key: number]: boolean }>(
    {}
  );

  // Mock data para demonstração
  const mockPosts: Post[] = [
    {
      id: 1,
      usuario: { id: 1, nome: "Maria Silva" },
      legenda: "Doei sangue hoje no Hemose! Cada gota conta! 🩸❤️",
      url_imagem: require("../../assets/images/doacao_1.jpeg"),
      criado_em: new Date().toISOString(),
    },
    {
      id: 2,
      usuario: { id: 2, nome: "João Santos" },
      legenda:
        "Primeira doação do ano! Sensação incrível de ajudar outras pessoas.",
      url_imagem: require("../../assets/images/doacao_2.jpeg"),
      criado_em: new Date().toISOString(),
    },
    {
      id: 3,
      usuario: { id: 3, nome: "Ana Costa" },
      legenda: "10ª doação! Orgulhosa de poder ajudar quem precisa 💪❤️",
      url_imagem: require("../../assets/images/doacao_3.jpeg"),
      criado_em: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  useEffect(() => {
    loadFeed();
  }, []);

  const loadFeed = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);

      // Simular carregamento
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setPosts(mockPosts);
    } catch (error: any) {
      Alert.alert("Erro", "Erro ao carregar feed");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadFeed(true);
  };

  const selectImage = async () => {
    try {
      // Solicitar permissões
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert(
          "Permissão necessária",
          "É necessário permitir o acesso à galeria para selecionar uma foto."
        );
        return;
      }

      // Mostrar opções de seleção
      Alert.alert("Selecionar Foto", "Escolha uma opção:", [
        {
          text: "Galeria",
          onPress: () => pickImageFromGallery(),
        },
        {
          text: "Câmera",
          onPress: () => pickImageFromCamera(),
        },
        {
          text: "Cancelar",
          style: "cancel",
        },
      ]);
    } catch (error) {
      console.error("Erro ao solicitar permissões:", error);
      Alert.alert("Erro", "Erro ao acessar a galeria");
    }
  };

  const pickImageFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Erro ao selecionar imagem da galeria:", error);
      Alert.alert("Erro", "Erro ao selecionar imagem da galeria");
    }
  };

  const pickImageFromCamera = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestCameraPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert(
          "Permissão necessária",
          "É necessário permitir o acesso à câmera para tirar uma foto."
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Erro ao tirar foto:", error);
      Alert.alert("Erro", "Erro ao tirar foto");
    }
  };

  const handleSubmitPost = async () => {
    if (!description.trim()) {
      Alert.alert("Atenção", "Por favor, adicione uma descrição");
      return;
    }

    if (!selectedImage) {
      Alert.alert("Atenção", "Por favor, selecione uma foto da sua doação");
      return;
    }

    try {
      // Simular criação de post
      const newPost: Post = {
        id: posts.length + 1,
        usuario: { id: 1, nome: "Você" },
        legenda: description.trim(),
        url_imagem: selectedImage,
        criado_em: new Date().toISOString(),
      };

      setPosts([newPost, ...posts]);
      setDescription("");
      setSelectedImage(null);
      setUploadModalVisible(false);

      Alert.alert("Sucesso", "Post criado com sucesso!");
    } catch (error: any) {
      Alert.alert("Erro", "Erro ao criar post");
    }
  };

  const renderPost = ({ item }: { item: Post }) => {
    const handleImageError = (postId: number) => {
      setImageErrors((prev) => ({ ...prev, [postId]: true }));
    };

    return <PostItem item={item} onImageError={handleImageError} />;
  };

  const renderHeader = () => (
    <TouchableOpacity
      style={styles.uploadCard}
      onPress={() => setUploadModalVisible(true)}
      activeOpacity={0.7}
    >
      <View style={styles.uploadIconContainer}>
        <Ionicons name="add" size={24} color="#E73645" />
      </View>
      <Text style={styles.uploadText}>Poste uma foto da sua doação</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E73645" />
        <Text style={styles.loadingText}>Carregando feed...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Image
          source={require("../../assets/images/gota_a_gota.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <TouchableOpacity style={styles.notificationButton}>
          <Ionicons name="notifications-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Feed */}
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={renderHeader}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#E73645"]}
            tintColor="#E73645"
          />
        }
        showsVerticalScrollIndicator={false}
        style={styles.feedList}
      />

      {/* Modal de Upload */}
      <Modal
        visible={uploadModalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nova Doação</Text>
              <TouchableOpacity
                onPress={() => {
                  setUploadModalVisible(false);
                  setDescription("");
                  setSelectedImage(null);
                }}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {/* Área de seleção de imagem */}
            <View style={styles.imageSelector}>
              <TouchableOpacity
                style={styles.imagePlaceholder}
                onPress={selectImage}
                activeOpacity={0.7}
              >
                {selectedImage ? (
                  <Image
                    source={{ uri: selectedImage }}
                    style={styles.selectedImage}
                    resizeMode="cover"
                  />
                ) : (
                  <>
                    <Ionicons name="camera" size={40} color="#999" />
                    <Text style={styles.imagePlaceholderText}>
                      Toque para selecionar uma foto
                    </Text>
                  </>
                )}
              </TouchableOpacity>
              {selectedImage && (
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => setSelectedImage(null)}
                >
                  <Text style={styles.removeImageText}>Remover foto</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Campo de descrição */}
            <TextInput
              style={styles.descriptionInput}
              placeholder="Conte sobre sua doação..."
              value={description}
              onChangeText={setDescription}
              multiline
              maxLength={500}
            />

            {/* Botão de enviar */}
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmitPost}
            >
              <Text style={styles.submitButtonText}>Publicar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    backgroundColor: "#f8dddd",
    borderBottomColor: "#E0E0E0",
  },
  logo: {
    height: 40,
    width: 120,
  },
  notificationButton: {
    padding: 8,
  },
  feedList: {
    flex: 1,
  },
  uploadCard: {
    backgroundColor: "#FFE8EA",
    margin: 16,
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFCDD3",
    borderStyle: "dashed",
  },
  uploadIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  uploadText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#E73645",
    textAlign: "center",
  },
  postCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  avatar: {
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  postTime: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },
  postDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
    lineHeight: 20,
  },
  postImage: {
    width: "100%",
    height: 200,
    borderRadius: 8,
  },
  imageErrorContainer: {
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  imageErrorText: {
    marginTop: 8,
    fontSize: 14,
    color: "#E73645",
    textAlign: "center",
    fontWeight: "500",
  },
  imageErrorSubtext: {
    marginTop: 4,
    fontSize: 12,
    color: "#999",
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    width: "90%",
    maxHeight: "80%",
    borderRadius: 16,
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  imageSelector: {
    marginBottom: 20,
  },
  imagePlaceholder: {
    height: 200,
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E0E0E0",
    borderStyle: "dashed",
    overflow: "hidden",
  },
  selectedImage: {
    width: "100%",
    height: "100%",
  },
  removeImageButton: {
    marginTop: 10,
    padding: 8,
    alignItems: "center",
  },
  removeImageText: {
    color: "#E73645",
    fontSize: 14,
    fontWeight: "500",
  },
  imagePlaceholderText: {
    marginTop: 8,
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
  descriptionInput: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: "top",
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: "#E73645",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
