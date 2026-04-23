import { beforeEach } from "node:test";
import { resetDatabasePoolForTests } from "../src/lib/db.ts";

beforeEach(() => {
  // Keep test isolation stable when individual suites mutate env vars.
  resetDatabasePoolForTests();
});
