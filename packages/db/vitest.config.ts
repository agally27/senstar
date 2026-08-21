import { defineConfig } from 'vitest/config';

/**
 * These suites are integration tests against one real database: each rebuilds
 * the schema from empty (`drop schema public cascade`) so migrations are proven
 * to construct the world from scratch. Run in parallel they corrupt each other.
 *
 * Serialising the files is the correct fix rather than sharing fixtures — the
 * from-empty rebuild is the property under test.
 */
export default defineConfig({
  test: {
    fileParallelism: false,
  },
});
