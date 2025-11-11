# Implementación Multitenant - Resumen y Guía

## 📋 Resumen de Cambios Implementados

### 1. **Corrección del Repositorio Tenant-Aware**
   - **Antes**: `TenantAwareRepository` extendía `Repository<T>` directamente, lo cual no funciona correctamente con TypeORM en NestJS.
   - **Ahora**: Se creó una clase helper estática `TenantAwareRepository` con métodos utilitarios que trabajan con repositorios de TypeORM.
   - **Archivo**: `src/common/repository/tenant-aware.repository.ts`
   - **Beneficio**: Permite usar los métodos helper con cualquier repositorio sin necesidad de extender clases.

### 2. **Corrección de Typos y Nombres**
   - Corregido el nombre del archivo: `tenat-aware.repository.ts` → `tenant-aware.repository.ts`
   - Corregido el método: `ensuereCompanyAccess` → `ensureCompanyAccess` en `TenantContextService`
   - **Archivo**: `src/common/context/tenant-context.service.ts`

### 3. **Mejora del JWT Strategy**
   - Actualizado para asegurar que la relación `company` esté cargada cuando se valida el usuario.
   - **Archivo**: `src/modules/auth/jwt.strategy.ts`
   - **Beneficio**: El `companyId` está disponible en `req.user.company.id` después de la autenticación.

### 4. **Mejora del UsersService**
   - Agregados métodos específicos para operaciones multi-tenant:
     - `findByIdForTenant(id, companyId)`
     - `findByEmailForTenant(email, companyId)`
     - `findByUsernameForTenant(username, companyId)`
     - `removeForTenant(id, companyId)`
   - **Archivo**: `src/modules/users/services/user.service.ts`
   - **Beneficio**: Separación clara entre métodos que requieren tenant y métodos genéricos.

### 5. **Actualización del UsersController**
   - Implementado el uso del decorador `@Tenant()` para obtener el `tenantId` automáticamente.
   - Mejorada la validación de permisos y manejo de errores.
   - **Archivo**: `src/modules/users/controllers/users.controllers.ts`
   - **Beneficio**: Código más limpio y menos repetitivo.

### 6. **Actualización del AuthService**
   - Agregado filtrado por tenant al buscar observaciones.
   - Validación de que las observaciones pertenezcan al tenant del usuario.
   - **Archivo**: `src/modules/auth/services/auth.service.ts`
   - **Beneficio**: Previene que usuarios de un tenant accedan a observaciones de otro tenant.

### 7. **Migración de Base de Datos**
   - Creada migración para agregar `company_id` a la tabla `observations`.
   - Agregado índice para mejorar el rendimiento de consultas por tenant.
   - Agregada foreign key constraint con `CASCADE` delete.
   - **Archivo**: `src/database/migrations/1762892275000-AddCompanyIdToObservations.ts`
   - **Nota**: La columna es temporalmente nullable para permitir migración de datos existentes.

### 8. **Configuración del AppModule**
   - Agregados `TenantContextService` y `TenantInterceptor` como providers globales.
   - **Archivo**: `src/app.module.ts`
   - **Beneficio**: Los servicios están disponibles en toda la aplicación.

---

## 🏗️ Arquitectura Multitenant Implementada

### Componentes Principales

#### 1. **BaseTenantEntity** (`src/common/entities/base-tenant.entity.ts`)
   - Clase base abstracta que todas las entidades multi-tenant deben extender.
   - Define la relación `ManyToOne` con `Company` y la columna `companyId`.
   - Garantiza que todas las entidades tengan el campo necesario para el aislamiento de datos.

#### 2. **TenantContextService** (`src/common/context/tenant-context.service.ts`)
   - Servicio para obtener el `tenantId` desde la request.
   - Método `getTenantIdFromRequest(req)`: Extrae el `companyId` del usuario autenticado.
   - Método `ensureCompanyAccess(user, companyId)`: Valida que el usuario tenga acceso al tenant.

#### 3. **TenantInterceptor** (`src/common/interceptors/tenant-interceptor.ts`)
   - Interceptor global que se ejecuta en cada request.
   - Extrae el `tenantId` del usuario autenticado y lo agrega a `req.tenantId`.
   - Permite que los controladores accedan al `tenantId` sin necesidad de acceder directamente a `req.user.company.id`.

#### 4. **Decorador @Tenant()** (`src/common/decorators/tenant-decorator.ts`)
   - Decorador personalizado para inyectar el `tenantId` en los controladores.
   - Simplifica el acceso al `tenantId` en los métodos de los controladores.
   - Uso: `@Tenant() tenantId: number | undefined`

