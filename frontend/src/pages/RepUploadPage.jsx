import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload } from "lucide-react";
import AppShell from "./AppShell.jsx";
import { repNavItemsFor } from "./RepDashboard.jsx";
import Button from "../components/Button.jsx";
import { Input, Select, Textarea } from "../components/FormFields.jsx";
import { listCourses } from "../services/courseService.js";
import { uploadMaterial } from "../services/materialService.js";
import { useToast } from "../components/Toast.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function RepUploadPage() {
  const { user } = useAuth();
  const navItems = repNavItemsFor(user);
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState({ title: "", description: "", courseId: "" });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const showToast = useToast();

  useEffect(() => { listCourses().then((cs) => { setCourses(cs); setForm((f) => ({ ...f, courseId: cs[0]?._id || "" })); }); }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title || !file) { showToast("Add a title and choose a file.", "error"); return; }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("courseId", form.courseId);
      fd.append("title", form.title);
      fd.append("description", form.description);
      fd.append("file", file);
      await uploadMaterial(fd);
      showToast("Material uploaded", "success");
      navigate("/");
    } catch (err) {
      showToast(err.message || "Upload failed", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell sidebarItems={navItems}>
      <div className="max-w-xl">
        <h1 className="text-2xl font-bold">Upload Material</h1>
        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          <Select value={form.courseId} onChange={(e) => setForm((f) => ({ ...f, courseId: e.target.value }))}>
            {courses.map((c) => <option key={c._id} value={c._id}>{c.code} — {c.title}{c.session ? ` (${c.session})` : ""}</option>)}
          </Select>
          <Input placeholder="Title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          <Textarea placeholder="Description" rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          <label className="flex items-center gap-2 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 px-4 py-6 text-sm cursor-pointer justify-center text-slate-500 dark:text-slate-400">
            <Upload className="w-4 h-4" /> {file?.name || "Choose a file to upload (PDF, PPT, DOC, XLS, image — max 50MB)"}
            <input type="file" className="hidden" onChange={(e) => setFile(e.target.files[0])} />
          </label>
          <Button type="submit" disabled={loading} className="w-full">{loading ? "Uploading..." : "Upload"}</Button>
        </form>
      </div>
    </AppShell>
  );
}
