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
import { feedService, Post as ServicePost } from "@/services/feed.service";

interface Post extends Omit<ServicePost, "url_imagem"> {
  url_imagem: string | ImageSourcePropType;
}

const mockPosts: Post[] = [
  {
    id: -1,
    usuario: {
      id: 999,
      nome: "Maria Silva",
      url_foto_perfil: undefined,
    },
    legenda: "Doei sangue hoje no Hemose! Cada gota conta! 🩸❤️",
    url_imagem: require("../../assets/images/doacao_1.jpeg"),
    criado_em: new Date().toISOString(),
  },
  {
    id: -2,
    usuario: {
      id: 998,
      nome: "João Santos",
      url_foto_perfil: undefined,
    },
    legenda: "Primeira doação do ano! Sensação incrível de ajudar.",
    url_imagem: require("../../assets/images/doacao_2.jpeg"),
    criado_em: new Date().toISOString(),
  },
  {
    id: -3,
    usuario: {
      id: 997,
      nome: "Ana Costa",
      url_foto_perfil: undefined,
    },
    legenda: "10ª doação! Orgulhosa de poder ajudar quem precisa 💪❤️",
    url_imagem: require("../../assets/images/doacao_3.jpeg"),
    criado_em: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
];

// --- COMPONENTE DE ITEM DO POST ---
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
      if (imageError) return;
      console.log(
        `❌ Erro imagem Post ${item.id}. URL Tentada:`,
        item.url_imagem
      );
      setImageError(true);
      onImageError(item.id);
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

// --- TELA PRINCIPAL ---
export default function FeedScreen() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Estados de Upload
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [description, setDescription] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadFeed();
  }, []);

  const loadFeed = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);

      const response = await feedService.getFeedPosts(1, 20);
      const realPosts = response.posts;

      const mergedPosts: Post[] = [...realPosts, ...mockPosts];

      setPosts(mergedPosts);
    } catch (error: any) {
      console.error("Erro ao buscar feed:", error);

      if (isRefresh || loading) {
        setPosts(mockPosts);
        if (!isRefresh) {
          console.log("Mostrando modo offline (apenas mocks)");
        }
      }
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
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert(
          "Permissão necessária",
          "É necessário permitir o acesso à galeria."
        );
        return;
      }
      Alert.alert("Selecionar Foto", "Escolha uma opção:", [
        { text: "Galeria", onPress: () => pickImageFromGallery() },
        { text: "Câmera", onPress: () => pickImageFromCamera() },
        { text: "Cancelar", style: "cancel" },
      ]);
    } catch (error) {
      Alert.alert("Erro", "Erro ao acessar a galeria");
    }
  };

  const pickImageFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled) setSelectedImage(result.assets[0].uri);
  };

  const pickImageFromCamera = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) return;
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled) setSelectedImage(result.assets[0].uri);
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
      setIsSubmitting(true);

      const formData = new FormData();
      formData.append("description", description.trim());

      const filename = selectedImage.split("/").pop();
      const match = /\.(\w+)$/.exec(filename || "");
      const type = match ? `image/${match[1]}` : `image/jpeg`;

      formData.append("url_imagem", {
        uri: selectedImage,
        name: filename || "photo.jpg",
        type: type,
      } as any);

      await feedService.createPost(formData);

      Alert.alert("Sucesso", "Sua doação foi publicada!");

      setDescription("");
      setSelectedImage(null);
      setUploadModalVisible(false);
      loadFeed(true);
    } catch (error: any) {
      console.error(error);
      Alert.alert("Erro", error.message || "Erro ao criar post");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderPost = ({ item }: { item: Post }) => {
    const handleImageError = (postId: number) => {
      console.log(`Erro visual renderizando post ${postId}`);
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

  if (loading && !refreshing && posts.length === 0) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E73645" />
        <Text style={styles.loadingText}>Carregando feed...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Fixo */}
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
        ListEmptyComponent={
          <View style={{ alignItems: "center", marginTop: 50 }}>
            <Text style={{ color: "#999" }}>Nenhuma publicação ainda.</Text>
          </View>
        }
      />

      {/* Modal de Upload */}
      <Modal
        visible={uploadModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          if (!isSubmitting) setUploadModalVisible(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nova Doação</Text>
              {!isSubmitting && (
                <TouchableOpacity
                  onPress={() => {
                    setUploadModalVisible(false);
                    setDescription("");
                    setSelectedImage(null);
                  }}
                >
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              )}
            </View>

            {/* Área de conteúdo do Modal (Bloqueia durante envio) */}
            <View
              style={{ opacity: isSubmitting ? 0.5 : 1 }}
              pointerEvents={isSubmitting ? "none" : "auto"}
            >
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

              <TextInput
                style={styles.descriptionInput}
                placeholder="Conte sobre sua doação..."
                value={description}
                onChangeText={setDescription}
                multiline
                maxLength={500}
                editable={!isSubmitting}
              />

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  isSubmitting && { backgroundColor: "#ccc" },
                ]}
                onPress={handleSubmitPost}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.submitButtonText}>Publicar</Text>
                )}
              </TouchableOpacity>
            </View>
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
