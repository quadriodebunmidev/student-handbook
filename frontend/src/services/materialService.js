import api from "./api.js";

export async function getMaterial(id) {
  const res = await api.get(`/materials/${id}`);
  return res.data.material;
}

export async function uploadMaterial(formData) {
  const res = await api.post("/materials", formData, { headers: { "Content-Type": "multipart/form-data" } });
  return res.data.material;
}

// Course Rep edits their own material's title/description.
export async function updateMaterial(id, data) {
  const res = await api.put(`/materials/${id}`, data);
  return res.data.material;
}

// Course Rep deletes their own material (or admin deletes any).
export async function deleteMaterial(id) {
  const res = await api.delete(`/materials/${id}`);
  return res.data;
}

export async function downloadMaterial(id) {
  const res = await api.post(`/materials/${id}/download`);
  return res.data; // { fileUrl, fileName }
}

// Actually triggers a browser "Save As" download instead of just opening the
// file in a new tab (which is all `window.open(fileUrl)` used to do, and
// which just previewed pdfs/images instead of downloading them). Fetches
// the file as a blob and saves it under its real filename.
export async function triggerFileDownload(fileUrl, fileName) {
  const res = await fetch(fileUrl);
  if (!res.ok) throw new Error("Couldn't download the file. Please try again.");
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = fileName || "download";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(objectUrl);
}

// Downloads a zip of every material passed in (defaults, server-side, to the
// student's whole dashboard feed if no ids are given) — powers the
// "Download all" button on the feed page.
export async function downloadAllMaterials(ids = []) {
  const res = await api.post("/materials/download-all", { ids }, { responseType: "blob" });
  const blob = res.data;
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = "lecturevault-materials.zip";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(objectUrl);
}

export async function toggleBookmark(id) {
  const res = await api.post(`/materials/${id}/bookmark`);
  return res.data.bookmarked;
}

export async function myMaterials() {
  const res = await api.get("/materials/mine");
  return res.data.materials;
}

export async function myBookmarks() {
  const res = await api.get("/materials/bookmarks/mine");
  return res.data.materials;
}

export async function searchMaterials(q) {
  const res = await api.get("/materials/search", { params: { q } });
  return res.data.materials;
}

export async function reportMaterial(id, reason) {
  const res = await api.post(`/materials/${id}/report`, { reason });
  return res.data.report;
}
