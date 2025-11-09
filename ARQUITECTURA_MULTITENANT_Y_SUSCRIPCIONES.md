# Evaluación y Requerimientos: Arquitectura Multi-tenant y Sistema de Suscripciones

## 📋 Estado Actual del Proyecto

### Lo que ya tienes:
✅ Relación `User` → `Company` (ManyToOne)  
✅ Roles de usuario (super_admin, company_admin, kitchen_admin, diner)  
✅ JWT authentication con `companyId` en el payload  
✅ Validación manual de permisos en algunos controllers (companies.controller.ts)  
✅ Estructura modular con NestJS  
✅ TypeORM configurado  

### Lo que falta para Multi-tenant:
❌ **Aislamiento sistemático de datos** - Las consultas no filtran automáticamente por `companyId`  
❌ **Middleware/Interceptors para contexto de tenant**  
❌ **Guard que valide automáticamente el acceso a recursos del tenant**  
❌ **Relación `Company` en entidades compartidas** (ej: `Observation` no tiene `companyId`)  
❌ **Soft delete o archiving por tenant**  
❌ **Query Builder patterns reutilizables** para filtrar por tenant  

---

## 🏗️ 1. ARQUITECTURA MULTI-TENANT

### 1.1. Enfoques de Multi-tenancy

#### Opción A: **Shared Database con Tenant ID (Recomendada)**
- ✅ Una sola base de datos
- ✅ Todas las tablas tienen `companyId` (o `tenantId`)
- ✅ Filtrado automático en queries
- ✅ Más fácil de escalar y mantener
- ⚠️ Requiere disciplina para no olvidar filtros

#### Opción B: **Database per Tenant**
- ✅ Aislamiento total
- ❌ Más complejo (migraciones múltiples, conexiones dinámicas)
- ❌ Mayor costo de infraestructura
- ⚠️ No recomendado para tu caso actual

**Recomendación: Opción A**

---

### 1.2. Entidades y Cambios Necesarios

#### A. Crear Base Entity con Tenant ID

```typescript
// src/common/entities/base-tenant.entity.ts
export abstract class BaseTenantEntity {
  @ManyToOne(() => Company, { nullable: false })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ name: 'company_id' })
  companyId: number;
}
```

#### B. Entidades que DEBEN tener `companyId`:

1. ✅ `User` - Ya lo tiene (`company` relationship)
2. ❌ `Observation` - **FALTA** → Agregar relación con `Company`
3. ❌ Futuras entidades (menús, pedidos, etc.) - Deben heredar de `BaseTenantEntity`

#### C. Migración necesaria:
- Agregar `company_id` a tabla `observations`
- Crear foreign key constraint
- Migrar datos existentes si hay

---

### 1.3. Middleware/Interceptors para Contexto de Tenant

#### A. Tenant Context Service
```typescript
// src/modules/auth/services/tenant-context.service.ts
@Injectable()
export class TenantContextService {
  getCompanyId(req: Request): number {
    const user = (req as any).user as User;
    return user?.company?.id;
  }

  ensureCompanyAccess(user: User, companyId: number): void {
    if (user.role !== 'super_admin' && user.company?.id !== companyId) {
      throw new ForbiddenException('No tienes acceso a este tenant');
    }
  }
}
```

#### B. Tenant Interceptor
```typescript
// src/modules/auth/interceptors/tenant.interceptor.ts
@Injectable()
export class TenantInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest();
    const user = request.user as User;
    
    if (user?.company?.id) {
      // Agregar companyId al request para uso en servicios
      request.tenantId = user.company.id;
    }
    
    return next.handle();
  }
}
```

#### C. Tenant Query Filter Helper
```typescript
// src/common/filters/tenant-query.filter.ts
export class TenantQueryFilter {
  static applyTenantFilter<T>(
    queryBuilder: SelectQueryBuilder<T>,
    companyId: number,
    tableAlias: string = 'entity'
  ): SelectQueryBuilder<T> {
    return queryBuilder.andWhere(`${tableAlias}.companyId = :companyId`, { companyId });
  }
}
```

---

### 1.4. Guards y Decorators

