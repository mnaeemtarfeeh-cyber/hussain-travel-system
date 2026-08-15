import jwt from "jsonwebtoken";

const JWT_SECRET: string = (() => {
  const value = process.env.JWT_SECRET;
  if (!value) throw new Error("JWT_SECRET environment variable is required");
  return value;
})();

export type TokenPayload = {
  userId: string;
  role: "ADMIN" | "AGENT" | "ACCOUNTANT";
};

export function signToken(payload: TokenPayload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as unknown as TokenPayload;
}
