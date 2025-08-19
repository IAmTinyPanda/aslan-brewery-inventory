// src/utils/aslanBranding.js
// Aslan Brewing Brand System

export const aslanColors = {
  primary: '#2D5016',    // Forest green
  secondary: '#8B4513',  // Rich brown  
  accent: '#F4A460',     // Sandy brown
  white: '#FFFFFF',
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827'
  }
};

export const aslanTheme = {
  colors: aslanColors,
  
  // Background classes
  backgrounds: {
    primary: 'bg-aslan-primary',
    secondary: 'bg-aslan-secondary', 
    accent: 'bg-aslan-accent',
    white: 'bg-white',
    gray: 'bg-gray-50'
  },
  
  // Text classes
  text: {
    primary: 'text-aslan-primary',
    secondary: 'text-aslan-secondary',
    accent: 'text-aslan-accent',
    white: 'text-white',
    gray: 'text-gray-600'
  },
  
  // Button styles
  buttons: {
    primary: 'px-4 py-2 bg-aslan-primary text-white rounded-lg hover:bg-aslan-800 transition-colors font-medium',
    secondary: 'px-4 py-2 bg-aslan-secondary text-white rounded-lg hover:bg-aslan-brown-800 transition-colors font-medium',
    accent: 'px-4 py-2 bg-aslan-accent text-white rounded-lg hover:bg-aslan-sand-500 transition-colors font-medium',
    outline: 'px-4 py-2 border-2 border-aslan-primary text-aslan-primary rounded-lg hover:bg-aslan-primary hover:text-white transition-colors font-medium'
  },
  
  // Gradient backgrounds
  gradients: {
    primary: 'bg-gradient-to-r from-aslan-primary to-aslan-900',
    secondary: 'bg-gradient-to-r from-aslan-secondary to-aslan-brown-800',
    warm: 'bg-gradient-to-r from-aslan-secondary to-aslan-accent'
  },
  
  // Card styles
  cards: {
    default: 'bg-white rounded-lg shadow-lg p-6',
    highlighted: 'bg-white rounded-lg shadow-lg p-6 border-l-4 border-aslan-primary'
  },
  
  // Input styles
  inputs: {
    default: 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-aslan-primary focus:border-transparent',
    error: 'w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent'
  }
};

// Role-specific themes
export const roleThemes = {
  foh: {
    primary: aslanColors.primary,
    secondary: aslanColors.accent,
    name: 'Bar Manager',
    description: 'Managing beverages, batch cocktails, and bar operations',
    responsibilities: [
      'Beverage inventory tracking',
      'Batch cocktail recipes', 
      'Bar supplier management',
      'Drink cost analysis'
    ]
  },
  boh: {
    primary: aslanColors.secondary,
    secondary: aslanColors.primary,
    name: 'Chef',
    description: 'Managing kitchen ingredients, recipes, and food operations',
    responsibilities: [
      'Kitchen inventory tracking',
      'Recipe cost calculations',
      'Food supplier management', 
      'Menu profitability analysis'
    ]
  }
};

// Export everything
export default aslanTheme;