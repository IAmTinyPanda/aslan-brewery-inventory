// src/components/products/ProductTable.jsx - Clean implementation
import React, { useState } from 'react';
import { Edit2, Trash2, Eye, EyeOff, ChevronUp, ChevronDown, Package, Beaker } from 'lucide-react';
import { fohCategories } from '../../data/categories';

const ProductTable = ({ products, onEdit, onDelete, onToggleActive, showRecipeBadges = false }) => {
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [viewMode, setViewMode] = useState('compact'); // 'compact' or 'full'

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedProducts = [...products].sort((a, b) => {
    let aValue = a[sortField] || '';
    let bValue = b[sortField] || '';

    // Handle numeric fields
    if (['costPerUnit', 'costPerServing', 'suggestedPrice', 'servingsPerUnit', 'targetMargin'].includes(sortField)) {
      aValue = parseFloat(aValue) || 0;
      bValue = parseFloat(bValue) || 0;
    }

    // Handle string fields
    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const SortHeader = ({ field, children }) => (
    <th
      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center space-x-1">
        <span>{children}</span>
        {sortField === field && (
          sortDirection === 'asc' ? 
            <ChevronUp className="h-4 w-4" /> : 
            <ChevronDown className="h-4 w-4" />
        )}
      </div>
    </th>
  );

  const getCategoryIcon = (categoryKey) => {
    return fohCategories[categoryKey]?.icon || '📦';
  };

  const getCategoryName = (categoryKey) => {
    return fohCategories[categoryKey]?.name || categoryKey;
  };

  const formatCurrency = (value) => {
    const num = parseFloat(value) || 0;
    return `$${num.toFixed(2)}`;
  };

  const formatNumber = (value, decimals = 1) => {
    const num = parseFloat(value) || 0;
    return num.toFixed(decimals);
  };

  const getProductTypeBadge = (product) => {
    if (product.isRecipeBased || product.category === 'batchCocktails') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
          <Beaker className="h-3 w-3 mr-1" />
          Recipe
        </span>
      );
    } else if (product.productType === 'ingredient') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          🧪 Ingredient
        </span>
      );
    } else if (product.multipleServings && product.multipleServings.length > 1) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          🍺 Multi-Serve
        </span>
      );
    }
    return null;
  };

  if (products.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 text-center">
          <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No products to display</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* View Toggle */}
      <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">
            {products.length} product{products.length !== 1 ? 's' : ''}
          </span>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500">View:</span>
            <button
              onClick={() => setViewMode('compact')}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                viewMode === 'compact' 
                  ? 'bg-green-800 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Compact
            </button>
            <button
              onClick={() => setViewMode('full')}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                viewMode === 'full' 
                  ? 'bg-green-800 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Full Details
            </button>
          </div>
        </div>
        {/* Scroll hint for full mode */}
        {viewMode === 'full' && (
          <div className="mt-2 text-xs text-gray-500 text-center">
            ← Scroll table horizontally to see all columns →
          </div>
        )}
      </div>

      {/* Table Container */}
      <div className="relative overflow-x-auto">
        <table className={`divide-y divide-gray-200 ${
          viewMode === 'full' ? 'min-w-full w-max' : 'w-full'
        }`}>
          <thead className="bg-gray-50">
            <tr>
              <SortHeader field="name">Product</SortHeader>
              <SortHeader field="category">Category</SortHeader>
              {viewMode === 'full' && <SortHeader field="sku">SKU</SortHeader>}
              {viewMode === 'full' && <SortHeader field="supplier">Supplier</SortHeader>}
              <SortHeader field="costPerUnit">Cost/Unit</SortHeader>
              <SortHeader field="costPerServing">Cost/Serving</SortHeader>
              {viewMode === 'full' && <SortHeader field="suggestedPrice">Suggested Price</SortHeader>}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedProducts.map((product) => (
              <tr
                key={product.id}
                className={`hover:bg-gray-50 transition-colors ${
                  !product.isActive ? 'opacity-60' : ''
                }`}
              >
                {/* Product Name */}
                <td className={`px-6 py-4 ${viewMode === 'compact' ? 'w-1/3' : 'min-w-48'}`}>
                  <div className="min-w-0">
                    <div className={`text-sm font-medium text-gray-900 ${
                      viewMode === 'full' ? 'whitespace-nowrap' : 'truncate'
                    }`}>
                      {product.name}
                    </div>
                    
                    {/* Product type badge */}
                    {showRecipeBadges && (
                      <div className="mt-1">
                        {getProductTypeBadge(product)}
                      </div>
                    )}
                    
                    {product.subcategory && (
                      <div className={`text-xs text-gray-500 mt-1 ${
                        viewMode === 'full' ? 'whitespace-nowrap' : 'truncate'
                      }`}>
                        {product.subcategory}
                      </div>
                    )}
                    
                    {/* Show additional info in compact mode */}
                    {viewMode === 'compact' && (
                      <div className="text-xs text-gray-400 mt-1 space-y-1">
                        {product.sku && <div className="truncate">SKU: {product.sku}</div>}
                        {product.supplier && <div className="truncate">{product.supplier}</div>}
                      </div>
                    )}
                  </div>
                </td>

                {/* Category */}
                <td className={`px-6 py-4 ${viewMode === 'compact' ? 'w-1/6' : 'min-w-40'}`}>
                  <div className="flex items-center min-w-0">
                    <span className="text-lg mr-2 flex-shrink-0">
                      {getCategoryIcon(product.category)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className={`text-sm text-gray-900 ${
                        viewMode === 'full' ? 'whitespace-nowrap' : 'truncate'
                      }`}>
                        {getCategoryName(product.category)}
                      </div>
                      {viewMode === 'compact' && product.unitSize && (
                        <div className="text-xs text-gray-500 truncate">
                          {formatNumber(product.unitSize, 0)} {product.unitType}
                        </div>
                      )}
                    </div>
                  </div>
                </td>

                {/* SKU - Full mode only */}
                {viewMode === 'full' && (
                  <td className="px-6 py-4 min-w-32">
                    <span className="inline-block px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded whitespace-nowrap">
                      {product.sku || 'N/A'}
                    </span>
                  </td>
                )}

                {/* Supplier - Full mode only */}
                {viewMode === 'full' && (
                  <td className="px-6 py-4 min-w-36">
                    <div className="text-sm text-gray-900 whitespace-nowrap">
                      {product.supplier || 'N/A'}
                    </div>
                  </td>
                )}

                {/* Cost per Unit */}
                <td className={`px-6 py-4 ${viewMode === 'compact' ? 'w-1/6' : 'min-w-24'}`}>
                  <div className={`text-sm font-medium text-gray-900 ${
                    viewMode === 'full' ? 'whitespace-nowrap' : ''
                  }`}>
                    {formatCurrency(product.costPerUnit)}
                  </div>
                  {viewMode === 'compact' && product.servingsPerUnit && (
                    <div className="text-xs text-gray-500">
                      {formatNumber(product.servingsPerUnit || 0)} servings
                    </div>
                  )}
                </td>

                {/* Cost per Serving */}
                <td className={`px-6 py-4 ${viewMode === 'compact' ? 'w-1/6' : 'min-w-32'}`}>
                  <div className={`text-sm font-medium text-gray-900 ${
                    viewMode === 'full' ? 'whitespace-nowrap' : ''
                  }`}>
                    {product.costPerServing ? formatCurrency(product.costPerServing) : 'N/A'}
                  </div>
                  
                  {/* Multiple serving options indicator */}
                  {product.multipleServings && product.multipleServings.length > 0 && (
                    <div className="text-xs text-gray-500 mt-1">
                      {product.multipleServings.length} serving option{product.multipleServings.length !== 1 ? 's' : ''}
                    </div>
                  )}
                  
                  {/* Show serving size info */}
                  {product.servingSize && product.servingUnit && (
                    <div className={`text-xs text-gray-500 mt-1 ${
                      viewMode === 'full' ? 'whitespace-nowrap' : 'truncate'
                    }`}>
                      {formatNumber(product.servingSize, 1)} {product.servingUnit}
                    </div>
                  )}
                  
                  {/* Compact mode pricing info */}
                  {viewMode === 'compact' && product.suggestedPrice && (
                    <div className="text-xs text-green-800 font-medium">
                      Suggested: ${formatNumber(product.suggestedPrice, 2)}
                    </div>
                  )}
                </td>

                {/* Suggested Price - Full mode only */}
                {viewMode === 'full' && (
                  <td className="px-6 py-4 min-w-28">
                    <div className="text-sm font-medium text-green-800 whitespace-nowrap">
                      {product.suggestedPrice ? formatCurrency(product.suggestedPrice) : 'N/A'}
                    </div>
                  </td>
                )}

                {/* Status */}
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                    product.isActive !== false
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {product.isActive !== false ? 'Active' : 'Inactive'}
                  </span>
                </td>

                {/* Actions */}
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center space-x-1">
                    <button
                      onClick={() => onEdit(product)}
                      className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50 transition-colors"
                      title="Edit product"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    
                    <button
                      onClick={() => onToggleActive(product.id)}
                      className={`p-1 rounded transition-colors ${
                        product.isActive !== false
                          ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                          : 'text-green-600 hover:text-green-900 hover:bg-green-50'
                      }`}
                      title={product.isActive !== false ? 'Deactivate' : 'Activate'}
                    >
                      {product.isActive !== false ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    
                    <button
                      onClick={() => onDelete(product.id)}
                      className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                      title="Delete product"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Table Footer with Summary (Removed Total Value) */}
      <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            {products.length} product{products.length !== 1 ? 's' : ''} total
          </span>
          <div className="flex items-center space-x-6">
            <span>
              Active: {products.filter(p => p.isActive !== false).length}
            </span>
            <span>
              Recipes: {products.filter(p => p.isRecipeBased || p.category === 'batchCocktails').length}
            </span>
            <span>
              Ingredients: {products.filter(p => p.productType === 'ingredient').length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductTable;