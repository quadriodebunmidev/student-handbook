import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Hash, Lock, Mail, Building2 } from "lucide-react";
import ThemeToggle from "../components/ThemeToggle.jsx";
import BrandMark from "../components/BrandMark.jsx";
import Button from "../components/Button.jsx";
import { Input, Select, Textarea } from "../components/FormFields.jsx";
import { repSignup } from "../services/authService.js";
import { APP_CONFIG, DEPARTMENTS, SESSIONS } from "../config/appConfig.js";

export default function RepSignupPage() {
  const [form, setForm] = useState({ session: SESSIONS[0], repType: "course" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!form.matricNumber || !form.name || !form.department || !form.email || !form.password) {
      setError("Please fill in all required fields."); return;
    }
    setLoading(true);
    try {
      await repSignup(form);
      navigate("/rep-pending");
    } catch (err) {
      setError(err.message || "Application failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-4 py-10 bg-slate-50 dark:bg-slate-950">
      <ThemeToggle className="fixed top-5 right-5" />
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 justify-center mb-6">
          <BrandMark className="h-11 w-11" />
          <p className="text-xl font-bold">{APP_CONFIG.name}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <form onSubmit={handleSubmit} className="space-y-3">
            <p className="font-semibold">Apply to become a Rep</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">Applications are reviewed by an admin before you get Rep access.</p>
            <div>
              <label className="block text-xs mb-1.5 font-medium text-slate-500 dark:text-slate-400">What kind of Rep?</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => update("repType", "course")}
                  className={`rounded-xl border px-3 py-2.5 text-left text-sm transition-colors ${form.repType === "course" ? "border-primary bg-primary/10" : "border-slate-200 dark:border-slate-700"}`}
                >
                  <p className="font-medium">Course Rep</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Upload, edit &amp; manage materials</p>
                </button>
                <button
                  type="button"
                  onClick={() => update("repType", "class")}
                  className={`rounded-xl border px-3 py-2.5 text-left text-sm transition-colors ${form.repType === "class" ? "border-primary bg-primary/10" : "border-slate-200 dark:border-slate-700"}`}
                >
                  <p className="font-medium">Class Rep</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Add &amp; edit courses</p>
                </button>
              </div>
            </div>
            <Input placeholder="Full Name" onChange={(e) => update("name", e.target.value)} />
            <Input icon={<Mail className="w-4 h-4" />} type="email" placeholder="Email" onChange={(e) => update("email", e.target.value)} />
            <Input icon={<Hash className="w-4 h-4" />} placeholder="Matric Number" onChange={(e) => update("matricNumber", e.target.value)} />
            <Select icon={<Building2 className="w-4 h-4" />} onChange={(e) => update("department", e.target.value)} defaultValue="">
              <option value="" disabled>Select Department</option>
              {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </Select>
            <Input placeholder="Level / Course(s) you represent (e.g. 100L, CSC101)" onChange={(e) => update("repCourses", e.target.value)} />
            <Select onChange={(e) => update("session", e.target.value)} defaultValue={SESSIONS[0]}>
              {SESSIONS.map((s) => <option key={s} value={s}>{s} Session</option>)}
            </Select>
            <Input icon={<Lock className="w-4 h-4" />} type="password" placeholder="Password" onChange={(e) => update("password", e.target.value)} />
            <Textarea placeholder="Why are you applying? (optional)" rows={2} onChange={(e) => update("repNote", e.target.value)} />
            {error && <p className="text-sm text-danger">{error}</p>}
            <Button type="submit" variant="secondary" disabled={loading} className="w-full">{loading ? "Submitting..." : "Submit Application"}</Button>
            <p className="text-center text-sm"><Link to="/login" className="text-primary font-medium">Back to login</Link></p>
          </form>
        </div>
      </div>
    </div>
  );
}
