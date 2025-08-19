// src/data/categories.js
// Enhanced Product Categories with Families and Custom Units

export const fohCategories = {
  // BEER FAMILIES (Parent + Variants)
  beerFamily: {
    id: 'beerFamily',
    name: 'Beer Family (Parent)',
    icon: '🍺',
    description: 'Create a beer style that has multiple package variants',
    subcategories: [
      'Aslan Core Beers',
      'Aslan Seasonal',
      'Aslan Limited Release',
      'Guest Beer Styles'
    ],
    isFamily: true,
    variants: ['draftBeer', 'packagedBeer'] // Can have both draft and packaged variants
  },
  
  draftBeer: {
    id: 'draftBeer',
    name: 'Draft Beer (Variant)',
    icon: '🚰',
    description: 'Individual keg purchases within a beer family',
    subcategories: [
      'Aslan Core - Draft',
      'Aslan Seasonal - Draft', 
      'Aslan Limited - Draft',
      'Guest Taps'
    ],
    isVariant: true,
    parentCategory: 'beerFamily',
    purchaseUnits: [
      { value: 'half-barrel', label: '1/2 BBL (15.5 gal)', oz: 1984 },
      { value: 'sixth-barrel', label: '1/6 BBL (5.16 gal)', oz: 660 }
    ],
    servingOptions: [
      { value: '0.5L', label: '0.5L Pour (~17oz)', oz: 16.9 },
      { value: '0.3L', label: '0.3L Pour (~10oz)', oz: 10.1 },
      { value: '12oz', label: '12oz Pour', oz: 12 },
      { value: '4oz', label: '4oz Pour', oz: 4 },
      { value: '2oz', label: '2oz Taster', oz: 2 },
      { value: '32oz-growler', label: '32oz Growler Fill', oz: 32 },
      { value: '64oz-growler', label: '64oz Growler Fill', oz: 64 },
      { value: '64oz-pitcher', label: '64oz Pitcher', oz: 64 }
    ]
  },

  packagedBeer: {
    id: 'packagedBeer',
    name: 'Packaged Beer (Variant)',
    icon: '🥫',
    description: 'Cans/bottles within a beer family',
    subcategories: [
      'Aslan Cans',
      'Aslan Bottles'
    ],
    isVariant: true,
    parentCategory: 'beerFamily',
    purchaseUnits: [
      { value: 'flat', label: 'Flat (24 × 12oz cans)', oz: 288 },
      { value: 'six-pack', label: 'Six Pack (6 × 12oz)', oz: 72 },
      { value: 'single-can', label: 'Single 12oz Can', oz: 12 },
      { value: 'bottle-500ml', label: '500ml Bottle', oz: 16.9 }
    ],
    servingOptions: [
      { value: 'single-can', label: 'Single 12oz Can', oz: 12 },
      { value: 'single-bottle', label: 'Single 500ml Bottle', oz: 16.9 },
      { value: 'six-pack', label: 'Six Pack', oz: 72 },
      { value: 'flat', label: 'Flat (24 cans)', oz: 288 }
    ]
  },

  // BATCH COCKTAIL FAMILIES
  cocktailFamily: {
    id: 'cocktailFamily',
    name: 'Batch Cocktail Family',
    icon: '🍹',
    description: 'Cocktail recipe with multiple ingredients',
    subcategories: [
      'Margarita Family',
      'Moscow Mule Family',
      'Seasonal Cocktail Family',
      'Sangria Family'
    ],
    isFamily: true,
    batchSize: { gallons: 5, oz: 640, servings: 106.7 }, // 5 gal ÷ 6oz servings
    variants: ['cocktailIngredient']
  },

  cocktailIngredient: {
    id: 'cocktailIngredient',
    name: 'Cocktail Ingredient',
    icon: '🧪',
    description: 'Individual ingredients for batch cocktails',
    subcategories: [
      'Spirits',
      'Liqueurs', 
      'Mixers',
      'Fresh Ingredients',
      'Syrups',
      'Garnishes'
    ],
    isVariant: true,
    parentCategory: 'cocktailFamily',
    hasCustomUnits: true,
    customUnits: [
      { value: 'ml', label: 'Milliliters (ml)', ozConversion: 0.033814 },
      { value: 'liters', label: 'Liters (L)', ozConversion: 33.814 },
      { value: 'oz', label: 'Fluid Ounces (oz)', ozConversion: 1 },
      { value: 'gallons', label: 'Gallons (gal)', ozConversion: 128 },
      { value: 'bottles-750ml', label: '750ml Bottles', ozConversion: 25.36 },
      { value: 'bottles-1L', label: '1L Bottles', ozConversion: 33.814 }
    ]
  },

  // INDIVIDUAL CATEGORIES (No Families)
  cider: {
    id: 'cider',
    name: 'Cider',
    icon: '🍎',
    subcategories: ['Draft Cider', 'Guest Cider'],
    purchaseUnits: [
      { value: 'half-barrel', label: '1/2 BBL (15.5 gal)', oz: 1984 }
    ],
    servingOptions: [
      { value: '12oz', label: '12oz Pour', oz: 12 },
      { value: '4oz', label: '4oz Pour', oz: 4 },
      { value: '2oz', label: '2oz Taster', oz: 2 }
    ]
  },

  kombucha: {
    id: 'kombucha',
    name: 'Kombucha',
    icon: '🫧',
    subcategories: ['Draft Kombucha', 'Guest Kombucha'],
    purchaseUnits: [
      { value: 'sixth-barrel', label: '1/6 BBL (5.16 gal)', oz: 660 }
    ],
    servingOptions: [
      { value: '12oz', label: '12oz Pour', oz: 12 },
      { value: '4oz', label: '4oz Pour', oz: 4 },
      { value: '2oz', label: '2oz Taster', oz: 2 }
    ]
  },

  wine: {
    id: 'wine',
    name: 'Wine', 
    icon: '🍷',
    subcategories: ['Red Wine', 'White Wine', 'Rosé Wine', 'Sparkling Wine'],
    purchaseUnits: [
      { value: 'bottle-750ml', label: '750ml Bottle', oz: 25.36 },
      { value: 'case-wine', label: 'Case (12 × 750ml)', oz: 304.32 }
    ],
    servingOptions: [
      { value: '5oz-glass', label: '5oz Glass', oz: 5 },
      { value: '6oz-glass', label: '6oz Glass', oz: 6 },
      { value: '9oz-glass', label: '9oz Glass', oz: 9 },
      { value: 'bottle', label: 'Bottle (750ml)', oz: 25.36 }
    ]
  },

  naBeverages: {
    id: 'naBeverages',
    name: 'N/A Beverages',
    icon: '🥤',
    subcategories: [
      'Fountain Drinks',
      'Hop Water', 
      'Coffee',
      'Kids Drinks',
      'Non-Alcoholic Beer'
    ],
    hasCustomUnits: true,
    purchaseUnits: [
      // Fountain drinks
      { value: 'syrup-2.5gal', label: '2.5 Gal Syrup Bag', oz: 1200, dilutionRatio: 5 }, // 2.5 gal × 1:5 = 12.5 gal final
      { value: 'syrup-5gal', label: '5 Gal Syrup Bag', oz: 2400, dilutionRatio: 5 }, // 5 gal × 1:5 = 25 gal final
      // Hop water  
      { value: 'half-barrel-hopwater', label: '1/2 BBL Hop Water', oz: 1984 },
      { value: 'sixth-barrel-hopwater', label: '1/6 BBL Hop Water', oz: 660 },
      // Coffee
      { value: '5lb-coffee', label: '5lb Coffee Bag', cups: 160 }, // 32 cups/lb × 5lb
      // Kids drinks
      { value: 'gallon-milk', label: 'Gallon Milk/Juice', oz: 128 },
      // NA Beer cases
      { value: 'case-24x12oz', label: 'Case (24 × 12oz)', oz: 288 },
      { value: 'case-24x16oz', label: 'Case (24 × 16oz)', oz: 384 }
    ],
    servingOptions: [
      { value: '0.5L-fountain', label: '0.5L Fountain', oz: 16.9 },
      { value: '0.3L-fountain', label: '0.3L Fountain', oz: 10.1 },
      { value: '16oz-kids', label: '16oz Kids', oz: 16 },
      { value: '8oz-coffee', label: '8oz Coffee', oz: 8 },
      { value: '12oz-hopwater', label: '12oz Hop Water', oz: 12 },
      { value: '12oz-nabeer', label: '12oz NA Beer', oz: 12 },
      { value: '16oz-nabeer', label: '16oz NA Beer', oz: 16 }
    ]
  },

  retail: {
    id: 'retail',
    name: 'Retail (Merchandise)',
    icon: '👕',
    subcategories: [
      'T-Shirts', 'Hoodies', 'Hats', 'Glassware', 
      'Accessories', 'Gift Cards', 'Growlers'
    ],
    purchaseUnits: [
      { value: 'item', label: 'Individual Item', quantity: 1 }
    ],
    servingOptions: [
      { value: 'item', label: 'Individual Item', quantity: 1 }
    ]
  }
};

