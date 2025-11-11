// src/modules/auth/jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../users/services/user.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private usersService: UsersService,
    private configService: ConfigService,
  ) {
    super({
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        ignoreExpiration: false,
        secretOrKey: configService.get<string>('JWT_SECRET') || 'default_secret_key', // evita undefined
    });
  }

  async validate(payload: any) {
    // Cargar el usuario con la relación company para que esté disponible en el contexto
    // Usar findById que carga las relaciones por defecto
    const user = await this.usersService.findById(payload.sub);
    if (!user) return null;
    
    // El usuario ya tiene la relación company cargada gracias a findById
    // Si por alguna razón no está cargada, TypeORM la manejará correctamente
    // ya que la relación está definida en la entidad
    return user; // Se agrega al request como req.user
  }
}
