import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AdminUser } from './admin-user.entity';
import { CreateAdminDto } from './create-admin.dto';
import { LoginAdminDto } from './login-admin.dto';
import { AdminRole } from './admin-role.enum';

@Injectable()
export class AdminAuthService {
  constructor(
    @InjectRepository(AdminUser)
    private adminUserRepository: Repository<AdminUser>,
    private jwtService: JwtService,
  ) {}

  async register(createAdminDto: CreateAdminDto): Promise<AdminUser> {
    const { username, password, role } = createAdminDto;

    const existingUser = await this.adminUserRepository.findOne({
      where: { username },
    });
    if (existingUser) {
      throw new ConflictException('El administrador ya existe');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newAdmin = this.adminUserRepository.create({
      username,
      passwordHash,
      role: role ?? AdminRole.SUPER_ADMIN,
      isActive: true,
    });

    return this.adminUserRepository.save(newAdmin);
  }

  async validateUser(loginAdminDto: LoginAdminDto): Promise<AdminUser> {
    const { username, password } = loginAdminDto;

    // Necesitamos seleccionar el passwordHash explícitamente porque tiene select: false en la entidad
    const user = await this.adminUserRepository.findOne({
      where: { username },
      select: ['id', 'username', 'passwordHash', 'role', 'isActive'],
    });

    if (
      user &&
      user.isActive &&
      (await bcrypt.compare(password, user.passwordHash))
    ) {
      const { passwordHash, ...result } = user;
      return result as AdminUser;
    }

    throw new UnauthorizedException('Credenciales inválidas');
  }

  async login(user: AdminUser) {
    const payload = {
      username: user.username,
      sub: user.id,
      roles: user.role,
      isAdmin: true,
    };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
