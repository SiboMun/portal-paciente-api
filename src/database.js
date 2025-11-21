import pg from "pg";

export const pool = new pg.Pool({
  host: "aws-1-us-east-1.pooler.supabase.com",
  port: 6543,
  user: "postgres.gyqkjkpledxbsuraviuz",                     // tu usuario de supabase (completo)
  password: "aT4zJDZBDnKoWKLD",                    // tu clave BD
  database: "postgres",
  ssl: { rejectUnauthorized: false }
});
