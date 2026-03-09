import jwt from "jsonwebtoken";

const secretKey = "simple_secret_key_for_school_project";

/* This function creates a login token for a teacher. */
export function createToken(teacher) {
  return jwt.sign(
    {
      id: teacher.id,
      username: teacher.username
    },
    secretKey,
    { expiresIn: "7d" }
  );
}

/* This function checks if the user is logged in before using protected routes. */
export function checkLogin(request, response, next) {
  const authHeader = request.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return response.status(401).json({ error: "Login required" });
  }

  try {
    const teacherData = jwt.verify(token, secretKey);
    request.teacher = teacherData;
    next();
  } catch {
    return response.status(401).json({ error: "Invalid token" });
  }
}