#### A. Tenant Guard
```typescript
// src/modules/auth/guards/tenant.guard.ts
@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user as User;
    const params = request.params;
    
    // Validar que el resourceId pertenece al tenant del usuario
    if (params.companyId && user.company?.id !== Number(params.companyId)) {
      if (user.role !== 'super_admin') {
        throw new ForbiddenException();
      }
    }
    
    return true;
  }
}
```

#### B. Decorator para Auto-filtrado
```typescript
// src/modules/auth/decorators/tenant.decorator.ts
export const TenantFilter = () => SetMetadata('tenant-filter', true);
```

---

### 1.5. Modificaciones en Servicios

**Patrón a aplicar en TODOS los servicios:**

```typescript
// ANTES (riesgoso)
async findAll(): Promise<Entity[]> {
  return this.repo.find(); // Devuelve TODAS las entidades
}

// DESPUÉS (seguro)
async findAll(companyId: number): Promise<Entity[]> {
  return this.repo.find({ 
    where: { company: { id: companyId } },
    relations: ['company']
  });
}
```

**Servicios que necesitan modificación:**
- ✅ `UsersService.findAll()` - Ya tiene `findAllByCompany()` pero `findAll()` es peligroso
- ✅ `CompaniesService.findAll()` - Debe ser solo para super_admin
- ❌ `ObservationsService` (si existe) - Necesita filtrado por tenant
- ❌ Futuros servicios - Todos deben recibir `companyId` explícitamente

---

### 1.6. Modificaciones en Controllers

**Patrón a aplicar:**

```typescript
@Get()
async findAll(@Req() req: Request) {
  const user = req.user as User;
  const companyId = user.role === 'super_admin' 
    ? undefined // super_admin ve todo
    : user.company.id;
  
  return this.service.findAll(companyId);
}
```

---

### 1.7. Validación de Datos entre Tenants

**Problema:** Un usuario de Company A podría modificar datos de Company B si conoce el ID.

**Solución:** Validación en cada operación:

```typescript
async update(id: number, dto: UpdateDto, companyId: number): Promise<Entity> {
  const entity = await this.repo.findOne({ 
    where: { id, company: { id: companyId } }
  });
  
  if (!entity) {
    throw new NotFoundException('Entity not found or access denied');
  }
  
  // ... resto de la lógica
}
```

---

## 💳 2. SISTEMA DE SUSCRIPCIONES

### 2.1. Entidades Necesarias

#### A. SubscriptionPlan (Plan de Suscripción)
```typescript
// src/modules/subscription/entities/subscription-plan.entity.ts
@Entity('subscription_plans')
export class SubscriptionPlan {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string; // 'basic', 'premium', 'enterprise'

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'varchar', length: 3, default: 'USD' })
  currency: string; // 'USD', 'ARS', etc.

  @Column({ type: 'enum', enum: ['monthly', 'yearly'], default: 'monthly' })
  billingPeriod: 'monthly' | 'yearly';

  @Column('simple-array') // ['feature1', 'feature2', ...]
  features: string[];

  @Column({ type: 'int', nullable: true })
  maxUsers: number; // null = ilimitado

  @Column({ type: 'int', nullable: true })
  maxCanteens: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

#### B. Subscription (Suscripción de la Company)
```typescript
// src/modules/subscription/entities/subscription.entity.ts
@Entity('subscriptions')
export class Subscription {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Company, { nullable: false })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ name: 'company_id' })
  companyId: number;

  @ManyToOne(() => SubscriptionPlan, { nullable: false })
  @JoinColumn({ name: 'plan_id' })
  plan: SubscriptionPlan;

  @Column({ name: 'plan_id' })
  planId: number;

  @Column({ 
    type: 'enum', 
    enum: ['active', 'cancelled', 'expired', 'suspended', 'trial'],
    default: 'trial'
  })
  status: 'active' | 'cancelled' | 'expired' | 'suspended' | 'trial';

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date', nullable: true })
  endDate: Date; // null = sin fin (suscripción activa)

  @Column({ type: 'date', nullable: true })
  trialEndDate: Date;

  @Column({ type: 'boolean', default: false })
  autoRenew: boolean;

  @Column({ type: 'date', nullable: true })
  cancelledAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

