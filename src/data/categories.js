// src/data/categories.js - Recipe Builder & Multiple Serving Architecture
// Updated to match actual Aslan brewery operations

export const fohCategories = {
  // ===================
  // INDIVIDUAL INGREDIENTS (Master List)
  // ===================
  spirits: {
    id: 'spirits',
    name: 'Spirits & Liquors',
    icon: '🥃',
    description: 'Base spirits for batch cocktails',
    productType: 'ingredient',
    subcategories: [
      'Tequila',
      'Vodka', 
      'Whiskey',
      'Rum',
      'Gin',
      'Liqueurs'
    ],
    purchaseUnits: [
      { value: 'bottle-750ml', label: '750ml Bottle', liters: 0.75 },
      { value: 'bottle-1L', label: '1L Bottle', liters: 1.0 },
      { value: 'bottle-1.75L', label: '1.75L Bottle', liters: 1.75 }
    ],
    // No serving options - these are ingredients only
    usedInRecipes: true
  },

  mixers: {
    id: 'mixers',
    name: 'Mixers & Syrups',
    icon: '🧪',
    description: 'Non-alcoholic mixers for batch cocktails',
    productType: 'ingredient',
    subcategories: [
      'Fresh Juices',
      'Simple Syrups',
      'Agave Syrups',
      'Bitters',
      'Sodas'
    ],
    purchaseUnits: [
      { value: 'gallon', label: 'Gallon', liters: 3.785 },
      { value: 'bottle-1.89L', label: '1.89L Bottle', liters: 1.89 },
      { value: 'liter', label: 'Liter', liters: 1.0 },
      { value: 'bottle-750ml', label: '750ml Bottle', liters: 0.75 }
    ],
    usedInRecipes: true
  },

  // ===================
  // RECIPE-BASED FINAL PRODUCTS
  // ===================
  batchCocktails: {
    id: 'batchCocktails',
    name: 'Batch Cocktails',
    icon: '🍹',
    description: 'Recipe-based cocktails served on tap',
    productType: 'final',
    isRecipeBased: true,
    subcategories: [
      'Margarita Family',
      'Moscow Mule Family',
      'Seasonal Cocktails',
      'Sangria Family'
    ],
    // Recipe output specs
    batchOutput: {
      gallons: 5,
      liters: 18.93,
      servings: 106.7 // 5 gal ÷ 6oz servings
    },
    // Multiple serving options for same recipe
    servingOptions: [
      { value: '6oz-cocktail', label: '6oz Cocktail', oz: 6, ml: 177 },
      { value: '9oz-cocktail', label: '9oz Large Cocktail', oz: 9, ml: 266 },
      { value: '2oz-sample', label: '2oz Sample', oz: 2, ml: 59 }
    ],
    recipeIngredients: true // Requires recipe builder
  },

  // ===================
  // BEER FAMILIES WITH MULTIPLE VARIANTS & SERVINGS
  // ===================
  beerFamily: {
    id: 'beerFamily',
    name: 'Beer Family',
    icon: '🍺',
    description: 'Beer style with multiple purchase formats and serving options',
    productType: 'final',
    isFamily: true,
    subcategories: [
      'Aslan Core Beers',
      'Aslan Seasonal',
      'Aslan Limited Release',
      'Guest Beer Styles'
    ],
    variants: {
      draftBeer: {
        name: 'Draft Beer',
        icon: '🚰',
        purchaseUnits: [
          { value: 'half-barrel', label: '1/2 BBL (15.5 gal)', liters: 58.67, oz: 1984 },
          { value: 'sixth-barrel', label: '1/6 BBL (5.16 gal)', liters: 19.53, oz: 660 }
        ],
        servingOptions: [
          { value: '0.5L', label: '0.5L Pour (~17oz)', oz: 16.9, ml: 500 },
          { value: '0.3L', label: '0.3L Pour (~10oz)', oz: 10.1, ml: 300 },
          { value: '12oz', label: '12oz Pour', oz: 12, ml: 355 },
          { value: '4oz', label: '4oz Pour', oz: 4, ml: 118 },
          { value: '2oz-taster', label: '2oz Taster', oz: 2, ml: 59 },
          { value: '32oz-growler', label: '32oz Growler Fill', oz: 32, ml: 946 },
          { value: '64oz-growler', label: '64oz Growler Fill', oz: 64, ml: 1893 },
          { value: '64oz-pitcher', label: '64oz Pitcher', oz: 64, ml: 1893 },
          { value: 'whole-keg', label: 'Whole Keg Sale', isWhole: true }
        ]
      },
      packagedBeer: {
        name: 'Packaged Beer',
        icon: '🥫',
        purchaseUnits: [
          { value: 'flat', label: 'Flat (24 × 12oz cans)', cans: 24, totalOz: 288 },
          { value: 'six-pack', label: 'Six Pack (6 × 12oz)', cans: 6, totalOz: 72 },
          { value: 'single-can', label: 'Single 12oz Can', cans: 1, totalOz: 12 }
        ],
        servingOptions: [
          { value: 'single-can', label: 'Single 12oz Can', cans: 1, oz: 12 },
          { value: 'six-pack', label: 'Six Pack', cans: 6, oz: 72 },
          { value: 'whole-flat', label: 'Whole Flat (24 cans)', cans: 24, oz: 288 }
        ]
      }
    },
    requiresToastSku: true
  },

  // ===================
  // SIMPLE FINAL PRODUCTS (No Recipes, Single Serving)
  // ===================
  wine: {
    id: 'wine',
    name: 'Wine', 
    icon: '🍷',
    description: 'Wine purchased by case, sold by glass',
    productType: 'final',
    subcategories: ['Red Wine', 'White Wine', 'Rosé Wine', 'Sparkling Wine'],
    purchaseUnits: [
      { value: 'case-wine', label: 'Case (12 × 750ml)', bottles: 12, totalOz: 304.32 },
      { value: 'bottle-750ml', label: '750ml Bottle', bottles: 1, totalOz: 25.36 }
    ],
    servingOptions: [
      { value: '6oz-glass', label: '6oz Glass', oz: 6, ml: 177 }
    ]
  },

  cider: {
    id: 'cider',
    name: 'Cider',
    icon: '🍎',
    productType: 'final',
    subcategories: ['Draft Cider', 'Guest Cider'],
    purchaseUnits: [
      { value: 'half-barrel', label: '1/2 BBL (15.5 gal)', liters: 58.67, oz: 1984 }
    ],
    servingOptions: [
      { value: '12oz', label: '12oz Pour', oz: 12 },
      { value: '4oz', label: '4oz Pour', oz: 4 }
    ]
  },

  retail: {
    id: 'retail',
    name: 'Retail & Merchandise',
    icon: '👕',
    productType: 'final',
    subcategories: [
      'T-Shirts', 'Hoodies', 'Hats', 'Glassware', 
      'Accessories', 'Gift Cards', 'Growlers'
    ],
    purchaseUnits: [
      { value: 'item', label: 'Individual Item', quantity: 1 }
    ],
    servingOptions: [
      { value: 'item', label: 'Individual Item', quantity: 1 }
    ],
    simpleMargin: true
  }
};

