// src/config/upload.js

import multer from 'multer';

/* Configura o multer para usar o armazenamento em memória.
Isso é ideal para o seu caso, pois você não precisa salvar o arquivo no disco do servidor,
apenas pegá-lo na memória para enviar para o Cloudflare.*/
const storage = multer.memoryStorage();

const upload = multer({ storage: storage });

export { upload };