import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";

function cleanReport(input: unknown) {
  if (!input || typeof input !== "object") throw new Error("Describe the problem");
  const raw = input as { message?: unknown; page?: unknown };
  const message = typeof raw.message === "string" ? raw.message.trim().slice(0, 2000) : "";
  const page = typeof raw.page === "string" ? raw.page.trim().slice(0, 120) : "";
  if (message.length < 8) throw new Error("Describe the problem in a sentence");
  return { message, page };
}

function cleanStatus(input: unknown) {
  if (!input || typeof input !== "object") throw new Error("Choose a status");
  const raw = input as { id?: unknown; status?: unknown };
  const id = typeof raw.id === "string" ? raw.id.slice(0, 80) : "";
  if (!id || (raw.status !== "open" && raw.status !== "fixed")) throw new Error("Choose a status");
  return { id, status: raw.status as "open" | "fixed" };
}

export const reportBug = createServerFn({ method: "POST" })
  .validator(cleanReport)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const { fileBug } = await import("./bugs-store.server");
    return fileBug(context.userId, data.message, data.page);
  });

export const loadBugs = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { listBugs } = await import("./bugs-store.server");
    return listBugs(context.userId);
  });

export const markBug = createServerFn({ method: "POST" })
  .validator(cleanStatus)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const { setBugStatus } = await import("./bugs-store.server");
    return setBugStatus(context.userId, data.id, data.status);
  });