// ===================
// RECIPE BUILDER FUNCTIONS
// ===================

/**
 * Recipe Builder for Batch Cocktails
 * Pulls costs from existing ingredient products
 */
export class RecipeBuilder {
  constructor(existingProducts) {
    this.ingredients = existingProducts.filter(p => p.productType === 'ingredient');
  }

  /**
   * Calculate recipe cost from ingredient list
   * @param {Array} recipeIngredients - [{productId, quantityLiters}, ...]
   * @returns {Object} - {totalCost, costPerLiter, costPerServing, servingsPerBatch}
   */
  calculateRecipeCost(recipeIngredients) {
    let totalCost = 0;
    let totalLiters = 0;
    const ingredientCosts = [];

    recipeIngredients.forEach(ingredient => {
      const product = this.ingredients.find(p => p.id === ingredient.productId);
      if (!product) return;

      // Calculate cost per liter from product purchase data
      const costPerUnit = parseFloat(product.costPerUnit) || 0;
      const unitSize = parseFloat(product.unitSize) || 0;
      
      // Convert unit to liters based on unit type
      let unitLiters = 0;
      switch (product.unitType) {
        case 'bottle-750ml':
          unitLiters = 0.75 * unitSize;
          break;
        case 'bottle-1L':
          unitLiters = 1.0 * unitSize;
          break;
        case 'bottle-1.75L':
          unitLiters = 1.75 * unitSize;
          break;
        case 'gallon':
          unitLiters = 3.785 * unitSize;
          break;
        case 'bottle-1.89L':
          unitLiters = 1.89 * unitSize;
          break;
        case 'liter':
          unitLiters = 1.0 * unitSize;
          break;
        default:
          unitLiters = unitSize; // Assume liters if unknown
      }
      
      if (unitLiters > 0) {
        const costPerLiter = costPerUnit / unitLiters;
        const ingredientCost = costPerLiter * ingredient.quantityLiters;
        
        totalCost += ingredientCost;
        totalLiters += ingredient.quantityLiters;
        
        ingredientCosts.push({
          name: product.name,
          quantityLiters: ingredient.quantityLiters,
          costPerLiter,
          totalCost: ingredientCost,
          percentage: 0 // Will calculate after total is known
        });
      }
    });

    // Calculate percentages
    ingredientCosts.forEach(ing => {
      ing.percentage = totalCost > 0 ? (ing.totalCost / totalCost) * 100 : 0;
    });

    const batchOutput = fohCategories.batchCocktails.batchOutput;
    const costPerLiter = totalCost / batchOutput.liters;
    const costPerServing = totalCost / batchOutput.servings;

    return {
      totalCost,
      totalLiters,
      costPerLiter,
      costPerServing,
      servingsPerBatch: batchOutput.servings,
      ingredientBreakdown: ingredientCosts
    };
  }