#### C. Payment (Pagos)
```typescript
// src/modules/payments/entities/payment.entity.ts
@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Subscription, { nullable: false })
  @JoinColumn({ name: 'subscription_id' })
  subscription: Subscription;

  @Column({ name: 'subscription_id' })
  subscriptionId: number;

  @ManyToOne(() => Company, { nullable: false })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ name: 'company_id' })
  companyId: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 3, default: 'USD' })
  currency: string;

  @Column({ 
    type: 'enum', 
    enum: ['pending', 'completed', 'failed', 'refunded', 'cancelled'],
    default: 'pending'
  })
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled';

  @Column({ type: 'varchar', length: 255, nullable: true })
  paymentMethod: string; // 'credit_card', 'bank_transfer', etc.

  @Column({ type: 'varchar', length: 255, nullable: true })
  transactionId: string; // ID del proveedor de pago (Stripe, Mercado Pago, etc.)

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>; // Datos adicionales del proveedor

  @Column({ type: 'date' })
  dueDate: Date;

  @Column({ type: 'date', nullable: true })
  paidAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

#### D. PaymentMethod (Métodos de Pago)
```typescript
// src/modules/payments/entities/payment-method.entity.ts
@Entity('payment_methods')
export class PaymentMethod {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Company, { nullable: false })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ name: 'company_id' })
  companyId: number;

  @Column({ type: 'enum', enum: ['credit_card', 'debit_card', 'bank_transfer'] })
  type: string;

  @Column({ type: 'varchar', length: 255 })
  providerToken: string; // Token del proveedor (Stripe customer ID, etc.)

  @Column({ type: 'boolean', default: true })
  isDefault: boolean;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
```

---

### 2.2. Módulos Necesarios

#### A. Subscription Module
```
src/modules/subscription/
├── subscription.module.ts
├── entities/
│   ├── subscription-plan.entity.ts
│   └── subscription.entity.ts
├── dto/
│   ├── create-subscription-plan.dto.ts
│   ├── update-subscription-plan.dto.ts
│   ├── create-subscription.dto.ts
│   ├── update-subscription.dto.ts
│   └── change-plan.dto.ts
├── services/
│   ├── subscription-plan.service.ts
│   ├── subscription.service.ts
│   └── subscription-validator.service.ts (valida límites del plan)
├── controllers/
│   ├── subscription-plans.controller.ts
│   └── subscriptions.controller.ts
└── enums/
    └── subscription-status.enum.ts
```

#### B. Payments Module
```
src/modules/payments/
├── payments.module.ts
├── entities/
│   ├── payment.entity.ts
│   └── payment-method.entity.ts
├── dto/
│   ├── create-payment.dto.ts
│   ├── process-payment.dto.ts
│   └── payment-webhook.dto.ts
├── services/
│   ├── payment.service.ts
│   ├── payment-processor.service.ts (abstracción)
│   ├── stripe.service.ts (implementación Stripe)
│   ├── mercado-pago.service.ts (implementación Mercado Pago)
│   └── payment-webhook.service.ts
├── controllers/
│   ├── payments.controller.ts
│   └── payment-webhooks.controller.ts
└── interfaces/
    └── payment-provider.interface.ts
```

---

### 2.3. Integración con Proveedores de Pago

#### Opciones Recomendadas:

1. **Stripe** (Internacional)
   - ✅ Excelente documentación
   - ✅ Soporte para suscripciones recurrentes
   - ✅ Webhooks robustos
   - ✅ SDK oficial para Node.js
   - ⚠️ Puede requerir procesador local para Argentina

2. **Mercado Pago** (América Latina)
   - ✅ Popular en Argentina
   - ✅ Suscripciones recurrentes
   - ✅ Webhooks
   - ✅ SDK oficial

3. **Otros** (según mercado objetivo):
   - PayPal
   - Adyen
   - Local payment processors

#### Patrón de Abstracción:

```typescript
// src/modules/payments/interfaces/payment-provider.interface.ts
export interface PaymentProvider {
  createCustomer(data: CreateCustomerDto): Promise<string>;
  createSubscription(customerId: string, planId: string): Promise<SubscriptionData>;
  cancelSubscription(subscriptionId: string): Promise<void>;
  processPayment(amount: number, customerId: string): Promise<PaymentResult>;
  handleWebhook(payload: any, signature: string): Promise<WebhookEvent>;
}
```

---

### 2.4. Lógica de Negocio

#### A. Validación de Límites del Plan
```typescript
// src/modules/subscription/services/subscription-validator.service.ts
@Injectable()
export class SubscriptionValidatorService {
  async canAddUser(companyId: number): Promise<boolean> {
    const subscription = await this.getActiveSubscription(companyId);
    const plan = subscription.plan;
    const currentUserCount = await this.usersService.countByCompany(companyId);
    
    if (plan.maxUsers === null) return true; // Ilimitado
    return currentUserCount < plan.maxUsers;
  }

