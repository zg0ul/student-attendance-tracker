import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  doublePrecision,
  serial,
  unique,
} from "drizzle-orm/pg-core";

/* ---------- better-auth tables (with admin plugin fields) ----------
 * The `user` table doubles as the professor store. role: 'admin' | 'professor'.
 * `banned` is reused as the "inactive" flag (admin can deactivate a professor).
 */
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  role: text("role").default("professor"),
  banned: boolean("banned").default(false),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  impersonatedBy: text("impersonated_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

/* ---------- Application tables ---------- */

// Enrolment roster. Names are looked up from here — students never type them.
export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  studentId: text("student_id").notNull().unique(),
  name: text("name").notNull(),
});

// 1..(days*periods). Generated from settings; label is optional/editable.
export const sessions = pgTable("sessions", {
  sessionNumber: integer("session_number").primaryKey(),
  day: integer("day").notNull(),
  period: integer("period").notNull(),
  label: text("label"),
});

export const attendance = pgTable(
  "attendance",
  {
    id: serial("id").primaryKey(),
    sessionNumber: integer("session_number").notNull(),
    day: integer("day").notNull(),
    period: integer("period").notNull(),
    studentId: text("student_id").notNull(),
    studentName: text("student_name"),
    professorId: text("professor_id"),
    professorName: text("professor_name"),
    deviceId: text("device_id"),
    distanceM: integer("distance_m"),
    status: text("status").notNull(), // 'OK' | 'NOT_IN_ROSTER'
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [unique("uniq_session_student").on(t.sessionNumber, t.studentId)],
);

// Singleton config row (id = 1). SHARED_SECRET lives in env, not here.
export const settings = pgTable("settings", {
  id: integer("id").primaryKey().default(1),
  requireGeo: boolean("require_geo").notNull().default(false),
  classLat: doublePrecision("class_lat").notNull().default(31.9421),
  classLng: doublePrecision("class_lng").notNull().default(35.873),
  geoRadiusM: integer("geo_radius_m").notNull().default(200),
  tokenWindowSeconds: integer("token_window_seconds").notNull().default(60),
  tokenGraceWindows: integer("token_grace_windows").notNull().default(1),
  maxCheckinsPerDevice: integer("max_checkins_per_device").notNull().default(1),
  days: integer("days").notNull().default(10),
  periods: integer("periods").notNull().default(3),
});

export type Settings = typeof settings.$inferSelect;
export type Student = typeof students.$inferSelect;
export type Attendance = typeof attendance.$inferSelect;
export type SessionRow = typeof sessions.$inferSelect;
