import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { CreateUserDto } from 'src/modules/users/dto/create.user.dto';
import { CreateCompanyDto } from 'src/modules/companies/dto/create.company.dto';
import { LoginDto } from '../dto/login.dto';
import { Public } from '../decorators/roles.decorators';

@Controller('auth')
export class AuthController {

    constructor(private readonly authService: AuthService) {}

    @Public()
    @Post('register-company')
    async registerCompany(@Body() body: {company: CreateCompanyDto; admin: CreateUserDto}) {
        return this.authService.registerCompany(body.company, body.admin);
    }

    @Public()
    @Post('login')
    async login(@Body() dto: LoginDto) {
        return this.authService.login(dto.username, dto.password);
    }

}