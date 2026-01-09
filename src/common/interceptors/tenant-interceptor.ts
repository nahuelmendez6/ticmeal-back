import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { TenantContextService } from '../context/tenant-context.service';

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  // Inyectamos el servicio que se encarga de obtener el tenantId desde la request
  constructor(private readonly tenantContext: TenantContextService) {}

  // Metodo obligatorio de la interfaz NestInterceptor
  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> {
    // Obrenemos el objeto request de Express (convertimos el contexto generico a uno HTTP)
    const req = context.switchToHttp().getRequest();

    // Usamos el servicio TenantContextService para extraer el tenantId desde el usuario autenticado
    const tenantId = this.tenantContext.getTenantIdFromRequest(req);

    // Si se encontró un tenantId, lo guardamos en la request para que esté disponible más adelante
    // (por ejemplo, en decoradores o controladores)
    if (tenantId) req.tenantId = tenantId;

    // contiuamos con el flujo normal de request hacia el controlador
    return next.handle();
  }
}
