import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  UsePipes,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiBody,
  ApiResponse,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { AuthenticatedUser } from './dto/authenticated-user.interface';
import {
  RegisterSchema,
  LoginSchema,
  RefreshSchema,
  RegisterDto,
  LoginDto,
  RefreshDto,
  TokensResponse,
  MeResponse,
} from '@marketplace/shared';
import { UsersService } from '../users/users.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a CUSTOMER or PROVIDER account' })
  @ApiBody({ schema: { example: { email: 'user@example.com', password: 'password123', role: 'CUSTOMER' } } })
  @ApiResponse({ status: 201, description: 'Returns access + refresh tokens' })
  @UsePipes(new ZodValidationPipe(RegisterSchema))
  register(@Body() dto: RegisterDto): Promise<TokensResponse> {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiBody({ schema: { example: { email: 'user@example.com', password: 'password123' } } })
  @ApiResponse({ status: 200, description: 'Returns access + refresh tokens' })
  @UsePipes(new ZodValidationPipe(LoginSchema))
  login(@Body() dto: LoginDto): Promise<TokensResponse> {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate tokens using a valid refresh token' })
  @ApiBody({ schema: { example: { refreshToken: '<refresh-jwt>' } } })
  @ApiResponse({ status: 200, description: 'Returns new access + refresh tokens' })
  @UsePipes(new ZodValidationPipe(RefreshSchema))
  refresh(@Body() dto: RefreshDto): Promise<TokensResponse> {
    return this.authService.refresh(dto.refreshToken);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the authenticated user profile' })
  @ApiResponse({ status: 200, description: 'Current user data' })
  async me(@CurrentUser() user: AuthenticatedUser): Promise<MeResponse> {
    const full = await this.usersService.findById(user.id);
    return this.authService.buildMeResponse(full!);
  }

  @Get('admin-test')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin-only test endpoint' })
  @ApiResponse({ status: 200, description: 'Confirms ADMIN role access' })
  @ApiResponse({ status: 403, description: 'Forbidden for non-admins' })
  adminTest(): { message: string } {
    return { message: 'Admin access confirmed' };
  }
}
