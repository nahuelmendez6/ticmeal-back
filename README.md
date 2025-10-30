# Ticmeal Backend

Backend construido con NestJS, TypeORM y PostgreSQL.

## Requisitos
- Node.js 18+
- PostgreSQL 13+

## Variables de entorno (.env)
Crea un archivo `.env` en la raíz con:

```
# App
PORT=3000

# DB
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASS=postgres
DB_NAME=ticmeal

# JWT
JWT_SECRET=super_secret_key
JWT_EXPIRES_IN=3600
```

## Instalación
```bash
npm install
```

## Desarrollo
```bash
npm run start:dev
```

## Documentación Swagger
Disponible en `http://localhost:3000/api`.

## Arquitectura
- `src/config`: configuración de base de datos (TypeORM)
- `src/common/filters`: manejadores globales de excepciones
- `src/modules/auth`: autenticación (JWT, guards, decoradores)
- `src/modules/companies`: CRUD de empresas
- `src/modules/users`: gestión de usuarios internos

## Autenticación y Autorización
- JWT Bearer en Authorization header.
- Decoradores:
  - `@Public()`: marca endpoints públicos (no requieren JWT)
  - `@Roles('super_admin' | 'company_admin' | ...)`: restringe por rol
- Guards globales: `JwtAuthGuard` y `RolesGuard` (respetan `@Public`).

## Endpoints principales

### Auth
- POST `/auth/register-company` (Public)
  - Body:
  ```json
  {
    "company": { "name": "ACME", "taxId": "20-123", "industryType": "food" },
    "admin": { "email": "admin@acme.com", "password": "Secret123" }
  }
  ```
  - Crea la empresa y un usuario `company_admin` con username `acme@ticmeal`.

- POST `/auth/login` (Public)
  - Body: `{ "username": "acme@ticmeal", "password": "Secret123" }`
  - Respuesta: `{ "access_token": "..." }`

### Companies
- GET `/companies` (Role: `super_admin`) — lista todas
- GET `/companies/:id` (Roles: `super_admin` o dueño del tenant)
- PATCH `/companies/:id` (Roles: `super_admin` o dueño del tenant)
- PATCH `/companies/:id/deactivate` (Role: `super_admin`)

Reglas:
- Unicidad por `name` y `taxId` con errores claros.
- `company_admin` solo accede a su empresa.

### Users
- POST `/users/create` (Roles: `company_admin`, `super_admin`)
  - Crea usuarios dentro del tenant. Si no es `super_admin`, se fuerza `company` desde el JWT.
- GET `/users` — lista usuarios del tenant; `super_admin` ve todos.
- GET `/users/:id` — restringido al tenant salvo `super_admin`.
- DELETE `/users/:id` (Roles: `company_admin`, `super_admin`) — restringido al tenant salvo `super_admin`.
- GET `/users/profile/me` — devuelve el usuario autenticado.

## Ejemplos de uso con curl

Login y uso de token:
```bash
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"acme@ticmeal","password":"Secret123"}' | jq -r .access_token)

curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/users
```

## Tests
```bash
npm run test
```

## Notas de seguridad
- Passwords hasheadas con bcrypt.
- Expiración de JWT configurable por `JWT_EXPIRES_IN` (segundos).
- Validación global con `ValidationPipe` (whitelist y transform).
