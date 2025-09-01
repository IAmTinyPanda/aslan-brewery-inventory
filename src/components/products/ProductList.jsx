// src/components/products/ProductList.jsx - Clean implementation
import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Package, Beaker, Eye, BarChart3 } from 'lucide-react';
import { fohCategories } from '../../data/categories';
import ProductForm from './ProductForm';
import RecipeBuilderComponent from './RecipeBuilderComponent';
import ProductTable from './ProductTable';

const ProductList = ({ role = 'foh' }) => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [isRecipeFormOpen, setIsRecipeFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'ingredients', 'recipes', 'final'

  // Load products from localStorage on component mount
  useEffect(() => {
    const savedProducts = localStorage.getItem('aslan_products');
    if (savedProducts) {
      const parsedProducts = JSON.parse(savedProducts);
      setProducts(parsedProducts);
      setFilteredProducts(parsedProducts);
    }
  }, []);

  // Save products to localStorage whenever products change
  useEffect(() => {
    localStorage.setItem('aslan_products', JSON.stringify(products));
  }, [products]);

  // Filter products based on search, category, supplier, and tab
  useEffect(() => {
    let filtered = products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
                           (product.supplier && product.supplier.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = !selectedCategory || product.category === selectedCategory;
      const matchesSupplier = !selectedSupplier || product.supplier === selectedSupplier;
      const matchesActive = showInactive || product.isActive !== false;

      // Tab filtering
      let matchesTab = true;
      switch (activeTab) {
        case 'ingredients':
          matchesTab = product.productType === 'ingredient';
          break;
        case 'recipes':
          matchesTab = product.isRecipeBased || product.category === 'batchCocktails';
          break;
        case 'final':
          matchesTab = (product.productType === 'final' || !product.productType) && !product.isRecipeBased;
          break;
        default:
          matchesTab = true;
      }

      return matchesSearch && matchesCategory && matchesSupplier && matchesActive && matchesTab;
    });

    setFilteredProducts(filtered);
  }, [products, searchTerm, selectedCategory, selectedSupplier, showInactive, activeTab]);

  // Get unique suppliers for filter dropdown
  const suppliers = [...new Set(products.map(p => p.supplier).filter(Boolean))];

  const handleAddProduct = () => {
    setEditingProduct(null);
    setIsProductFormOpen(true);
  };

  const handleAddRecipe = () => {
    setEditingProduct(null);
    setIsRecipeFormOpen(true);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    if (product.isRecipeBased || product.category === 'batchCocktails') {
      setIsRecipeFormOpen(true);
    } else {
      setIsProductFormOpen(true);
    }
  };

  const handleDeleteProduct = (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      setProducts(prev => prev.filter(p => p.id !== productId));
    }
  };

  const handleToggleActive = (productId) => {
    setProducts(prev => prev.map(p => 
      p.id === productId ? { ...p, isActive: !p.isActive } : p
    ));
  };

  const handleSaveProduct = (productData) => {
    if (editingProduct) {
      // Update existing product
      const updatedProducts = products.map(p => 
        p.id === editingProduct.id ? productData : p
      );
      
      // If this was an ingredient, update any recipes that use it
      if (productData.productType === 'ingredient') {
        // Auto-update recipe costs when ingredient costs change
        const recipesToUpdate = updatedProducts.filter(p => p.isRecipeBased && p.recipeIngredients);
        recipesToUpdate.forEach(recipe => {
          const usesThisIngredient = recipe.recipeIngredients.some(ing => ing.productId === productData.id);
          if (usesThisIngredient) {
            // Mark recipe as needing cost recalculation
            recipe.needsCostUpdate = true;
            recipe.updatedAt = new Date().toISOString();
          }
        });
        setProducts(updatedProducts);
      } else {
        setProducts(updatedProducts);
      }
    } else {
      // Add new product
      setProducts(prev => [...prev, productData]);
    }
    setIsProductFormOpen(false);
    setIsRecipeFormOpen(false);
    setEditingProduct(null);
  };

  const handleCloseForms = () => {
    setIsProductFormOpen(false);
    setIsRecipeFormOpen(false);
    setEditingProduct(null);
  };

  // Calculate summary stats (removed total value as requested)
  const finalProducts = products.filter(p => (p.productType === 'final' || !p.productType) && !p.isRecipeBased);
  const ingredients = products.filter(p => p.productType === 'ingredient');
  const recipes = products.filter(p => p.isRecipeBased || p.category === 'batchCocktails');
  
  const stats = {
    total: products.length,
    active: products.filter(p => p.isActive !== false).length,
    ingredients: ingredients.length,
    recipes: recipes.length,
    finalProducts: finalProducts.length,
    categories: [...new Set(products.map(p => p.category))].length
  };

  const TabButton = ({ tabKey, label, count, icon: Icon }) => (
    <button
      onClick={() => setActiveTab(tabKey)}
      className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
        activeTab === tabKey
          ? 'bg-green-800 text-white'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
      <span className={`px-2 py-1 rounded-full text-xs ${
        activeTab === tabKey ? 'bg-green-700' : 'bg-gray-300'
      }`}>
        {count}
      </span>
    </button>
  );

  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Package className="h-8 w-8 mr-3 text-green-800 flex-shrink-0" />
            <span>Product Management</span>
          </h1>
          <p className="text-gray-600 mt-1">
            Manage your {role === 'foh' ? 'beverage' : 'kitchen'} inventory and recipes
          </p>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={handleAddProduct}
            className="px-4 py-2 bg-green-800 text-white rounded-lg hover:bg-green-900 transition-colors font-medium flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Product</span>
          </button>
          <button
            onClick={handleAddRecipe}
            className="px-4 py-2 bg-purple-800 text-white rounded-lg hover:bg-purple-900 transition-colors font-medium flex items-center space-x-2"
          >
            <Beaker className="h-4 w-4" />
            <span>Create Recipe</span>
          </button>
        </div>
      </div>

      {/* Product Type Tabs */}
      <div className="flex flex-wrap gap-2">
        <TabButton tabKey="all" label="All Products" count={stats.total} icon={Package} />
        <TabButton tabKey="ingredients" label="Ingredients" count={stats.ingredients} icon={Package} />
        <TabButton tabKey="recipes" label="Recipes" count={stats.recipes} icon={Beaker} />
        <TabButton tabKey="final" label="Final Products" count={stats.finalProducts} icon={BarChart3} />
      </div>

      {/* Summary Stats (Removed Total Value) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-800">
          <div className="flex items-center">
            <Package className="h-6 w-6 lg:h-8 lg:w-8 text-green-800 flex-shrink-0" />
            <div className="ml-3 lg:ml-4 min-w-0">
              <p className="text-xs lg:text-sm font-medium text-gray-600 truncate">Total Products</p>
              <p className="text-xl lg:text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <div className="flex items-center">
            <Eye className="h-6 w-6 lg:h-8 lg:w-8 text-green-500 flex-shrink-0" />
            <div className="ml-3 lg:ml-4 min-w-0">
              <p className="text-xs lg:text-sm font-medium text-gray-600 truncate">Active Products</p>
              <p className="text-xl lg:text-2xl font-bold text-gray-900">{stats.active}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-600">
          <div className="flex items-center">
            <Beaker className="h-6 w-6 lg:h-8 lg:w-8 text-purple-600 flex-shrink-0" />
            <div className="ml-3 lg:ml-4 min-w-0">
              <p className="text-xs lg:text-sm font-medium text-gray-600 truncate">Recipes</p>
              <p className="text-xl lg:text-2xl font-bold text-gray-900">{stats.recipes}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-orange-600">
          <div className="flex items-center">
            <Filter className="h-6 w-6 lg:h-8 lg:w-8 text-orange-600 flex-shrink-0" />
            <div className="ml-3 lg:ml-4 min-w-0">
              <p className="text-xs lg:text-sm font-medium text-gray-600 truncate">Categories</p>
              <p className="text-xl lg:text-2xl font-bold text-gray-900">{stats.categories}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-end">
          {/* Search */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Products
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-800 focus:border-transparent"
                placeholder="Search by name, SKU, or supplier..."
              />
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-800"
            >
              <option value="">All Categories</option>
              {Object.entries(fohCategories).map(([key, cat]) => (
                <option key={key} value={key}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Supplier Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Supplier
            </label>
            <select
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-800"
            >
              <option value="">All Suppliers</option>
              {suppliers.map(supplier => (
                <option key={supplier} value={supplier}>
                  {supplier}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Additional Filters */}
        <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="h-4 w-4 text-green-800 focus:ring-green-800 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">Show inactive products</span>
          </label>

          {(searchTerm || selectedCategory || selectedSupplier) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('');
                setSelectedSupplier('');
                setShowInactive(false);
              }}
              className="text-sm text-green-800 hover:text-green-900 font-medium"
            >
              Clear all filters
            </button>
          )}
        </div>
      </div>

      {/* Results Info */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>
          Showing {filteredProducts.length} of {products.length} products
          {activeTab !== 'all' && (
            <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
              {activeTab} view
            </span>
          )}
        </span>
        {filteredProducts.length !== products.length && (
          <span className="text-green-800 font-medium">
            Filters applied
          </span>
        )}
      </div>

      {/* Special info for ingredients and recipes */}
      {activeTab === 'ingredients' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <Package className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <div className="text-sm font-medium text-blue-800">
                Ingredient Master List
              </div>
              <div className="text-sm text-blue-700 mt-1">
                These ingredients are used to build batch cocktail recipes. When you update ingredient costs, 
                all related recipes will automatically recalculate their costs.
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'recipes' && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-start">
            <Beaker className="h-5 w-5 text-purple-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <div className="text-sm font-medium text-purple-800">
                Recipe-Based Products
              </div>
              <div className="text-sm text-purple-700 mt-1">
                These products are built from ingredient recipes. Costs automatically update when ingredient prices change.
                Seasonal recipes can be easily added without code changes.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product Table */}
      <div className="w-full overflow-hidden">
        <ProductTable
          products={filteredProducts}
          onEdit={handleEditProduct}
          onDelete={handleDeleteProduct}
          onToggleActive={handleToggleActive}
          showRecipeBadges={true}
        />
      </div>

      {/* Product Form */}
      <ProductForm
        product={editingProduct}
        isOpen={isProductFormOpen}
        isEditing={!!editingProduct}
        onClose={handleCloseForms}
        onSave={handleSaveProduct}
      />

      {/* Recipe Builder */}
      <RecipeBuilderComponent
        recipe={editingProduct}
        isOpen={isRecipeFormOpen}
        isEditing={!!editingProduct}
        onClose={handleCloseForms}
        onSave={handleSaveProduct}
        existingProducts={products}
      />

      {/* Empty State */}
      {filteredProducts.length === 0 && products.length === 0 && (
        <div className="text-center py-12">
          <div className="flex justify-center space-x-4 mb-6">
            <Package className="h-16 w-16 text-gray-300" />
            <Beaker className="h-16 w-16 text-gray-300" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No products yet</h3>
          <p className="text-gray-600 mb-6">Get started by adding ingredients or creating recipes.</p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={handleAddProduct}
              className="px-4 py-2 bg-green-800 text-white rounded-lg hover:bg-green-900 transition-colors font-medium flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Ingredients</span>
            </button>
            <button
              onClick={handleAddRecipe}
              className="px-4 py-2 bg-purple-800 text-white rounded-lg hover:bg-purple-900 transition-colors font-medium flex items-center space-x-2"
            >
              <Beaker className="h-4 w-4" />
              <span>Create Recipe</span>
            </button>
          </div>
        </div>
      )}

      {/* No Results State */}
      {filteredProducts.length === 0 && products.length > 0 && (
        <div className="text-center py-12">
          <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-600 mb-6">Try adjusting your search or filter criteria.</p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('');
              setSelectedSupplier('');
              setActiveTab('all');
            }}
            className="text-green-800 hover:text-green-900 font-medium"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductList;