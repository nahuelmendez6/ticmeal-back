import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AdminJwtStrategy extends PassportStrategy(Strategy, 'admin-jwt') {
  constructor(private configService: ConfigService) {
    const secret = configService.get<string>('JWT_ADMIN_SECRET');
    if (!secret) {
      throw new Error('JWT_ADMIN_SECRET no está definido en las variables de entorno');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    })
  }

  async validate(payload: any) {
    // Validamos que el token pertenezca a un contexto de administración
    if (!payload.isAdmin) {
      throw new UnauthorizedException('Token no válido para backoffice');
    }

    // Retornamos el usuario adjunto al request. 
    // payload.roles debe venir en el token firmado al hacer login.
    return { userId: payload.sub, username: payload.username, roles: payload.roles };
  }
}