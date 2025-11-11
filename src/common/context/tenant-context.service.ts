import { Injectable, ForbiddenException } from "@nestjs/common";
import { Request } from "@nestjs/common";
import { User } from "src/modules/users/entities/user.entity";


/**
 * Servicio para gestionar el contexto multi-tenant.
 * 
 * - Obtiene el tenant (empresa) actual desde la request.
 * - Verifica si un usuario tiene permiso para acceder a un tenant.
 */
@Injectable()
export class TenantContextService {
  /**
   * Obtiene el ID de la empresa (tenant) desde la request actual.
   * 
   * @param req - Objeto de solicitud HTTP (Express)
   * @returns ID de la empresa o undefined si no hay usuario autenticado.
   */
    getTenantIdFromRequest(req: Request): number | undefined {
        const user = (req as any).user as User;
        if (!user) return undefined;
        // Retorna el ID de la empresa, priorizando el objeto 'company' si está cargado
        return user.company?.id ?? (user as any).companyId;
    }

    /**
     * Verifica que el usuario tenga acceso al tenant especificado.
     * @param user - Usuario autenticado
     * @param companyId - ID del tenant al que se intenta acceder
     * @throws ForbiddenException si el usuario no tiene permiso
     */
    ensureCompanyAccess(user: User, companyId: number): void {
        if (!user) throw new ForbiddenException('No autenticado');

        // Los super_admin tienen acceso a todos los tenants
        if (user.role === 'super_admin') return;

        // Si el usuario pertenece a otra empresa, se deniega el acceso
        const userCompanyId = user.company?.id ?? (user as any).companyId;
        if (userCompanyId !== companyId) {
            throw new ForbiddenException('No tienes acceso a este tenant');
        }
    }

}