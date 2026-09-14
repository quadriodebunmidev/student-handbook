import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Hash, Lock, Mail, Building2 } from "lucide-react";
import ThemeToggle from "../components/ThemeToggle.jsx";
import Button from "../components/Button.jsx";
import { Input, Select } from "../components/FormFields.jsx";
import { signup } from "../services/authService.js";
import BrandMark from "../components/BrandMark.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { APP_CONFIG, DEPARTMENTS, LEVELS, SEMESTERS, SESSIONS } from "../config/appConfig.js";
import { markStudyTipForNextLoad } from "../components/StudyTipModal.jsx";

export default function SignupPage() {
  const [form, setForm] = useState({ semester: SEMESTERS[0], session: SESSIONS[0] });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!form.matricNumber || !form.name || !form.department || !form.level || !form.session || !form.email || !form.password) {
      setError("Please fill in all fields."); return;
    }
    setLoading(true);
    try {
      const user = await signup({ ...form, level: Number(form.level) });
      markStudyTipForNextLoad();
      setUser(user);
      navigate("/");
    } catch (err) {
      setError(err.message || "Signup failed.");
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
            <p className="font-semibold">Create your student account</p>
            <Input icon={<Hash className="w-4 h-4" />} placeholder="Matric Number" onChange={(e) => update("matricNumber", e.target.value)} />
            <Input placeholder="Full Name" onChange={(e) => update("name", e.target.value)} />
            <Select icon={<Building2 className="w-4 h-4" />} onChange={(e) => update("department", e.target.value)} defaultValue="">
              <option value="" disabled>Select Department</option>
              {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </Select>
            <div className="grid grid-cols-2 gap-3">
              <Select onChange={(e) => update("level", e.target.value)} defaultValue="">
                <option value="" disabled>Level</option>
                {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
              </Select>
              <Select onChange={(e) => update("semester", e.target.value)} defaultValue={SEMESTERS[0]}>
                {SEMESTERS.map((s) => <option key={s} value={s}>{s}</option>)}
              </Select>
            </div>
            <Select onChange={(e) => update("session", e.target.value)} defaultValue={SESSIONS[0]}>
              {SESSIONS.map((s) => <option key={s} value={s}>{s} Session</option>)}
            </Select>
            <Input icon={<Mail className="w-4 h-4" />} type="email" placeholder="Email" onChange={(e) => update("email", e.target.value)} />
            <Input icon={<Lock className="w-4 h-4" />} type="password" placeholder="Password" onChange={(e) => update("password", e.target.value)} />
            {error && <p className="text-sm text-danger">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full">{loading ? "Creating account..." : "Sign Up"}</Button>
            <p className="text-center text-sm text-slate-500 dark:text-slate-400">Already have an account? <Link to="/login" className="text-primary font-medium">Log in</Link></p>
          </form>
        </div>
      </div>
    </div>
  );
}