#### 5. **TenantGuard** (`src/common/guards/tenant-guard.ts`)
   - Guard que valida el acceso a recursos basado en el `companyId` en los parámetros de la URL.
   - Permite acceso global a `super_admin`.
   - Valida que usuarios normales solo accedan a recursos de su tenant.

#### 6. **TenantAwareRepository** (`src/common/repository/tenant-aware.repository.ts`)
   - Clase helper con métodos estáticos para trabajar con repositorios multi-tenant.
   - Métodos principales:
     - `applyTenantFilter(qb, companyId, alias)`: Aplica filtro de tenant a un QueryBuilder.
     - `createTenantQueryBuilder(repo, companyId, alias)`: Crea un QueryBuilder con filtro de tenant.
     - `findOneByTenant(repo, id, companyId, alias)`: Busca una entidad por ID verificando tenant.
     - `findAllByTenant(repo, companyId, alias)`: Busca todas las entidades de un tenant.
     - `belongsToTenant(repo, id, companyId)`: Verifica si una entidad pertenece a un tenant.

---

## 📝 Guía Paso a Paso para Implementar Nuevos Módulos Multitenant

### Paso 1: Crear la Entidad

Todas las entidades que necesiten aislamiento por tenant deben extender `BaseTenantEntity`:

```typescript
// src/modules/tu-modulo/entities/tu-entidad.entity.ts
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { BaseTenantEntity } from 'src/common/entities/base-tenant.entity';

@Entity({ name: 'tu_tabla' })
export class TuEntidad extends BaseTenantEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string;

  // ... otros campos
}
```

**Importante**: 
- ✅ Extender `BaseTenantEntity`
- ✅ No agregar manualmente `company` o `companyId` (ya está en la clase base)
- ✅ Asegurar que la tabla tenga la columna `company_id` en la base de datos

### Paso 2: Crear la Migración

Si la tabla no existe, crear una migración que incluya `company_id`:

```typescript
// src/database/migrations/TIMESTAMP-CreateTuTabla.ts
import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableColumn } from "typeorm";

export class CreateTuTablaTIMESTAMP implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'tu_tabla',
                columns: [
                    {
                        name: 'id',
                        type: 'int',
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: 'increment',
                    },
                    {
                        name: 'nombre',
                        type: 'varchar',
                        length: '255',
                    },
                    {
                        name: 'companyId',
                        type: 'int',
                        isNullable: false, // Importante: NO nullable
                    },
                    {
                        name: 'createdAt',
                        type: 'datetime',
                        default: 'CURRENT_TIMESTAMP(6)',
                    },
                    {
                        name: 'updatedAt',
                        type: 'datetime',
                        default: 'CURRENT_TIMESTAMP(6)',
                        onUpdate: 'CURRENT_TIMESTAMP(6)',
                    },
                ],
            }),
            true,
        );

        // Crear índice para mejorar el rendimiento
        await queryRunner.query(
            `CREATE INDEX IDX_tu_tabla_companyId ON tu_tabla (companyId)`
        );

        // Crear foreign key
        await queryRunner.createForeignKey(
            'tu_tabla',
            new TableForeignKey({
                columnNames: ['companyId'],
                referencedColumnNames: ['id'],
                referencedTableName: 'companies',
                onDelete: 'CASCADE',
                onUpdate: 'NO ACTION',
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Eliminar foreign key
        const table = await queryRunner.getTable('tu_tabla');
        const foreignKey = table?.foreignKeys.find(fk => fk.columnNames.indexOf('companyId') !== -1);
        if (foreignKey) {
            await queryRunner.dropForeignKey('tu_tabla', foreignKey);
        }

        // Eliminar tabla
        await queryRunner.dropTable('tu_tabla');
    }
}
```

### Paso 3: Crear el DTO

Incluir `companyId` en el DTO si es necesario (generalmente no es necesario porque se obtiene del contexto):

```typescript
// src/modules/tu-modulo/dto/create-tu-entidad.dto.ts
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateTuEntidadDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  // companyId NO se incluye aquí, se obtiene del contexto
}
```

### Paso 4: Crear el Servicio

Usar `TenantAwareRepository` para todas las operaciones que requieran filtrado por tenant:

```typescript
// src/modules/tu-modulo/services/tu-entidad.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TuEntidad } from '../entities/tu-entidad.entity';
import { TenantAwareRepository } from 'src/common/repository/tenant-aware.repository';
import { CreateTuEntidadDto } from '../dto/create-tu-entidad.dto';
import { UpdateTuEntidadDto } from '../dto/update-tu-entidad.dto';

@Injectable()
export class TuEntidadService {
  constructor(
    @InjectRepository(TuEntidad)
    private readonly tuEntidadRepo: Repository<TuEntidad>,
  ) {}

  /**
   * Crea una nueva entidad para un tenant específico.
   */
  async create(dto: CreateTuEntidadDto, companyId: number): Promise<TuEntidad> {
    const entidad = this.tuEntidadRepo.create({
      ...dto,
      companyId, // Asignar el companyId del tenant
    });
    return this.tuEntidadRepo.save(entidad);
  }

  /**
   * Busca todas las entidades de un tenant.
   */
  async findAllForTenant(companyId: number): Promise<TuEntidad[]> {
    return TenantAwareRepository.findAllByTenant(this.tuEntidadRepo, companyId, 'entidad');
  }

  /**
   * Busca una entidad por ID verificando que pertenezca al tenant.
   */
  async findOneForTenant(id: number, companyId: number): Promise<TuEntidad> {
    const entidad = await TenantAwareRepository.findOneByTenant(
      this.tuEntidadRepo,
      id,
      companyId,
      'entidad',
    );
    
    if (!entidad) {
      throw new NotFoundException('Entidad no encontrada o sin permisos');
    }
    
    return entidad;
  }

  /**
   * Actualiza una entidad verificando que pertenezca al tenant.
   */
  async update(id: number, dto: UpdateTuEntidadDto, companyId: number): Promise<TuEntidad> {
    const entidad = await this.findOneForTenant(id, companyId);
    Object.assign(entidad, dto);
    return this.tuEntidadRepo.save(entidad);
  }

  /**
   * Elimina una entidad verificando que pertenezca al tenant.
   */
  async remove(id: number, companyId: number): Promise<boolean> {
    const belongs = await TenantAwareRepository.belongsToTenant(
      this.tuEntidadRepo,
      id,
      companyId,
    );
    
    if (!belongs) {
      throw new ForbiddenException('No tienes permiso para eliminar esta entidad');
    }
    
    await this.tuEntidadRepo.delete(id);
    return true;
  }
}
```

### Paso 5: Crear el Controlador

Usar el decorador `@Tenant()` para obtener el `tenantId` y aplicar la lógica de permisos:

```typescript
// src/modules/tu-modulo/controllers/tu-entidad.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { TuEntidadService } from '../services/tu-entidad.service';
import { CreateTuEntidadDto } from '../dto/create-tu-entidad.dto';
import { UpdateTuEntidadDto } from '../dto/update-tu-entidad.dto';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { Roles } from 'src/modules/auth/decorators/roles.decorators';
import { Tenant } from 'src/common/decorators/tenant-decorator';
import type { Request } from 'express';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tu-entidad')
export class TuEntidadController {
  constructor(private readonly tuEntidadService: TuEntidadService) {}

  @Post()
  @Roles('company_admin', 'super_admin')
  async create(
    @Body() dto: CreateTuEntidadDto,
    @Tenant() tenantId: number | undefined,
    @Req() req: Request,
  ) {
    const user: any = (req as any).user;
    
    // Si no es super_admin, usar el tenantId del usuario autenticado
    if (user.role !== 'super_admin') {
      if (!tenantId) {
        throw new ForbiddenException('No se pudo determinar el tenant');
      }
      return this.tuEntidadService.create(dto, tenantId);
    }
    
    // Super_admin puede especificar el companyId en el DTO si es necesario
    // Por ahora, requerimos que siempre se use el tenantId del usuario
    if (!tenantId) {
      throw new ForbiddenException('No se pudo determinar el tenant');
    }
    return this.tuEntidadService.create(dto, tenantId);
  }

  @Get()
  async findAll(
    @Tenant() tenantId: number | undefined,
    @Req() req: Request,
  ) {
    const user: any = (req as any).user;
    
    // Los super_admin pueden ver todas las entidades (si se implementa)
    if (user.role === 'super_admin') {
      // Opcional: implementar método findAll() sin filtro
      // return this.tuEntidadService.findAll();
    }
    
    // Los demás solo ven entidades de su tenant
    if (!tenantId) {
      throw new ForbiddenException('No se pudo determinar el tenant');
    }
    
    return this.tuEntidadService.findAllForTenant(tenantId);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Tenant() tenantId: number | undefined,
    @Req() req: Request,
  ) {
    const user: any = (req as any).user;
    
    // Los super_admin pueden ver cualquier entidad
    if (user.role === 'super_admin') {
      // Opcional: implementar método findOne() sin filtro
      // return this.tuEntidadService.findOne(Number(id));
    }
    
    // Los demás solo pueden ver entidades de su tenant
    if (!tenantId) {
      throw new ForbiddenException('No se pudo determinar el tenant');
    }
    
    return this.tuEntidadService.findOneForTenant(Number(id), tenantId);
  }

  @Put(':id')
  @Roles('company_admin', 'super_admin')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTuEntidadDto,
    @Tenant() tenantId: number | undefined,
    @Req() req: Request,
  ) {
    const user: any = (req as any).user;
    
    // Los super_admin pueden actualizar cualquier entidad
    if (user.role === 'super_admin') {
      // Opcional: implementar método update() sin filtro
      // return this.tuEntidadService.update(Number(id), dto);
    }
    
    // Los demás solo pueden actualizar entidades de su tenant
    if (!tenantId) {
      throw new ForbiddenException('No se pudo determinar el tenant');
    }
    
    return this.tuEntidadService.update(Number(id), dto, tenantId);
  }

  @Delete(':id')
  @Roles('company_admin', 'super_admin')
  async remove(
    @Param('id') id: string,
    @Tenant() tenantId: number | undefined,
    @Req() req: Request,
  ) {
    const user: any = (req as any).user;
    
    // Los super_admin pueden eliminar cualquier entidad
    if (user.role === 'super_admin') {
      // Opcional: implementar método remove() sin filtro
      // return this.tuEntidadService.remove(Number(id));
    }
    
    // Los demás solo pueden eliminar entidades de su tenant
    if (!tenantId) {
      throw new ForbiddenException('No se pudo determinar el tenant');
    }
    
    await this.tuEntidadService.remove(Number(id), tenantId);
    return { deleted: true };
  }
}
```

### Paso 6: Crear el Módulo

Registrar la entidad, servicio y controlador en el módulo:

```typescript
// src/modules/tu-modulo/tu-modulo.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TuEntidad } from './entities/tu-entidad.entity';
import { TuEntidadService } from './services/tu-entidad.service';
import { TuEntidadController } from './controllers/tu-entidad.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TuEntidad])],
  providers: [TuEntidadService],
  controllers: [TuEntidadController],
  exports: [TuEntidadService],
})
export class TuModuloModule {}
```

### Paso 7: Registrar el Módulo en AppModule

```typescript
// src/app.module.ts
import { TuModuloModule } from './modules/tu-modulo/tu-modulo.module';

@Module({
  imports: [
    // ... otros imports
    TuModuloModule,
  ],
})
export class AppModule {}
```

---

## 🔍 Verificación y Testing

### Checklist de Verificación

- [ ] La entidad extiende `BaseTenantEntity`
- [ ] La migración incluye `company_id` con foreign key y índice
- [ ] El servicio usa `TenantAwareRepository` para operaciones multi-tenant
- [ ] El controlador usa el decorador `@Tenant()` para obtener el `tenantId`
- [ ] Se valida que `tenantId` no sea `undefined` antes de usarlo
- [ ] Se manejan correctamente los casos de `super_admin` (acceso global)
- [ ] Los métodos del servicio verifican que las entidades pertenezcan al tenant
- [ ] Se lanzan excepciones apropiadas (`NotFoundException`, `ForbiddenException`)
- [ ] El módulo está registrado en `AppModule`

### Testing Manual

1. **Crear entidad como usuario normal**:
   - Debe crearse con el `companyId` del usuario autenticado
   - No debe permitir crear entidades para otros tenants

2. **Listar entidades**:
   - Debe retornar solo las entidades del tenant del usuario
   - `super_admin` debe poder ver todas (si se implementa)

3. **Obtener entidad por ID**:
   - Debe retornar la entidad si pertenece al tenant
   - Debe lanzar `NotFoundException` si no pertenece al tenant

4. **Actualizar entidad**:
   - Debe permitir actualizar solo entidades del tenant
   - Debe lanzar `NotFoundException` si no pertenece al tenant

5. **Eliminar entidad**:
   - Debe permitir eliminar solo entidades del tenant
   - Debe lanzar `ForbiddenException` si no pertenece al tenant

---

## 🎯 Mejores Prácticas

