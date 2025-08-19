// src/components/products/ProductList.jsx
import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Package, DollarSign, Eye } from 'lucide-react';
import { fohCategories } from '../../data/categories';
import ProductFamilyForm from './ProductFamilyForm';
import ProductTable from './ProductTable';

const ProductList = ({ role = 'foh' }) => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [showInactive, setShowInactive] = useState(false);

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

  // Filter products based on search, category, and supplier
  useEffect(() => {
    let filtered = products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
                           (product.supplier && product.supplier.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = !selectedCategory || product.category === selectedCategory;
      const matchesSupplier = !selectedSupplier || product.supplier === selectedSupplier;
      const matchesActive = showInactive || product.isActive;

      return matchesSearch && matchesCategory && matchesSupplier && matchesActive;
    });

    setFilteredProducts(filtered);
  }, [products, searchTerm, selectedCategory, selectedSupplier, showInactive]);

  // Get unique suppliers for filter dropdown
  const suppliers = [...new Set(products.map(p => p.supplier).filter(Boolean))];

  const handleAddProduct = () => {
    setEditingProduct(null);
    setIsFormOpen(true);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setIsFormOpen(true);
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
      setProducts(prev => prev.map(p => 
        p.id === editingProduct.id ? productData : p
      ));
    } else {
      // Add new product
      setProducts(prev => [...prev, productData]);
    }
    setIsFormOpen(false);
    setEditingProduct(null);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingProduct(null);
  };

  // Calculate summary stats
  const stats = {
    total: products.length,
    active: products.filter(p => p.isActive).length,
    totalValue: products.reduce((sum, p) => sum + (parseFloat(p.costPerUnit) || 0), 0),
    categories: [...new Set(products.map(p => p.category))].length
  };

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
            Manage your {role === 'foh' ? 'beverage' : 'kitchen'} inventory products
          </p>
        </div>
        
        <button
          onClick={handleAddProduct}
          className="px-4 py-2 bg-green-800 text-white rounded-lg hover:bg-green-900 transition-colors font-medium flex items-center space-x-2 flex-shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Add Product</span>
        </button>
      </div>

      {/* Summary Stats */}
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

        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-600">
          <div className="flex items-center">
            <DollarSign className="h-6 w-6 lg:h-8 lg:w-8 text-yellow-600 flex-shrink-0" />
            <div className="ml-3 lg:ml-4 min-w-0">
              <p className="text-xs lg:text-sm font-medium text-gray-600 truncate">Total Value</p>
              <p className="text-lg lg:text-2xl font-bold text-gray-900">${stats.totalValue.toFixed(0)}</p>
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
              {Object.entries(fohCategories)
                .filter(([key, cat]) => !cat.isVariant)
                .map(([key, cat]) => (
                  <option key={key} value={key}>
                    {cat.icon} {cat.name}
                  </option>
                ))
              }
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
        </span>
        {filteredProducts.length !== products.length && (
          <span className="text-green-800 font-medium">
            Filters applied
          </span>
        )}
      </div>

      {/* Product Table - Constrained width */}
      <div className="w-full overflow-hidden">
        <ProductTable
          products={filteredProducts}
          onEdit={handleEditProduct}
          onDelete={handleDeleteProduct}
          onToggleActive={handleToggleActive}
        />
      </div>

      {/* Product Family Form Modal */}
      <ProductFamilyForm
        product={editingProduct}
        isOpen={isFormOpen}
        isEditing={!!editingProduct}
        onClose={handleCloseForm}
        onSave={handleSaveProduct}
      />

      {/* Empty State */}
      {filteredProducts.length === 0 && products.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No products yet</h3>
          <p className="text-gray-600 mb-6">Get started by adding your first product.</p>
          <button
            onClick={handleAddProduct}
            className="px-4 py-2 bg-green-800 text-white rounded-lg hover:bg-green-900 transition-colors font-medium flex items-center space-x-2 mx-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Add Your First Product</span>
          </button>
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