import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bookmark } from "lucide-react";
import AppShell from "./AppShell.jsx";
import { studentNavItems } from "./StudentDashboard.jsx";
import MaterialCard from "../components/MaterialCard.jsx";
import EmptyState from "../components/EmptyState.jsx";
import { InlineLoader } from "../components/Loader.jsx";
import { myBookmarks } from "../services/materialService.js";

export default function BookmarksPage() {
  const [materials, setMaterials] = useState(null);
  const navigate = useNavigate();

  useEffect(() => { myBookmarks().then(setMaterials); }, []);

  return (
    <AppShell sidebarItems={studentNavItems}>
      <h1 className="text-2xl font-bold">Bookmarks</h1>
      {!materials ? <InlineLoader /> : (
        <div className="mt-6 grid sm:grid-cols-2 gap-4">
          {materials.map((m) => (
            <MaterialCard key={m._id} material={m} isBookmarked onOpen={() => navigate(`/material/${m._id}`)} />
          ))}
          {materials.length === 0 && <EmptyState icon={<Bookmark className="w-8 h-8" />} title="No bookmarks yet" message="Save materials for quick access later." />}
        </div>
      )}
    </AppShell>
  );
}
