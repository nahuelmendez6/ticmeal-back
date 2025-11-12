import { Body, 
  Controller, 
  Post, 
  UseGuards,
  Req,
  ForbiddenException} from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { CreateUserDto } from 'src/modules/users/dto/create.user.dto';
import { CreateCompanyDto } from 'src/modules/companies/dto/create.company.dto';
import { LoginDto } from '../dto/login.dto';
import { Public } from '../decorators/roles.decorators';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { User } from 'src/modules/users/entities/user.entity';

@Controller('auth')
export class AuthController {

    constructor(private readonly authService: AuthService) {}

  // ===================================================
  // Registro de empresa + admin (público)
  // ===================================================


    @Public()
    @Post('register-company')
    async registerCompany(@Body() body: {company: CreateCompanyDto; admin: CreateUserDto}) {
        return this.authService.registerCompany(body.company, body.admin);
    }

  // ===================================================
  // Login (público)
  // ===================================================


    @Public()
    @Post('login')
    async login(@Body() dto: LoginDto) {
        return this.authService.login(dto.username, dto.password);
    }

    // ===================================================
    //  Crear usuarios internos (solo admin de empresa)
    // ===================================================
    @UseGuards(JwtAuthGuard)
    @Post('register-diner')
    async registerDiner(
      @Req() req: Request & { user: User}, 
      @Body() dto: CreateUserDto
    ) {
      const currentUser = req.user as User;
      if (!currentUser) throw new ForbiddenException('Usuario no autenticado.')
      return this.authService.registerDiner(dto, currentUser);
    }

    @UseGuards(JwtAuthGuard)
    @Post('register-kitchen-admin')
    async registerKitchenAdmin(
      @Req() req: Request & { user: User}, 
      @Body() dto: CreateUserDto
    ) {
      const currentUser = req.user as User;
      if (!currentUser) throw new ForbiddenException('Usuario no autenticado.')
      return this.authService.registerKitchenAdmin(dto, currentUser);
    }

    @UseGuards(JwtAuthGuard)
    @Post('register-company-admin')
    async registerCompanyAdmin(
      @Req() req: Request & { user: User}, 
      @Body() dto: CreateUserDto
    ) {
      const currentUser = req.user as User;
      if (!currentUser) throw new ForbiddenException('Usuario no autenticado');
      return this.authService.registerCompanyAdmin(dto, currentUser);
    }

    @Public()
    @Post('verify-registration')
    async verifyRegistration(@Body() body: { email: string; code: string}) {
      return this.authService.verifyRegistration(body.email, body.code);
    }


}