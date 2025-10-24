import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface Post {
  id: number;
  usuario: {
    id: number;
    nome: string;
    url_foto_perfil?: string;
  };
  legenda: string;
  url_imagem: string;
  criado_em: string;
}

export default function FeedScreen() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [description, setDescription] = useState("");

  // Mock data para demonstração
  const mockPosts: Post[] = [
    {
      id: 1,
      usuario: { id: 1, nome: "Maria Silva" },
      legenda: "Doei sangue hoje no Hemose! Cada gota conta! 🩸❤️",
      url_imagem: "https://via.placeholder.com/400x300",
      criado_em: new Date().toISOString(),
    },
    {
      id: 2,
      usuario: { id: 2, nome: "João Santos" },
      legenda:
        "Primeira doação do ano! Sensação incrível de ajudar outras pessoas.",
      url_imagem: "https://via.placeholder.com/400x300",
      criado_em: new Date().toISOString(),
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

  const handleSubmitPost = async () => {
    if (!description.trim()) {
      Alert.alert("Atenção", "Por favor, adicione uma descrição");
      return;
    }

    try {
      // Simular criação de post
      const newPost: Post = {
        id: posts.length + 1,
        usuario: { id: 1, nome: "Você" },
        legenda: description.trim(),
        url_imagem: "https://via.placeholder.com/400x300",
        criado_em: new Date().toISOString(),
      };

      setPosts([newPost, ...posts]);
      setDescription("");
      setUploadModalVisible(false);

      Alert.alert("Sucesso", "Post criado com sucesso!");
    } catch (error: any) {
      Alert.alert("Erro", "Erro ao criar post");
    }
  };

  const renderPost = ({ item }: { item: Post }) => (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <Ionicons
          name="person-circle-outline"
          size={40}
          color="#666"
          style={styles.avatar}
        />
        <Text style={styles.username}>{item.usuario.nome}</Text>
      </View>

      {item.legenda && (
        <Text style={styles.postDescription}>{item.legenda}</Text>
      )}

      <Image
        source={{ uri: item.url_imagem }}
        style={styles.postImage}
        resizeMode="cover"
      />
    </View>
  );

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
                }}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {/* Área de seleção de imagem */}
            <View style={styles.imageSelector}>
              <View style={styles.imagePlaceholder}>
                <Ionicons name="camera" size={40} color="#999" />
                <Text style={styles.imagePlaceholderText}>
                  Toque para selecionar uma foto
                </Text>
              </View>
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
  username: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
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
