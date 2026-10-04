import test from "node:test";
import assert from "node:assert/strict";
import { validateFilters, validateMutationFilters, matchRow, resolveContainedPath } from "../recovery-guards.mjs";

test("recovery rejects update/delete without filters", () => {
  assert.throws(
    () => validateMutationFilters([], ["id", "title"], "delete"),
    /without a filter/
  );
  assert.throws(
    () => validateMutationFilters(undefined, ["id", "title"], "update"),
    /without a filter/
  );
});

test("recovery rejects invalid columns and operators", () => {
  assert.throws(
    () => validateFilters([{ column: "missing", op: "eq", value: 1 }], ["id"]),
    /Invalid filter column/
  );
  assert.throws(
    () => validateFilters([{ column: "id", op: "wat", value: 1 }], ["id"]),
    /Unsupported filter operator/
  );
});

test("recovery matching stays deterministic", () => {
  const row = { id: "a", title: "hello", tags: ["one", "two"] };
  assert.equal(matchRow(row, [{ column: "id", op: "eq", value: "a" }]), true);
  assert.equal(matchRow(row, [{ column: "id", op: "eq", value: "b" }]), false);
  assert.equal(matchRow(row, [{ column: "tags", op: "contains", value: ["two"] }]), true);
});

test("recovery paths cannot escape the storage root", () => {
  const root = "/tmp/audit2-storage";
  assert.doesNotThrow(() => resolveContainedPath(root, "memories/photo.jpg"));
  assert.throws(() => resolveContainedPath(root, "../database.json"), /escapes recovery root/);
  assert.throws(() => resolveContainedPath(root, "/etc/passwd"), /escapes recovery root/);
});
