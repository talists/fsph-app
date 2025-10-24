// Configurações da API
export const API_CONFIG = {
  // URL base do backend - ajuste conforme necessário
  BASE_URL: __DEV__
    ? "http://localhost:3000/api"
    : "https://your-production-api.com/api",

  // Timeout padrão para requisições
  TIMEOUT: 10000,

  // Configurações de upload
  UPLOAD: {
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_TYPES: ["image/jpeg", "image/png", "image/jpg"],
  },

  // Configurações do feed
  FEED: {
    POSTS_PER_PAGE: 20,
    CACHE_TTL: 60, // seconds
  },
};

export default API_CONFIG;
