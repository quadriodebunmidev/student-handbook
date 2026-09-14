import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, FileText } from "lucide-react";
import AppShell from "./AppShell.jsx";
import { studentNavItems } from "./StudentDashboard.jsx";
import MaterialCard from "../components/MaterialCard.jsx";
import EmptyState from "../components/EmptyState.jsx";
import { InlineLoader } from "../components/Loader.jsx";
import { Select } from "../components/FormFields.jsx";
import { getCourse } from "../services/courseService.js";

export default function CoursePage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [sort, setSort] = useState("date");
  const navigate = useNavigate();

  useEffect(() => { setData(null); getCourse(id).then(setData); }, [id]);

  if (!data) return <AppShell sidebarItems={studentNavItems}><InlineLoader /></AppShell>;

  const { course, materials } = data;
  const sorted = [...materials].sort((a, b) => (sort === "date" ? new Date(b.createdAt) - new Date(a.createdAt) : b.downloads - a.downloads));

  return (
    <AppShell sidebarItems={studentNavItems}>
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm mb-4 text-slate-500 dark:text-slate-400"><ArrowLeft className="w-4 h-4" /> Back</button>
      <p className="text-xs font-semibold text-primary">{course.code}</p>
      <h1 className="text-2xl font-bold">{course.title}</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{course.department} · {course.level} Level · {course.semester}{course.session && ` · ${course.session} Session`}</p>
      <div className="mt-4 flex justify-end">
        <Select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="date">Sort by date</option>
          <option value="downloads">Sort by most downloaded</option>
        </Select>
      </div>
      <div className="mt-4 grid sm:grid-cols-2 gap-4">
        {sorted.map((m) => (
          <MaterialCard key={m._id} material={m} onOpen={() => navigate(`/material/${m._id}`)} />
        ))}
        {sorted.length === 0 && <EmptyState icon={<FileText className="w-8 h-8" />} title="No materials yet" message="Nothing has been uploaded for this course." />}
      </div>
    </AppShell>
  );
}
