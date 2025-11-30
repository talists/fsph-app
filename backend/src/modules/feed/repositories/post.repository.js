import AppDataSource from "../../../config/data-source.js";
import { Post } from "../post.model.js";

export class PostRepository {
  constructor() {
    this.repo = AppDataSource.getRepository(Post);
  }

  async create(post) {
    const newPost = this.repo.create(post);
    const saved = await this.repo.save(newPost);
    // Buscar novamente com as relações para retornar o objeto completo
    return await this.findById(saved.id);
  }

  async findAll(skip = 0, take = 20) {
    const [posts, total] = await this.repo.findAndCount({
      relations: ["usuario"],
      order: { criado_em: "DESC" },
      skip,
      take,
    });
    return { posts, total };
  }

  async findByUsuario(usuarioId) {
    return await this.repo.find({
      where: { usuario: { id: usuarioId } },
      relations: ["usuario"],
      order: { criado_em: "DESC" },
    });
  }

  async findById(id) {
    return await this.repo.findOne({ where: { id }, relations: ["usuario"] });
  }

  async update(id, data) {
    await this.repo.update(id, data);
    return this.findById(id);
  }

  async delete(id) {
    return await this.repo.delete(id);
  }
}
