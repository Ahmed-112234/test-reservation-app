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
      reservations.grade_level,
      reservations.program_type,
      reservations.credit_count,
      teachers.username
    FROM reservations
    JOIN teachers ON reservations.teacher_id = teachers.id
    ORDER BY reservations.test_date ASC
  `);

  response.json({ reservations: reservationList });
});

const reservationSchema = z.object({
  testDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  subjectName: z.string().min(1),
  gradeLevel: z.number().int().min(1).max(12),
  programType: z.string().optional(),
  creditCount: z.number().int().min(1)
});

/* This function checks if a reservation conflicts with another one. */
async function checkReservationConflict(
  database,
  testDate,
  creditCount,
  gradeLevel,
  programType,
  reservationIdToIgnore = null
) {
  const existingReservations = await database.all(
    `
      SELECT *
      FROM reservations
      WHERE test_date = ? AND credit_count = ?
    `,
    [testDate, creditCount]
  );

  for (const reservation of existingReservations) {
    if (reservationIdToIgnore && reservation.id === reservationIdToIgnore) {
      continue;
    }

    const newReservationIsSenior = gradeLevel === 11 || gradeLevel === 12;
    const existingReservationIsSenior =
      reservation.grade_level === 11 || reservation.grade_level === 12;

    if (newReservationIsSenior && existingReservationIsSenior) {
      if (reservation.program_type !== programType) {
        continue;
      }
    }

    return true;
  }

  return false;
}

/* This function creates a new reservation if the rules are valid. */
app.post("/reservations", checkLogin, async (request, response) => {
  const result = reservationSchema.safeParse(request.body);

  if (!result.success) {
    return response.status(400).json({ error: "Invalid reservation data" });
  }

  const { testDate, subjectName, gradeLevel, programType, creditCount } = result.data;

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
    const hasConflict = await checkReservationConflict(
      database,
      testDate,
      creditCount,
      gradeLevel,
      programType || null
    );

    if (hasConflict) {
      return response.status(409).json({
        error: "A test with the same credits is already reserved on this day"
      });
    }

    const insertResult = await database.run(
      `
        INSERT INTO reservations
        (teacher_id, test_date, subject_name, grade_level, program_type, credit_count)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        request.teacher.id,
        testDate,
        subjectName,
        gradeLevel,
        programType || null,
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
          reservations.grade_level,
          reservations.program_type,
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

  const { testDate, subjectName, gradeLevel, programType, creditCount } = result.data;
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

  const hasConflict = await checkReservationConflict(
    database,
    testDate,
    creditCount,
    gradeLevel,
    programType || null,
    reservationId
  );

  if (hasConflict) {
    return response.status(409).json({
      error: "A test with the same credits is already reserved on this day"
    });
  }

  await database.run(
    `
      UPDATE reservations
      SET test_date = ?, subject_name = ?, grade_level = ?, program_type = ?, credit_count = ?
      WHERE id = ?
    `,
    [
      testDate,
      subjectName,
      gradeLevel,
      programType || null,
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
        reservations.grade_level,
        reservations.program_type,
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