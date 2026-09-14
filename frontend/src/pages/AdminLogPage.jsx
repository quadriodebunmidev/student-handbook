import React, { useEffect, useState } from "react";
import AppShell from "./AppShell.jsx";
import { useAdminNavItems } from "./AdminDashboard.jsx";
import { InlineLoader } from "../components/Loader.jsx";
import { getActivityLog } from "../services/adminService.js";

export default function AdminLogPage() {
  const navItems = useAdminNavItems();
  const [log, setLog] = useState(null);

  useEffect(() => { getActivityLog().then(setLog); }, []);

  if (!log) return <AppShell sidebarItems={navItems}><InlineLoader /></AppShell>;

  return (
    <AppShell sidebarItems={navItems}>
      <h1 className="text-2xl font-bold">Activity Log</h1>
      <div className="mt-5 space-y-2">
        {log.map((a) => (
          <div key={a._id} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 text-sm flex justify-between">
            <span>{a.action}</span>
            <span className="text-slate-500 dark:text-slate-400">{new Date(a.createdAt).toLocaleString()}</span>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
