const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "openai/gpt-oss-120b";

async function callGroq(system: string, user: string, maxTokens: number) {
  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq API error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Groq did not return any content.");
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

  return (await callGroq(system, user, 500)) as { questionText: string; difficulty: string };
}

export async function evaluateCode(role: string, questionText: string, code: string) {
  const system = `You are a technical interviewer for a ${role} position, evaluating a candidate's code for one question. Give concise, specific, constructive feedback (2-4 sentences) as if speaking to the candidate directly. Respond with ONLY a JSON object in this exact shape: {"feedback": string, "subScore": number} where subScore is 0-100.`;
  const user = `Question: ${questionText}\n\nCandidate's code:\n${code}`;

  return (await callGroq(system, user, 400)) as { feedback: string; subScore: number };
}

export async function generateReport(
  role: string,
  qaHistory: Array<{ questionText: string; feedback: string; subScore: number }>
) {
  const historyText = qaHistory
    .map((qa, i) => `Q${i + 1}: ${qa.questionText}\nFeedback: ${qa.feedback}\nScore: ${qa.subScore}`)
    .join("\n\n");

  const system = `You are a technical interviewer for a ${role} position, writing a final summary after a full mock interview. Respond with ONLY a JSON object in this exact shape: {"finalScore": number, "summary": string, "strengths": string[], "improveAreas": string[]} where finalScore is 0-100 (roughly the average of the sub-scores, adjusted for overall impression), summary is 2-3 sentences, and strengths/improveAreas each have 2-3 short items.`;
  const user = `Here is the full interview history:\n\n${historyText}`;

  return (await callGroq(system, user, 500)) as {
    finalScore: number;
    summary: string;
    strengths: string[];
    improveAreas: string[];
  };
}