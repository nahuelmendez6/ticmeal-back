# Guía de Pruebas - Multitenant

Esta guía te ayudará a probar la creación de companies y usuarios, así como verificar que el sistema multitenant funcione correctamente.

## 🚀 Pre-requisitos

1. **Base de datos configurada**: Asegúrate de que la base de datos esté corriendo y las migraciones estén ejecutadas.
2. **Servidor corriendo**: Inicia el servidor con `npm run start:dev` o `npm run start`.
3. **Variables de entorno**: Verifica que el archivo `.env` tenga las configuraciones correctas.

## 📋 Endpoints Disponibles

### 1. Registro de Company (Público)
- **Endpoint**: `POST /auth/register-company`
- **Autenticación**: No requerida
- **Descripción**: Crea una nueva company y su administrador

### 2. Login (Público)
- **Endpoint**: `POST /auth/login`
- **Autenticación**: No requerida
- **Descripción**: Autentica un usuario y retorna un JWT token

### 3. Crear Usuario Diner (Protegido)
- **Endpoint**: `POST /auth/register-diner`
- **Autenticación**: JWT Bearer Token
- **Descripción**: Crea un usuario diner en la company del usuario autenticado

### 4. Crear Usuario Kitchen Admin (Protegido)
- **Endpoint**: `POST /auth/register-kitchen-admin`
- **Autenticación**: JWT Bearer Token
- **Descripción**: Crea un usuario kitchen_admin en la company del usuario autenticado

### 5. Listar Usuarios (Protegido)
- **Endpoint**: `GET /users`
- **Autenticación**: JWT Bearer Token
- **Descripción**: Lista los usuarios del tenant del usuario autenticado

### 6. Obtener Usuario por ID (Protegido)
- **Endpoint**: `GET /users/:id`
- **Autenticación**: JWT Bearer Token
- **Descripción**: Obtiene un usuario por ID (solo del mismo tenant)

## 🧪 Pruebas con cURL

### Paso 1: Crear una Company y su Administrador

```bash
curl -X POST http://localhost:3000/auth/register-company \
  -H "Content-Type: application/json" \
  -d '{
    "company": {
      "name": "Empresa Test S.A.",
      "taxId": "20-12345678-9",
      "industryType": "Restaurantes",
      "contactEmail": "contacto@empresatest.com",
      "address": "Av. Test 123",
      "state": "Buenos Aires",
      "postalCode": "1000",
      "country": "Argentina",
      "numberOfCanteens": 2,
      "canteenCapacity": 100
    },
    "admin": {
      "email": "admin@empresatest.com",
      "password": "Admin123!",
      "firsName": "Juan",
      "lastName": "Pérez"
    }
  }'
```

**Respuesta esperada**:
```json
{
  "company": {
    "id": 1,
    "name": "Empresa Test S.A.",
    "taxId": "20-12345678-9",
    "industryType": "Restaurantes",
    ...
  },
  "admin": {
    "id": 1,
    "username": "empresatest s.a.@ticmeal",
    "email": "admin@empresatest.com",
    "role": "company_admin",
    "company": {
      "id": 1,
      "name": "Empresa Test S.A.",
      ...
    }
  }
}
```

**Nota**: Guarda el `username` del admin (ej: `empresatest s.a.@ticmeal`) y el `id` de la company para las siguientes pruebas.

### Paso 2: Login con el Administrador

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "empresatest s.a.@ticmeal",
    "password": "Admin123!"
  }'
```

**Respuesta esperada**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Nota**: Guarda el `access_token` para usar en las siguientes requests.

### Paso 3: Crear un Usuario Diner

```bash
curl -X POST http://localhost:3000/auth/register-diner \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_ACCESS_TOKEN_AQUI" \
  -d '{
    "email": "diner1@empresatest.com",
    "firsName": "María",
    "lastName": "González"
  }'
```

**Respuesta esperada**:
```json
{
  "id": 2,
  "username": null,
  "email": "diner1@empresatest.com",
  "firsName": "María",
  "lastName": "González",
  "role": "diner",
  "company": {
    "id": 1,
    "name": "Empresa Test S.A.",
    ...
  },
  ...
}
```

### Paso 4: Crear un Usuario Kitchen Admin

```bash
curl -X POST http://localhost:3000/auth/register-kitchen-admin \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_ACCESS_TOKEN_AQUI" \
  -d '{
    "email": "kitchen@empresatest.com",
    "firsName": "Carlos",
    "lastName": "Rodríguez"
  }'
