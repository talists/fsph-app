import jwt from "jsonwebtoken";
import { redisClient } from "../config/redis.js";

const JWT_SECRET = process.env.JWT_SECRET;

export const verifyToken = async (req, res, next) => {
  // Pega o token do header (ex: "Bearer <token>")
  const authHeader = req.headers["authorization"];
  const token = authHeader?.split(" ")[1];

  if (!token) {
    return res
      .status(403)
      .json({ msg: "Acesso negado. Nenhum token fornecido." });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const redisToken = await redisClient.get(`token_usuario_${decoded.id}`);

    // Se não houver token no Redis ou se o token for diferente do enviado, a sessão é inválida.
    if (!redisToken || redisToken !== token) {
      return res
        .status(401)
        .json({
          msg: "Token inválido ou sessão expirada. Por favor, faça login novamente.",
        });
    }

    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ msg: "Token inválido ou expirado." });
  }
};