### 1. **Siempre usar métodos con sufijo `ForTenant`**
   - Preferir `findOneForTenant()` sobre `findOne()` cuando se requiera filtrado por tenant.
   - Esto garantiza que siempre se valide el acceso al tenant.

### 2. **Validar `tenantId` en controladores**
   - Siempre verificar que `tenantId` no sea `undefined` antes de usarlo.
   - Lanzar `ForbiddenException` si no se puede determinar el tenant.

### 3. **Manejar `super_admin` correctamente**
   - Los `super_admin` tienen acceso global, pero es buena práctica mantener el filtrado por tenant cuando sea posible.
   - Si se necesita acceso global, documentarlo claramente.

### 4. **Usar índices en `company_id`**
   - Todas las tablas multi-tenant deben tener un índice en `company_id` para mejorar el rendimiento.
   - Incluir el índice en la migración.

### 5. **Usar `CASCADE` delete con precaución**
   - El `CASCADE` delete asegura que al eliminar una company, se eliminen sus datos relacionados.
   - Verificar que esto sea el comportamiento deseado antes de aplicarlo.

### 6. **Documentar métodos públicos**
   - Documentar claramente qué métodos requieren `tenantId` y cuáles no.
   - Usar JSDoc para documentar los métodos del servicio.

### 7. **No confiar en el cliente**
   - Nunca aceptar `companyId` desde el cliente sin validar.
   - Siempre obtener el `companyId` del usuario autenticado.

### 8. **Usar el decorador `@Tenant()`**
   - Preferir `@Tenant() tenantId` sobre `req.user.company.id` para mayor claridad.
   - El decorador maneja automáticamente los casos edge.

---

## ⚠️ Consideraciones Importantes

### 1. **Migración de Datos Existentes**
   - Si hay datos existentes sin `company_id`, se debe crear una estrategia de migración.
   - La migración para `observations` deja la columna nullable temporalmente para permitir migración.

### 2. **Rendimiento**
   - Todas las consultas multi-tenant deben incluir el filtro `companyId`.
   - Asegurar que haya índices en `company_id` en todas las tablas.
   - Considerar usar `QueryBuilder` para consultas complejas.

### 3. **Seguridad**
   - Nunca confiar en que el cliente envíe el `companyId` correcto.
   - Siempre validar que las entidades pertenezcan al tenant antes de realizar operaciones.
   - Usar `ForbiddenException` cuando se intente acceder a recursos de otro tenant.

### 4. **Testing**
   - Crear tests que verifiquen el aislamiento de datos entre tenants.
   - Probar que los usuarios no puedan acceder a datos de otros tenants.
   - Probar que `super_admin` tenga acceso global (si se implementa).

### 5. **Logging y Auditoría**
   - Considerar agregar logging cuando se intente acceder a recursos de otro tenant.
   - Esto puede ayudar a detectar intentos de acceso no autorizados.

---

## 📚 Recursos Adicionales

### Archivos Clave
- `src/common/entities/base-tenant.entity.ts` - Clase base para entidades multi-tenant
- `src/common/repository/tenant-aware.repository.ts` - Helper para repositorios multi-tenant
- `src/common/context/tenant-context.service.ts` - Servicio de contexto de tenant
- `src/common/interceptors/tenant-interceptor.ts` - Interceptor global
- `src/common/decorators/tenant-decorator.ts` - Decorador `@Tenant()`
- `src/common/guards/tenant-guard.ts` - Guard de validación de tenant

### Ejemplos de Implementación
- `src/modules/users/` - Módulo de usuarios (implementación completa)
- `src/modules/users/entities/observation.entity.ts` - Ejemplo de entidad multi-tenant
- `src/modules/users/services/user.service.ts` - Ejemplo de servicio multi-tenant
- `src/modules/users/controllers/users.controllers.ts` - Ejemplo de controlador multi-tenant

---

## 🔄 Próximos Pasos

1. **Migrar datos existentes**: Si hay datos sin `company_id`, crear una migración de datos.
2. **Hacer `company_id` NOT NULL**: Después de migrar datos, hacer la columna `company_id` NOT NULL en `observations`.
3. **Agregar tests**: Crear tests unitarios y de integración para verificar el aislamiento de datos.
4. **Documentar APIs**: Actualizar la documentación de Swagger con ejemplos multi-tenant.
5. **Monitoreo**: Agregar logging y métricas para monitorear el acceso a recursos multi-tenant.

---

**Última actualización**: Diciembre 2024
**Versión**: 1.0.0

