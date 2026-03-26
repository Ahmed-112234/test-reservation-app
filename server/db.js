import sqlite3 from "sqlite3";
import { open } from "sqlite";
import bcrypt from "bcryptjs";

let database;

export async function getDatabase() {
  if (database) {
    return database;
  }

  database = await open({
    filename: "./data.sqlite",
    driver: sqlite3.Database,
  });

  await database.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS teachers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reservations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      teacher_id INTEGER NOT NULL,
      test_date TEXT NOT NULL,
      subject_name TEXT NOT NULL,
      section_name TEXT NOT NULL,
      grade_level INTEGER NOT NULL,
      program_type TEXT,
      test_type TEXT NOT NULL,
      credit_count REAL NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_name TEXT NOT NULL,
      grade_level INTEGER NOT NULL,
      section_name TEXT NOT NULL,
      program_type TEXT
    );

    CREATE TABLE IF NOT EXISTS student_subjects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      subject_name TEXT NOT NULL,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    );
  `);

  await addSampleTeachers();
  await addSampleStudents();

  return database;
}

/* This function adds sample teachers the first time the app runs. */
async function addSampleTeachers() {
  const teacherCount = await database.get("SELECT COUNT(*) AS count FROM teachers");

  if (teacherCount.count > 0) {
    return;
  }

  const sampleTeachers = [
    { username: "FatimaMansoori", password: "Pass1234!" },
    { username: "JohnGillooley", password: "Word!4321" }
  ];

  for (const teacher of sampleTeachers) {
    const hashedPassword = await bcrypt.hash(teacher.password, 10);

    await database.run(
      "INSERT INTO teachers (username, password_hash) VALUES (?, ?)",
      [teacher.username, hashedPassword]
    );
  }
}

/* This function adds a sample student list and subject enrolments. */
async function addSampleStudents() {
  const studentCount = await database.get("SELECT COUNT(*) AS count FROM students");

  if (studentCount.count > 0) {
    return;
  }

  const sampleStudents = [
    {
      studentName: "Ali Hasan",
      gradeLevel: 11,
      sectionName: "A",
      programType: "IB",
      subjects: [
        "Arabic B",
        "Economics",
        "English Lang-Lit",
        "Math Applications & Int.",
        "Theory of Knowledge"
      ]
    },
    {
      studentName: "Sara Ahmed",
      gradeLevel: 11,
      sectionName: "A",
      programType: "IB",
      subjects: [
        "Arabic B",
        "Business Manag.",
        "English Lang-Lit",
        "Math Applications & Int.",
        "Theory of Knowledge"
      ]
    },
    {
      studentName: "Omar Khalid",
      gradeLevel: 11,
      sectionName: "A",
      programType: "High School",
      subjects: [
        "Computer Science",
        "Islamic Studies",
        "National-Social Studies",
        "PE"
      ]
    },
    {
      studentName: "Mariam Yusuf",
      gradeLevel: 11,
      sectionName: "A",
      programType: "High School",
      subjects: [
        "Business Manag.",
        "English Lang-Lit",
        "National-Social Studies",
        "PE"
      ]
    },
    {
      studentName: "Fatima Noor",
      gradeLevel: 10,
      sectionName: "A",
      programType: null,
      subjects: [
        "Integrated Science",
        "Mathematics",
        "English Lang-Lit",
        "Arabic literature"
      ]
    },
    {
      studentName: "Ahmed Salem",
      gradeLevel: 10,
      sectionName: "A",
      programType: null,
      subjects: [
        "Integrated Humanities",
        "Mathematics",
        "English Lang-Lit",
        "Biology MYP"
      ]
    },
    {
      studentName: "Lina Hassan",
      gradeLevel: 12,
      sectionName: "A",
      programType: "IB",
      subjects: [
        "Economics",
        "English Lang-Lit",
        "Theory of Knowledge"
      ]
    },
    {
      studentName: "Khalid Jasim",
      gradeLevel: 12,
      sectionName: "A",
      programType: "High School",
      subjects: [
        "Computer Science",
        "National-Social Studies",
        "PE"
      ]
    }
  ];

  for (const student of sampleStudents) {
    const insertResult = await database.run(
      `
        INSERT INTO students (student_name, grade_level, section_name, program_type)
        VALUES (?, ?, ?, ?)
      `,
      [
        student.studentName,
        student.gradeLevel,
        student.sectionName,
        student.programType
      ]
    );

    for (const subjectName of student.subjects) {
      await database.run(
        `
          INSERT INTO student_subjects (student_id, subject_name)
          VALUES (?, ?)
        `,
        [insertResult.lastID, subjectName]
      );
    }
  }
}