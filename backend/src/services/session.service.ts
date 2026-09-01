import { pool } from "../config/db";

export async function createSession(userId: string, role: string, totalQuestions: number) {
  const result = await pool.query(
    `INSERT INTO interview_sessions (user_id, role, status, total_questions)
     VALUES ($1, $2, 'in_progress', $3)
     RETURNING id, role, status, total_questions, started_at`,
    [userId, role, totalQuestions]
  );
  return result.rows[0];
}

export async function getSessionsForUser(userId: string) {
  const result = await pool.query(
    `SELECT id, role, status, final_score, total_questions, started_at, ended_at
     FROM interview_sessions
     WHERE user_id = $1
     ORDER BY started_at DESC`,
    [userId]
  );
  return result.rows;
}

export async function getSessionById(sessionId: string, userId: string) {
  const result = await pool.query(
    `SELECT id, role, status, final_score, total_questions, summary, strengths, improve_areas, started_at, ended_at
     FROM interview_sessions
     WHERE id = $1 AND user_id = $2`,
    [sessionId, userId]
  );
  return result.rows[0];
}

export async function completeSession(
  sessionId: string,
  finalScore: number,
  summary: string,
  strengths: string[],
  improveAreas: string[]
) {
  await pool.query(
    `UPDATE interview_sessions
     SET status = 'completed', final_score = $1, summary = $2, strengths = $3, improve_areas = $4, ended_at = now()
     WHERE id = $5`,
    [finalScore, summary, strengths, improveAreas, sessionId]
  );
}

export async function deleteSession(sessionId: string, userId: string) {
  const result = await pool.query(
    `DELETE FROM interview_sessions WHERE id = $1 AND user_id = $2`,
    [sessionId, userId]
  );
  return result.rowCount! > 0;
}