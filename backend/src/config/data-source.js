// src/config/data-source.js

import "reflect-metadata"; // Necessário para o TypeORM
import { DataSource } from "typeorm";
import dotenv from "dotenv";

dotenv.config();

// configuração da fonte de dados (DataSource)
const AppDataSource = new DataSource({
  type: "mysql",
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || "3306"),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  
  // IMPORTANTE: synchronize deve ser 'false' em produção.
  // Como estamos criando as tabelas manualmente com o script SQL, deixamos como 'false'.
  synchronize: false,
  
  // Define se as queries do banco serão mostradas no console. Útil para debug.
  logging: false,
  
  // Diz ao TypeORM onde encontrar os arquivos de Model (Entidades).
  // Este padrão "glob" encontra todos os arquivos *.model.js dentro da pasta modules.
  entities: ["src/modules/**/*.model.js"],
  
  // Caminhos para migrations e subscribers (podemos deixar vazios por agora)
  migrations: [],
  subscribers: [],
});

// Exportamos a instância para ser usada em outros lugares (nos repositórios)
export default AppDataSource ;