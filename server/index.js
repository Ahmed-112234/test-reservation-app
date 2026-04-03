import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { getDatabase } from "./db.js";
import { createToken, checkLogin } from "./auth.js";
import { addDays, formatDateOnly } from "./dateHelpers.js";

const app = express();
const portNumber = 4000;

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

/* This function returns a simple health check response. */
app.get("/health", (request, response) => {
  response.json({ message: "Server is working" });
});

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1)
});

/* This function logs in a teacher and returns a token. */
app.post("/auth/login", async (request, response) => {
  const result = loginSchema.safeParse(request.body);

  if (!result.success) {
    return response.status(400).json({ error: "Invalid login data" });
  }

  const { username, password } = result.data;
  const database = await getDatabase();

  const teacher = await database.get(
    "SELECT id, username, password_hash FROM teachers WHERE username = ?",
    [username]
  );

  if (!teacher) {
    return response.status(401).json({ error: "Wrong username or password" });
  }

  const correctPassword = await bcrypt.compare(password, teacher.password_hash);

  if (!correctPassword) {
    return response.status(401).json({ error: "Wrong username or password" });
  }

  const token = createToken(teacher);

  response.json({
    token,
    teacher: {
      id: teacher.id,
      username: teacher.username
    }
  });
});

/* This function returns details for the logged in teacher. */
app.get("/auth/me", checkLogin, async (request, response) => {
  const database = await getDatabase();

  const teacher = await database.get(
    "SELECT id, username FROM teachers WHERE id = ?",
    [request.teacher.id]
  );

  if (!teacher) {
    return response.status(404).json({ error: "Teacher not found" });
  }

  response.json({ teacher });
});

/* This function returns the allowed booking date range. */
app.get("/reservations/window", checkLogin, (request, response) => {
  const today = new Date();
  const firstAllowedDate = formatDateOnly(addDays(today, 7));
  const lastAllowedDate = formatDateOnly(addDays(today, 14));

  response.json({
    firstAllowedDate,
    lastAllowedDate
  });
});

/* This function returns all reservations for the shared calendar. */
app.get("/reservations", checkLogin, async (request, response) => {
  const database = await getDatabase();

  const reservationList = await database.all(`
    SELECT
      reservations.id,
      reservations.teacher_id,
      reservations.test_date,
      reservations.subject_name,
      reservations.section_name,
      reservations.grade_level,
      reservations.program_type,
      reservations.test_type,
      reservations.credit_count,
      teachers.username
    FROM reservations
    JOIN teachers ON reservations.teacher_id = teachers.id
    ORDER BY reservations.test_date ASC
  `);

  response.json({ reservations: reservationList });
});

/* This function returns all students with their enrolled subjects. */
app.get("/students", checkLogin, async (request, response) => {
  const database = await getDatabase();

  try {
    const studentRows = await database.all(`
      SELECT
        students.id,
        students.student_name,
        students.grade_level,
        students.section_name,
        students.program_type,
        COALESCE(GROUP_CONCAT(student_subjects.subject_name, '|||'), '') AS subjects_text
      FROM students
      LEFT JOIN student_subjects ON student_subjects.student_id = students.id
      GROUP BY
        students.id,
        students.student_name,
        students.grade_level,
        students.section_name,
        students.program_type
      ORDER BY students.student_name ASC
    `);

    const students = studentRows.map((student) => ({
      id: student.id,
      student_name: student.student_name,
      grade_level: student.grade_level,
      section_name: student.section_name,
      program_type: student.program_type,
      subjects: student.subjects_text ? student.subjects_text.split("|||") : []
    }));

    response.json({ students });
  } catch {
    response.status(500).json({ error: "Failed to load students" });
  }
});

const reservationSchema = z.object({
  testDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  subjectName: z.string().min(1),
  sectionName: z.string().min(1),
  gradeLevel: z.number().int().min(1).max(12),
  programType: z.string().optional(),
  testType: z.enum(["summative", "formative"]),
  creditCount: z.number().min(0.5).max(1)
});

