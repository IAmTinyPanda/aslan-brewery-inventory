// src/App.jsx - Safe version with error handling
import React, { useState } from 'react';
import { Package, BarChart3, FileText, ChefHat, Utensils, Home } from 'lucide-react';
import './styles/globals.css';

// Import with fallback
let aslanTheme, useRole, ProductList;
try {
  const branding = require('./utils/aslanBranding');
  aslanTheme = branding.aslanTheme || branding.default;
} catch (e) {
  console.warn('Branding file not found, using fallback');
  aslanTheme = {
    gradients: { primary: 'bg-gradient-to-r from-green-800 to-green-900' },
    buttons: { primary: 'px-4 py-2 bg-green-800 text-white rounded-lg hover:bg-green-900 transition-colors font-medium' },
    backgrounds: { primary: 'bg-green-800', accent: 'bg-yellow-600' }
  };
}

try {
  const roleHook = require('./hooks/useRole');
  useRole = roleHook.useRole;
} catch (e) {
  console.warn('Role hook not found, using fallback');
  useRole = () => ({
    role: 'foh',
    setRole: () => {},
    roleInfo: {
      title: 'Bar Manager',
      description: 'Managing beverages and bar operations',
      responsibilities: ['Beverage inventory', 'Bar operations']
    }
  });
}

try {
  const productListComponent = require('./components/products/ProductList');
  ProductList = productListComponent.default;
} catch (e) {
  console.warn('ProductList component not found, using fallback');
  ProductList = ({ role }) => (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Product Management</h1>
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Loading...</h2>
        <p className="text-gray-600">
          Product management system is loading. Make sure all files are in place.
        </p>
      </div>
    </div>
  );
}

function App() {
  const { role, setRole, roleInfo } = useRole();
  const [currentView, setCurrentView] = useState('dashboard');

  // Navigation items based on role
  const getNavigationItems = () => {
    const baseItems = [
      { id: 'dashboard', label: 'Dashboard', icon: Home },
      { id: 'products', label: 'Products', icon: Package }
    ];

    if (role === 'foh') {
      return [
        ...baseItems,
        { id: 'invoices', label: 'Invoices', icon: FileText },
        { id: 'recipes', label: 'Batch Cocktails', icon: Utensils },
        { id: 'inventory', label: 'Bar Inventory', icon: BarChart3 }
      ];
    } else {
      return [
        ...baseItems,
        { id: 'invoices', label: 'Invoices', icon: FileText },
        { id: 'recipes', label: 'Kitchen Recipes', icon: ChefHat },
        { id: 'inventory', label: 'Kitchen Inventory', icon: BarChart3 }
      ];
    }
  };

  const navigationItems = getNavigationItems();

  const renderCurrentView = () => {
    switch (currentView) {
      case 'products':
        return <ProductList role={role} />;
      case 'dashboard':
        return <DashboardView role={role} />;
      case 'invoices':
        return <ComingSoonView title="Invoice Management" role={role} />;
      case 'recipes':
        return <ComingSoonView title={role === 'foh' ? 'Batch Cocktails' : 'Kitchen Recipes'} role={role} />;
      case 'inventory':
        return <ComingSoonView title="Inventory Counting" role={role} />;
      default:
        return <DashboardView role={role} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className={`${aslanTheme.gradients?.primary || 'bg-green-800'} shadow-lg`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Title */}
            <div className="flex items-center space-x-4">
              <div className="text-3xl">🦁</div>
              <div>
                <h1 className="text-xl font-bold text-white">
                  Aslan Brewing Inventory
                </h1>
                <p className="text-sm text-white text-opacity-90">
                  {roleInfo?.description || 'Inventory Management System'}
                </p>
              </div>
            </div>

            {/* Role Selector */}
            <div className="flex items-center space-x-4">
              <div className="text-white text-sm">
                <span className="text-white text-opacity-75">Role:</span>
                <span className="ml-2 font-medium">{roleInfo?.title || 'Bar Manager'}</span>
              </div>
              <div className="flex rounded-lg overflow-hidden border border-white border-opacity-20">
                <button
                  onClick={() => setRole('foh')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    role === 'foh'
                      ? 'bg-white text-green-800'
                      : 'text-white hover:bg-white hover:bg-opacity-10'
                  }`}
                >
                  Bar Manager
                </button>
                <button
                  onClick={() => setRole('boh')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    role === 'boh'
                      ? 'bg-white text-green-800'
                      : 'text-white hover:bg-white hover:bg-opacity-10'
                  }`}
                >
                  Chef
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar Navigation */}
        <nav className="w-64 bg-white shadow-lg min-h-screen">
          <div className="p-4">
            <div className="space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentView(item.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      currentView === item.id
                        ? 'bg-green-800 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Role Info Panel */}
          <div className="p-4 border-t border-gray-200 mt-8">
            <div className="p-4 rounded-lg bg-yellow-100">
              <h3 className="font-semibold text-green-800 mb-2">
                {roleInfo?.title || 'Bar Manager'}
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                {roleInfo?.description || 'Managing beverages and bar operations'}
              </p>
              <div className="text-xs text-gray-500">
                <strong>Focus Areas:</strong>
                <ul className="mt-1 space-y-1">
                  {(roleInfo?.responsibilities || ['Beverage inventory', 'Bar operations']).map((resp, index) => (
                    <li key={index}>• {resp}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {renderCurrentView()}
        </main>
      </div>
    </div>
  );
}

// Dashboard View Component
const DashboardView = ({ role }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          {role === 'foh' ? 'Bar Management Dashboard' : 'Kitchen Management Dashboard'}
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Quick Stats */}
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-800">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-green-800" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Products</p>
              <p className="text-2xl font-bold text-gray-900">
                {JSON.parse(localStorage.getItem('aslan_products') || '[]').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-yellow-600">
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Recent Invoices</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-orange-600">
          <div className="flex items-center">
            <BarChart3 className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Inventory Value</p>
              <p className="text-2xl font-bold text-gray-900">
                ${JSON.parse(localStorage.getItem('aslan_products') || '[]')
                  .reduce((sum, p) => sum + (parseFloat(p.costPerUnit) || 0), 0)
                  .toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Welcome Message */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Welcome to Aslan Brewing Inventory System
        </h2>
        <p className="text-gray-600 mb-4">
          This system is designed to help you manage your {role === 'foh' ? 'bar' : 'kitchen'} operations 
          efficiently. Start by adding products to build your inventory master list.
        </p>
        <div className="bg-yellow-100 p-4 rounded-lg">
          <h3 className="font-medium text-green-800 mb-2">🎯 Next Steps:</h3>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• Add your {role === 'foh' ? 'beverage products' : 'kitchen ingredients'} in the Products section</li>
            <li>• Set up suppliers and cost information</li>
            <li>• Configure serving sizes and target margins</li>
            <li>• Begin tracking invoices and updating costs</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

// Coming Soon View Component
const ComingSoonView = ({ title, role }) => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      
      <div className="bg-white p-12 rounded-lg shadow text-center">
        <div className="text-6xl mb-4">🚧</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Coming Soon</h2>
        <p className="text-gray-600 mb-6">
          This feature is currently under development and will be available soon.
        </p>
      </div>
    </div>
  );
};

export default App;