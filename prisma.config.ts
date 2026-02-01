import "dotenv/config";
import { defineConfig } from "prisma/config";

const datasourceUrl =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@localhost:5432/tabscape?schema=public";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: datasourceUrl,
  },
});
