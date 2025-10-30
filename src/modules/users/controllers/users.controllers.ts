import { Body, Controller, Get, Param, Post, Delete, UseGuards, Req } from '@nestjs/common';
import { UsersService } from '../services/user.service';
import { CreateUserDto } from '../dto/create.user.dto';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { Roles } from 'src/modules/auth/decorators/roles.decorators';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import type { Request } from 'express';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // company_admin puede crear usuarios de su empresa
  @Roles('company_admin', 'super_admin')
  @Post('create')
  async create(@Body() dto: CreateUserDto, @Req() req: Request) {
    const user: any = (req as any).user;
    if (user.role !== 'super_admin') {
      (dto as any).companyId = user.company?.id;
    }
    return this.usersService.createUser(dto as any);
  }

  // Lista usuarios del tenant; super_admin ve todos
  @Get()
  async list(@Req() req: Request) {
    const user: any = (req as any).user;
    if (user.role === 'super_admin') {
      return this.usersService.findAll();
    }
    return this.usersService.findAllByCompany(user.company.id);
  }

  // Obtener un usuario por id, restringido al tenant salvo super_admin
  @Get(':id')
  async getById(@Param('id') id: string, @Req() req: Request) {
    const userReq: any = (req as any).user;
    const found = await this.usersService.findById(Number(id));
    if (!found) return null;
    if (userReq.role !== 'super_admin' && found.company?.id !== userReq.company?.id) {
      return null;
    }
    return found;
  }

  // Eliminar usuario: company_admin puede eliminar solo de su tenant; super_admin cualquiera
  @Roles('company_admin', 'super_admin')
  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: Request) {
    const userReq: any = (req as any).user;
    const found = await this.usersService.findById(Number(id));
    if (!found) return { deleted: false };
    if (userReq.role !== 'super_admin' && found.company?.id !== userReq.company?.id) {
      return { deleted: false };
    }
    await this.usersService.remove(Number(id));
    return { deleted: true };
  }

  // Perfil del usuario autenticado
  @Get('profile/me')
  async profile(@Req() req: Request) {
    const user: any = (req as any).user;
    return this.usersService.findById(user.id);
  }
}