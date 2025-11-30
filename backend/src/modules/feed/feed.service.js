// src/modules/feed/feed.service.js (ou post.service.js)

import { PostRepository } from "./repositories/post.repository.js";
import { uploadToCloudflare } from "../../utils/cloudflare.js";
import { redisClient } from "../../config/redis.js";

const postRepo = new PostRepository();

export class FeedService {
  static async createPost(usuario, file, description) {
    let url_imagem = null;
    if (file) {
      url_imagem = await uploadToCloudflare(file);
    } else {
      throw new Error("A imagem é obrigatória");
    }

    const newPost = await postRepo.create({
      usuario,
      url_imagem,
      legenda: description,
    });

    // Limpa todos os caches de feed
    const keys = await redisClient.keys("feed_posts_*");
    if (keys.length > 0) {
      await Promise.all(keys.map(key => redisClient.del(key)));
    }

    return newPost;
  } static async getFeedPosts(page = 1, limit = 20) {
    const cacheKey = `feed_posts_page_${page}_limit_${limit}`;
    const cached = await redisClient.get(cacheKey);

    if (cached) return JSON.parse(cached);

    const skip = (page - 1) * limit;
    const { posts, total } = await postRepo.findAll(skip, limit);

    const postsInfoSeguras = posts.map(post => {
      // Cria um objeto de usuário seguro, apenas com os dados públicos
      const usuarioInfoPost = {
        id: post.usuario.id,
        nome: post.usuario.nome,
        url_foto_perfil: post.usuario.url_foto_perfil
      };

      return {
        id: post.id,
        url_imagem: post.url_imagem,
        legenda: post.legenda,
        criado_em: post.criado_em,
        usuario: usuarioInfoPost
      };
    });

    const response = {
      totalPosts: total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      posts: postsInfoSeguras,
    };

    await redisClient.set(cacheKey, JSON.stringify(response), { EX: 60 });
    return response;
  } static async getPostsByUsuario(usuarioId) {
    const cacheKey = `feed_posts_usuario_${usuarioId}`;
    const cached = await redisClient.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const posts = await postRepo.findByUsuario(usuarioId);

    await redisClient.set(cacheKey, JSON.stringify(posts), { EX: 60 });
    return posts;
  }

  static async updatePost(id, data) {
    const updated = await postRepo.update(id, data);

    // Limpa todos os caches de feed
    const keys = await redisClient.keys("feed_posts_*");
    if (keys.length > 0) {
      await Promise.all(keys.map(key => redisClient.del(key)));
    }

    await redisClient.del(`post_${id}`);

    return updated;
  }

  static async deletePost(id) {
    await postRepo.delete(id);

    // Limpa todos os caches de feed
    const keys = await redisClient.keys("feed_posts_*");
    if (keys.length > 0) {
      await Promise.all(keys.map(key => redisClient.del(key)));
    }

    return { message: "Post deletado com sucesso" };
  }
}