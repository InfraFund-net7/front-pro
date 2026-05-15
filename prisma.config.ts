import { defineConfig } from 'prisma/config';

const datasourceUrl =
  process.env.DATABASE_URL ??
  'postgresql://postgres:postgres@localhost:5432/infrafund';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: datasourceUrl,
  },
});