// Enhanced conversion functions
export const calculateServings = (purchaseUnit, purchaseQuantity, servingSize, servingUnit, category) => {
  const categoryData = fohCategories[category];
  if (!categoryData) return 0;

  // Find purchase unit data
  const purchaseUnitData = categoryData.purchaseUnits?.find(unit => unit.value === purchaseUnit);
  if (!purchaseUnitData) return 0;

  // Find serving option data
  const servingOptionData = categoryData.servingOptions?.find(option => option.value === servingUnit);
  if (!servingOptionData) return 0;

  let totalOz = 0;
  
  // Handle special cases
  if (purchaseUnitData.dilutionRatio) {
    // Fountain drinks with syrup dilution
    totalOz = purchaseUnitData.oz * purchaseUnitData.dilutionRatio * purchaseQuantity;
  } else if (purchaseUnitData.cups) {
    // Coffee - convert cups to servings
    return purchaseUnitData.cups * purchaseQuantity; // Direct cup count
  } else if (purchaseUnitData.quantity) {
    // Retail items
    return purchaseUnitData.quantity * purchaseQuantity;
  } else {
    // Standard liquid conversion
    totalOz = purchaseUnitData.oz * purchaseQuantity;
  }

  // Calculate servings
  if (servingOptionData.oz) {
    return totalOz / servingOptionData.oz;
  } else if (servingOptionData.quantity) {
    return purchaseQuantity / servingOptionData.quantity;
  }

  return 0;
};

// Custom unit conversion helper
export const convertCustomUnit = (amount, fromUnit, toOz = true) => {
  const cocktailIngredient = fohCategories.cocktailIngredient;
  const unitData = cocktailIngredient.customUnits.find(unit => unit.value === fromUnit);
  
  if (!unitData) return amount; // Fallback
  
  return toOz ? amount * unitData.ozConversion : amount / unitData.ozConversion;
};

export default fohCategories;