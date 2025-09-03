// src/components/products/ProductTable.jsx
import React, { useState } from 'react';
import { Edit2, Trash2, Eye, EyeOff, ChevronUp, ChevronDown, Package, DollarSign, Calculator } from 'lucide-react';
import { fohCategories } from '../../data/categories';

const ProductTable = ({ products, onEdit, onDelete, onToggleActive }) => {
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [viewMode, setViewMode] = useState('compact'); // 'compact' or 'full'
  const [expandedProducts, setExpandedProducts] = useState(new Set());

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const toggleProductExpansion = (productId) => {
    const newExpanded = new Set(expandedProducts);
    if (newExpanded.has(productId)) {
      newExpanded.delete(productId);
    } else {
      newExpanded.add(productId);
    }
    setExpandedProducts(newExpanded);
  };

  const sortedProducts = [...products].sort((a, b) => {
    let aValue = a[sortField] || '';
    let bValue = b[sortField] || '';

    // Handle nested fields for new structure
    if (sortField === 'costPerUnit') {
      aValue = parseFloat(a.purchaseInfo?.costPerUnit || a.costPerUnit || 0);
      bValue = parseFloat(b.purchaseInfo?.costPerUnit || b.costPerUnit || 0);
    } else if (['costPerServing', 'suggestedPrice', 'targetMargin'].includes(sortField)) {
      // Use first serving option for sorting
      const aFirstServing = a.servingOptions?.[0] || {};
      const bFirstServing = b.servingOptions?.[0] || {};
      aValue = parseFloat(aFirstServing[sortField] || a[sortField] || 0);
      bValue = parseFloat(bFirstServing[sortField] || b[sortField] || 0);
    } else if (typeof aValue === 'string') {
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

  const getProductTypeLabel = (productType) => {
    const types = {
      'purchased': '🛒 Purchased',
      'manufactured': '🏭 Manufactured',
      'recipe-based': '🧪 Recipe-Based'
    };
    return types[productType] || '🛒 Purchased';
  };

  const formatCurrency = (value) => {
    const num = parseFloat(value) || 0;
    return `$${num.toFixed(2)}`;
  };

  const formatNumber = (value, decimals = 1) => {
    const num = parseFloat(value) || 0;
    return num.toFixed(decimals);
  };

  // Get primary serving option for display (first one or most common)
  const getPrimaryServing = (product) => {
    if (!product.servingOptions || product.servingOptions.length === 0) {
      // Fallback for old data structure
      return {
        costPerServing: product.costPerServing || 0,
        price: product.suggestedPrice || 0,
        margin: product.targetMargin || 0,
        servingSize: product.servingSize || 0,
        servingUnit: product.servingUnit || 'oz'
      };
    }
    return product.servingOptions[0];
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
            maxWidth: viewMode === 'full' ? 'calc(100vw - 320px)' : '100%',
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
              minWidth: '1400px'
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
                  <SortHeader field="productType">
                    <span className="block truncate">Type</span>
                  </SortHeader>
                )}
                {viewMode === 'full' && (
                  <SortHeader field="supplier">
                    <span className="block truncate">Supplier</span>
                  </SortHeader>
                )}
                <SortHeader field="costPerUnit">
                  <span className="block truncate">Purchase Cost</span>
                </SortHeader>
                <SortHeader field="costPerServing">
                  <span className="block truncate">Cost/Serving</span>
                </SortHeader>
                {viewMode === 'full' && (
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <span className="block truncate">Serving Options</span>
                  </th>
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
              {sortedProducts.map((product) => {
                const primaryServing = getPrimaryServing(product);
                const isExpanded = expandedProducts.has(product.id);
                const hasMultipleServings = product.servingOptions && product.servingOptions.length > 1;
                
                return (
                  <React.Fragment key={product.id}>
                    {/* Main Product Row */}
                    <tr
                      className={`hover:bg-gray-50 transition-colors ${
                        !product.isActive ? 'opacity-60' : ''
                      }`}
                    >
                      {/* Product Name */}
                      <td className={`${viewMode === 'full' ? 'px-4 py-4 min-w-48' : 'px-3 py-4'}`} 
                          style={viewMode === 'compact' ? {width: '30%'} : {}}>
                        <div className="min-w-0">
                          <div className="flex items-center space-x-2">
                            {hasMultipleServings && (
                              <button
                                onClick={() => toggleProductExpansion(product.id)}
                                className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                              >
                                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                              </button>
                            )}
                            <div className="min-w-0 flex-1">
                              <div className={`text-sm font-medium text-gray-900 ${viewMode === 'full' ? 'whitespace-nowrap' : 'truncate'}`}>
                                {product.name}
                              </div>
                              {product.subcategory && (
                                <div className={`text-xs text-gray-500 ${viewMode === 'full' ? 'whitespace-nowrap' : 'truncate'}`}>
                                  {product.subcategory}
                                </div>
                              )}
                              {hasMultipleServings && (
                                <div className="text-xs text-blue-600">
                                  {product.servingOptions.length} serving options
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className={`${viewMode === 'full' ? 'px-4 py-4 min-w-40' : 'px-3 py-4'}`} 
                          style={viewMode === 'compact' ? {width: '15%'} : {}}>
                        <div className="flex items-center min-w-0">
                          <span className="text-lg mr-1 flex-shrink-0">
                            {getCategoryIcon(product.category)}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className={`text-sm text-gray-900 ${viewMode === 'full' ? 'whitespace-nowrap' : 'truncate'}`}>
                              {getCategoryName(product.category)}
                            </div>
                            {viewMode === 'compact' && product.purchaseInfo?.format && (
                              <div className="text-xs text-gray-500 truncate">
                                {product.purchaseInfo.format}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Product Type - Full mode only */}
                      {viewMode === 'full' && (
                        <td className="px-4 py-4 min-w-32">
                          <span className="inline-block px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded whitespace-nowrap">
                            {getProductTypeLabel(product.productType)}
                          </span>
                        </td>
                      )}

                      {/* Supplier - Full mode only */}
                      {viewMode === 'full' && (
                        <td className="px-4 py-4 min-w-36">
                          <div className="text-sm text-gray-900 whitespace-nowrap">
                            {product.productType === 'recipe-based' 
                              ? (product.recipeId || 'Recipe TBD')
                              : (product.supplier || 'N/A')
                            }
                          </div>
                        </td>
                      )}

                      {/* Purchase Cost */}
                      <td className={`${viewMode === 'full' ? 'px-4 py-4 min-w-24' : 'px-3 py-4'}`} 
                          style={viewMode === 'compact' ? {width: '15%'} : {}}>
                        <div className={`text-sm font-medium text-gray-900 ${viewMode === 'full' ? 'whitespace-nowrap' : ''}`}>
                          {product.purchaseInfo?.costPerUnit 
                            ? formatCurrency(product.purchaseInfo.costPerUnit)
                            : formatCurrency(product.costPerUnit || 0)
                          }
                        </div>
                        {viewMode === 'compact' && (
                          <div className="text-xs text-gray-500">
                            {product.purchaseInfo?.quantity 
                              ? `${product.purchaseInfo.quantity} ${product.purchaseInfo.unit}`
                              : `${formatNumber(product.unitSize || 0)} ${product.unitType || ''}`
                            }
                          </div>
                        )}
                      </td>

                      {/* Cost per Serving */}
                      <td className={`${viewMode === 'full' ? 'px-4 py-4 min-w-32' : 'px-3 py-4'}`} 
                          style={viewMode === 'compact' ? {width: '20%'} : {}}>
                        <div className={`text-sm font-medium text-gray-900 ${viewMode === 'full' ? 'whitespace-nowrap' : ''}`}>
                          {formatCurrency(primaryServing.costPerServing)}
                        </div>
                        <div className={`text-xs text-gray-500 ${viewMode === 'full' ? 'whitespace-nowrap' : 'truncate'}`}>
                          {formatNumber(primaryServing.servingSize, 1)} {primaryServing.servingUnit}
                        </div>
                        {viewMode === 'compact' && (
                          <div className="text-xs text-green-800 font-medium">
                            ${formatNumber(primaryServing.price, 2)} @ {formatNumber(primaryServing.margin, 0)}%
                          </div>
                        )}
                      </td>

                      {/* Serving Options - Full mode only */}
                      {viewMode === 'full' && (
                        <td className="px-4 py-4 min-w-48">
                          {product.servingOptions && product.servingOptions.length > 0 ? (
                            <div className="space-y-1">
                              <div className="text-sm font-medium text-gray-900">
                                {primaryServing.customName || primaryServing.optionType}
                              </div>
                              <div className="text-xs text-gray-600">
                                {formatCurrency(primaryServing.price)} @ {formatNumber(primaryServing.margin)}%
                              </div>
                              {hasMultipleServings && (
                                <div className="text-xs text-blue-600">
                                  +{product.servingOptions.length - 1} more option{product.servingOptions.length > 2 ? 's' : ''}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-xs text-gray-400">No serving options</div>
                          )}
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

                    {/* Expanded Serving Options Rows */}
                    {isExpanded && hasMultipleServings && (
                      product.servingOptions.slice(1).map((serving, index) => (
                        <tr key={`${product.id}-serving-${index}`} className="bg-blue-50">
                          <td className={`${viewMode === 'full' ? 'px-4 py-2 pl-12' : 'px-3 py-2 pl-8'}`}>
                            <div className="text-sm text-gray-700">
                              <Calculator className="h-3 w-3 inline mr-1" />
                              {serving.customName || serving.optionType}
                            </div>
                          </td>
                          <td className={`${viewMode === 'full' ? 'px-4 py-2' : 'px-3 py-2'}`}>
                            <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                              SKU: {serving.sku}
                            </span>
                          </td>
                          {viewMode === 'full' && <td className="px-4 py-2"></td>}
                          {viewMode === 'full' && <td className="px-4 py-2"></td>}
                          <td className={`${viewMode === 'full' ? 'px-4 py-2' : 'px-3 py-2'}`}>
                            <div className="text-sm text-gray-700">
                              Same cost basis
                            </div>
                          </td>
                          <td className={`${viewMode === 'full' ? 'px-4 py-2' : 'px-3 py-2'}`}>
                            <div className="text-sm font-medium text-gray-900">
                              {formatCurrency(serving.costPerServing)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatNumber(serving.servingSize, 1)} {serving.servingUnit}
                            </div>
                          </td>
                          {viewMode === 'full' && (
                            <td className="px-4 py-2">
                              <div className="text-sm font-medium text-gray-900">
                                {formatCurrency(serving.price)} @ {formatNumber(serving.margin)}%
                              </div>
                            </td>
                          )}
                          <td className={`${viewMode === 'full' ? 'px-4 py-2' : 'px-3 py-2'}`}></td>
                          <td className={`${viewMode === 'full' ? 'px-4 py-2' : 'px-3 py-2'}`}></td>
                        </tr>
                      ))
                    )}
                  </React.Fragment>
                );
              })}
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
                products.reduce((sum, p) => {
                  const cost = p.purchaseInfo?.costPerUnit || p.costPerUnit || 0;
                  return sum + parseFloat(cost);
                }, 0)
              )}
            </span>
            <span>
              Serving Options: {products.reduce((sum, p) => sum + (p.servingOptions?.length || 0), 0)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductTable;