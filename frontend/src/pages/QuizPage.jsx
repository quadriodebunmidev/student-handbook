import React, { useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { ClipboardCheck, CheckCircle2, XCircle, Copy, Check } from "lucide-react";
import AppShell from "./AppShell.jsx";
import { studentNavItems } from "./StudentDashboard.jsx";
import Badge from "../components/Badge.jsx";
import Button from "../components/Button.jsx";
import { submitQuiz } from "../services/quizService.js";
import { useToast } from "../components/Toast.jsx";

// Copy-to-clipboard button shared by the question text and its (revealed)
// correct answer, so students can paste either into their own notes.
function CopyButton({ text, label }) {
  const [copied, setCopied] = useState(false);
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API unavailable — nothing to recover from here.
    }
  }
  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
      title={`Copy ${label}`}
    >
      {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />} {copied ? "Copied" : `Copy ${label}`}
    </button>
  );
}

export default function QuizPage() {
  const { id } = useParams();
  const { state } = useLocation();
  const quiz = state?.quiz;
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const navigate = useNavigate();
  const showToast = useToast();

  if (!quiz) {
    return (
      <AppShell sidebarItems={studentNavItems}>
        <p className="text-slate-500 dark:text-slate-400">This quiz session has expired — generate a new one from the material page.</p>
        <Button className="mt-4" onClick={() => navigate("/")}>Back to Dashboard</Button>
      </AppShell>
    );
  }

  const answeredCount = Object.keys(answers).length;

  async function handleSubmit() {
    const orderedAnswers = quiz.questions.map((_, i) => answers[i]);
    const res = await submitQuiz(id, orderedAnswers);
    setResult(res);
    showToast("Quiz completed", "success");
  }

  if (result) {
    const pct = Math.round((result.score / result.total) * 100);
    return (
      <AppShell sidebarItems={studentNavItems}>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">Your score</p>
          <p className={`text-4xl font-bold mt-1 ${pct >= 70 ? "text-success" : pct >= 40 ? "text-warning" : "text-danger"}`}>{result.score}/{result.total}</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{pct}% correct</p>
        </div>
        <div className="mt-5 space-y-4">
          {result.results.map((r, idx) => (
            <div key={idx} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  {r.correct ? <CheckCircle2 className="w-4 h-4 text-success" /> : <XCircle className="w-4 h-4 text-danger" />}
                  <p className="font-medium">{idx + 1}. {r.question}</p>
                </div>
                <CopyButton text={r.question} label="question" />
              </div>
              <div className="mt-2 flex items-start justify-between gap-3">
                <p className="text-sm text-slate-500 dark:text-slate-400">Correct answer: <span className="text-slate-900 dark:text-slate-100">{r.options[r.correctAnswer]}</span></p>
                <CopyButton text={r.options[r.correctAnswer]} label="answer" />
              </div>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{r.explanation}</p>
            </div>
          ))}
        </div>
        <Button className="mt-5" onClick={() => navigate(-2)}>Back to material</Button>
      </AppShell>
    );
  }

  return (
    <AppShell sidebarItems={studentNavItems}>
      <div className="flex items-center gap-2">
        <ClipboardCheck className="w-5 h-5 text-primary" />
        <h1 className="text-xl font-bold">Quiz — {quiz.materialTitle}</h1>
      </div>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{answeredCount} of {quiz.questions.length} answered</p>
      <div className="mt-5 space-y-4">
        {quiz.questions.map((q, idx) => (
          <div key={idx} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
            <div className="flex items-start justify-between gap-3">
              <p className="font-medium">{idx + 1}. {q.question}</p>
              <Badge tone={q.difficulty === "Hard" ? "red" : q.difficulty === "Easy" ? "green" : "amber"}>{q.difficulty}</Badge>
            </div>
            <div className="mt-3 space-y-2">
              {q.options.map((opt, oi) => (
                <label key={oi} className={`flex items-center gap-3 rounded-xl border px-3 py-2 cursor-pointer text-sm ${answers[idx] === oi ? "border-primary bg-primary/10" : "border-slate-200 dark:border-slate-700"}`}>
                  <input type="radio" name={`q-${idx}`} checked={answers[idx] === oi} onChange={() => setAnswers((a) => ({ ...a, [idx]: oi }))} className="accent-primary" />
                  {opt}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
      <Button className="mt-5" disabled={answeredCount < quiz.questions.length} onClick={handleSubmit}>Submit Quiz</Button>
    </AppShell>
  );
}
