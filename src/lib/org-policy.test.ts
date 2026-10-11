import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canManage,
  formatInvite,
  inviteCode,
  keepsAnOwner,
  normalizeInvite,
  roleChangeAllowed,
  slugify,
} from "./org-policy.ts";

describe("workspace roles", () => {
  it("lets owners appoint another owner and stops admins from doing it", () => {
    assert.equal(roleChangeAllowed("owner", "a", "b", "admin", "owner"), true);
    assert.equal(roleChangeAllowed("admin", "a", "b", "learner", "owner"), false);
    assert.equal(roleChangeAllowed("admin", "a", "b", "owner", "admin"), false);
    assert.equal(roleChangeAllowed("admin", "a", "b", "learner", "admin"), true);
    assert.equal(roleChangeAllowed("learner", "a", "b", "learner", "admin"), false);
  });

  it("refuses a member changing their own role", () => {
    assert.equal(roleChangeAllowed("owner", "a", "a", "owner", "admin"), false);
  });

  it("keeps at least one owner", () => {
    assert.equal(keepsAnOwner(1, "owner", "admin"), false);
    assert.equal(keepsAnOwner(2, "owner", "learner"), true);
    assert.equal(keepsAnOwner(1, "admin", "learner"), true);
  });

  it("treats owners and admins as managers", () => {
    assert.equal(canManage("owner"), true);
    assert.equal(canManage("admin"), true);
    assert.equal(canManage("learner"), false);
  });
});

describe("workspace names and invites", () => {
  it("slugs a company name", () => {
    assert.equal(slugify("Acme AI Lab"), "acme-ai-lab");
    assert.equal(slugify("!!!"), "workspace");
  });

  it("builds an 8-character code and accepts a dashed copy", () => {
    const code = inviteCode(Uint8Array.from([0, 1, 2, 3, 4, 5, 6, 7]));
    assert.equal(code.length, 8);
    assert.equal(normalizeInvite(formatInvite(code).toLowerCase()), code);
    assert.equal(normalizeInvite("ab-cd ef"), "ABCDEF");
  });
});