```

### Paso 5: Listar Usuarios del Tenant

```bash
curl -X GET http://localhost:3000/users \
  -H "Authorization: Bearer TU_ACCESS_TOKEN_AQUI"
```

**Respuesta esperada**: Lista de usuarios que pertenecen a la misma company que el usuario autenticado.

### Paso 6: Obtener Usuario por ID

```bash
curl -X GET http://localhost:3000/users/2 \
  -H "Authorization: Bearer TU_ACCESS_TOKEN_AQUI"
```

**Respuesta esperada**: Datos del usuario con ID 2, solo si pertenece al mismo tenant.

## 🧪 Pruebas con Thunder Client / Postman

### Colección de Requests

#### 1. Register Company
- **Method**: POST
- **URL**: `http://localhost:3000/auth/register-company`
- **Headers**:
  - `Content-Type: application/json`
- **Body** (JSON):
```json
{
  "company": {
    "name": "Empresa Test S.A.",
    "taxId": "20-12345678-9",
    "industryType": "Restaurantes",
    "contactEmail": "contacto@empresatest.com",
    "address": "Av. Test 123",
    "state": "Buenos Aires",
    "postalCode": "1000",
    "country": "Argentina",
    "numberOfCanteens": 2,
    "canteenCapacity": 100
  },
  "admin": {
    "email": "admin@empresatest.com",
    "password": "Admin123!",
    "firsName": "Juan",
    "lastName": "Pérez"
  }
}
```

#### 2. Login
- **Method**: POST
- **URL**: `http://localhost:3000/auth/login`
- **Headers**:
  - `Content-Type: application/json`
- **Body** (JSON):
```json
{
  "username": "empresatest s.a.@ticmeal",
  "password": "Admin123!"
}
```
- **Nota**: Guarda el `access_token` de la respuesta para usar en las siguientes requests.

#### 3. Register Diner
- **Method**: POST
- **URL**: `http://localhost:3000/auth/register-diner`
- **Headers**:
  - `Content-Type: application/json`
  - `Authorization: Bearer {{access_token}}`
- **Body** (JSON):
```json
{
  "email": "diner1@empresatest.com",
  "firsName": "María",
  "lastName": "González"
}
```

#### 4. List Users
- **Method**: GET
- **URL**: `http://localhost:3000/users`
- **Headers**:
  - `Authorization: Bearer {{access_token}}`

#### 5. Get User by ID
- **Method**: GET
- **URL**: `http://localhost:3000/users/2`
- **Headers**:
  - `Authorization: Bearer {{access_token}}`

## 🧪 Pruebas con Script Automatizado (Recomendado)

### Script de Prueba Automatizado

Ya existe un script de prueba automatizado en `test-multitenant.js` que ejecuta todas las pruebas necesarias.

### Ejecutar el Script

```bash
# Asegúrate de que el servidor esté corriendo
npm run start:dev

# En otra terminal, ejecuta el script de pruebas
npm run test:multitenant

# O directamente:
node test-multitenant.js
```

### ¿Qué hace el script?

El script automáticamente:
1. ✅ Crea una company y su administrador
2. ✅ Hace login con el administrador
3. ✅ Crea un usuario diner
4. ✅ Crea un usuario kitchen_admin
5. ✅ Lista los usuarios del tenant
6. ✅ Obtiene un usuario por ID
7. ✅ Verifica el aislamiento de datos entre tenants
8. ✅ Crea una segunda company y verifica que no puede acceder a usuarios de la primera

### Requisitos

- Node.js 18+ (tiene fetch nativo)
- Servidor corriendo en `http://localhost:3000` (o configurar `API_URL`)

### Personalizar la URL del servidor

```bash
API_URL=http://localhost:3000 node test-multitenant.js
```

---

## 🧪 Pruebas Manuales con Scripts Node.js

Si prefieres crear tu propio script, aquí tienes un ejemplo:

