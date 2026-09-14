import api from "./api.js";

export async function listCourses(filters = {}) {
  const res = await api.get("/courses", { params: filters });
  return res.data.courses;
}

export async function getCourse(id) {
  const res = await api.get(`/courses/${id}`);
  return res.data;
}

// Class Rep (or admin) adds a course.
export async function createCourse(data) {
  const res = await api.post("/courses", data);
  return res.data.course;
}

// Class Rep (or admin) edits a course.
export async function updateCourse(id, data) {
  const res = await api.put(`/courses/${id}`, data);
  return res.data.course;
}

// Course Rep, Class Rep (or admin) deletes a course.
export async function deleteCourse(id) {
  const res = await api.delete(`/courses/${id}`);
  return res.data;
}
