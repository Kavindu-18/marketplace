import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  // Never reject the request — returns the validated user if a valid JWT is present,
  // null otherwise. Errors (expired, malformed) are silently ignored.
  handleRequest<T = unknown>(_err: unknown, user: T): T {
    return (user || null) as T;
  }
}
