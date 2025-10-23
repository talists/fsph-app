// src/config/firebase.js

import admin from "firebase-admin";
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";


const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serviceAccountPath = path.join(__dirname, "firebase-service-account.json");

if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf8"));

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("✅ Firebase Admin SDK inicializado com sucesso.");
  } catch (error) {
    console.error("❌ Erro ao inicializar o Firebase Admin SDK:", error);

    process.exit(1);
  }
}

export default admin.messaging();