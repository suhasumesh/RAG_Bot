import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "Avaali1233456$";

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}
