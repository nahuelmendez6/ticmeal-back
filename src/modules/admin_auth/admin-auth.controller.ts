import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Request,
} from '@nestjs/common';
import { AdminAuthService } from './admin-auth.service';
import { CreateAdminDto } from './create-admin.dto';
import { LoginAdminDto } from './login-admin.dto';
import { AdminJwtAuthGuard } from './admin-jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';

@Public()
@Controller('backoffice/auth')
export class AdminAuthController {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  @Post('register')
  // @UseGuards(AdminJwtAuthGuard) // Descomentar si deseas que solo admins logueados creen otros admins
  async register(@Body() createAdminDto: CreateAdminDto) {
    return this.adminAuthService.register(createAdminDto);
  }

  @Post('login')
  async login(@Body() loginAdminDto: LoginAdminDto) {
    const user = await this.adminAuthService.validateUser(loginAdminDto);
    return this.adminAuthService.login(user);
  }

  @UseGuards(AdminJwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }
}
