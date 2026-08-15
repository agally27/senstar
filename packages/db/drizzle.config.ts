import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/schema.ts',
  out: './migrations',
  dbCredentials: {
    // drizzle-kit is a dev tool; it reads the URL directly rather than via @senstar/config
    // because it runs outside the application boot path.
    url:
      process.env['DATABASE_URL'] ??
      'postgresql://senstar:senstar_local_dev@localhost:5432/senstar_dev',
  },
});
