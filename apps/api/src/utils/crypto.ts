import crypto from "crypto";
import config from "../config";

const getEncryptionKey = (): Buffer => {
  const secret = process.env.ENCRYPTION_KEY || config.JWT_SECRET || "zsender-default-secure-fallback-key-32";
  return crypto.createHash("sha256").update(`zsender-credentials:${secret}`).digest();
};

/**
 * Encrypt arbitrary JSON serializable data using AES-256-GCM.
 */
export function encryptCredentials<T = Record<string, unknown>>(data: T): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  
  const plaintext = JSON.stringify(data);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

/**
 * Decrypt AES-256-GCM encrypted string back to typed data.
 */
export function decryptCredentials<T = Record<string, unknown>>(encryptedStr: string | null | undefined): T | null {
  if (!encryptedStr || typeof encryptedStr !== "string") return null;

  try {
    const parts = encryptedStr.split(":");
    if (parts.length !== 3) return null;

    const [ivHex, tagHex, cipherHex] = parts;
    const iv = Buffer.from(ivHex, "hex");
    const tag = Buffer.from(tagHex, "hex");
    const ciphertext = Buffer.from(cipherHex, "hex");
    const key = getEncryptionKey();

    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return JSON.parse(decrypted.toString("utf8")) as T;
  } catch (err) {
    return null;
  }
}
