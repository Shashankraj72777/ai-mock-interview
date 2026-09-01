import { Server, Socket } from "socket.io";
import { redis } from "../config/redis";
import { getSessionById, completeSession } from "../services/session.service";
import { createQuestion, saveAnswerResult, getRecentQuestionTextsForRole } from "../services/question.service";
import { generateQuestion, evaluateCode, generateReport } from "../services/ai.service";

const SESSION_TTL_SECONDS = 60 * 60 * 2; // 2 hours — plenty for one interview

interface QAHistoryItem {
  questionText: string;
  feedback: string;
  subScore: number;
}

interface LiveState {
  role: string;
  totalQuestions: number;
  questionNumber: number;
  currentQuestionId: string;
  currentQuestionText: string;
  qaHistory: QAHistoryItem[];
  // past questions this user has already seen for this role, fetched once at
  // session start — combined with qaHistory to build the "avoid" list
  pastQuestions: string[];
}

function stateKey(sessionId: string) {
  return `interview:${sessionId}`;
}

async function loadState(sessionId: string): Promise<LiveState | null> {
  const raw = await redis.get(stateKey(sessionId));
  return raw ? JSON.parse(raw) : null;
}

async function saveState(sessionId: string, state: LiveState) {
  await redis.set(stateKey(sessionId), JSON.stringify(state), "EX", SESSION_TTL_SECONDS);
}

function buildAvoidList(state: LiveState): string[] {
  return [...state.pastQuestions, ...state.qaHistory.map((qa) => qa.questionText)];
}

export function registerInterviewHandlers(io: Server) {
  io.on("connection", (socket: Socket) => {
    const userId = socket.data.userId as string;

    socket.on("join_session", async ({ sessionId }: { sessionId: string }) => {
      try {
        const session = await getSessionById(sessionId, userId);
        if (!session) {
          socket.emit("error", { message: "Session not found." });
          return;
        }
        if (session.status === "completed") {
          socket.emit("error", { message: "This session is already completed." });
          return;
        }

        socket.join(sessionId);

        let state = await loadState(sessionId);

        if (!state) {
          // brand new session — generate the first question, avoiding anything
          // this user has already been asked for this role in past sessions
          const pastQuestions = await getRecentQuestionTextsForRole(userId, session.role, 40);
          const generated = await generateQuestion(session.role, 1, session.total_questions, pastQuestions);
          const questionRow = await createQuestion(sessionId, generated.questionText, generated.difficulty);

          state = {
            role: session.role,
            totalQuestions: session.total_questions,
            questionNumber: 1,
            currentQuestionId: questionRow.id,
            currentQuestionText: generated.questionText,
            qaHistory: [],
            pastQuestions,
          };
          await saveState(sessionId, state);
        }

        socket.emit("question", {
          questionId: state.currentQuestionId,
          questionText: state.currentQuestionText,
          questionNumber: state.questionNumber,
          totalQuestions: state.totalQuestions,
        });
      } catch (err) {
        console.error("join_session error:", err);
        socket.emit("error", { message: "Could not join session." });
      }
    });

    socket.on(
      "submit_code",
      async ({ sessionId, questionId, code }: { sessionId: string; questionId: string; code: string }) => {
        try {
          const state = await loadState(sessionId);
          if (!state || state.currentQuestionId !== questionId) {
            socket.emit("error", { message: "This question is no longer active." });
            return;
          }

          const evaluation = await evaluateCode(state.role, state.currentQuestionText, code);
          await saveAnswerResult(questionId, code, evaluation.feedback, evaluation.subScore);

          socket.emit("feedback", {
            feedback: evaluation.feedback,
            subScore: evaluation.subScore,
          });

          state.qaHistory.push({
            questionText: state.currentQuestionText,
            feedback: evaluation.feedback,
            subScore: evaluation.subScore,
          });

          if (state.questionNumber >= state.totalQuestions) {
            // interview finished — generate the final report
            const report = await generateReport(state.role, state.qaHistory);
            await completeSession(
              sessionId,
              Math.round(report.finalScore),
              report.summary,
              report.strengths,
              report.improveAreas
            );
            await redis.del(stateKey(sessionId));

            socket.emit("session_complete", report);
          } else {
            const nextNumber = state.questionNumber + 1;
            const avoidList = buildAvoidList(state);
            const generated = await generateQuestion(state.role, nextNumber, state.totalQuestions, avoidList);
            const questionRow = await createQuestion(sessionId, generated.questionText, generated.difficulty);

            state.questionNumber = nextNumber;
            state.currentQuestionId = questionRow.id;
            state.currentQuestionText = generated.questionText;
            await saveState(sessionId, state);

            socket.emit("next_question", {
              questionId: state.currentQuestionId,
              questionText: state.currentQuestionText,
              questionNumber: state.questionNumber,
              totalQuestions: state.totalQuestions,
            });
          }
        } catch (err) {
          console.error("submit_code error:", err);
          socket.emit("error", { message: "Could not evaluate your code. Try submitting again." });
        }
      }
    );

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });
}