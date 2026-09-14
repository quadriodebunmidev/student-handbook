import Quiz from "../models/Quiz.js";
import QuizAttempt from "../models/QuizAttempt.js";
import Material from "../models/Material.js";
import { generateQuestionsFromText, generateTheoryQuestionsFromText } from "../utils/aiService.js";

// POST /api/quiz/generate  { materialId, numQuestions, difficulty }
export async function generateQuiz(req, res, next) {
  try {
    const { materialId, numQuestions = 5, difficulty = "Medium" } = req.body;
    const material = await Material.findById(materialId);
    if (!material) return res.status(404).json({ message: "Material not found." });

    const questions = await generateQuestionsFromText({
      text: material.extractedText,
      title: material.title,
      numQuestions,
      difficulty,
    });

    const quiz = await Quiz.create({
      materialId,
      generatedFor: req.user._id,
      numQuestions,
      difficulty,
      questions,
    });

    material.quizzesGenerated += 1;
    await material.save();

    // Don't leak correct answers to the client before they attempt it
    const safeQuiz = {
      _id: quiz._id,
      materialId,
      materialTitle: material.title,
      difficulty,
      questions: quiz.questions.map((q) => ({ question: q.question, options: q.options, difficulty: q.difficulty })),
    };
    res.status(201).json({ quiz: safeQuiz });
  } catch (err) { next(err); }
}

// POST /api/quiz/generate-theory  { materialId, numQuestions, difficulty }
// Unlike /generate (multiple-choice, answers hidden until submission), theory
// questions are returned with their model answers right away — they're for
// self-study and copying, not scored grading.
export async function generateTheoryQuiz(req, res, next) {
  try {
    const { materialId, numQuestions = 5, difficulty = "Medium" } = req.body;
    const material = await Material.findById(materialId);
    if (!material) return res.status(404).json({ message: "Material not found." });

    const questions = await generateTheoryQuestionsFromText({
      text: material.extractedText,
      title: material.title,
      numQuestions,
      difficulty,
    });

    const quiz = await Quiz.create({
      materialId,
      generatedFor: req.user._id,
      type: "theory",
      numQuestions,
      difficulty,
      questions,
    });

    material.quizzesGenerated += 1;
    await material.save();

    res.status(201).json({
      quiz: {
        _id: quiz._id,
        materialId,
        materialTitle: material.title,
        type: "theory",
        difficulty,
        questions: quiz.questions.map((q) => ({ question: q.question, answer: q.answer, difficulty: q.difficulty })),
      },
    });
  } catch (err) { next(err); }
}

// GET /api/quiz/:id
export async function getQuiz(req, res, next) {
  try {
    const quiz = await Quiz.findById(req.params.id).populate("materialId", "title");
    if (!quiz) return res.status(404).json({ message: "Quiz not found." });
    res.json({ quiz });
  } catch (err) { next(err); }
}

// POST /api/quiz/:id/submit  { answers: [selectedIndex, ...] }
export async function submitQuiz(req, res, next) {
  try {
    const { answers } = req.body;
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: "Quiz not found." });

    let score = 0;
    const results = quiz.questions.map((q, i) => {
      const correct = answers[i] === q.correctAnswer;
      if (correct) score++;
      return { question: q.question, options: q.options, correctAnswer: q.correctAnswer, yourAnswer: answers[i], correct, explanation: q.explanation };
    });

    const attempt = await QuizAttempt.create({
      quizId: quiz._id,
      studentId: req.user._id,
      answers,
      score,
      total: quiz.questions.length,
    });

    res.json({ attempt, score, total: quiz.questions.length, results });
  } catch (err) { next(err); }
}

// GET /api/quiz/attempts/mine
export async function myAttempts(req, res, next) {
  try {
    const attempts = await QuizAttempt.find({ studentId: req.user._id })
      .populate({ path: "quizId", populate: { path: "materialId", select: "title" } })
      .sort({ createdAt: 1 });
    res.json({ attempts });
  } catch (err) { next(err); }
}

// GET /api/quiz/analytics/mine  — study analytics for the logged-in student
export async function myAnalytics(req, res, next) {
  try {
    const attempts = await QuizAttempt.find({ studentId: req.user._id }).populate({ path: "quizId", populate: { path: "materialId", select: "title" } });
    const totalAttempts = attempts.length;
    const avgScore = totalAttempts
      ? Math.round(attempts.reduce((s, a) => s + (a.score / a.total) * 100, 0) / totalAttempts)
      : 0;
    const weakest = [...attempts].sort((a, b) => a.score / a.total - b.score / b.total)[0];

    res.json({
      totalAttempts,
      avgScore,
      weakestTopic: weakest ? weakest.quizId?.materialId?.title : null,
      trend: attempts.map((a) => ({ score: Math.round((a.score / a.total) * 100), date: a.completedAt })),
    });
  } catch (err) { next(err); }
}
