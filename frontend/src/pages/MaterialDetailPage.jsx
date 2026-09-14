import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Eye, Bookmark, BookmarkCheck, Sparkles, Loader2, Flag, X, Copy, Check, BookOpenText } from "lucide-react";
import AppShell from "./AppShell.jsx";
import { studentNavItems } from "./StudentDashboard.jsx";
import Button from "../components/Button.jsx";
import { Select } from "../components/FormFields.jsx";
import { InlineLoader } from "../components/Loader.jsx";
import { getMaterial, downloadMaterial, triggerFileDownload, toggleBookmark, reportMaterial } from "../services/materialService.js";
import { generateQuiz, generateTheoryQuiz } from "../services/quizService.js";
import { useToast } from "../components/Toast.jsx";
import { markMaterialOpened } from "../hooks/useStudyProgress.js";

// Office formats (docx/pptx/xlsx) can't be rendered natively by a browser,
// so they're embedded through Google's public document viewer. pdf and
// images render directly.
function OFFICE_VIEWER_URL(fileUrl) {
  return `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`;
}

function FilePreview({ material }) {
  if (!material) return null;
  if (material.fileType === "image") {
    return <img src={material.fileUrl} alt={material.title} className="w-full max-h-[75vh] object-contain rounded-xl bg-slate-100 dark:bg-slate-800" />;
  }
  if (material.fileType === "pdf") {
    return <iframe title={material.title} src={material.fileUrl} className="w-full h-[75vh] rounded-xl border border-slate-200 dark:border-slate-800" />;
  }
  // docx / pptx / xlsx
  return <iframe title={material.title} src={OFFICE_VIEWER_URL(material.fileUrl)} className="w-full h-[75vh] rounded-xl border border-slate-200 dark:border-slate-800" />;
}

// A small copy-to-clipboard button used for both theory questions and
// answers, so students can quickly paste either into their own notes.
function CopyButton({ text, label }) {
  const [copied, setCopied] = useState(false);
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API unavailable — fail silently, nothing to recover from here.
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

export default function MaterialDetailPage() {
  const { id } = useParams();
  const [material, setMaterial] = useState(null);
  const [bookmarked, setBookmarked] = useState(false);
  const [numQuestions, setNumQuestions] = useState(5);
  const [difficulty, setDifficulty] = useState("Medium");
  const [genLoading, setGenLoading] = useState(false);
  const [theoryLoading, setTheoryLoading] = useState(false);
  const [theoryQuestions, setTheoryQuestions] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const navigate = useNavigate();
  const showToast = useToast();

  useEffect(() => {
    getMaterial(id).then(setMaterial);
    // Counts toward the "opened so far" figure and the course progress bars.
    markMaterialOpened(id);
  }, [id]);

  async function handleDownload() {
    setDownloading(true);
    try {
      const { fileUrl, fileName } = await downloadMaterial(id);
      await triggerFileDownload(fileUrl, fileName);
      showToast("Download started", "success");
    } catch (err) {
      showToast(err.message || "Couldn't download this file.", "error");
    } finally {
      setDownloading(false);
    }
  }

  async function handleBookmark() {
    const isBookmarked = await toggleBookmark(id);
    setBookmarked(isBookmarked);
    showToast(isBookmarked ? "Bookmark saved" : "Removed bookmark", "success");
  }

  async function handleReport() {
    const reason = window.prompt("What's the issue with this material?");
    if (!reason) return;
    await reportMaterial(id, reason);
    showToast("Thanks — our team will review this.", "success");
  }

  async function handleGenerateQuiz() {
    setGenLoading(true);
    try {
      const quiz = await generateQuiz(id, numQuestions, difficulty);
      navigate(`/quiz/${quiz._id}`, { state: { quiz } });
    } catch (err) {
      showToast(err.message || "Couldn't generate quiz", "error");
    } finally {
      setGenLoading(false);
    }
  }

  async function handleGenerateTheory() {
    setTheoryLoading(true);
    try {
      const quiz = await generateTheoryQuiz(id, numQuestions, difficulty);
      setTheoryQuestions(quiz.questions);
    } catch (err) {
      showToast(err.message || "Couldn't generate theory questions", "error");
    } finally {
      setTheoryLoading(false);
    }
  }

  if (!material) return <AppShell sidebarItems={studentNavItems}><InlineLoader /></AppShell>;

  return (
    <AppShell sidebarItems={studentNavItems}>
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm mb-4 text-slate-500 dark:text-slate-400"><ArrowLeft className="w-4 h-4" /> Back</button>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
        <p className="text-xs font-semibold text-primary">{material.courseId?.code}</p>
        <h1 className="text-xl font-bold mt-1">{material.title}</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{material.description}</p>
        <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400">
          <span>Uploaded by {material.uploadedBy?.name}</span>
          <span>{new Date(material.createdAt).toLocaleDateString()}</span>
          {material.size && <span>{material.size}</span>}
          <span>{material.downloads} downloads</span>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button disabled={downloading} onClick={handleDownload}>
            {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} {downloading ? "Preparing..." : "Download"}
          </Button>
          <Button variant="outline" onClick={() => setPreviewOpen(true)}><Eye className="w-4 h-4" /> Preview</Button>
          <Button variant="outline" onClick={handleBookmark}>
            {bookmarked ? <BookmarkCheck className="w-4 h-4 text-primary" /> : <Bookmark className="w-4 h-4" />} {bookmarked ? "Bookmarked" : "Bookmark"}
          </Button>
          <Button variant="outline" onClick={handleReport}><Flag className="w-4 h-4" /> Report an issue</Button>
        </div>
      </div>

      {previewOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setPreviewOpen(false)}>
          <div className="w-full max-w-4xl rounded-2xl bg-white dark:bg-slate-900 p-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <p className="font-semibold truncate pr-4">{material.title}</p>
              <button onClick={() => setPreviewOpen(false)} className="rounded-full p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"><X className="w-4 h-4" /></button>
            </div>
            <FilePreview material={material} />
          </div>
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-secondary-purple" />
          <h2 className="font-semibold">AI Question Generator</h2>
        </div>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Generate a multiple-choice quiz or open-ended theory questions straight from this material's content.</p>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs mb-1 text-slate-500 dark:text-slate-400">Number of questions</label>
            <Select value={numQuestions} onChange={(e) => setNumQuestions(Number(e.target.value))}>
              {[3, 5, 8, 10].map((n) => <option key={n} value={n}>{n}</option>)}
            </Select>
          </div>
          <div>
            <label className="block text-xs mb-1 text-slate-500 dark:text-slate-400">Difficulty</label>
            <Select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
              {["Easy", "Medium", "Hard"].map((d) => <option key={d} value={d}>{d}</option>)}
            </Select>
          </div>
          <Button variant="secondary" disabled={genLoading || theoryLoading} onClick={handleGenerateQuiz}>
            {genLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Generate Quiz
          </Button>
          <Button variant="outline" disabled={genLoading || theoryLoading} onClick={handleGenerateTheory}>
            {theoryLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookOpenText className="w-4 h-4" />} Generate Theory Questions
          </Button>
        </div>

        {theoryQuestions && (
          <div className="mt-5 space-y-4">
            {theoryQuestions.map((q, idx) => (
              <div key={idx} className="rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium text-sm">{idx + 1}. {q.question}</p>
                  <CopyButton text={q.question} label="question" />
                </div>
                <div className="mt-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm text-slate-600 dark:text-slate-300">{q.answer}</p>
                    <CopyButton text={q.answer} label="answer" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
