import { createParamDecorator, ExecutionContext } from "@nestjs/common";


// Definimos un decorador personalizado @Tenant()
// este decorador sirve para otener automaticamente el tenantId (companyId)
// desde la request actual (req.tenantId), sin tener que acceder manualmente al objeto req

export const Tenant = createParamDecorator(
    (data: unknown, ctx: ExecutionContext) => {
        // obtenemos el objeto Request de Express desde el contexto HTTP
        // el ExecutionContext puede representar diferentes tipos de contexto
        // por eso se usa switchToHttp() para obtener el contexto HTTP específico
        const req = ctx.switchToHttp().getRequest();

        // Retornamos el tenantId que previamente fue inyectado en la request
        // por el TenantIinterceptor. De esta forma, cualquier controlador puede acceder a él
        // simplemente usando el decorador @Tenant()
        return req.tenantId;
    }
)