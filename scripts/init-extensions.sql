-- Runs automatically on first container start via docker-entrypoint-initdb.d.
-- Image: custom build on postgis/postgis:16-3.4 + postgresql-16-pgvector.

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;
CREATE EXTENSION IF NOT EXISTS vector;