```javascript
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
let accessToken = '';
let companyId = null;
let adminUserId = null;

async function testMultitenant() {
  try {
    console.log('🧪 Iniciando pruebas multitenant...\n');

    // 1. Crear Company
    console.log('1. Creando company...');
    const companyResponse = await axios.post(`${BASE_URL}/auth/register-company`, {
      company: {
        name: 'Empresa Test S.A.',
        taxId: '20-12345678-9',
        industryType: 'Restaurantes',
        contactEmail: 'contacto@empresatest.com',
        address: 'Av. Test 123',
        state: 'Buenos Aires',
        postalCode: '1000',
        country: 'Argentina',
        numberOfCanteens: 2,
        canteenCapacity: 100,
      },
      admin: {
        email: 'admin@empresatest.com',
        password: 'Admin123!',
        firsName: 'Juan',
        lastName: 'Pérez',
      },
    });

    console.log('✅ Company creada:', companyResponse.data.company.name);
    companyId = companyResponse.data.company.id;
    adminUserId = companyResponse.data.admin.id;
    const adminUsername = companyResponse.data.admin.username;
    console.log('   Company ID:', companyId);
    console.log('   Admin Username:', adminUsername);
    console.log('');

    // 2. Login
    console.log('2. Haciendo login...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      username: adminUsername,
      password: 'Admin123!',
    });

    accessToken = loginResponse.data.access_token;
    console.log('✅ Login exitoso');
    console.log('   Token:', accessToken.substring(0, 20) + '...');
    console.log('');

    // 3. Crear Usuario Diner
    console.log('3. Creando usuario diner...');
    const dinerResponse = await axios.post(
      `${BASE_URL}/auth/register-diner`,
      {
        email: 'diner1@empresatest.com',
        firsName: 'María',
        lastName: 'González',
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    console.log('✅ Usuario diner creado:', dinerResponse.data.email);
    const dinerId = dinerResponse.data.id;
    console.log('   Diner ID:', dinerId);
    console.log('');

    // 4. Listar Usuarios
    console.log('4. Listando usuarios del tenant...');
    const usersResponse = await axios.get(`${BASE_URL}/users`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    console.log('✅ Usuarios encontrados:', usersResponse.data.length);
    usersResponse.data.forEach((user) => {
      console.log(`   - ${user.email} (${user.role})`);
    });
    console.log('');

    // 5. Obtener Usuario por ID
    console.log('5. Obteniendo usuario por ID...');
    const userResponse = await axios.get(`${BASE_URL}/users/${dinerId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    console.log('✅ Usuario obtenido:', userResponse.data.email);
    console.log('   Company ID:', userResponse.data.company.id);
    console.log('');

    // 6. Verificar Aislamiento de Datos
    console.log('6. Verificando aislamiento de datos...');
    console.log('   Company ID del usuario:', userResponse.data.company.id);
    console.log('   Company ID esperado:', companyId);
    
    if (userResponse.data.company.id === companyId) {
      console.log('✅ Aislamiento de datos correcto: El usuario pertenece al tenant correcto');
    } else {
      console.log('❌ Error: El usuario no pertenece al tenant correcto');
    }

    console.log('\n✅ Todas las pruebas completadas exitosamente!');
  } catch (error) {
    console.error('❌ Error en las pruebas:', error.response?.data || error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

// Ejecutar pruebas
testMultitenant();
```

### Ejecutar el Script

```bash
# Instalar axios si no está instalado
npm install axios

# Ejecutar el script
node test-multitenant.js
```

## 🧪 Pruebas de Aislamiento Multitenant

### Escenario 1: Verificar que usuarios de diferentes tenants no se ven entre sí

1. **Crear Company 1 y Admin 1**:
```bash
curl -X POST http://localhost:3000/auth/register-company \
  -H "Content-Type: application/json" \
  -d '{
    "company": {
      "name": "Company A",
      "taxId": "20-11111111-1",
      "industryType": "Tech"
    },
    "admin": {
      "email": "admin@companya.com",
      "password": "Admin123!",
      "firsName": "Admin",
      "lastName": "A"
    }
  }'
```

2. **Login con Admin 1 y crear usuario**:
```bash
# Login
TOKEN_A=$(curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "company a@ticmeal", "password": "Admin123!"}' \
  | jq -r '.access_token')

# Crear usuario
curl -X POST http://localhost:3000/auth/register-diner \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_A" \
  -d '{
    "email": "user@companya.com",
    "firsName": "User",
    "lastName": "A"
  }'
```

3. **Crear Company 2 y Admin 2**:
```bash
curl -X POST http://localhost:3000/auth/register-company \
  -H "Content-Type: application/json" \
  -d '{
    "company": {
      "name": "Company B",
      "taxId": "20-22222222-2",
      "industryType": "Food"
    },
    "admin": {
      "email": "admin@companyb.com",
      "password": "Admin123!",
      "firsName": "Admin",
      "lastName": "B"
    }
  }'
```

4. **Login con Admin 2 y listar usuarios**:
```bash
# Login
TOKEN_B=$(curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "company b@ticmeal", "password": "Admin123!"}' \
  | jq -r '.access_token')

# Listar usuarios (debe estar vacío o solo tener usuarios de Company B)
curl -X GET http://localhost:3000/users \
  -H "Authorization: Bearer $TOKEN_B"
```

**Resultado esperado**: El Admin de Company B NO debe ver usuarios de Company A.

### Escenario 2: Verificar que no se puede acceder a usuarios de otros tenants

1. **Obtener ID de usuario de Company A** (usando TOKEN_A):
```bash
USER_ID_A=$(curl -X GET http://localhost:3000/users \
  -H "Authorization: Bearer $TOKEN_A" \
  | jq -r '.[] | select(.email == "user@companya.com") | .id')
```

2. **Intentar acceder al usuario de Company A usando TOKEN_B**:
```bash
curl -X GET http://localhost:3000/users/$USER_ID_A \
  -H "Authorization: Bearer $TOKEN_B"
```

**Resultado esperado**: Debe retornar 404 (Not Found) o 403 (Forbidden), indicando que el usuario no pertenece al tenant.

## 🔍 Verificación en la Base de Datos

### Consultas SQL para verificar

```sql
-- Ver todas las companies
SELECT * FROM companies;

-- Ver usuarios con su company
SELECT u.id, u.email, u.role, u.companyId, c.name as company_name
FROM users u
LEFT JOIN companies c ON u.companyId = c.id;

-- Verificar que todos los usuarios tienen companyId
SELECT COUNT(*) as total_users,
       COUNT(companyId) as users_with_company,
       COUNT(*) - COUNT(companyId) as users_without_company
FROM users;

-- Ver observaciones con su company
SELECT o.id, o.name, o.companyId, c.name as company_name
FROM observations o
LEFT JOIN companies c ON o.companyId = c.id;
```

## 📊 Checklist de Pruebas

- [ ] Crear company exitosamente
- [ ] Login con el admin creado
- [ ] Crear usuario diner
- [ ] Crear usuario kitchen_admin
- [ ] Listar usuarios del tenant (solo deben aparecer usuarios del mismo tenant)
- [ ] Obtener usuario por ID (solo si pertenece al tenant)
- [ ] Verificar que usuarios de diferentes tenants no se ven entre sí
- [ ] Verificar que no se puede acceder a usuarios de otros tenants
- [ ] Verificar que el `companyId` se asigna correctamente
- [ ] Verificar que las observaciones se filtran por tenant

## 🐛 Troubleshooting

### Error: "No se pudo determinar el tenant"
- **Causa**: El usuario no tiene una company asociada o el JWT no incluye el `companyId`.
- **Solución**: Verificar que el usuario tenga una company asignada y que el JWT se genere correctamente.

### Error: "Usuario no encontrado o sin permisos"
- **Causa**: El usuario no pertenece al mismo tenant que el usuario autenticado.
- **Solución**: Verificar que el `companyId` del usuario sea el mismo que el del usuario autenticado.

### Error: "Una o más observaciones no pertenecen a tu empresa"
- **Causa**: Se intentó asignar observaciones que pertenecen a otro tenant.
- **Solución**: Verificar que las observaciones pertenezcan al mismo tenant que el usuario.

### Error: "No autenticado"
- **Causa**: El token JWT no es válido o ha expirado.
- **Solución**: Hacer login nuevamente para obtener un nuevo token.

## 📝 Notas Adicionales

1. **Super Admin**: Los usuarios con rol `super_admin` tienen acceso global a todos los tenants. Para probar esto, necesitarías crear un usuario super_admin manualmente en la base de datos.

2. **PIN para Diners**: Los usuarios diner reciben un PIN de 4 dígitos que se envía por email. Este PIN se usa para autenticación alternativa.

3. **Observaciones**: Las observaciones deben crearse con un `companyId` antes de poder asignarlas a usuarios.

4. **Migraciones**: Asegúrate de ejecutar las migraciones antes de probar:
   ```bash
   npm run migration:run
   ```

## 🚀 Próximos Pasos

1. Crear tests automatizados con Jest
2. Agregar tests de integración para el multitenant
3. Configurar CI/CD para ejecutar tests automáticamente
4. Agregar métricas y logging para monitorear el multitenant

---

**Última actualización**: Diciembre 2024

