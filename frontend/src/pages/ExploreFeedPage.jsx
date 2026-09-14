import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X } from "lucide-react";
import AppShell from "./AppShell.jsx";
import { studentNavItems } from "./StudentDashboard.jsx";
import { Select, Input } from "../components/FormFields.jsx";
import Badge from "../components/Badge.jsx";
import EmptyState from "../components/EmptyState.jsx";
import { InlineLoader } from "../components/Loader.jsx";
import { getExploreFeed } from "../services/feedService.js";
import { DEPARTMENTS, LEVELS, SEMESTERS, SESSIONS } from "../config/appConfig.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function ExploreFeedPage() {
  const { user } = useAuth();
  const [filters, setFilters] = useState({ department: "All", level: "All", semester: "All", session: "All" });
  const [courses, setCourses] = useState(null);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    setCourses(null);
    getExploreFeed(filters).then(setCourses);
  }, [filters]);

  const q = query.trim().toLowerCase();
  const filteredCourses = useMemo(() => {
    if (!courses) return [];
    if (!q) return courses;
    return courses.filter((c) => c.code.toLowerCase().includes(q) || c.title.toLowerCase().includes(q) || c.department.toLowerCase().includes(q));
  }, [courses, q]);

  return (
    <AppShell sidebarItems={studentNavItems}>
      <h1 className="text-2xl font-bold">Explore Feed</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Browse materials from other departments and levels — read-only, doesn't affect your dashboard.</p>

      <div className="mt-4 relative max-w-md">
        <Input
          icon={<Search className="w-4 h-4" />}
          placeholder="Search by course code, title or department..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && (
          <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

<div className="mt-4 flex flex-wrap gap-3">
  <div className="flex flex-col gap-1">
    <label htmlFor="filter-department" className="text-xs font-medium text-muted-foreground">Department</label>
    <Select id="filter-department" value={filters.department} onChange={(e) => setFilters((f) => ({ ...f, department: e.target.value }))}>
      <option>All</option>{DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
    </Select>
  </div>
  <div className="flex flex-col gap-1">
    <label htmlFor="filter-level" className="text-xs font-medium text-muted-foreground">Level</label>
    <Select id="filter-level" value={filters.level} onChange={(e) => setFilters((f) => ({ ...f, level: e.target.value }))}>
      <option>All</option>{LEVELS.map((l) => <option key={l}>{l}</option>)}
    </Select>
  </div>
  <div className="flex flex-col gap-1">
    <label htmlFor="filter-semester" className="text-xs font-medium text-muted-foreground">Semester</label>
    <Select id="filter-semester" value={filters.semester} onChange={(e) => setFilters((f) => ({ ...f, semester: e.target.value }))}>
      <option>All</option>{SEMESTERS.map((s) => <option key={s}>{s}</option>)}
    </Select>
  </div>
  <div className="flex flex-col gap-1">
    <label htmlFor="filter-session" className="text-xs font-medium text-muted-foreground">Session</label>
    <Select id="filter-session" value={filters.session} onChange={(e) => setFilters((f) => ({ ...f, session: e.target.value }))}>
      <option>All</option>{SESSIONS.map((s) => <option key={s}>{s}</option>)}
    </Select>
  </div>
</div>
      {!courses ? <InlineLoader /> : (
        <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCourses.map((c) => (
            <button key={c._id} onClick={() => navigate(`/course/${c._id}`)} className="text-left rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-primary">{c.code}</p>
                {(c.department !== user.department || c.level !== user.level) && <Badge tone="violet">Other</Badge>}
              </div>
              <p className="mt-1 font-semibold">{c.title}</p>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{c.department} · {c.level} Level{c.session && ` · ${c.session}`}</p>
            </button>
          ))}
          {filteredCourses.length === 0 && (
            <EmptyState icon={<Search className="w-8 h-8" />} title="No courses match" message="Try a different keyword or adjust your filters." />
          )}
        </div>
      )}
    </AppShell>
  );
}
