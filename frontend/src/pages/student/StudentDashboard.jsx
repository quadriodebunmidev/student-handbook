import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, FolderKanban, ChevronRight, FileText, DownloadCloud, Search, X, UploadCloud } from "lucide-react";
import AppShell from "../AppShell.jsx";
import { StreakChip, ProgressBar } from "../../components/StudyStats.jsx";
import { useStudyProgress } from "../../hooks/useStudyProgress.js";
import { useInfiniteScroll } from "../../hooks/useInfiniteScroll.js";
import InfiniteScrollSentinel from "../../components/InfiniteScrollSentinel.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import Button from "../../components/Button.jsx";
import MaterialCard from "../../components/MaterialCard.jsx";
import { Select, Input } from "../../components/FormFields.jsx";
import { getDashboard, getFeedMaterials } from "../../services/feedService.js";
import { downloadAllMaterials } from "../../services/materialService.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../components/Toast.jsx";
import StudyTipModal from "../../components/StudyTipModal.jsx";
import booksIllustration from "../../../public/Books.svg";

import { studentNavItems, repNavItemsFor } from "../../config/navItems.jsx";
export { studentNavItems };

const SORT_OPTIONS = [
  { value: "for_you", label: "For you" },
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

// Replaces the old card-skeleton grid while something is loading. Spans the
// full grid so it sits centered in the space the cards will occupy, rather
// than looking like one card among placeholders.
function LoadingBooks({ label }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center gap-3 py-12">
      <img src={booksIllustration} alt="" aria-hidden="true" className="h-48 w-48" />
      <p className="text-sm lv-meta">{label}</p>
    </div>
  );
}

