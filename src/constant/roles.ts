export const ROLES = {
  ADMIN: "admin",
  EDITOR: "editor",
  WRITER: "writer",
  READER: "reader",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];
