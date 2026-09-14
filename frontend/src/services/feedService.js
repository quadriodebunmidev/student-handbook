import api from "./api.js";

// A fresh AI-generated study tip, shown to students once per login.
export async function getStudyTip() {
  const res = await api.get("/feed/study-tip");
  return res.data.tip;
}

export async function getDashboard(sort = "recent") {
  const res = await api.get("/feed/dashboard", { params: { sort } });
  return res.data; // { courses, materials, scope }
}

export async function getExploreFeed(filters = {}) {
  const res = await api.get("/feed/explore", { params: filters });
  return res.data.courses;
}
