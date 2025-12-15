import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { BackofficeUsersService } from './backoffice-users.service';
import { CreateUserDto } from './create-user.dto';
import { UpdateUserDto } from './update-user.dto';
import { AdminJwtAuthGuard } from '../admin_auth/admin-jwt-auth.guard';
import { RolesGuard } from '../admin_auth/roles.guard';
import { Roles } from '../admin_auth/roles.decorator';
import { AdminRole } from '../admin_auth/admin-role.enum';
import { Public } from '../../common/decorators/public.decorator';

@Public()
@Controller('backoffice/users')
@UseGuards(AdminJwtAuthGuard, RolesGuard)
@Roles(AdminRole.SUPER_ADMIN)
export class BackofficeUsersController {
  constructor(private readonly backofficeUsersService: BackofficeUsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.backofficeUsersService.create(createUserDto);
  }

  @Get()
  findAll() {
    return this.backofficeUsersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.backofficeUsersService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.backofficeUsersService.update(+id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.backofficeUsersService.remove(+id);
  }
}