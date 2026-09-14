import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Sidebar from "../components/Sidebar.jsx";
import MobileTabBar from "../components/MobileTabBar.jsx";
import MaterialCard from "../components/MaterialCard.jsx";
import EmptyState from "../components/EmptyState.jsx";
import { CardSkeleton } from "../components/Loader.jsx";
import PwaPrompts, { OfflineBanner } from "../components/PwaPrompts.jsx";
import { Search } from "lucide-react";
import { searchMaterials } from "../services/materialService.js";

// Shared shell for every logged-in role: offline banner, top nav with global
// search, role-specific sidebar (bottom tabs on mobile) and the PWA surfaces.
export default function AppShell({ sidebarItems, children }) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!search.trim()) {
      setResults(null);
      return;
    }
    setLoading(true);
    const t = setTimeout(() => {
      searchMaterials(search)
        .then(setResults)
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <OfflineBanner />
      <Navbar search={search} setSearch={setSearch} />

      <div className="mx-auto flex max-w-7xl">
        {sidebarItems && <Sidebar items={sidebarItems} />}
        <main className="min-w-0 flex-1 px-4 pb-28 pt-6 sm:px-6 lg:pb-10">
          {search.trim() ? (
            <div className="animate-rise-in">
              <p className="mb-4 text-sm lv-meta">
                {loading ? "Searching..." : `${results?.length || 0} result(s) for "${search}"`}
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                {loading ? (
                  <CardSkeleton count={4} />
                ) : (
                  <>
                    {results?.map((m) => (
                      <MaterialCard
                        key={m._id}
                        material={m}
                        onOpen={() => {
                          setSearch("");
                          navigate(`/material/${m._id}`);
                        }}
                      />
                    ))}
                    {results?.length === 0 && (
                      <EmptyState
                        icon={<Search className="h-7 w-7" />}
                        title="No matches"
                        message="Try the course code instead of the full title, or check a different session."
                      />
                    )}
                  </>
                )}
              </div>
            </div>
          ) : (
            children
          )}
        </main>
      </div>

      {sidebarItems && <MobileTabBar items={sidebarItems} />}
      <PwaPrompts />
    </div>
  );
}
