export type ApiStatus = 'ok' | 'error';

export interface HealthResponse {
  status: ApiStatus;
  db: ApiStatus;
}
