import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

@Injectable()
export class TenantGuard implements CanActivate {
  // metodo principal del guard: se ejecuta antes de entrar al controlador
  canActivate(context: ExecutionContext): boolean {
    // obtenemos el objeto request de express (a patir del contexto HTTP de nest)
    const req = context.switchToHttp().getRequest();

    // el usuario autenticado (agregado previamente por el JwtAuthGuard)
    const user = req.user;

    // obtenemos el paramatro "companyId" de la URL (si existe)
    // Ejemplo: /companies/12/users  =>  companyId = 12
    const paramCompanyId = req.params?.companyId
      ? Number(req.params.companyId)
      : undefined;

    // si la ruta no incluye un companyId no hay nada que validar (rutas de perfil por ejemplo)
    if (!paramCompanyId) return true;

    // los super_admin tienen acceso global a todos los tenants
    if (user.role === 'super_admin') return true;

    // Verificamos que el usuario pertenezca al mismo tenant (empresa)
    // Comprobamos tanto user.company.id (si está cargado el objeto completo)
    // como user.companyId (si solo tenemos el ID).
    if (user.company?.id !== paramCompanyId) {
      // Si no coincide, lanzamos 403
      throw new ForbiddenException('No tienes acceso a ese tenant');
    }

    // si pasa todas las validaciones, permitimos el acceso al controlador
    return true;
  }
}
