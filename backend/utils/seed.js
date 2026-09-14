// Run with: npm run seed
// Seeds a demo admin, an active course rep, a pending rep application,
// a demo student, and the sample courses/materials from the project guide.
import bcrypt from "bcryptjs";
import { connectDB } from "../config/db.js";
import User from "../models/User.js";
import Course from "../models/Course.js";
import Material from "../models/Material.js";
import mongoose from "mongoose";

const SESSION = "2025/2026";

async function seed() {
  await connectDB();

  await Promise.all([User.deleteMany({}), Course.deleteMany({}), Material.deleteMany({})]);

  const password = await bcrypt.hash("demo123", 10);
  const adminPassword = await bcrypt.hash("admin123", 10);

  const admin = await User.create({ name: "Admin User", email: "admin@demo.edu", password: adminPassword, role: "admin" });
  const rep = await User.create({
    name: "John Okafor", email: "john@demo.edu", password, matricNumber: "CSC/18/0098",
    department: "Computer Science", level: 100, session: SESSION, repCourses: "CSC101, CSC102, CSC201", role: "rep", repStatus: "active", repType: "course",
  });
  await User.create({
    name: "Grace Udo", email: "grace@demo.edu", password, matricNumber: "ACC/20/0451",
    department: "Accounting", role: "rep", repStatus: "pending", repCourses: "ACC101", session: SESSION, repType: "course",
    repNote: "I'm the class representative and can keep materials current for our set.",
  });
  await User.create({
    name: "Tunde Balogun", email: "tunde@demo.edu", password, matricNumber: "CSC/18/0077",
    department: "Computer Science", level: 100, session: SESSION, role: "rep", repStatus: "active", repType: "class",
    repNote: "Class rep for CSC 100L — keeping the course list up to date.",
  });
  await User.create({
    name: "Aisha Bello", email: "aisha@demo.edu", password, matricNumber: "CSC/19/1234",
    department: "Computer Science", level: 100, semester: "First Semester", session: SESSION, role: "student",
  });

  const courses = await Course.insertMany([
    { code: "CSC101", title: "Introduction to Programming", department: "Computer Science", level: 100, semester: "First Semester", session: SESSION },
    { code: "CSC102", title: "Introduction to Computer Science", department: "Computer Science", level: 100, semester: "First Semester", session: SESSION },
    { code: "MTH101", title: "Elementary Mathematics I", department: "Computer Science", level: 100, semester: "First Semester", session: SESSION },
    { code: "CSC201", title: "Data Structures & Algorithms", department: "Computer Science", level: 200, semester: "First Semester", session: SESSION },
    { code: "ACC101", title: "Principles of Accounting I", department: "Accounting", level: 100, semester: "First Semester", session: SESSION },
    { code: "MCM101", title: "Introduction to Mass Communication", department: "Mass Communication", level: 100, semester: "First Semester", session: SESSION },
    // A prior session too, so the session filter/sort has something to show.
    { code: "CSC101", title: "Introduction to Programming", department: "Computer Science", level: 100, semester: "First Semester", session: "2024/2025" },
  ]);

  await Material.insertMany([
    { courseId: courses[0]._id, uploadedBy: rep._id, title: "Lecture 1 — Introduction to Programming Concepts", description: "Overview of programming basics, variables and control flow.", fileUrl: "https://example.com/lecture1.pptx", fileName: "Lecture1.pptx", fileType: "pptx", size: "3.4 MB" },
    { courseId: courses[0]._id, uploadedBy: rep._id, title: "Assignment 1 Guide — Flowcharts & Pseudocode", description: "Step-by-step guide for the first assignment.", fileUrl: "https://example.com/assignment1.pdf", fileName: "Assignment1.pdf", fileType: "pdf", size: "850 KB" },
    { courseId: courses[1]._id, uploadedBy: rep._id, title: "Number Systems & Binary Arithmetic", description: "Binary, octal, hexadecimal conversions with examples.", fileUrl: "https://example.com/numbers.pdf", fileName: "Numbers.pdf", fileType: "pdf", size: "2.0 MB" },
  ]);

  console.log("✅ Seed complete. Demo logins: admin@demo.edu / admin123, john@demo.edu / demo123 (course rep), tunde@demo.edu / demo123 (class rep), aisha@demo.edu / demo123 (student)");
  await mongoose.disconnect();
}

seed().catch((err) => { console.error(err); process.exit(1); });
