#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🦁 Setting up Aslan Brewing Inventory Management System...\n');

// Project structure
const folders = [
  'src/components/layout',
  'src/components/dashboard', 
  'src/components/products',
  'src/components/invoices',
  'src/components/recipes',
  'src/components/inventory',
  'src/components/ai',
  'src/components/shared',
  'src/hooks',
  'src/services',
  'src/utils',
  'src/data',
  'src/store/slices',
  'src/store/middleware',
  'src/styles',
  'public',
  'backend/controllers',
  'backend/models',
  'backend/routes',
  'backend/middleware', 
  'backend/services',
  'backend/config',
  'database/migrations',
  'database/seeders',
  'docs'
];

// Files to create
const files = {
  // Root files
  'package.json': JSON.stringify({
    "name": "aslan-brewery-inventory",
    "version": "1.0.0",
    "private": true,
    "dependencies": {
      "react": "^18.2.0",
      "react-dom": "^18.2.0",
      "react-scripts": "5.0.1",
      "react-router-dom": "^6.8.0",
      "@reduxjs/toolkit": "^1.9.1",
      "react-redux": "^8.0.5",
      "axios": "^1.2.6",
      "lucide-react": "^0.263.1",
      "recharts": "^2.5.0",
      "papaparse": "^5.3.2"
    },
    "devDependencies": {
      "tailwindcss": "^3.2.4",
      "postcss": "^8.4.21",
      "autoprefixer": "^10.4.13"
    },
    "scripts": {
      "start": "react-scripts start",
      "build": "react-scripts build",
      "test": "react-scripts test"
    }
  }, null, 2),

  'tailwind.config.js': `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        'aslan-primary': '#2D5016',
        'aslan-secondary': '#8B4513', 
        'aslan-accent': '#F4A460',
        'aslan-light': '#F5F5DC',
        'aslan-gold': '#DAA520'
      }
    },
  },
  plugins: [],
}`,

  'postcss.config.js': `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`,

  '.env.example': `# API Keys
REACT_APP_OPENAI_API_KEY=your_openai_key_here
REACT_APP_TOAST_API_KEY=your_toast_api_key_here

# Backend Configuration  
REACT_APP_API_URL=http://localhost:3001
REACT_APP_ENV=development

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/aslan_brewery`,

  '.gitignore': `node_modules/
.env
.env.local
/build
npm-debug.log*
.DS_Store`,

  'README.md': `# Aslan Brewing Inventory Management System

🦁 Organic inventory management for sustainable brewery operations

## Quick Start

1. Install dependencies: \`npm install\`
2. Setup environment: \`cp .env.example .env.local\`
3. Start development: \`npm start\`

## Features

- Dashboard with AI insights
- BoH/FoH role separation
- Product management
- Invoice processing
- Recipe builder
- Inventory counting
- TOAST POS integration ready`,

  // Frontend core files
  'src/index.js': `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/globals.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);`,

  'src/App.jsx': `import React from 'react';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-8">
        <h1 className="text-3xl font-bold text-aslan-primary">
          🦁 Aslan Brewing Inventory System
        </h1>
        <p className="text-gray-600 mt-2">
          Framework ready! Start building your modules.
        </p>
      </div>
    </div>
  );
}

export default App;`,

  'src/styles/globals.css': `@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

body {
  font-family: 'Inter', sans-serif;
}`,

  // Component placeholders
  'src/components/layout/Layout.jsx': '// Layout component',
  'src/components/layout/Header.jsx': '// Header component',
  'src/components/layout/Navigation.jsx': '// Navigation component', 
  'src/components/layout/RoleSelector.jsx': '// Role selector component',

  'src/components/dashboard/FinancialDashboard.jsx': '// Financial dashboard',
  'src/components/dashboard/AIInsightsPanel.jsx': '// AI insights panel',
  'src/components/dashboard/MetricCard.jsx': '// Metric card component',

  'src/components/products/ProductList.jsx': '// Product list component',
  'src/components/products/ProductForm.jsx': '// Product form component', 
  'src/components/products/ProductTable.jsx': '// Product table component',
  'src/components/products/SKUGenerator.jsx': '// SKU generator',

  'src/components/invoices/InvoiceList.jsx': '// Invoice list component',
  'src/components/invoices/InvoiceForm.jsx': '// Invoice form component',
  'src/components/invoices/InvoiceLineItems.jsx': '// Invoice line items',

  'src/components/recipes/RecipeList.jsx': '// Recipe list component',
  'src/components/recipes/RecipeBuilder.jsx': '// Recipe builder',
  'src/components/recipes/CostCalculator.jsx': '// Cost calculator',

  'src/components/inventory/InventoryCount.jsx': '// Inventory count component',
  'src/components/inventory/StockLevels.jsx': '// Stock levels component',
  'src/components/inventory/CountScheduler.jsx': '// Count scheduler',

  'src/components/shared/Modal.jsx': '// Modal component',
  'src/components/shared/LoadingSpinner.jsx': '// Loading spinner',
  'src/components/shared/SearchFilter.jsx': '// Search filter',

  // Hooks
  'src/hooks/useRole.js': '// Role management hook',
  'src/hooks/useProducts.js': '// Products hook',
  'src/hooks/useInvoices.js': '// Invoices hook',
  'src/hooks/useRecipes.js': '// Recipes hook',
  'src/hooks/useInventory.js': '// Inventory hook',
  'src/hooks/useDashboard.js': '// Dashboard hook',
  'src/hooks/useAuth.js': '// Authentication hook',

  // Services  
  'src/services/api.js': '// API base service',
  'src/services/productService.js': '// Product service',
  'src/services/invoiceService.js': '// Invoice service',
  'src/services/recipeService.js': '// Recipe service',
  'src/services/inventoryService.js': '// Inventory service',
  'src/services/aiService.js': '// AI service (OpenAI)',
  'src/services/toastIntegration.js': '// TOAST POS integration',

  // Utils
  'src/utils/constants.js': '// App constants',
  'src/utils/aslanBranding.js': '// Aslan brand theme',
  'src/utils/unitConversions.js': '// Unit conversion utilities',
  'src/utils/skuGenerator.js': '// SKU generation logic',
  'src/utils/costCalculations.js': '// Cost calculation utilities',
  'src/utils/rolePermissions.js': '// Role-based permissions',

  // Data
  'src/data/aslanProducts.js': '// Aslan product data (import from CSV)',
  'src/data/suppliers.js': '// Supplier data',
  'src/data/categories.js': '// Category definitions',

  // Store
  'src/store/index.js': '// Redux store setup',
  'src/store/slices/productsSlice.js': '// Products state slice',
  'src/store/slices/invoicesSlice.js': '// Invoices state slice',
  'src/store/slices/recipesSlice.js': '// Recipes state slice',
  'src/store/slices/inventorySlice.js': '// Inventory state slice',
  'src/store/slices/dashboardSlice.js': '// Dashboard state slice',
  'src/store/slices/authSlice.js': '// Auth state slice',
  'src/store/slices/roleSlice.js': '// Role state slice',

  // Public
  'public/index.html': `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#2D5016" />
    <title>Aslan Brewing Inventory</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`,

  // Backend placeholders
  'backend/package.json': JSON.stringify({
    "name": "aslan-brewery-backend",
    "version": "1.0.0",
    "main": "server.js",
    "dependencies": {
      "express": "^4.18.2",
      "cors": "^2.8.5",
      "helmet": "^6.0.1",
      "bcryptjs": "^2.4.3",
      "jsonwebtoken": "^9.0.0",
      "sequelize": "^6.28.0",
      "pg": "^8.8.0",
      "dotenv": "^16.0.3",
      "openai": "^3.2.1"
    },
    "scripts": {
      "start": "node server.js",
      "dev": "nodemon server.js"
    }
  }, null, 2),

  'backend/server.js': '// Express server setup',
  'backend/.env.example': `PORT=3001
DATABASE_URL=postgresql://username:password@localhost:5432/aslan_brewery
JWT_SECRET=your_jwt_secret_here
OPENAI_API_KEY=your_openai_key_here`,

  // Database
  'database/schema.sql': '-- Aslan Brewery database schema',
  'database/migrations/001_initial_setup.sql': '-- Initial database migration',
  'database/seeders/aslan_products_seed.sql': '-- Seed data for Aslan products',

  // Docs
  'docs/API.md': '# API Documentation',
  'docs/SETUP.md': '# Setup Guide', 
  'docs/DEPLOYMENT.md': '# Deployment Guide'
};

