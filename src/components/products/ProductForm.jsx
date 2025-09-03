// src/components/products/ProductForm.jsx
// This component is now simplified since ProductFamilyForm handles the main functionality
// This can serve as a quick-entry form for simple products or as a backup

import React, { useState, useEffect } from 'react';
import { X, Save, Package, AlertCircle } from 'lucide-react';
import { fohCategories, generateSKU } from '../../data/categories';

const ProductForm = ({ 
  product = null, 
  isOpen = false, 
  onClose, 
  onSave, 
  isEditing = false 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    subcategory: '',
    supplier: '',
    description: '',
    notes: '',
    isActive: true,
    productType: 'purchased',
    
    // Simplified structure - will be converted to new format on save
    purchaseInfo: {
      quantity: '',
      unit: '',
      costPerUnit: ''
    },
    
    // Single serving option for simple entry
    servingOptions: [{
      optionType: 'primary',
      customName: 'Standard Serving',
      sku: '',
      servingSize: '',
      servingUnit: 'oz',
      price: '',
      margin: '75'
    }]
  });

  useEffect(() => {
    if (isOpen && !isEditing) {
      resetForm();
    } else if (product && isEditing) {
      setFormData({ ...product });
    }
  }, [isOpen, isEditing, product]);

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      subcategory: '',
      supplier: '',
      description: '',
      notes: '',
      isActive: true,
      productType: 'purchased',
      purchaseInfo: {
        quantity: '',
        unit: '',
        costPerUnit: ''
      },
      servingOptions: [{
        optionType: 'primary',
        customName: 'Standard Serving',
        sku: '',
        servingSize: '',
        servingUnit: 'oz',
        price: '',
        margin: '75'
      }]
    });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleCategoryChange = (e) => {
    const category = e.target.value;
    const categoryData = fohCategories[category];
    
    // Auto-generate SKU
    const sku = categoryData?.requiresManualSKU ? '' : generateSKU(formData.name, category, 'primary');
    
    setFormData(prev => ({
      ...prev,
      category,
      subcategory: '',
      productType: categoryData?.productType || 'purchased',
      servingOptions: [{
        ...prev.servingOptions[0],
        sku
      }]
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const productData = {
      ...formData,
      id: isEditing ? product.id : Date.now().toString(),
      createdAt: isEditing ? product.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    onSave(productData);
  };

  if (!isOpen) return null;

  const selectedCategory = fohCategories[formData.category];
  const requiresManualSKU = selectedCategory?.requiresManualSKU;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
        <div className="bg-gradient-to-r from-blue-800 to-blue-900 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Package className="h-6 w-6 text-white" />
            <h2 className="text-xl font-bold text-white">
              Quick Product Entry
            </h2>
          </div>
          <button onClick={onClose} className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-blue-800">
                This is a simplified form. Use the main product form for complex products with multiple serving options.
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Product Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-800"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleCategoryChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-800"
              >
                <option value="">Select Category</option>
                {Object.entries(fohCategories).map(([key, cat]) => (
                  <option key={key} value={key}>{cat.icon} {cat.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Supplier</label>
            <input
              type="text"
              name="supplier"
              value={formData.supplier}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-800"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SKU {requiresManualSKU && <span className="text-red-600">*</span>}
            </label>
            <input
              type="text"
              value={formData.servingOptions[0]?.sku || ''}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                servingOptions: [{
                  ...prev.servingOptions[0],
                  sku: e.target.value
                }]
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-800"
              placeholder={requiresManualSKU ? "Enter TOAST SKU" : "Auto-generated"}
              readOnly={!requiresManualSKU}
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-800 focus:ring-blue-800 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-700">Product is active</label>
          </div>

          <div className="flex justify-end space-x-4 pt-6 border-t">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-900 flex items-center space-x-2">
              <Save className="h-4 w-4" />
              <span>{isEditing ? 'Update' : 'Create'} Product</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;