  async canAddCanteen(companyId: number): Promise<boolean> {
    // Similar lógica
  }
}
```

#### B. Renovación Automática
```typescript
// src/modules/subscription/services/subscription-renewal.service.ts
@Injectable()
export class SubscriptionRenewalService {
  // Ejecutar con cron job diario
  async processRenewals() {
    const expiringSubscriptions = await this.findExpiringSoon();
    
    for (const sub of expiringSubscriptions) {
      if (sub.autoRenew) {
        await this.renewSubscription(sub);
      } else {
        await this.expireSubscription(sub);
      }
    }
  }
}
```

#### C. Procesamiento de Webhooks
```typescript
// src/modules/payments/services/payment-webhook.service.ts
@Injectable()
export class PaymentWebhookService {
  async handlePaymentSuccess(event: PaymentEvent) {
    const payment = await this.updatePaymentStatus(event.transactionId, 'completed');
    const subscription = await this.subscriptionService.activate(payment.subscriptionId);
    
    // Notificar al usuario
    await this.mailService.sendPaymentConfirmation(payment);
  }

  async handlePaymentFailed(event: PaymentEvent) {
    // Lógica de retry o suspensión
  }

  async handleSubscriptionCancelled(event: SubscriptionEvent) {
    // Actualizar estado de suscripción
  }
}
```

---

### 2.5. Cron Jobs y Tareas Programadas

Necesitarás `@nestjs/schedule`:

```bash
npm install @nestjs/schedule
```

```typescript
// src/modules/subscription/services/subscription-scheduler.service.ts
@Injectable()
export class SubscriptionSchedulerService {
  @Cron('0 0 * * *') // Diario a medianoche
  async checkExpiringSubscriptions() {
    // Verificar suscripciones que expiran
  }

  @Cron('0 9 * * *') // Diario a las 9 AM
  async processRenewals() {
    // Procesar renovaciones automáticas
  }

  @Cron('0 */6 * * *') // Cada 6 horas
  async syncPaymentStatus() {
    // Sincronizar estados con proveedor de pago
  }
}
```

---

### 2.6. Integración con Company Entity

```typescript
// Modificar Company entity
@Entity('companies')
export class Company {
  // ... campos existentes

  @OneToOne(() => Subscription, subscription => subscription.company)
  subscription: Subscription;

