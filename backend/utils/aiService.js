import { ENV } from "../config/env.js";

const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

/**
 * Generates quiz questions from material text using Groq's fast LLM inference
 * API (OpenAI-compatible chat completions endpoint). Falls back to a
 * deterministic mock generator when no GROQ_API_KEY is set, so the feature
 * stays demoable without any AI credentials.
 */
export async function generateQuestionsFromText({ text, title, numQuestions = 5, difficulty = "Medium" }) {
  const content = (text && text.trim().length > 50) ? text.slice(0, 8000) : `Material titled "${title}". No extracted text was available, so base questions on the title and general subject matter.`;

  const prompt = `You are helping build a study quiz for a university student.
Based on the following course material content, generate exactly ${numQuestions} multiple-choice questions at "${difficulty}" difficulty.

Return ONLY valid JSON (no markdown, no commentary) as an array of objects with this exact shape:
[{ "question": string, "options": [string, string, string, string], "correctAnswer": number (0-3 index), "explanation": string }]

Material content:
"""
${content}
"""`;

  try {
    if (ENV.groqKey) {
      const res = await fetch(GROQ_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${ENV.groqKey}`,
        },
        body: JSON.stringify({
          model: ENV.groqModel,
          messages: [
            { role: "system", content: "You are a precise quiz-generation assistant. You only ever respond with raw JSON — never markdown fences, never commentary." },
            { role: "user", content: prompt },
          ],
          temperature: 0.4,
          max_tokens: 3000,
        }),
      });

      if (!res.ok) {
        const errBody = await res.text().catch(() => "");
        throw new Error(`Groq API error ${res.status}: ${errBody.slice(0, 300)}`);
      }

      const data = await res.json();
      const raw = data.choices?.[0]?.message?.content || "[]";
      return parseQuestions(raw, difficulty);
    }
  } catch (err) {
    console.error("Groq question generation failed, falling back to mock questions:", err.message);
  }

  return mockQuestions(title, numQuestions, difficulty);
}

/**
 * Generates open-ended "theory" (short-answer/essay-style) study questions,
 * each paired with a model answer, from material text. Unlike the
 * multiple-choice quiz above, both the question and answer are returned
 * together up front — these are for self-study/copying, not grading.
 * Falls back to a deterministic mock generator when no GROQ_API_KEY is set.
 */
export async function generateTheoryQuestionsFromText({ text, title, numQuestions = 5, difficulty = "Medium" }) {
  const content = (text && text.trim().length > 50) ? text.slice(0, 8000) : `Material titled "${title}". No extracted text was available, so base questions on the title and general subject matter.`;

  const prompt = `You are helping a university student study. Based on the following course material content, generate exactly ${numQuestions} open-ended theory (short-answer/essay-style) questions at "${difficulty}" difficulty, each with a clear, well-explained model answer.

Return ONLY valid JSON (no markdown, no commentary) as an array of objects with this exact shape:
[{ "question": string, "answer": string }]

Material content:
"""
${content}
"""`;

  try {
    if (ENV.groqKey) {
      const res = await fetch(GROQ_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${ENV.groqKey}`,
        },
        body: JSON.stringify({
          model: ENV.groqModel,
          messages: [
            { role: "system", content: "You are a precise study-question-generation assistant. You only ever respond with raw JSON — never markdown fences, never commentary." },
            { role: "user", content: prompt },
          ],
          temperature: 0.5,
          max_tokens: 3000,
        }),
      });

      if (!res.ok) {
        const errBody = await res.text().catch(() => "");
        throw new Error(`Groq API error ${res.status}: ${errBody.slice(0, 300)}`);
      }

      const data = await res.json();
      const raw = data.choices?.[0]?.message?.content || "[]";
      const cleaned = raw.replace(/```json|```/g, "").trim();
      return JSON.parse(cleaned).map((q) => ({ ...q, difficulty }));
    }
  } catch (err) {
    console.error("Groq theory question generation failed, falling back to mock questions:", err.message);
  }

  return mockTheoryQuestions(title, numQuestions, difficulty);
}

