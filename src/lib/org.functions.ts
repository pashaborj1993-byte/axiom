import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { isOrgRole, normalizeInvite } from "@/lib/org-policy";
import type { OrgRole } from "@/lib/org-types";

function asText(value: unknown) {
  return typeof value === "string" ? value : "";
}

function cleanName(input: unknown) {
  if (!input || typeof input !== "object") throw new Error("Name the workspace");
  const name = asText((input as { name?: unknown }).name).trim().slice(0, 40);
  if (name.length < 2) throw new Error("Name the workspace");
  return name;
}

function cleanCode(input: unknown) {
  if (!input || typeof input !== "object") throw new Error("Enter the invite code");
  const code = normalizeInvite(asText((input as { code?: unknown }).code));
  if (code.length !== 8) throw new Error("Enter the invite code");
  return code;
}

function cleanRoleChange(input: unknown) {
  if (!input || typeof input !== "object") throw new Error("Choose a role");
  const raw = input as { userId?: unknown; role?: unknown };
  const userId = asText(raw.userId).slice(0, 80);
  if (!userId || !isOrgRole(raw.role)) throw new Error("Choose a role");
  return { userId, role: raw.role as OrgRole };
}

export const loadWorkspace = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { loadWorkspaceFor } = await import("./org-store.server");
    return loadWorkspaceFor(context.userId);
  });

export const createOrganization = createServerFn({ method: "POST" })
  .validator(cleanName)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const { createOrgFor } = await import("./org-store.server");
    return createOrgFor(context.userId, data);
  });

export const joinOrganization = createServerFn({ method: "POST" })
  .validator(cleanCode)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const { joinOrgFor } = await import("./org-store.server");
    return joinOrgFor(context.userId, data);
  });

export const leaveOrganization = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { leaveOrgFor } = await import("./org-store.server");
    return leaveOrgFor(context.userId);
  });

export const setMemberRole = createServerFn({ method: "POST" })
  .validator(cleanRoleChange)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const { setRoleFor } = await import("./org-store.server");
    return setRoleFor(context.userId, data);
  });

export const rotateInvite = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { rotateInviteFor } = await import("./org-store.server");
    return rotateInviteFor(context.userId);
  });

export const loadDesk = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { loadDeskFor } = await import("./org-store.server");
    return loadDeskFor(context.userId);
  });
