import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import crypto from "crypto";

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const accessKeyId = process.env.CLOUDFLARE_ACCESS_KEY_ID;
const secretAccessKey = process.env.CLOUDFLARE_SECRET_ACCESS_KEY;
const bucketName = process.env.CLOUDFLARE_BUCKET_NAME;

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

export const uploadToCloudflare = async (file) => {
  // Gera um nome de arquivo único para evitar que um arquivo sobrescreva o outro
  const fileExtension = file.originalname.split('.').pop();
  const fileName = `${crypto.randomBytes(16).toString('hex')}.${fileExtension}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: fileName,
    Body: file.buffer,
    ContentType: file.mimetype,
  });

  await s3.send(command);

  // Retorna a URL completa e pública do arquivo
  return `${process.env.CLOUDFLARE_PUBLIC_URL}/${fileName}`;
};

export const deleteFromCloudflare = async (fileName) => {
  if (!fileName) return; // Não faz nada se não houver nome de arquivo

  const command = new DeleteObjectCommand({
    Bucket: process.env.CLOUDFLARE_BUCKET_NAME,
    Key: fileName, // O nome exato do arquivo no bucket
  });

  try {
    await s3.send(command);
    console.log(`✅ Arquivo deletado do Cloudflare: ${fileName}`);
  } catch (err) {
    console.error(`❌ Falha ao deletar arquivo do Cloudflare: ${fileName}`, err);
  }
};