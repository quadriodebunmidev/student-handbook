import api from "./api.js";

export const listPendingReps = async () => (await api.get("/admin/reps/pending")).data.reps;
export const approveRep = async (id) => (await api.post(`/admin/reps/${id}/approve`)).data;
export const rejectRep = async (id, reason) => (await api.post(`/admin/reps/${id}/reject`, { reason })).data;
export const listUsers = async (search) => (await api.get("/admin/users", { params: { search } })).data.users;
export const toggleSuspendUser = async (id) => (await api.post(`/admin/users/${id}/suspend`)).data.user;
export const listAllMaterials = async () => (await api.get("/admin/materials")).data.materials;
export const removeMaterial = async (id) => (await api.delete(`/admin/materials/${id}`)).data;
export const listReports = async () => (await api.get("/admin/reports")).data.reports;
export const resolveReport = async (id) => (await api.post(`/admin/reports/${id}/resolve`)).data.report;
export const getActivityLog = async () => (await api.get("/admin/activity-log")).data.log;
export const getPlatformAnalytics = async () => (await api.get("/admin/analytics")).data;
