// src/data/categories.js
export const fohCategories = {
  beerFamily: {
    name: 'Beer Family',
    icon: '🍺',
    productType: 'manufactured', // We make this in-house
    isFamily: true,
    purchaseFormats: {
      draft: {
        name: 'Draft',
        icon: '🚰',
        purchaseUnits: [
          { value: 'half_bbl', label: '1/2 BBL (15.5 gal)' },
          { value: 'sixth_bbl', label: '1/6 BBL (5.16 gal)' }
        ],
        servingOptions: [
          { value: 'pint_16', label: '16oz Pint', defaultSize: 16, unit: 'oz' },
          { value: 'pint_20', label: '20oz Imperial Pint', defaultSize: 20, unit: 'oz' },
          { value: 'half_pint', label: '8oz Half Pint', defaultSize: 8, unit: 'oz' },
          { value: 'flight', label: '4oz Flight', defaultSize: 4, unit: 'oz' },
          { value: 'growler_32', label: '32oz Growler', defaultSize: 32, unit: 'oz' },
          { value: 'growler_64', label: '64oz Growler', defaultSize: 64, unit: 'oz' }
        ]
      },
      packaged: {
        name: 'Packaged',
        icon: '📦',
        purchaseUnits: [
          { value: 'case_24', label: 'Case (24 Cans)' },
          { value: 'case_12', label: 'Case (12 Bottles)' }
        ],
        servingOptions: [
          { value: 'single_can', label: 'Single Can', defaultSize: 12, unit: 'oz' },
          { value: 'six_pack', label: 'Six Pack', defaultSize: 6, unit: 'cans' },
          { value: 'full_case', label: 'Full Case', defaultSize: 24, unit: 'cans' },
          { value: 'single_bottle', label: 'Single Bottle', defaultSize: 12, unit: 'oz' }
        ]
      }
    },
    subcategories: ['Flagship', 'Seasonal'],
    requiresManualSKU: true // SKUs entered per serving option
  },

  wine: {
    name: 'Wine',
    icon: '🍷',
    productType: 'purchased',
    subcategories: [
      'Red Wine', 'White Wine', 'Rosé', 'Sparkling Wine', 
      'Dessert Wine', 'Fortified Wine'
    ],
    purchaseUnits: [
      { value: 'bottle', label: 'Bottle (750ml)' },
      { value: 'case_12', label: 'Case (12 bottles)' },
      { value: 'magnum', label: 'Magnum (1.5L)' }
    ],
    servingOptions: [
      { value: 'glass_5oz', label: '5oz Glass', defaultSize: 5, unit: 'oz' },
      { value: 'glass_6oz', label: '6oz Glass', defaultSize: 6, unit: 'oz' },
      { value: 'glass_8oz', label: '8oz Glass', defaultSize: 8, unit: 'oz' },
      { value: 'half_bottle', label: 'Half Bottle', defaultSize: 375, unit: 'ml' },
      { value: 'full_bottle', label: 'Full Bottle', defaultSize: 750, unit: 'ml' }
    ],
    requiresManualSKU: false // Auto-generated, but can be overridden per serving
  },

  cider: {
    name: 'Cider',
    icon: '🍎',
    productType: 'purchased',
    subcategories: ['Traditional Cider', 'Fruit Cider', 'Hopped Cider', 'Sour Cider'],
    purchaseUnits: [
      { value: 'half_bbl', label: '1/2 BBL (15.5 gal)' },
      { value: 'sixth_bbl', label: '1/6 BBL (5.16 gal)' },
      { value: 'case_24', label: 'Case (24 Cans)' }
    ],
    servingOptions: [
      { value: 'pint_16', label: '16oz Pint', defaultSize: 16, unit: 'oz' },
      { value: 'pint_20', label: '20oz Imperial Pint', defaultSize: 20, unit: 'oz' },
      { value: 'half_pint', label: '8oz Half Pint', defaultSize: 8, unit: 'oz' },
      { value: 'flight', label: '4oz Flight', defaultSize: 4, unit: 'oz' }
    ],
    requiresManualSKU: false
  },

  kombucha: {
    name: 'Kombucha',
    icon: '🫧',
    productType: 'purchased',
    subcategories: ['Gingerade', 'Seasonal Flavor', 'Traditional'],
    purchaseUnits: [
      { value: 'half_bbl', label: '1/2 BBL (15.5 gal)' },
      { value: 'sixth_bbl', label: '1/6 BBL (5.16 gal)' },
      { value: 'case_24', label: 'Case (24 Cans)' }
    ],
    servingOptions: [
      { value: 'pint_16', label: '16oz Pint', defaultSize: 16, unit: 'oz' },
      { value: 'half_pint', label: '8oz Half Pint', defaultSize: 8, unit: 'oz' },
      { value: 'flight', label: '4oz Flight', defaultSize: 4, unit: 'oz' }
    ],
    requiresManualSKU: false
  },

  batchCocktails: {
    name: 'Batch Cocktails',
    icon: '🍹',
    productType: 'recipe-based', // Made from recipes
    subcategories: ['Margarita Family', 'Whiskey Cocktails', 'Gin Cocktails', 'Vodka Cocktails', 'Seasonal Cocktails'],
    // No purchase units - these are made from recipes
    servingOptions: [
      { value: 'cocktail_single', label: 'Single Cocktail', defaultSize: 8, unit: 'oz' },
      { value: 'cocktail_double', label: 'Double Cocktail', defaultSize: 16, unit: 'oz' },
      { value: 'pitcher', label: 'Pitcher', defaultSize: 64, unit: 'oz' },
      { value: 'half_pitcher', label: 'Half Pitcher', defaultSize: 32, unit: 'oz' }
    ],
    requiresRecipe: true, // Links to recipe system
    requiresManualSKU: false
  },

  spirits: {
    name: 'Spirits & Liquors',
    icon: '🥃',
    productType: 'purchased',
    isIngredient: true, // Used for making batch cocktails
    subcategories: [
      'Whiskey', 'Vodka', 'Gin', 'Rum', 'Tequila', 'Brandy', 
      'Liqueurs', 'Bitters', 'Vermouth'
    ],
    purchaseUnits: [
      { value: 'bottle_750ml', label: '750ml Bottle' },
      { value: 'bottle_1L', label: '1L Bottle' },
      { value: 'bottle_1_75L', label: '1.75L Bottle' },
      { value: 'case_12', label: 'Case (12 bottles)' }
    ],
    // Spirits are ingredients - serving options for costing purposes
    servingOptions: [
      { value: 'shot_1_5oz', label: '1.5oz Shot', defaultSize: 1.5, unit: 'oz' },
      { value: 'shot_1oz', label: '1oz Shot', defaultSize: 1, unit: 'oz' },
      { value: 'half_shot', label: '0.5oz Half Shot', defaultSize: 0.5, unit: 'oz' }
    ],
    requiresManualSKU: false
  },

  naBeverages: {
    name: 'N/A Beverages',
    icon: '🥤',
    productType: 'purchased',
    subcategories: ['Soda', 'Coffee', 'Iced Tea', 'Lemonade', 'Juice', 'Milk', 'N/A Beer Cans'],
    purchaseUnits: [
      { value: 'case_24', label: 'Case (24 cans)' },
      { value: 'bag_2_5gal', label: '2.5 Gal Syrup Bag' },
      { value: 'bag_5gal', label: '5 Gal Syrup Bag' },
      { value: 'bag_5lb', label: '5lb Coffee Bag' },
      { value: 'jug_1gal', label: '1 Gallon Jug' },
      { value: 'bottle', label: 'Individual Bottle' },
      { value: 'can', label: 'Individual Can' }
    ],
    servingOptions: [
      { value: 'glass_12oz', label: '12oz Glass', defaultSize: 12, unit: 'oz' },
      { value: 'glass_16oz', label: '16oz Glass', defaultSize: 16, unit: 'oz' },
      { value: 'glass_20oz', label: '20oz Glass', defaultSize: 20, unit: 'oz' },
      { value: 'can_12oz', label: '12oz Can', defaultSize: 12, unit: 'oz' },
      { value: 'bottle_12oz', label: '12oz Bottle', defaultSize: 12, unit: 'oz' },
      { value: 'cup_8oz', label: '8oz Cup (Coffee)', defaultSize: 8, unit: 'oz' },
      { value: 'cup_12oz', label: '12oz Cup (Coffee)', defaultSize: 12, unit: 'oz' },
      { value: 'cup_16oz', label: '16oz Cup (Coffee)', defaultSize: 16, unit: 'oz' }
    ],
    requiresManualSKU: false
  },

  retail: {
    name: 'Retail & Merchandise',
    icon: '👕',
    productType: 'purchased',
    subcategories: ['Apparel', 'Glassware', 'Accessories', 'Gift Cards'],
    purchaseUnits: [
      { value: 'individual', label: 'Individual Item' },
      { value: 'case', label: 'Case/Box' },
      { value: 'dozen', label: 'Dozen (12 items)' }
    ],
    servingOptions: [
      { value: 'individual', label: 'Individual Item', defaultSize: 1, unit: 'item' }
    ],
    requiresManualSKU: false
  }
};

