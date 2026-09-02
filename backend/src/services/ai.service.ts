import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const MODEL = "openai/gpt-oss-120b";

async function callAI(system: string, user: string) {
  try {
    const response = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: system,
        },
        {
          role: "user",
          content: user,
        },
      ],
      reasoning_effort: "medium",
      response_format: {
        type: "json_object",
      },
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      throw new Error("AI did not return any content.");
    }

    try {
      return JSON.parse(content);
    } catch (parseError) {
      console.error("AI returned invalid JSON:", content);
      throw new Error("AI returned invalid JSON.");
    }
  } catch (error: any) {
    console.error("Groq API error:", error?.message || error);
    throw error;
  }
}

export async function generateQuestion(
  role: string,
  questionNumber: number,
  totalQuestions: number,
  avoidQuestions: string[] = []
) {
  const avoidText =
    avoidQuestions.length > 0
      ? `

Do NOT repeat or closely rephrase any of these previously asked questions.
Generate something genuinely different:

${avoidQuestions
  .map((q, i) => `${i + 1}. ${q}`)
  .join("\n")}`
      : "";

  const system = `You are a professional technical interviewer conducting a ${role} interview.

Generate exactly ONE coding interview question.

This is question ${questionNumber} of ${totalQuestions}.

Difficulty progression:
- Early questions should generally be easier.
- Middle questions should generally be medium difficulty.
- Later questions can be harder.
- Do not make every question unnecessarily difficult.

The question must be:
- Relevant to the ${role} role.
- Clear and unambiguous.
- Solvable by a competent candidate.
- Appropriate for a technical interview.
- Different from previously asked questions.

Respond ONLY with a JSON object in this exact structure:

{
  "questionText": "string",
  "difficulty": "easy" | "medium" | "hard"
}

${avoidText}`;

  const user = `Generate interview question ${questionNumber} of ${totalQuestions} for a ${role} position.`;

  const result = (await callAI(system, user)) as {
    questionText: string;
    difficulty: string;
  };

  return result;
}

export async function evaluateCode(
  role: string,
  questionText: string,
  code: string
) {
  const trimmed = code?.trim() ?? "";

  // Deterministic guard for empty submissions.
  if (trimmed.length < 5) {
    return {
      feedback:
        "No real answer was submitted for this question — the field was empty or effectively blank.",
      subScore: 0,
    };
  }

  const system = `You are a strict and objective technical interviewer evaluating a candidate's answer for a ${role} position.

Your job is to evaluate the candidate accurately, not to be encouraging.

IMPORTANT:
Do not give credit merely because the candidate wrote code.
Determine whether the code actually attempts to solve the requested problem.

SCORING RUBRIC:

0-10:
No meaningful attempt.
Examples:
- Empty answer
- Random text
- Gibberish
- Placeholder text
- Comments only
- Completely unrelated code

11-30:
An attempt exists but the solution is fundamentally wrong or addresses the wrong problem.

31-50:
The candidate demonstrates some relevant understanding, but the solution is incomplete, broken, or contains major logical errors.

51-70:
The general approach is correct, but the implementation contains bugs, important missing cases, or significant efficiency problems.

71-85:
Correct working solution with relatively minor issues such as:
- Small edge-case omissions
- Minor style problems
- Reasonably suboptimal complexity

86-100:
Correct, well-implemented, efficient solution with strong handling of relevant edge cases.

BEFORE SCORING:

1. Determine whether the submission actually attempts to solve the question.
2. Check the algorithm and logic.
3. Check for obvious syntax or implementation problems.
4. Check relevant edge cases.
5. Consider time complexity.
6. Consider space complexity.
7. Do not assume code works merely because it looks plausible.
8. Do not invent test results that were never provided.
9. Do not give partial credit for unrelated code.
10. Do not be artificially generous.

Question:

${questionText}

Respond ONLY with JSON in exactly this structure:

{
  "feedback": "2-4 direct and specific sentences explaining the evaluation.",
  "subScore": 0
}

subScore MUST be an integer from 0 to 100.`;

  const user = `Candidate's submission:

${trimmed}`;

  const result = (await callAI(system, user)) as {
    feedback: string;
    subScore: number;
  };

  // Safety: never allow an invalid score into the database/report.
  const safeScore = Math.max(
    0,
    Math.min(100, Math.round(Number(result.subScore) || 0))
  );

  return {
    feedback: result.feedback,
    subScore: safeScore,
  };
}

export async function generateReport(
  role: string,
  qaHistory: Array<{
    questionText: string;
    feedback: string;
    subScore: number;
  }>
) {
  if (qaHistory.length === 0) {
    return {
      finalScore: 0,
      summary: "No interview questions were completed.",
      strengths: [],
      improveAreas: ["Complete the interview questions."],
    };
  }

  // Calculate the actual final score in backend code.
  // The AI is NOT allowed to determine this number.
  const computedScore = Math.round(
    qaHistory.reduce((sum, qa) => sum + qa.subScore, 0) /
      qaHistory.length
  );

  const historyText = qaHistory
    .map(
      (qa, i) =>
        `Q${i + 1}: ${qa.questionText}
Feedback: ${qa.feedback}
Score: ${qa.subScore}/100`
    )
    .join("\n\n");

  const system = `You are writing the final report for a ${role} technical mock interview.

You must be objective and evidence-based.

The candidate's final score has ALREADY been calculated by the backend:

${computedScore}/100

You MUST NOT change this score.

Your job is only to summarize the actual interview performance.

IMPORTANT RULES:

- Do not invent achievements.
- Do not invent strengths that are not supported by the interview history.
- Do not claim that code worked if there is no evidence that it worked.
- Do not soften poor performance.
- Do not exaggerate poor performance either.
- Make the report consistent with the individual question scores and feedback.
- If the candidate gave blank, meaningless, or incorrect answers, state that clearly.
- Strengths should only mention things actually demonstrated.
- Improvement areas should be specific and useful.

Return ONLY this JSON structure:

{
  "summary": "2-3 direct sentences describing the candidate's actual performance.",
  "strengths": ["2-3 short evidence-based strengths"],
  "improveAreas": ["2-3 short specific improvement areas"]
}`;

  const user = `Full interview history:

${historyText}

Remember:

Final score = ${computedScore}/100

Do not modify the final score.`;

  const aiResult = (await callAI(system, user)) as {
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