  /**
   * Get available ingredients for recipe building
   */
  getAvailableIngredients() {
    return this.ingredients.map(ingredient => ({
      id: ingredient.id,
      name: ingredient.name,
      category: ingredient.category,
      subcategory: ingredient.subcategory,
      costPerUnit: ingredient.costPerUnit,
      unitType: ingredient.unitType,
      supplier: ingredient.supplier
    }));
  }
}

// ===================
// MULTIPLE SERVING CALCULATIONS
// ===================

/**
 * Calculate servings for products with multiple serving options
 * @param {Object} product - Product with purchase and serving data
 * @param {string} servingOptionValue - Selected serving option
 * @returns {number} - Number of servings possible
 */
export const calculateMultipleServings = (product, servingOptionValue) => {
  const category = fohCategories[product.category];
  if (!category) return 0;

  // Handle beer families with variants
  if (category.variants && product.variantType) {
    const variant = category.variants[product.variantType];
    if (!variant) return 0;

    const purchaseUnit = variant.purchaseUnits?.find(unit => unit.value === product.unitType);
    const servingOption = variant.servingOptions?.find(option => option.value === servingOptionValue);
    
    if (!purchaseUnit || !servingOption) return 0;

    // Handle whole unit sales (whole keg, whole flat)
    if (servingOption.isWhole) return parseFloat(product.unitSize) || 1;

    // Calculate servings based on volume
    if (purchaseUnit.oz && servingOption.oz) {
      const totalOz = purchaseUnit.oz * parseFloat(product.unitSize);
      return totalOz / servingOption.oz;
    }
    
    if (purchaseUnit.cans && servingOption.cans) {
      const totalCans = purchaseUnit.cans * parseFloat(product.unitSize);
      return Math.floor(totalCans / servingOption.cans);
    }

    if (purchaseUnit.totalOz && servingOption.oz) {
      const totalOz = purchaseUnit.totalOz * parseFloat(product.unitSize);
      return totalOz / servingOption.oz;
    }
  }

  // Handle simple categories
  const purchaseUnit = category.purchaseUnits?.find(unit => unit.value === product.unitType);
  const servingOption = category.servingOptions?.find(option => option.value === servingOptionValue);
  
  if (!purchaseUnit || !servingOption) return 0;

  // Wine case to glass calculation
  if (purchaseUnit.bottles && servingOption.oz) {
    const totalBottles = purchaseUnit.bottles * parseFloat(product.unitSize);
    const ozPerBottle = 25.36; // 750ml = 25.36 oz
    const totalOz = totalBottles * ozPerBottle;
    return totalOz / servingOption.oz;
  }

  // Standard liquid calculations
  if (purchaseUnit.totalOz && servingOption.oz) {
    const totalOz = purchaseUnit.totalOz * parseFloat(product.unitSize);
    return totalOz / servingOption.oz;
  }

  if (purchaseUnit.liters && servingOption.ml) {
    const totalMl = purchaseUnit.liters * parseFloat(product.unitSize) * 1000;
    return totalMl / servingOption.ml;
  }

  // Retail items (1:1)
  if (purchaseUnit.quantity && servingOption.quantity) {
    return (purchaseUnit.quantity * parseFloat(product.unitSize)) / servingOption.quantity;
  }

  return 0;
};

/**
 * Auto-update recipe costs when ingredient costs change
 * @param {Array} allProducts - All products including recipes
 * @param {string} changedIngredientId - ID of ingredient that changed
 * @returns {Array} - Updated products with recalculated recipe costs
 */
export const updateRecipeCosts = (allProducts, changedIngredientId) => {
  const recipeBuilder = new RecipeBuilder(allProducts);
  
  return allProducts.map(product => {
    // Only update recipe-based products that use the changed ingredient
    if (product.isRecipeBased && product.recipeIngredients) {
      const usesChangedIngredient = product.recipeIngredients.some(
        ing => ing.productId === changedIngredientId
      );
      
      if (usesChangedIngredient) {
        const newCosts = recipeBuilder.calculateRecipeCost(product.recipeIngredients);
        return {
          ...product,
          costPerServing: newCosts.costPerServing,
          totalRecipeCost: newCosts.totalCost,
          ingredientBreakdown: newCosts.ingredientBreakdown,
          updatedAt: new Date().toISOString()
        };
      }
    }
    
    return product;
  });
};

export default fohCategories;