import { FeedService } from "./feed.service.js";

//========================//
//     Feed Controller    //
//========================//

export class FeedController {
  static async createPost(req, res) {
    try {
      const usuario = req.user; // via verifyToken
      const { description } = req.body;
      const file = req.file;

      const post = await FeedService.createPost(usuario, file, description);

      res.status(201).json(post);
    } catch (err) {
      if (err.message == "A imagem é obrigatória") {
        return res.status(400).json({ message: err.message })
      }
      res.status(500).json({ message: err.message });
    }
  }

  static async getFeedPosts(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;

      const feed = await FeedService.getFeedPosts(page, limit);
      res.status(200).json(feed);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  static async getPostsByUsuario(req, res) {
    try {
      const usuarioId = req.user.id;
      const posts = await FeedService.getPostsByUsuario(usuarioId);
      res.status(200).json(posts);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  static async updatePost(req, res) {
    try {
      const { id } = req.params;
      const updated = await FeedService.updatePost(id, req.body);
      res.status(200).json(updated);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  static async deletePost(req, res) {
    try {
      const { id } = req.params;
      const result = await FeedService.deletePost(id);
      res.status(200).json(result);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
}
