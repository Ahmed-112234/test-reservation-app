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
      grade_level INTEGER NOT NULL,
      program_type TEXT,
      credit_count INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE
    );
  `);

  await addSampleTeachers();

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