// src/components/products/ProductTable.jsx
import React, { useState } from 'react';
import { Edit2, Trash2, Eye, EyeOff, ChevronUp, ChevronDown, Package } from 'lucide-react';
import { fohCategories } from '../../data/categories';

const ProductTable = ({ products, onEdit, onDelete, onToggleActive }) => {
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
              Full Details {viewMode === 'full' && <span className="ml-1">📜</span>}
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

      {/* Table Container with Controlled Scrolling */}
      <div 
        className="relative"
        style={{
          width: '100%',
          maxWidth: '100%'
        }}
      >
        <div 
          className={`overflow-x-auto ${viewMode === 'full' ? 'scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200' : ''}`}
          style={{
            width: '100%',
            maxWidth: viewMode === 'full' ? 'calc(100vw - 320px)' : '100%', // Account for sidebar width
            ...(viewMode === 'full' ? {
              scrollbarWidth: 'thin',
              scrollbarColor: '#9ca3af #e5e7eb'
            } : {})
          }}
        >
          <table 
            className="divide-y divide-gray-200"
            style={viewMode === 'full' ? {
              tableLayout: 'auto',
              width: 'max-content',
              minWidth: '1200px' // Force horizontal scroll in full mode
            } : {
              tableLayout: 'fixed', 
              width: '100%'
            }}
          >
          <thead className="bg-gray-50">
            <tr>
              <SortHeader field="name">
                <span className="block truncate">Product</span>
              </SortHeader>
              <SortHeader field="category">
                <span className="block truncate">Category</span>
              </SortHeader>
              {viewMode === 'full' && (
                <SortHeader field="sku">
                  <span className="block truncate">SKU</span>
                </SortHeader>
              )}
              {viewMode === 'full' && (
                <SortHeader field="supplier">
                  <span className="block truncate">Supplier</span>
                </SortHeader>
              )}
              <SortHeader field="costPerUnit">
                <span className="block truncate">Cost/Unit</span>
              </SortHeader>
              <SortHeader field="costPerServing">
                <span className="block truncate">Cost/Serving</span>
              </SortHeader>
              {viewMode === 'full' && (
                <SortHeader field="suggestedPrice">
                  <span className="block truncate">Suggested Price</span>
                </SortHeader>
              )}
              {viewMode === 'full' && (
                <SortHeader field="targetMargin">
                  <span className="block truncate">Margin %</span>
                </SortHeader>
              )}
              <th className={`${viewMode === 'full' ? 'px-4 py-3 w-24' : 'w-20 px-3 py-3'} text-left text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                Status
              </th>
              <th className={`${viewMode === 'full' ? 'px-4 py-3 w-32' : 'w-24 px-3 py-3'} text-left text-xs font-medium text-gray-500 uppercase tracking-wider`}>
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
                <td className={`${viewMode === 'full' ? 'px-4 py-4 min-w-48' : 'px-3 py-4'}`} 
                    style={viewMode === 'compact' ? {width: '35%'} : {}}>
                  <div className="min-w-0">
                    <div className={`text-sm font-medium text-gray-900 ${viewMode === 'full' ? 'whitespace-nowrap' : 'truncate'}`}>
                      {product.name}
                    </div>
                    {product.subcategory && (
                      <div className={`text-xs text-gray-500 ${viewMode === 'full' ? 'whitespace-nowrap' : 'truncate'}`}>
                        {product.subcategory}
                      </div>
                    )}
                    {/* Show additional info in compact mode */}
                    {viewMode === 'compact' && (
                      <div className="text-xs text-gray-400 mt-1 truncate">
                        {product.sku && <span className="truncate">SKU: {product.sku}</span>}
                        {product.supplier && <span className="block truncate">{product.supplier}</span>}
                      </div>
                    )}
                  </div>
                </td>

                {/* Category */}
                <td className={`${viewMode === 'full' ? 'px-4 py-4 min-w-40' : 'px-3 py-4'}`} 
                    style={viewMode === 'compact' ? {width: '20%'} : {}}>
                  <div className="flex items-center min-w-0">
                    <span className="text-lg mr-1 flex-shrink-0">
                      {getCategoryIcon(product.category)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className={`text-sm text-gray-900 ${viewMode === 'full' ? 'whitespace-nowrap' : 'truncate'}`}>
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
                  <td className="px-4 py-4 min-w-32">
                    <span className="inline-block px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded whitespace-nowrap">
                      {product.sku}
                    </span>
                  </td>
                )}

                {/* Supplier - Full mode only */}
                {viewMode === 'full' && (
                  <td className="px-4 py-4 min-w-36">
                    <div className="text-sm text-gray-900 whitespace-nowrap">
                      {product.supplier || 'N/A'}
                    </div>
                  </td>
                )}

                {/* Cost per Unit */}
                <td className={`${viewMode === 'full' ? 'px-4 py-4 min-w-24' : 'px-3 py-4'}`} 
                    style={viewMode === 'compact' ? {width: '15%'} : {}}>
                  <div className={`text-sm font-medium text-gray-900 ${viewMode === 'full' ? 'whitespace-nowrap' : ''}`}>
                    {formatCurrency(product.costPerUnit)}
                  </div>
                  {viewMode === 'compact' && (
                    <div className="text-xs text-gray-500">
                      {formatNumber(product.servingsPerUnit || 0)} servings
                    </div>
                  )}
                </td>

                {/* Cost per Serving */}
                <td className={`${viewMode === 'full' ? 'px-4 py-4 min-w-32' : 'px-3 py-4'}`} 
                    style={viewMode === 'compact' ? {width: '20%'} : {}}>
                  <div className={`text-sm font-medium text-gray-900 ${viewMode === 'full' ? 'whitespace-nowrap' : ''}`}>
                    {formatCurrency(product.costPerServing)}
                  </div>
                  <div className={`text-xs text-gray-500 ${viewMode === 'full' ? 'whitespace-nowrap' : 'truncate'}`}>
                    {formatNumber(product.servingSize, 1)} {product.servingUnit}
                  </div>
                  {viewMode === 'compact' && (
                    <div className="text-xs text-green-800 font-medium">
                      ${formatNumber(product.suggestedPrice, 2)} @ {formatNumber(product.targetMargin, 0)}%
                    </div>
                  )}
                </td>

                {/* Suggested Price - Full mode only */}
                {viewMode === 'full' && (
                  <td className="px-4 py-4 min-w-28">
                    <div className="text-sm font-medium text-green-800 whitespace-nowrap">
                      {formatCurrency(product.suggestedPrice)}
                    </div>
                  </td>
                )}

                {/* Margin % - Full mode only */}
                {viewMode === 'full' && (
                  <td className="px-4 py-4 min-w-20">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                      parseFloat(product.targetMargin) >= 70 
                        ? 'bg-green-100 text-green-800'
                        : parseFloat(product.targetMargin) >= 50
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                    }`}>
                      {formatNumber(product.targetMargin, 0)}%
                    </span>
                  </td>
                )}

                {/* Status */}
                <td className={`${viewMode === 'full' ? 'px-4 py-4 w-24' : 'px-3 py-4 w-20'}`}>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                    product.isActive 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {product.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>

                {/* Actions */}
                <td className={`${viewMode === 'full' ? 'px-4 py-4 w-32' : 'px-3 py-4 w-24'}`}>
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
                        product.isActive
                          ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                          : 'text-green-600 hover:text-green-900 hover:bg-green-50'
                      }`}
                      title={product.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {product.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
      </div>
      
      {/* Table Footer with Summary */}
      <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            {products.length} product{products.length !== 1 ? 's' : ''} total
          </span>
          <div className="flex items-center space-x-6">
            <span>
              Active: {products.filter(p => p.isActive).length}
            </span>
            <span>
              Total Value: {formatCurrency(
                products.reduce((sum, p) => sum + (parseFloat(p.costPerUnit) || 0), 0)
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductTable;