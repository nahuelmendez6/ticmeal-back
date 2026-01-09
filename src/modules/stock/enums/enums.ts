/**
 * Mapea los choices de la categoria MenuItems
 */
export enum MenuItemCategory {
  // Bebidas
  DRINK_HOT = 'drink_hot',
  DRINK_COLD = 'drink_cold',
  BEVERAGE_SUGAR_FREE = 'beverage_sugar_free',

  // Panificados y snacks
  BAKERY = 'bakery',
  SNACK = 'snack',

  // Postres y frutas
  DESSERT = 'dessert',
  FRUIT = 'fruit',

  // Comidas por tipo
  MAIN_COURSE = 'main_course',
  SIDE_DISH = 'side_dish',
  SOUP = 'soup',
  SALAD = 'salad',
  PASTA = 'pasta',
  SANDWICH = 'sandwich',
  MEAT = 'meat',
  POULTRY = 'poultry',
  FISH = 'fish',

  // Lácteos y alimentos
  DAIRY = 'dairy',
  CEREAL = 'cereal',
  LEGUME = 'legume',

  // Dietas especiales
  VEGAN = 'vegan',
  VEGETARIAN = 'vegetarian',
  GLUTEN_FREE = 'gluten_free',
  LOW_SUGAR = 'low_sugar',
  SPECIAL_DIET = 'special_diet',
  INFANT_FOOD = 'infant_food',

  // Otras
  COMBO = 'combo',
  OTHER = 'other',
}

/**
 * Mapea choices de la unidad de medida de Ingredient
 */
export enum IngredientUnit {
  UNIT = 'unit',
  GRAMS = 'g',
  KILOGRAMS = 'kg',
  MILLILITERS = 'ml',
  LITERS = 'l',
}

/**
 * Mapea los choices del tipo de costo de Ingredient de Django.
 */
export enum IngredientCostType {
  PER_UNIT = 'per_unit',
  PER_WEIGHT = 'per_weight', // (Por peso/volumen en el original)
}

/**
 * Mapea los choices del tipo de movimiento de StockMovement de Django.
 */
export enum MovementType {
  IN = 'in', // Ingreso
  OUT = 'out', // Egreso
  ADJUSTMENT = 'adjustment', // Ajuste
  WASTE = 'waste', // Merma
}