/* This function gets student ids for a reservation based on subject, section, grade, and program. */
async function getStudentIdsForReservation(database, reservationData) {
  const { subjectName, sectionName, gradeLevel, programType } = reservationData;

  if (gradeLevel === 11 || gradeLevel === 12) {
    const rows = await database.all(
      `
        SELECT students.id
        FROM students
        JOIN student_subjects ON student_subjects.student_id = students.id
        WHERE students.grade_level = ?
          AND students.section_name = ?
          AND students.program_type = ?
          AND student_subjects.subject_name = ?
      `,
      [gradeLevel, sectionName, programType || null, subjectName]
    );

    return rows.map((row) => row.id);
  }

  const rows = await database.all(
    `
      SELECT students.id
      FROM students
      JOIN student_subjects ON student_subjects.student_id = students.id
      WHERE students.grade_level = ?
        AND students.section_name = ?
        AND student_subjects.subject_name = ?
    `,
    [gradeLevel, sectionName, subjectName]
  );

  return rows.map((row) => row.id);
}

/* This function checks whether two student lists overlap. */
function hasStudentOverlap(firstStudentIds, secondStudentIds) {
  const secondStudentSet = new Set(secondStudentIds);

  for (const studentId of firstStudentIds) {
    if (secondStudentSet.has(studentId)) {
      return true;
    }
  }

  return false;
}

/* This function checks whether a reservation breaks any booking rules. */
async function checkReservationConflict(
  database,
  newReservation,
  reservationIdToIgnore = null
) {
  const existingReservations = await database.all(
    `
      SELECT *
      FROM reservations
      WHERE test_date = ?
    `,
    [newReservation.testDate]
  );

  let totalCreditsForGradeForDay = 0;

  for (const reservation of existingReservations) {
    if (reservationIdToIgnore && reservation.id === reservationIdToIgnore) {
      continue;
    }

    if (Number(reservation.grade_level) !== Number(newReservation.gradeLevel)) {
      continue;
    }

    totalCreditsForGradeForDay += Number(reservation.credit_count);
  }

  if (totalCreditsForGradeForDay + Number(newReservation.creditCount) > 1.5) {
    return {
      hasConflict: true,
      message: `Grade ${newReservation.gradeLevel} has reached the maximum total of 1.5 credits for this day`
    };
  }

  const newReservationStudentIds = await getStudentIdsForReservation(database, newReservation);

  for (const reservation of existingReservations) {
    if (reservationIdToIgnore && reservation.id === reservationIdToIgnore) {
      continue;
    }

    const existingReservationStudentIds = await getStudentIdsForReservation(database, {
      subjectName: reservation.subject_name,
      sectionName: reservation.section_name,
      gradeLevel: reservation.grade_level,
      programType: reservation.program_type
    });

    const overlapExists = hasStudentOverlap(
      newReservationStudentIds,
      existingReservationStudentIds
    );

    if (overlapExists) {
      return {
        hasConflict: true,
        message: "This booking is not allowed because at least one student is in both classes on this day"
      };
    }
  }

  return {
    hasConflict: false,
    message: ""
  };
}