  // Helper method
  async getActiveSubscription(): Promise<Subscription | null> {
    return this.subscription?.status === 'active' 
      ? this.subscription 
      : null;
  }
}
```

---

### 2.7. Modificaciones en Auth Service

Al crear una nueva company, crear trial automático:

```typescript
async registerCompany(companyDto: CreateCompanyDto, adminDto: CreateUserDto) {
  // ... código existente

  // Crear suscripción trial
  const trialPlan = await this.subscriptionPlanService.findTrialPlan();
  const subscription = await this.subscriptionService.create({
    companyId: company.id,
    planId: trialPlan.id,
    status: 'trial',
    startDate: new Date(),
    trialEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 días
  });

  return { company, admin: savedAdmin, subscription };
}
```

---

### 2.8. Guards y Validaciones

```typescript
// src/modules/subscription/guards/subscription-active.guard.ts
@Injectable()
export class SubscriptionActiveGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as User;
    const company = user.company;

    const subscription = await this.subscriptionService.getActive(company.id);
    
    if (!subscription || subscription.status !== 'active') {
      throw new ForbiddenException('La suscripción no está activa');
    }

    return true;
  }
}
```

---

## 📦 3. DEPENDENCIAS ADICIONALES NECESARIAS

### Para Multi-tenant:
```json
{
  "dependencies": {
    // Ya tienes todo lo necesario (TypeORM, NestJS)
  }
}
```

### Para Suscripciones y Pagos:
```json
{
  "dependencies": {
    "@nestjs/schedule": "^4.0.0",           // Cron jobs
    "stripe": "^14.0.0",                     // Stripe SDK
    "mercadopago": "^2.0.0",                // Mercado Pago SDK (opcional)
    "uuid": "^9.0.0",                        // Generar IDs únicos para transacciones
    "@types/uuid": "^9.0.0"
  }
}
```

---

## 🔐 4. CONSIDERACIONES DE SEGURIDAD

### Multi-tenant:
1. **Nunca confiar en client-side** - Validar `companyId` en backend siempre
2. **Row Level Security** - Considerar políticas a nivel de base de datos (PostgreSQL RLS)
3. **Auditoría** - Logs de acceso entre tenants
4. **Rate limiting por tenant** - Evitar abuso

### Suscripciones:
1. **Validar webhooks** - Verificar firma de proveedor de pago
2. **Idempotencia** - Manejar webhooks duplicados
3. **Encryptar datos sensibles** - Tokens, customer IDs
4. **PCI Compliance** - Nunca almacenar datos de tarjetas directamente

---

## 📝 5. CHECKLIST DE IMPLEMENTACIÓN

### Multi-tenant:
- [ ] Crear `BaseTenantEntity` abstract class
- [ ] Agregar `companyId` a `Observation` entity
- [ ] Crear migración para `observations.company_id`
- [ ] Crear `TenantContextService`
- [ ] Crear `TenantInterceptor`
- [ ] Modificar todos los servicios para filtrar por `companyId`
- [ ] Modificar controllers para extraer `companyId` del usuario
- [ ] Agregar validaciones en operaciones CRUD
- [ ] Crear tests para verificar aislamiento de datos
- [ ] Documentar patrones en README

### Suscripciones:
- [ ] Crear entidades: `SubscriptionPlan`, `Subscription`, `Payment`, `PaymentMethod`
- [ ] Crear módulos: `SubscriptionModule`, `PaymentsModule`
- [ ] Crear servicios básicos (CRUD)
- [ ] Integrar con proveedor de pago (Stripe/Mercado Pago)
- [ ] Implementar webhooks
- [ ] Crear cron jobs para renovaciones
- [ ] Modificar `registerCompany` para crear trial
- [ ] Crear guards para validar suscripción activa
- [ ] Crear validadores de límites (usuarios, canteens)
- [ ] Implementar notificaciones de pago/vencimiento
- [ ] Dashboard de administración de suscripciones

---

## 🎯 6. ORDEN DE IMPLEMENTACIÓN RECOMENDADO

### Fase 1: Multi-tenant Foundation
1. Crear `BaseTenantEntity`
2. Agregar `companyId` a entidades existentes
3. Crear `TenantContextService` y `TenantInterceptor`
4. Modificar servicios existentes
5. Tests de aislamiento

### Fase 2: Suscripciones Básicas
1. Crear entidades de planes y suscripciones
2. Crear servicios CRUD
3. Modificar registro de company para crear trial
4. Dashboard básico de planes

### Fase 3: Integración de Pagos
1. Elegir proveedor de pago
2. Implementar servicios de pago
3. Webhooks
4. Procesamiento de pagos

### Fase 4: Funcionalidades Avanzadas
1. Renovaciones automáticas
2. Validación de límites
3. Upgrade/downgrade de planes
4. Reportes y analytics

---

## 📚 7. RECURSOS ADICIONALES

- **NestJS Multi-tenancy**: Buscar "NestJS multi-tenant architecture"
- **Stripe Subscriptions**: https://stripe.com/docs/billing/subscriptions/overview
- **Mercado Pago Subscriptions**: https://www.mercadopago.com.ar/developers/es/docs/subscriptions
- **TypeORM Query Builder**: Para queries complejas con filtrado por tenant

---

## ⚠️ 8. PUNTOS CRÍTICOS A CONSIDERAR

1. **Migración de datos existentes**: Si ya hay datos sin `companyId`, necesitas migración
2. **Performance**: Índices en `company_id` en todas las tablas
3. **Backups**: Estrategia de backup por tenant (si es requerimiento)
4. **Compliance**: GDPR, LGPD - eliminar datos de tenant si es necesario
5. **Billing**: Manejo de cambios de plan a mitad de período
6. **Trials**: Qué pasa cuando termina el trial sin pago

---

**Nota Final**: Este documento es una guía. La implementación real dependerá de tus requerimientos específicos de negocio, compliance, y restricciones técnicas de tu infraestructura.