// Utility functions for calculations
export const calculateServingsFromPurchase = (purchaseUnit, purchaseQuantity, servingSize, servingUnit) => {
  const conversions = {
    // Volume conversions to oz
    'half_bbl': 15.5 * 128, // 15.5 gallons to oz
    'sixth_bbl': 5.16 * 128, // 5.16 gallons to oz
    'bottle_750ml': 25.36, // 750ml to oz
    'bottle_1L': 33.81, // 1L to oz
    'bottle_1_75L': 59.17, // 1.75L to oz
    'bag_2_5gal': 2.5 * 128, // 2.5 gallons to oz
    'bag_5gal': 5 * 128, // 5 gallons to oz
    'jug_1gal': 128, // 1 gallon to oz
    
    // Count-based units
    'case_24': 24,
    'case_12': 12,
    'dozen': 12,
    'individual': 1,
    'bottle': 1,
    'can': 1
  };

  const purchaseInBaseUnit = conversions[purchaseUnit] || purchaseQuantity;
  const totalPurchased = purchaseInBaseUnit * purchaseQuantity;

  // Convert serving size to same base unit
  let servingInBaseUnit = servingSize;
  
  // Handle unit conversions for servings
  if (servingUnit === 'ml' && (purchaseUnit.includes('bottle') || purchaseUnit.includes('bag') || purchaseUnit.includes('jug'))) {
    servingInBaseUnit = servingSize * 0.033814; // ml to oz
  } else if (servingUnit === 'cans' || servingUnit === 'item') {
    servingInBaseUnit = servingSize; // Count-based
  }

  return totalPurchased / servingInBaseUnit;
};

export const generateSKU = (productName, category, servingOption) => {
  const categoryPrefixes = {
    beerFamily: 'ASL-BER',
    wine: 'ASL-WIN',
    cider: 'ASL-CDR',
    kombucha: 'ASL-KMB',
    batchCocktails: 'ASL-CTL',
    spirits: 'ASL-SPR',
    naBeverages: 'ASL-NAB',
    retail: 'ASL-RTL'
  };

  const nameCode = productName.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, '');
  const servingCode = servingOption.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, '');
  const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  
  return `${categoryPrefixes[category] || 'ASL-GEN'}-${nameCode}-${servingCode}-${randomNum}`;
};

export default fohCategories;