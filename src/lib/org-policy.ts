import { ORG_ROLES, type OrgRole } from "./org-types";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function isOrgRole(value: unknown): value is OrgRole {
  return ORG_ROLES.includes(value as OrgRole);
}

export function canManage(role: OrgRole) {
  return role === "owner" || role === "admin";
}

/**
 * An actor may change someone else's role. Owners are only appointed or
 * removed by an owner. Nobody edits their own role.
 */
export function roleChangeAllowed(
  actor: OrgRole,
  actorId: string,
  targetId: string,
  target: OrgRole,
  next: OrgRole,
) {
  if (actorId === targetId) return false;
  if (next === target) return false;
  if (actor === "learner") return false;
  if (target === "owner" || next === "owner") return actor === "owner";
  return true;
}

/** Demoting the last owner would leave the workspace with nobody in charge. */
export function keepsAnOwner(ownerCount: number, target: OrgRole, next: OrgRole) {
  if (target !== "owner" || next === "owner") return true;
  return ownerCount > 1;
}

export function slugify(name: string) {
  const base = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return base || "workspace";
}

export function inviteCode(bytes: Uint8Array) {
  let out = "";
  for (let i = 0; i < 8; i++) out += ALPHABET[bytes[i]! % ALPHABET.length];
  return out;
}

export function normalizeInvite(input: string) {
  return input.toUpperCase().replace(/[^A-Z2-9]/g, "").slice(0, 8);
}

export function formatInvite(code: string) {
  return `${code.slice(0, 4)}-${code.slice(4)}`;
}