function mockTheoryQuestions(title, numQuestions, difficulty) {
  const stems = [
    (t) => `Explain, in your own words, the main concept covered in "${t}".`,
    (t) => `Discuss why "${t}" matters within its broader subject area.`,
    (t) => `Describe the key steps or ideas presented in "${t}".`,
    (t) => `Compare and contrast the ideas in "${t}" with a related concept you know.`,
    (t) => `What real-world applications relate to "${t}"?`,
  ];
  const questions = [];
  for (let i = 0; i < numQuestions; i++) {
    questions.push({
      question: stems[i % stems.length](title),
      answer: `A strong answer would summarize the core ideas of "${title}" clearly, use relevant terminology, and give at least one supporting example. (Generated as a fallback — set GROQ_API_KEY for real AI-generated answers.)`,
      difficulty,
    });
  }
  return questions;
}

const FALLBACK_STUDY_TIPS = [
  "Try the Pomodoro technique: 25 minutes of focused study, then a 5-minute break.",
  "Teach what you just learned to someone else (or out loud to yourself) — it exposes gaps fast.",
  "Space your revision out over several days instead of cramming the night before.",
  "Turn your notes into questions, then quiz yourself a day later without looking.",
  "Study your hardest subject first, while your energy and focus are highest.",
  "Summarize each material in 3 bullet points right after reading it — it locks in retention.",
  "Mix up topics in one session (interleaving) instead of drilling only one — it improves recall.",
  "Get enough sleep before an exam; memory consolidation happens while you rest.",
];

/**
 * Generates a single short, motivating study tip using AI. Falls back to a
 * random tip from a curated list when no GROQ_API_KEY is set or the call
 * fails, so the feature always has something to show.
 */
export async function generateStudyTip() {
  try {
    if (ENV.groqKey) {
      const res = await fetch(GROQ_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${ENV.groqKey}`,
        },
        body: JSON.stringify({
          model: ENV.groqModel,
          messages: [
            { role: "system", content: "You give one short, practical, encouraging study tip for a university student. Respond with ONLY the tip itself as plain text — one or two sentences, no quotes, no markdown, no preamble." },
            { role: "user", content: "Give me a fresh study tip." },
          ],
          temperature: 0.9,
          max_tokens: 100,
        }),
      });
      if (!res.ok) throw new Error(`Groq API error ${res.status}`);
      const data = await res.json();
      const tip = data.choices?.[0]?.message?.content?.trim();
      if (tip) return tip.replace(/^"|"$/g, "");
    }
  } catch (err) {
    console.error("Groq study tip generation failed, falling back to a stock tip:", err.message);
  }
  return FALLBACK_STUDY_TIPS[Math.floor(Math.random() * FALLBACK_STUDY_TIPS.length)];
}

function parseQuestions(raw, difficulty) {
  const cleaned = raw.replace(/```json|```/g, "").trim();
  const parsed = JSON.parse(cleaned);
  return parsed.map((q) => ({ ...q, difficulty }));
}

function mockQuestions(title, numQuestions, difficulty) {
  const stems = [
    (t) => `What is the main idea introduced in "${t}"?`,
    (t) => `Which statement about the content of "${t}" is most accurate?`,
    (t) => `Based on "${t}", which of the following best fits the topic?`,
    (t) => `Which of these terms is directly related to "${t}"?`,
    (t) => `According to "${t}", what would logically follow?`,
  ];
  const questions = [];
  for (let i = 0; i < numQuestions; i++) {
    const correctIndex = i % 4;
    questions.push({
      question: stems[i % stems.length](title),
      options: ["Option A", "Option B", "Option C", "Option D"].map((label, idx) =>
        idx === correctIndex ? `The concept most consistent with "${title}"` : `${label} — a plausible but incorrect distractor`
      ),
      correctAnswer: correctIndex,
      explanation: `This reflects what "${title}" actually covers. (Generated as a fallback — set GROQ_API_KEY for real AI-generated questions.)`,
      difficulty,
    });
  }
  return questions;
}
