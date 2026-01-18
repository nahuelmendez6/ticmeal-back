# Módulo de Stock

## Descripción General

El módulo `stock` es el núcleo del sistema de gestión de inventario de Ticmeal. Se encarga de administrar todos los aspectos relacionados con el stock de productos, desde las materias primas (ingredientes) hasta los productos finales (ítems del menú). Está diseñado con una arquitectura multi-tenant, asegurando que los datos de cada empresa estén completamente aislados y seguros.

La gestión de inventario se basa en un **sistema de lotes**, lo que proporciona una trazabilidad completa de cada entrada y salida de stock.

## Componentes Principales

### 1. Entidades (Modelos de Datos)

Las entidades definen la estructura de la base de datos para este módulo. Todas las entidades específicas de un tenant extienden `BaseTenantEntity` para heredar la columna `companyId`.

- **`Category`**: Agrupa los ítems del menú (ej: "Platos Principales", "Postres"). Puede ser global (compartida por todas las empresas) o específica de un tenant.
- **`IngredientCategory`**: Agrupa los ingredientes (ej: "Lácteos", "Verduras"). También puede ser global o específica de un tenant.
- **`Ingredient`**: Representa una materia prima. Contiene información como nombre, unidad de medida y costo. El stock no se almacena directamente aquí, sino que se calcula a partir de sus lotes.
- **`IngredientLot`**: Representa un lote específico de un ingrediente. Cada lote tiene su propia cantidad, costo unitario y fecha de vencimiento, permitiendo una gestión de inventario detallada (FIFO/LIFO).
- **`MenuItems`**: Representa un producto final que se vende a los comensales. Puede ser un producto simple (ej: una bebida) o un producto compuesto (elaborado a partir de una receta).
- **`MenuItemLot`**: Similar a `IngredientLot`, representa un lote específico de un ítem de menú producido.
- **`RecipeIngredient`**: Entidad de unión que define la receta de un `MenuItems` compuesto. Especifica qué ingredientes y en qué cantidad son necesarios para producir una unidad del ítem.
- **`MealShift`**: Registra la producción de un `MenuItems` para un turno (`Shift`) y fecha específicos. Su creación desencadena los movimientos de stock correspondientes.
- **`StockMovement`**: Es un registro histórico de cada cambio en el inventario. Guarda detalles como el tipo de movimiento (entrada/salida), la cantidad, el motivo, el lote afectado y el usuario responsable.

### 2. Servicios (Lógica de Negocio)

Los servicios contienen la lógica de negocio y orquestan las operaciones del módulo.

- **`CategoryService` / `IngredientCategoryService`**: Gestionan el CRUD de las categorías, aplicando la lógica para diferenciar entre categorías globales y personalizadas por tenant.
- **`IngredientService`**: Administra los ingredientes. Se comunica con `StockService` para registrar las entradas iniciales de stock.
- **`MenuItemService`**: Gestiona los ítems del menú. Colabora con `RecipeIngredientService` para las recetas y con `MealShiftService` para verificar la producción.
- **`RecipeIngredientService`**: Maneja la lógica de las recetas, permitiendo añadir, actualizar o eliminar ingredientes de un `MenuItems`.
- **`MealShiftService`**: Orquesta el proceso de producción. Al crear un `MealShift`, utiliza el `StockService` para:
    1. Incrementar el stock del `MenuItems` producido (movimiento de entrada).
    2. Decrementar el stock de los `Ingredients` consumidos según la receta (movimientos de salida).
- **`StockService`**: Es el servicio más crítico. Centraliza todos los movimientos de inventario.
    - **`handleInMovement`**: Procesa las entradas de stock, creando o actualizando los lotes (`IngredientLot` o `MenuItemLot`).
    - **`handleOutMovement`**: Procesa las salidas de stock, consumiendo la cantidad requerida de un lote específico y validando que haya stock suficiente.

### 3. Controladores y Endpoints (API)

Los controladores exponen la funcionalidad del módulo a través de una API REST, protegida con guardias de autenticación (`JwtAuthGuard`) y roles (`RolesGuard`).

- **`CategoryController` (`/api/categories`)**: CRUD para las categorías de menú.
- **`IngredientCategoryController` (`/api/ingredient-categories`)**: CRUD para las categorías de ingredientes.
- **`IngredientController` (`/api/ingredients`)**: CRUD para los ingredientes.
- **`MenuItemController` (`/api/menu-items`)**: CRUD para los ítems del menú.
    - `GET /`: Permite filtrar por turno (`shiftId`) y fecha (`date`) para saber si un producto fue producido.
- **`RecipeIngredientController` (`/api/recipe-ingredients`)**: Permite gestionar los ingredientes de una receta.
- **`MealShiftController` (`/api/meal-shifts`)**: Endpoints para registrar la producción de ítems de menú para un turno.
- **`StockController` (`/api/stock`)**:
    - `GET /ingredient/:id/history`: Devuelve el historial de movimientos de un ingrediente.
    - `GET /menu-item/:id/history`: Devuelve el historial de movimientos de un ítem de menú.
    - `POST /movements`: Permite registrar movimientos manuales de stock (ajustes, mermas, etc.).

## Flujo de Funcionamiento Básico

1.  **Configuración Inicial**: Un administrador (`company_admin`) crea las `Categories` e `Ingredients` necesarios para su operación. Al dar de alta un `Ingredient`, se puede registrar una entrada inicial de stock a través de un movimiento en `POST /stock/movements`, especificando un número de lote y costo.
2.  **Creación de Recetas**: Se crea un `MenuItems` de tipo "compuesto" y se le asocian los `Ingredients` necesarios a través del endpoint `POST /recipe-ingredients`.
3.  **Producción**: Antes de un turno, el personal de cocina registra la producción a través de `POST /meal-shifts`. Por ejemplo, producen 50 unidades del "Menú del Día".
    - El sistema automáticamente crea un movimiento de entrada para 50 unidades del `MenuItemLot` "Menú del Día".
    - Simultáneamente, crea movimientos de salida para todos los ingredientes de la receta, descontando las cantidades correspondientes de sus respectivos `IngredientLot`.
4.  **Consulta y Trazabilidad**: En cualquier momento, se puede consultar el stock actual de cualquier producto y ver su historial completo de movimientos a través de los endpoints de `/stock`.


## --- Cambios implementados en stock -----
 Resumen Detallado de Cambios

  Se han implementado dos características principales que se integran profundamente con el módulo de stock.

  1. Factor de Rendimiento (Merma Técnica)


   * Modelo Modificado: `Ingredient` (.../stock/entities/ingredient.entity.ts)
       * Se añadió un nuevo campo: shrinkagePercentage: number. Este campo almacena el porcentaje de merma que tiene un
         ingrediente durante su preparación (ej: 20% para papas por el pelado).

   * DTOs Modificados: `CreateIngredientDto` y `UpdateIngredientDto`
       * Se actualizó el DTO para incluir el campo shrinkagePercentage, permitiendo establecerlo al crear o actualizar un
         ingrediente.


   * Lógica de Negocio Modificada: `MealShiftService` (.../stock/services/meal-shift.service.ts)
       * Se ajustó el método create que gestiona la producción. Ahora, al calcular los ingredientes necesarios para una
         receta, el sistema determina la cantidad bruta a consumir basándose en la cantidad neta de la receta y el
         shrinkagePercentage del ingrediente. El descuento del inventario se realiza sobre esta cantidad bruta, reflejando
         el consumo real.

  2. Gestión y Registro de Mermas (Waste Management)


   * Nuevo Módulo: `waste`
       * Se ha creado una estructura de módulo completamente nueva en src/modules/waste/ para encapsular toda la lógica de
         gestión de desperdicios.


   * Nuevos Objetos:
       * Enum `WasteReason`: Define un conjunto de razones estandarizadas para el desperdicio (SOBRANTE_LINEA,
         ERROR_COCCION, VENCIMIENTO, etc.).
       * Entidad `WasteLog`: Nuevo modelo para persistir cada registro de merma. Es una entidad multi-tenant que se vincula
         a un ingredient o menuItem y registra la cantidad, la razón, la fecha y el usuario que realizó el registro.
       * DTO `CreateWasteLogDto`: Objeto para la transferencia de datos al crear una merma, con validaciones para asegurar
         la integridad de los datos.


   * Nuevos Servicios y Controladores:
       * `WasteService`: Contiene la lógica de negocio. Su función principal, createWasteLog, se integra con el
         StockService para generar automáticamente un movimiento de stock de salida (`OUT`) cada vez que se registra una
         merma, manteniendo el inventario sincronizado.
       * `WasteController`: Expone la funcionalidad a través de la API.


   * Nuevos Endpoints:
       * `POST /waste`: Permite a los administradores (company_admin, kitchen_admin) registrar una nueva merma. El cuerpo
         de la petición debe incluir el ítem o ingrediente, la cantidad y la razón.
       * `GET /waste`: Permite consultar el historial de mermas de la empresa.


   * Integración General:
       * El nuevo WasteModule ha sido registrado en el módulo principal de la aplicación (app.module.ts) para activarlo.

  3. Trazabilidad de Mermas a Nivel de Lote

   Para mejorar la precisión en el seguimiento de desperdicios, se ha modificado la forma en que se registran las mermas, vinculándolas directamente a los lotes.

   * **Modelo Modificado**: `WasteLog` (`.../waste/entities/waste-log.entity.ts`)
       * Se reemplazaron las relaciones directas con `Ingredient` y `MenuItems`.
       * Se añadieron nuevas relaciones `ManyToOne` hacia `IngredientLot` y `MenuItemLot`.
       * Ahora, cada registro de merma está asociado a un lote específico de un ingrediente o de un ítem de menú, permitiendo una trazabilidad exacta del origen del desperdicio. Esto es fundamental para identificar problemas con lotes específicos (ej: un lote cercano a su fecha de vencimiento).