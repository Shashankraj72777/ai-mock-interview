import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { pool } from "../config/db";

const SALT_ROUNDS = 10;

export async function createUser(email: string, password: string) {
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const result = await pool.query(
    "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at",
    [email, passwordHash]
  );
  return result.rows[0];
}

export async function findUserByEmail(email: string) {
  const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
  return result.rows[0];
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function generateToken(userId: string, email: string) {
  return jwt.sign({ userId, email }, process.env.JWT_SECRET as string, {
    expiresIn: "7d",
  });
}

// Generates a random reset token, stores only its hash in the database (so a
// database leak alone can never be used to reset someone's password), and
// returns the raw token — this is the only place the raw value ever exists.
export async function createResetToken(email: string) {
  const user = await findUserByEmail(email);
  if (!user) return null;

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await pool.query(
    "UPDATE users SET reset_token_hash = $1, reset_token_expires = $2 WHERE id = $3",
    [tokenHash, expires, user.id]
  );

  return rawToken;
}

export async function resetPasswordWithToken(rawToken: string, newPassword: string) {
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

  const result = await pool.query(
    "SELECT id FROM users WHERE reset_token_hash = $1 AND reset_token_expires > now()",
    [tokenHash]
  );
  const user = result.rows[0];
  if (!user) return false;

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await pool.query(
    "UPDATE users SET password_hash = $1, reset_token_hash = NULL, reset_token_expires = NULL WHERE id = $2",
    [passwordHash, user.id]
  );

  return true;
}