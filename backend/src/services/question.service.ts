import { pool } from "../config/db";

export async function createQuestion(sessionId: string, questionText: string, difficulty: string) {
  const result = await pool.query(
    `INSERT INTO questions (session_id, question_text, difficulty)
     VALUES ($1, $2, $3)
     RETURNING id, question_text, difficulty, asked_at`,
    [sessionId, questionText, difficulty]
  );
  return result.rows[0];
}

export async function saveAnswerResult(questionId: string, code: string, feedback: string, subScore: number) {
  await pool.query(
    `UPDATE questions SET code_submitted = $1, ai_feedback = $2, sub_score = $3 WHERE id = $4`,
    [code, feedback, subScore, questionId]
  );
}

export async function getQuestionsForSession(sessionId: string) {
  const result = await pool.query(
    `SELECT id, question_text, difficulty, code_submitted, ai_feedback, sub_score, asked_at
     FROM questions WHERE session_id = $1 ORDER BY asked_at ASC`,
    [sessionId]
  );
  return result.rows;
}

// Used to keep questions fresh across sessions — pulls this user's past
// question texts for the same role so the AI can avoid repeating them.
export async function getRecentQuestionTextsForRole(userId: string, role: string, limit = 40) {
  const result = await pool.query(
    `SELECT q.question_text
     FROM questions q
     JOIN interview_sessions s ON q.session_id = s.id
     WHERE s.user_id = $1 AND s.role = $2
     ORDER BY q.asked_at DESC
     LIMIT $3`,
    [userId, role, limit]
  );
  return result.rows.map((r: any) => r.question_text as string);
}