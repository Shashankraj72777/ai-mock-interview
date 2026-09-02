const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL = "gemini-3.6-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`;

async function callGemini(system: string, user: string) {
  const res = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: user }] }],
      generationConfig: {
        responseMimeType: "application/json",
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!content) throw new Error("Gemini did not return any content.");
  return JSON.parse(content);
}

export async function generateQuestion(
  role: string,
  questionNumber: number,
  totalQuestions: number,
  avoidQuestions: string[] = []
) {
  const avoidText =
    avoidQuestions.length > 0
      ? `\n\nDo NOT repeat or closely rephrase any of these previously asked questions — generate something genuinely different:\n${avoidQuestions
          .map((q, i) => `${i + 1}. ${q}`)
          .join("\n")}`
      : "";

  const system = `You are a technical interviewer for a ${role} position. Ask exactly one coding question appropriate for question ${questionNumber} of ${totalQuestions} in the interview (early questions should be simpler, later ones more involved). Respond with ONLY a JSON object in this exact shape: {"questionText": string, "difficulty": "easy" | "medium" | "hard"}${avoidText}`;
  const user = `Generate interview question ${questionNumber} of ${totalQuestions}.`;

  return (await callGemini(system, user)) as { questionText: string; difficulty: string };
}

export async function evaluateCode(role: string, questionText: string, code: string) {
  const trimmed = code?.trim() ?? "";

  // Deterministic guard: don't even ask the AI to judge an empty or
  // near-empty submission — remove any chance of it being lenient.
  if (trimmed.length < 5) {
    return {
      feedback: "No real answer was submitted for this question — the field was empty or effectively blank.",
      subScore: 0,
    };
  }

  const system = `You are a strict, no-nonsense technical interviewer for a ${role} position, grading a candidate's answer to one question. You are not here to be encouraging — you are here to be accurate, the same way a real interviewer's internal scorecard would be honest even if their spoken feedback is polite.

Follow this scoring rubric exactly:
- 0-10: No real attempt — placeholder text, random/unrelated text, or code that makes no attempt to address the question at all.
- 11-30: An attempt exists but is fundamentally wrong, irrelevant to the question, or nonsensical as a solution.
- 31-50: Shows some relevant understanding but the approach is broken, incomplete, or has major logical errors.
- 51-70: A working but flawed solution — correct general idea, with bugs, missing edge cases, or poor complexity.
- 71-85: A correct, working solution with minor issues (style, missing edge cases, suboptimal complexity).
- 86-100: A correct, well-implemented, efficient solution.

Before scoring, first check: does this code even attempt to solve "${questionText}"? If the submission is gibberish, placeholder text like "asdf", or comments only, you MUST score it in the 0-10 range and say so plainly in the feedback — do not soften this or find partial credit that doesn't exist. If it's real code that solves the wrong problem entirely, or shows no grasp of what was asked, that belongs in 11-30, not higher.

Respond with ONLY a JSON object in this exact shape: {"feedback": string, "subScore": number} where feedback is 2-4 direct, specific sentences and subScore is 0-100 following the rubric above.`;
  const user = `Question: ${questionText}\n\nCandidate's submission:\n${trimmed}`;

  return (await callGemini(system, user)) as { feedback: string; subScore: number };
}

export async function generateReport(
  role: string,
  qaHistory: Array<{ questionText: string; feedback: string; subScore: number }>
) {
  // Compute the real score in code — this is never left to the AI's
  // judgment, so there's no possibility of it drifting upward.
  const computedScore = Math.round(
    qaHistory.reduce((sum, qa) => sum + qa.subScore, 0) / qaHistory.length
  );

  const historyText = qaHistory
    .map((qa, i) => `Q${i + 1}: ${qa.questionText}\nFeedback: ${qa.feedback}\nScore: ${qa.subScore}`)
    .join("\n\n");

  const system = `You are a strict, no-nonsense technical interviewer for a ${role} position, writing a final report after a full mock interview. Do not be encouraging or generous — be accurate. The candidate's true final score has already been calculated as ${computedScore}/100 — you don't decide this number, you only need to write a summary and strengths/improvements that are consistent with it. If the score is low (indicating blank, nonsensical, or off-topic answers), the summary must clearly say this was a poor or incomplete attempt, not soften it into something that sounds middling.

Respond with ONLY a JSON object in this exact shape: {"summary": string, "strengths": string[], "improveAreas": string[]} where summary is 2-3 direct sentences describing what actually happened and is consistent with a score of ${computedScore}/100, and strengths/improveAreas each have 2-3 short items. If there were no real strengths to point to (e.g. answers were blank or off-topic), strengths can note the absence honestly (e.g. "No question was meaningfully attempted") rather than inventing positives.`;
  const user = `Here is the full interview history:\n\n${historyText}`;

  const aiResult = (await callGemini(system, user)) as {
    summary: string;
    strengths: string[];
    improveAreas: string[];
  };

  return {
    finalScore: computedScore,
    summary: aiResult.summary,
    strengths: aiResult.strengths,
    improveAreas: aiResult.improveAreas,
  };
}