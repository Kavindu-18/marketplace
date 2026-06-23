-- Initial migration: empty schema.
-- Extensions are provisioned by docker-entrypoint-initdb.d/01-extensions.sql
-- (PostGIS, pgvector) at container first-start, not in Prisma migrations,
-- because Prisma does not manage extensions.

-- This is a placeholder so `prisma migrate dev` has a baseline to work from.
-- Business tables will be added in subsequent migrations.
SELECT 1;