// The student experience — courses, private uploads, and a ranked, infinite-
// scroll feed of materials. Course Reps get this exact page too (as their
// "Student Dashboard"): same search, same download-all, same feed, just
// reached from a different nav item. RepDashboard (their uploads/queue) is
// still their landing page.
export default function StudentDashboard() {
  const { user } = useAuth();
  const isRep = user.role === "rep";
  const [dash, setDash] = useState(null);
  const [dashError, setDashError] = useState("");
  const [sort, setSort] = useState("for_you");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [downloadingAll, setDownloadingAll] = useState(false);
  const navigate = useNavigate();
  const showToast = useToast();
  const progress = useStudyProgress(dash?.privateMaterials || []);

  useEffect(() => {
    setDash(null); setDashError("");
    getDashboard().then(setDash).catch((err) => setDashError(err.message || "Couldn't load your dashboard."));
  }, []);

  // Debounce the feed search so we're not firing a request on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 350);
    return () => clearTimeout(t);
  }, [query]);

  const fetchPage = useCallback(
    (cursor) => getFeedMaterials({ sort, q: debouncedQuery, cursor }),
    [sort, debouncedQuery]
  );
  const {
    items: materials, loading, loadingMore, error: feedError, hasMore, sentinelRef,
  } = useInfiniteScroll({
    fetchPage,
    getItems: (res) => res.materials,
    getNextCursor: (res) => res.pagination?.nextCursor,
    deps: [sort, debouncedQuery],
  });

  const q = debouncedQuery.toLowerCase();
  const filteredCourses = useMemo(() => {
    if (!dash) return [];
    if (!q) return dash.courses;
    return dash.courses.filter((c) => c.code.toLowerCase().includes(q) || c.title.toLowerCase().includes(q));
  }, [dash, q]);
  const filteredPrivate = useMemo(() => {
    const list = dash?.privateMaterials || [];
    if (!q) return list;
    return list.filter((m) => m.title.toLowerCase().includes(q) || m.courseId?.code?.toLowerCase().includes(q));
  }, [dash, q]);

  async function handleDownloadAll() {
    if (materials.length === 0) { showToast("Nothing to download yet.", "info"); return; }
    setDownloadingAll(true);
    try {
      // No explicit ids — the server zips the caller's own dashboard courses,
      // so "Download all" always reflects everything, not just this scroll page.
      await downloadAllMaterials({});
      showToast("Your zip download has started.", "success");
    } catch (err) {
      showToast(err.message || "Couldn't download all materials.", "error");
    } finally {
      setDownloadingAll(false);
    }
  }

  const sidebarItems = isRep ? repNavItemsFor(user) : studentNavItems;

  return (
    <AppShell sidebarItems={sidebarItems}>
      {!isRep && <StudyTipModal />}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-night dark:text-slate-50">
            {greeting()}, {user.name.split(" ")[0]}
          </h1>
          <p className="mt-1.5 text-sm lv-meta">
            {user.school?.name && `${user.school.name} · `}{user.department}, {user.level} Level, {user.semester}
            {user.session && ` (${user.session})`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StreakChip days={progress.streakDays} />
          {!isRep && (
            <Button variant="ghost" onClick={() => navigate("/my-uploads")}>
              <UploadCloud className="h-4 w-4" /> Upload material
            </Button>
          )}
          <Button variant="outline" disabled={downloadingAll} onClick={handleDownloadAll}>
            <DownloadCloud className="h-4 w-4" /> {downloadingAll ? "Preparing zip..." : "Download all"}
          </Button>
        </div>
      </div>

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

      {dashError && (
        <div className="mt-6 rounded-2xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger" role="alert">{dashError}</div>
      )}

      {!dash && !dashError ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2"><LoadingBooks label="Loading your dashboard…" /></div>
      ) : dash && (
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

          {filteredPrivate.length > 0 && (
            <div className="mt-8">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="lv-section-title"><Lock className="h-4 w-4" /> Just for you</h2>
                <Button variant="ghost" className="text-primary" onClick={() => navigate("/my-uploads")}>
                  {dash.privateTotal > filteredPrivate.length ? `See all ${dash.privateTotal}` : "Manage"} <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              <p className="-mt-1 mb-3 text-xs lv-meta">Your private uploads — only you can see these.</p>
              <div className="grid sm:grid-cols-2 gap-4">
                {filteredPrivate.map((m) => (
                  <MaterialCard key={m._id} material={m} isBookmarked={progress.isOpened(m._id)} onOpen={() => navigate(`/material/${m._id}`)} />
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 flex items-center justify-between gap-3 flex-wrap">
            <h2 className="lv-section-title">{sort === "for_you" ? "For you" : "Latest materials"}</h2>
            <Select value={sort} onChange={(e) => setSort(e.target.value)} className="w-auto">
              {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </Select>
          </div>

          {feedError && !loading && (
            <div className="mt-3 rounded-2xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger" role="alert">{feedError}</div>
          )}

          {loading ? (
            <div className="mt-4 grid sm:grid-cols-2 gap-4"><LoadingBooks label="Loading materials…" /></div>
          ) : (
            <div className="mt-4 grid sm:grid-cols-2 gap-4">
              {materials.map((m) => (
                <MaterialCard key={m._id} material={m} isBookmarked={progress.isOpened(m._id)} onOpen={() => navigate(`/material/${m._id}`)} />
              ))}
              {materials.length === 0 && !feedError && (
                <EmptyState
                  icon={<FileText className="w-8 h-8" />}
                  title={q ? "No materials match your search" : "No materials yet"}
                  message={q ? "Try the course code instead." : "Nothing has been uploaded for your courses yet. Check the explore feed for related material."}
                />
              )}
              {materials.length > 0 && <InfiniteScrollSentinel sentinelRef={sentinelRef} hasMore={hasMore} loadingMore={loadingMore} />}
            </div>
          )}

          <div className="mt-8 flex items-center justify-between">
            <h2 className="lv-section-title">Explore other departments</h2>
            <Button variant="ghost" className="text-primary" onClick={() => navigate("/explore")}>Go to Explore Feed <ChevronRight className="w-4 h-4" /></Button>
          </div>
        </>
      )}
    </AppShell>
  );
}