import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import crypto from "crypto";

// --- LOGS DE DIAGNÓSTICO ---
// Vamos verificar se as variáveis de ambiente estão a ser carregadas
console.log("--- Diagnóstico Cloudflare.js ---");
console.log(`CLOUDFLARE_ACCOUNT_ID: ${process.env.CLOUDFLARE_ACCOUNT_ID ? 'Carregado' : 'UNDEFINED'}`);
console.log(`CLOUDFLARE_ACCESS_KEY_ID: ${process.env.CLOUDFLARE_ACCESS_KEY_ID ? 'Carregado' : 'UNDEFINED'}`);
console.log(`CLOUDFLARE_SECRET_ACCESS_KEY: ${process.env.CLOUDFLARE_SECRET_ACCESS_KEY ? 'Carregado' : 'UNDEFINED'}`);
console.log(`CLOUDFLARE_BUCKET_NAME: ${process.env.CLOUDFLARE_BUCKET_NAME ? 'Carregado' : 'UNDEFINED'}`);
console.log(`CLOUDFLARE_PUBLIC_URL: ${process.env.CLOUDFLARE_PUBLIC_URL ? 'Carregado' : 'UNDEFINED'}`);
console.log("-----------------------------------");
// ------------------------------

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const accessKeyId = process.env.CLOUDFLARE_ACCESS_KEY_ID;
const secretAccessKey = process.env.CLOUDFLARE_SECRET_ACCESS_KEY;
const bucketName = process.env.CLOUDFLARE_BUCKET_NAME;

// Validação de segurança
if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
  console.error("❌ ERRO CRÍTICO: As credenciais do Cloudflare R2 não estão definidas no ficheiro .env!");
  // Lança um erro para impedir a inicialização incorreta do S3Client
  throw new Error("Credenciais de armazenamento não configuradas no servidor.");
}

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

export const uploadToCloudflare = async (file) => {
  // Gera um nome de ficheiro único
  const fileExtension = file.originalname.split('.').pop();
  const fileName = `${crypto.randomBytes(16).toString('hex')}.${fileExtension}`;
  
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: fileName,
    Body: file.buffer,
    ContentType: file.mimetype,
  });

  try {
    await s3.send(command);
    console.log(`✅ Upload para Cloudflare bem-sucedido: ${fileName}`);
    // Retorna a URL pública completa
    return `${process.env.CLOUDFLARE_PUBLIC_URL}/${fileName}`;
  } catch (error) {
    console.error("❌ ERRO NO UPLOAD para o Cloudflare:", error);
    throw new Error("Não foi possível fazer o upload da imagem.");
  }
};

export const deleteFromCloudflare = async (fileName) => {
  if (!fileName) return; 

  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: fileName,
  });

  try {
    await s3.send(command);
    console.log(`✅ Ficheiro deletado do Cloudflare: ${fileName}`);
  } catch (err) {
    console.error(`❌ Falha ao deletar ficheiro do Cloudflare: ${fileName}`, err);
  }
};
