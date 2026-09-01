import { Router } from "express";
import { requireAuth, AuthRequest } from "../middleware/auth.middleware";
import {
  createSession,
  getSessionsForUser,
  getSessionById,
  deleteSession,
} from "../services/session.service";
import { getQuestionsForSession } from "../services/question.service";

const router = Router();

// The frontend's ROLE_GROUPS list is the single source of truth for which
// roles exist — we don't duplicate that list here. We only do basic sanity
// validation so nothing empty, malicious, or absurdly long ever reaches the AI.
function isValidRole(role: unknown): role is string {
  return typeof role === "string" && role.trim().length >= 2 && role.trim().length <= 80;
}

function isValidTotalQuestions(n: unknown): n is number {
  return typeof n === "number" && Number.isInteger(n) && n >= 5 && n <= 100 && n % 5 === 0;
}

// POST /api/sessions — start a new interview session
router.post("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { role, totalQuestions } = req.body;

    if (!isValidRole(role)) {
      return res.status(400).json({ error: "Please provide a valid role (2–80 characters)." });
    }
    if (!isValidTotalQuestions(totalQuestions)) {
      return res.status(400).json({ error: "Number of questions must be a multiple of 5, between 5 and 100." });
    }

    const session = await createSession(req.user!.userId, role.trim(), totalQuestions);
    res.status(201).json({ session });
  } catch (err) {
    console.error("Create session error:", err);
    res.status(500).json({ error: "Could not start a new session. Try again." });
  }
});

// GET /api/sessions — list this user's past sessions
router.get("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    const sessions = await getSessionsForUser(req.user!.userId);
    res.json({ sessions });
  } catch (err) {
    console.error("List sessions error:", err);
    res.status(500).json({ error: "Could not load sessions. Try again." });
  }
});

// GET /api/sessions/:id — one session plus its full question breakdown
router.get("/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const sessionId = req.params.id as string;
    const session = await getSessionById(sessionId, req.user!.userId);
    if (!session) {
      return res.status(404).json({ error: "Session not found." });
    }
    const questions = await getQuestionsForSession(sessionId);
    res.json({ session, questions });
  } catch (err) {
    console.error("Get session error:", err);
    res.status(500).json({ error: "Could not load session. Try again." });
  }
});

// DELETE /api/sessions/:id — remove a session (and its questions, via cascade)
router.delete("/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const deleted = await deleteSession(req.params.id as string, req.user!.userId);
    if (!deleted) {
      return res.status(404).json({ error: "Session not found." });
    }
    res.json({ success: true });
  } catch (err) {
    console.error("Delete session error:", err);
    res.status(500).json({ error: "Could not delete session. Try again." });
  }
});

export default router;