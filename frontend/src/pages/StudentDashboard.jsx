import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LayoutDashboard, Compass, Bookmark, BarChart3, FolderKanban, ChevronRight, FileText, DownloadCloud, UserCircle2, Search, X, BookOpenCheck, Sparkles, Library } from "lucide-react";
import AppShell from "./AppShell.jsx";
import { CardSkeleton } from "../components/Loader.jsx";
import { StatTile, StreakChip, ProgressBar } from "../components/StudyStats.jsx";
import { useStudyProgress } from "../hooks/useStudyProgress.js";
import EmptyState from "../components/EmptyState.jsx";
import Button from "../components/Button.jsx";
import MaterialCard from "../components/MaterialCard.jsx";
import { Select, Input } from "../components/FormFields.jsx";
import { getDashboard } from "../services/feedService.js";
import { downloadAllMaterials } from "../services/materialService.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../components/Toast.jsx";
import StudyTipModal from "../components/StudyTipModal.jsx";

export const studentNavItems = [
  { to: "/", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" />, end: true },
  { to: "/explore", label: "Explore Feed", icon: <Compass className="w-4 h-4" /> },
  { to: "/bookmarks", label: "Bookmarks", icon: <Bookmark className="w-4 h-4" /> },
  { to: "/analytics", label: "Study Analytics", icon: <BarChart3 className="w-4 h-4" /> },
  { to: "/profile", label: "Profile", icon: <UserCircle2 className="w-4 h-4" /> },
];

const SORT_OPTIONS = [
  { value: "recent", label: "Most recent" },
  { value: "downloads", label: "Most downloaded" },
  { value: "session", label: "By session/year" },
];

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [sort, setSort] = useState("recent");
  const [query, setQuery] = useState("");
  const [downloadingAll, setDownloadingAll] = useState(false);
  const navigate = useNavigate();
  const showToast = useToast();
  const progress = useStudyProgress(data?.materials || []);

  useEffect(() => {
    setData(null); setError("");
    getDashboard(sort).then(setData).catch((err) => setError(err.message || "Couldn't load your feed."));
  }, [sort]);

  const sortedMaterials = useMemo(() => {
    if (!data) return [];
    const materials = [...data.materials];
    if (sort === "session") {
      return materials.sort((a, b) => {
        const sa = a.courseId?.session || "";
        const sb = b.courseId?.session || "";
        return sb.localeCompare(sa) || new Date(b.createdAt) - new Date(a.createdAt);
      });
    }
    if (sort === "downloads") return materials.sort((a, b) => b.downloads - a.downloads);
    return materials.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [data, sort]);

  // Quick client-side search across the student's own feed — separate from
  // the global navbar search, which searches every material in the system.
  // This just filters what's already scoped to their courses.
  const q = query.trim().toLowerCase();
  const filteredCourses = useMemo(() => {
    if (!data) return [];
    if (!q) return data.courses;
    return data.courses.filter((c) => c.code.toLowerCase().includes(q) || c.title.toLowerCase().includes(q));
  }, [data, q]);
  const filteredMaterials = useMemo(() => {
    if (!q) return sortedMaterials;
    return sortedMaterials.filter((m) =>
      m.title.toLowerCase().includes(q) ||
      m.courseId?.code?.toLowerCase().includes(q) ||
      m.courseId?.title?.toLowerCase().includes(q)
    );
  }, [sortedMaterials, q]);

  async function handleDownloadAll() {
    if (!data || filteredMaterials.length === 0) { showToast("Nothing to download yet.", "info"); return; }
    setDownloadingAll(true);
    try {
      await downloadAllMaterials(filteredMaterials.map((m) => m._id));
      showToast("Your zip download has started.", "success");
    } catch (err) {
      showToast(err.message || "Couldn't download all materials.", "error");
    } finally {
      setDownloadingAll(false);
    }
  }

  return (
    <AppShell sidebarItems={studentNavItems}>
      <StudyTipModal />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-night dark:text-slate-50">
            {greeting()}, {user.name.split(" ")[0]}
          </h1>
          <p className="mt-1.5 text-sm lv-meta">
            {user.department}, {user.level} Level, {user.semester}
            {user.session && ` (${user.session})`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StreakChip days={progress.streakDays} />
          <Button variant="outline" disabled={downloadingAll || !data} onClick={handleDownloadAll}>
            <DownloadCloud className="h-4 w-4" /> {downloadingAll ? "Preparing zip..." : "Download all"}
          </Button>
        </div>
      </div>

      {/* Your week at a glance. The peach tile is whatever you should do next. */}
      {data && (
        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile icon={<Library className="h-4 w-4" />} value={data.materials.length} label="Materials in your feed" />
          <StatTile icon={<BookOpenCheck className="h-4 w-4" />} value={`${progress.percentRead}%`} label="Opened so far" />
          <StatTile icon={<FolderKanban className="h-4 w-4" />} value={data.courses.length} label="Courses this semester" />
          <StatTile tone="accent" icon={<Sparkles className="h-4 w-4" />} value={progress.quizReadyCount} label="Quizzes ready to take" />
        </div>
      )}

      <div className="mt-4 relative max-w-md">
        <Input
          icon={<Search className="w-4 h-4" />}
          placeholder="Search your courses and materials..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && (
          <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {error && (
        <div className="mt-6 rounded-2xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger" role="alert">{error}</div>
      )}

      {!data && !error ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2"><CardSkeleton count={4} /></div>
      ) : data && (
        <>
          <div className="mt-6">
            <h2 className="lv-section-title mb-3">Your courses</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCourses.map((c) => (
                <button
                  key={c._id}
                  onClick={() => navigate(`/course/${c._id}`)}
                  className="lv-card-interactive flex h-full flex-col p-4 text-left"
                >
                  <p className="font-display text-xs font-bold tracking-wide text-primary">{c.code}</p>
                  <p className="mt-1.5 font-display font-semibold leading-snug text-night dark:text-slate-100">{c.title}</p>
                  <div className="flex-1" />
                  <div className="mt-4 pt-1">
                    <ProgressBar value={progress.courseProgress(c._id)} />
                    <div className="mt-2 flex items-center justify-between text-xs lv-meta">
                      <span>{c.semester}{c.session && `, ${c.session}`}</span>
                      <span className="font-medium">{progress.courseProgress(c._id)}% read</span>
                    </div>
                  </div>
                </button>
              ))}
              {filteredCourses.length === 0 && (
                <EmptyState
                  icon={<FolderKanban className="w-8 h-8" />}
                  title={q ? "No courses match your search" : "No courses yet"}
                  message={q ? "Try the course code instead." : "Courses for your department, level and session appear here as soon as a rep sets them up."}
                />
              )}
            </div>
          </div>

          <div className="mt-8 flex items-center justify-between gap-3 flex-wrap">
            <h2 className="lv-section-title">Latest materials</h2>
            <Select value={sort} onChange={(e) => setSort(e.target.value)} className="w-auto">
              {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </Select>
          </div>
          <div className="mt-4 grid sm:grid-cols-2 gap-4">
            {filteredMaterials.map((m) => (
              <MaterialCard key={m._id} material={m} isBookmarked={progress.isOpened(m._id)} onOpen={() => navigate(`/material/${m._id}`)} />
            ))}
            {filteredMaterials.length === 0 && (
              <EmptyState
                icon={<FileText className="w-8 h-8" />}
                title={q ? "No materials match your search" : "No materials yet"}
                message={q ? "Try the course code instead." : "Nothing has been uploaded for your courses yet. Check the explore feed for related material."}
              />
            )}
          </div>

          <div className="mt-8 flex items-center justify-between">
            <h2 className="lv-section-title">Explore other departments</h2>
            <Button variant="ghost" className="text-primary" onClick={() => navigate("/explore")}>Go to Explore Feed <ChevronRight className="w-4 h-4" /></Button>
          </div>
        </>
      )}
    </AppShell>
  );
}
