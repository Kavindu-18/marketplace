import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { User } from '@prisma/client';
import { UsersService } from '../users/users.service';
import { JwtPayload } from './dto/jwt-payload.interface';
import { RegisterDto, LoginDto, TokensResponse, MeResponse } from '@marketplace/shared';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<TokensResponse> {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }
    const passwordHash = await argon2.hash(dto.password);
    const user = await this.usersService.create({
      email: dto.email,
      passwordHash,
      role: dto.role,
    });
    return this.issueAndStoreTokens(user);
  }

  async login(dto: LoginDto): Promise<TokensResponse> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const passwordValid = await argon2.verify(user.passwordHash, dto.password);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (user.status === 'SUSPENDED') {
      throw new UnauthorizedException('Account suspended');
    }
    return this.issueAndStoreTokens(user);
  }

  async refresh(rawRefreshToken: string): Promise<TokensResponse> {
    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify<JwtPayload>(rawRefreshToken, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user?.refreshTokenHash) {
      throw new UnauthorizedException('Session expired');
    }
    const isValid = await argon2.verify(user.refreshTokenHash, rawRefreshToken);
    if (!isValid) {
      throw new UnauthorizedException('Refresh token reuse detected');
    }

    return this.issueAndStoreTokens(user);
  }

  buildMeResponse(user: User): MeResponse {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt.toISOString(),
    };
  }

  private async issueAndStoreTokens(user: User): Promise<TokensResponse> {
    const tokens = this.signTokens(user);
    const hash = await argon2.hash(tokens.refreshToken);
    await this.usersService.updateRefreshTokenHash(user.id, hash);
    return tokens;
  }

  private signTokens(user: User): TokensResponse {
    const payload: JwtPayload = { sub: user.id, email: user.email, role: user.role };

    // ConfigService.get returns `string`; @nestjs/jwt v11 requires ms.StringValue (a
    // template-literal type). The runtime values are valid ms strings — cast is safe.
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.configService.get('JWT_ACCESS_EXPIRES_IN', '15m') as any,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d') as any,
    });
    /* eslint-enable @typescript-eslint/no-explicit-any */

    return { accessToken, refreshToken };
  }
}