/* This function creates a new reservation if the rules are valid. */
app.post("/reservations", checkLogin, async (request, response) => {
  const result = reservationSchema.safeParse(request.body);

  if (!result.success) {
    return response.status(400).json({ error: "Invalid reservation data" });
  }

  const {
    testDate,
    subjectName,
    sectionName,
    gradeLevel,
    programType,
    testType,
    creditCount
  } = result.data;

  const today = new Date();
  const firstAllowedDate = formatDateOnly(addDays(today, 7));
  const lastAllowedDate = formatDateOnly(addDays(today, 14));

  if (testDate < firstAllowedDate) {
    return response.status(400).json({
      error: "Test date must be at least 7 days from today"
    });
  }

  if (testDate > lastAllowedDate) {
    return response.status(400).json({
      error: "Test date must be within 14 days from today"
    });
  }

  if ((gradeLevel === 11 || gradeLevel === 12) && !programType) {
    return response.status(400).json({
      error: "Program type is required for grade 11 and 12"
    });
  }

  const database = await getDatabase();

  try {
    const conflictResult = await checkReservationConflict(database, {
      testDate,
      subjectName,
      sectionName,
      gradeLevel,
      programType: programType || null,
      creditCount
    });

    if (conflictResult.hasConflict) {
      return response.status(409).json({
        error: conflictResult.message
      });
    }

    const insertResult = await database.run(
      `
        INSERT INTO reservations
        (teacher_id, test_date, subject_name, section_name, grade_level, program_type, test_type, credit_count)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        request.teacher.id,
        testDate,
        subjectName,
        sectionName,
        gradeLevel,
        programType || null,
        testType,
        creditCount
      ]
    );

    const newReservation = await database.get(
      `
        SELECT
          reservations.id,
          reservations.teacher_id,
          reservations.test_date,
          reservations.subject_name,
          reservations.section_name,
          reservations.grade_level,
          reservations.program_type,
          reservations.test_type,
          reservations.credit_count,
          teachers.username
        FROM reservations
        JOIN teachers ON reservations.teacher_id = teachers.id
        WHERE reservations.id = ?
      `,
      [insertResult.lastID]
    );

    response.status(201).json({ reservation: newReservation });
  } catch {
    response.status(500).json({ error: "Server error" });
  }
});

/* This function updates a reservation if it belongs to the logged in teacher. */
app.put("/reservations/:id", checkLogin, async (request, response) => {
  const reservationId = Number(request.params.id);

  if (!Number.isInteger(reservationId)) {
    return response.status(400).json({ error: "Invalid reservation id" });
  }

  const result = reservationSchema.safeParse(request.body);

  if (!result.success) {
    return response.status(400).json({ error: "Invalid reservation data" });
  }

  const {
    testDate,
    subjectName,
    sectionName,
    gradeLevel,
    programType,
    testType,
    creditCount
  } = result.data;

  const database = await getDatabase();

  const existingReservation = await database.get(
    "SELECT * FROM reservations WHERE id = ?",
    [reservationId]
  );

  if (!existingReservation) {
    return response.status(404).json({ error: "Reservation not found" });
  }

  if (existingReservation.teacher_id !== request.teacher.id) {
    return response.status(403).json({ error: "You can only edit your own reservation" });
  }

  const today = new Date();
  const firstAllowedDate = formatDateOnly(addDays(today, 7));
  const lastAllowedDate = formatDateOnly(addDays(today, 14));

  if (testDate < firstAllowedDate) {
    return response.status(400).json({
      error: "Test date must be at least 7 days from today"
    });
  }

  if (testDate > lastAllowedDate) {
    return response.status(400).json({
      error: "Test date must be within 14 days from today"
    });
  }

  if ((gradeLevel === 11 || gradeLevel === 12) && !programType) {
    return response.status(400).json({
      error: "Program type is required for grade 11 and 12"
    });
  }

  const conflictResult = await checkReservationConflict(
    database,
    {
      testDate,
      subjectName,
      sectionName,
      gradeLevel,
      programType: programType || null,
      creditCount
    },
    reservationId
  );

  if (conflictResult.hasConflict) {
    return response.status(409).json({
      error: conflictResult.message
    });
  }

  await database.run(
    `
      UPDATE reservations
      SET test_date = ?, subject_name = ?, section_name = ?, grade_level = ?, program_type = ?, test_type = ?, credit_count = ?
      WHERE id = ?
    `,
    [
      testDate,
      subjectName,
      sectionName,
      gradeLevel,
      programType || null,
      testType,
      creditCount,
      reservationId
    ]
  );

  const updatedReservation = await database.get(
    `
      SELECT
        reservations.id,
        reservations.teacher_id,
        reservations.test_date,
        reservations.subject_name,
        reservations.section_name,
        reservations.grade_level,
        reservations.program_type,
        reservations.test_type,
        reservations.credit_count,
        teachers.username
      FROM reservations
      JOIN teachers ON reservations.teacher_id = teachers.id
      WHERE reservations.id = ?
    `,
    [reservationId]
  );

  response.json({ reservation: updatedReservation });
});

/* This function deletes a reservation if it belongs to the logged in teacher. */
app.delete("/reservations/:id", checkLogin, async (request, response) => {
  const reservationId = Number(request.params.id);

  if (!Number.isInteger(reservationId)) {
    return response.status(400).json({ error: "Invalid reservation id" });
  }

  const database = await getDatabase();

  const reservation = await database.get(
    "SELECT id, teacher_id FROM reservations WHERE id = ?",
    [reservationId]
  );

  if (!reservation) {
    return response.status(404).json({ error: "Reservation not found" });
  }

  if (reservation.teacher_id !== request.teacher.id) {
    return response.status(403).json({ error: "You can only delete your own reservation" });
  }

  await database.run("DELETE FROM reservations WHERE id = ?", [reservationId]);

  response.json({ message: "Reservation deleted" });
});

/* This function starts the server after the database is ready. */
async function startServer() {
  await getDatabase();

  app.listen(portNumber, () => {
    console.log(`Server running on http://localhost:${portNumber}`);
  });
}

startServer();