// Create folders
console.log('📁 Creating folder structure...');
folders.forEach(folder => {
  const folderPath = path.join(process.cwd(), folder);
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
    console.log(`✓ Created: ${folder}`);
  }
});

// Create files
console.log('\n📄 Creating files...');
Object.entries(files).forEach(([filePath, content]) => {
  const fullPath = path.join(process.cwd(), filePath);
  const dir = path.dirname(fullPath);
  
  // Ensure directory exists
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  // Create file
  fs.writeFileSync(fullPath, content);
  console.log(`✓ Created: ${filePath}`);
});

console.log('\n🎉 Aslan Brewing Inventory System structure created!');
console.log('\n📋 Next steps:');
console.log('1. npm install');
console.log('2. cp .env.example .env.local (add your API keys)');
console.log('3. npm start');
console.log('\n🦁 Ready to brew some organic inventory management!');

// Create a quick start script
const quickStartScript = `#!/bin/bash
echo "🦁 Quick Start - Aslan Brewing Inventory"
echo "Installing dependencies..."
npm install

echo "Setting up Tailwind CSS..."
npx tailwindcss init -p

echo "Copying environment file..."
cp .env.example .env.local

echo "✅ Setup complete!"
echo "🚀 Run 'npm start' to begin development"
`;

fs.writeFileSync('quick-start.sh', quickStartScript);
if (process.platform !== 'win32') {
  fs.chmodSync('quick-start.sh', '755');
}
console.log('✓ Created: quick-start.sh (run this for easy setup)');