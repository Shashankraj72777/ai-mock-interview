// JWT sign/verify, password hashing
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
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