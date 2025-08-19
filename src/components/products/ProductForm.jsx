import React, { useState, useEffect } from 'react';
import { X, Save, Package, DollarSign, Calculator, Plus, Trash2, AlertCircle } from 'lucide-react';
import { fohCategories, calculateMultipleServings } from '../../data/categories';

const EnhancedProductForm = ({ 
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
    sku: '',
    supplier: '',
    unitSize: '',
    unitType: '',
    costPerUnit: '',
    description: '',
    notes: '',
    isActive: true,
    productType: 'final',
    variantType: '', // For beer families
    multipleServings: [], // [{servingOption, price, margin}, ...]
    isFamily: false
  });

  const [calculatedData, setCalculatedData] = useState({
    servingsPerUnit: {},
    costPerServing: {}
  });

  // Reset form when opening
  useEffect(() => {
    if (isOpen && !isEditing) {
      setFormData({
        name: '',
        category: '',
        subcategory: '',
        sku: '',
        supplier: '',
        unitSize: '',
        unitType: '',
        costPerUnit: '',
        description: '',
        notes: '',
        isActive: true,
        productType: 'final',
        variantType: '',
        multipleServings: [],
        isFamily: false
      });
    } else if (product && isEditing) {
      setFormData({ ...product });
    }
  }, [isOpen, isEditing, product]);

  // Calculate servings and costs for all serving options
  useEffect(() => {
    const { costPerUnit, unitSize } = formData;
    const selectedCategory = fohCategories[formData.category];
    
    if (costPerUnit && unitSize && selectedCategory) {
      const cost = parseFloat(costPerUnit);
      const newServingsPerUnit = {};
      const newCostPerServing = {};

      // Handle beer families with multiple serving options
      if (selectedCategory.variants && formData.variantType) {
        const variant = selectedCategory.variants[formData.variantType];
        if (variant?.servingOptions) {
          variant.servingOptions.forEach(option => {
            const servings = calculateMultipleServings(formData, option.value);
            if (servings > 0) {
              newServingsPerUnit[option.value] = servings;
              newCostPerServing[option.value] = cost / servings;
            }
          });
        }
      }
      // Handle simple categories with single serving option
      else if (selectedCategory.servingOptions) {
        selectedCategory.servingOptions.forEach(option => {
          const servings = calculateMultipleServings(formData, option.value);
          if (servings > 0) {
            newServingsPerUnit[option.value] = servings;
            newCostPerServing[option.value] = cost / servings;
          }
        });
      }

      setCalculatedData({
        servingsPerUnit: newServingsPerUnit,
        costPerServing: newCostPerServing
      });
    }
  }, [formData.costPerUnit, formData.unitSize, formData.unitType, formData.category, formData.variantType]);

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
    
    let defaults = {};
    
    if (categoryData) {
      defaults.productType = categoryData.productType || 'final';
      defaults.isFamily = categoryData.isFamily || false;
      
      // Reset variant type when changing categories
      defaults.variantType = '';
      defaults.multipleServings = [];
    }
    
    setFormData(prev => ({
      ...prev,
      category,
      subcategory: '',
      sku: generateSKU(prev.name, category, categoryData?.requiresToastSku),
      ...defaults
    }));
  };

  const handleVariantTypeChange = (e) => {
    const variantType = e.target.value;
    setFormData(prev => ({
      ...prev,
      variantType,
      unitType: '', // Reset unit type when changing variant
      multipleServings: []
    }));
  };

  const generateSKU = (name, category, requiresToast = false) => {
    if (requiresToast) return ''; // Manual entry required
    
    const categoryCode = {
      'spirits': 'SPR',
      'mixers': 'MIX',
      'wine': 'WIN',
      'cider': 'CDR',
      'retail': 'RTL',
      'beerFamily': 'BER'
    };

    const nameCode = name.substring(0, 3).toUpperCase().replace(/\s/g, '');
    const catCode = categoryCode[category] || 'GEN';
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    return `ASL-${catCode}-${nameCode}-${randomNum}`;
  };

  const handleNameChange = (e) => {
    const name = e.target.value;
    const categoryData = fohCategories[formData.category];
    
    setFormData(prev => ({
      ...prev,
      name,
      sku: generateSKU(name, prev.category, categoryData?.requiresToastSku)
    }));
  };

  const addServingOption = (servingOption) => {
    const costPerServing = calculatedData.costPerServing[servingOption.value] || 0;
    const suggestedPrice = costPerServing / 0.25; // 75% margin

    setFormData(prev => ({
      ...prev,
      multipleServings: [
        ...prev.multipleServings,
        {
          servingOption: servingOption.value,
          label: servingOption.label,
          price: suggestedPrice.toFixed(2),
          margin: 75
        }
      ]
    }));
  };

  const updateServingPrice = (index, price) => {
    const costPerServing = Object.values(calculatedData.costPerServing)[0] || 0;
    const margin = price > 0 ? ((price - costPerServing) / price) * 100 : 0;

    setFormData(prev => ({
      ...prev,
      multipleServings: prev.multipleServings.map((serving, i) => 
        i === index 
          ? { ...serving, price, margin: margin.toFixed(1) }
          : serving
      )
    }));
  };

  const removeServingOption = (index) => {
    setFormData(prev => ({
      ...prev,
      multipleServings: prev.multipleServings.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = () => {
    const productData = {
      ...formData,
      calculatedData,
      id: isEditing ? product.id : Date.now().toString(),
      createdAt: isEditing ? product.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    onSave(productData);
  };

  if (!isOpen) return null;

  const selectedCategory = fohCategories[formData.category];
  const selectedVariant = selectedCategory?.variants?.[formData.variantType];
  const requiresManualSku = selectedCategory?.requiresToastSku;
  const isIngredient = formData.productType === 'ingredient';
  const isBeerFamily = formData.category === 'beerFamily';

  // Get available serving options
  const availableServingOptions = selectedVariant?.servingOptions || selectedCategory?.servingOptions || [];
  const usedServingOptions = formData.multipleServings.map(ms => ms.servingOption);
  const remainingServingOptions = availableServingOptions.filter(
    option => !usedServingOptions.includes(option.value)
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-800 to-green-900 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Package className="h-6 w-6 text-white" />
            <h2 className="text-xl font-bold text-white">
              {isEditing ? 'Edit Product' : 'Add New Product'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Product Type Indicator */}
          {formData.category && (
            <div className={`p-3 rounded-lg border-l-4 ${
              isIngredient 
                ? 'bg-blue-50 border-blue-500' 
                : isBeerFamily 
                  ? 'bg-purple-50 border-purple-500'
                  : 'bg-green-50 border-green-500'
            }`}>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">
                  {isIngredient ? '🧪 Ingredient' : isBeerFamily ? '🍺 Beer Family' : '🛒 Final Product'}
                </span>
                <span className="text-sm text-gray-600">
                  {isIngredient 
                    ? 'Used in recipes, not sold directly' 
                    : isBeerFamily
                      ? 'Multiple purchase formats and serving options'
                      : 'Sold directly to customers'
                  }
                </span>
              </div>
            </div>
          )}

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleNameChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-800 focus:border-transparent"
                placeholder={isBeerFamily ? "e.g., Batch 15, House IPA" : "e.g., Tequila Blanco, Pinot Grigio"}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleCategoryChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-800"
              >
                <option value="">Select Category</option>
                {Object.entries(fohCategories).map(([key, cat]) => (
                  <option key={key} value={key}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Beer Family Variant Selection */}
            {isBeerFamily && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Purchase Format *
                </label>
                <select
                  name="variantType"
                  value={formData.variantType}
                  onChange={handleVariantTypeChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-800"
                >
                  <option value="">Select Format</option>
                  {selectedCategory?.variants && Object.entries(selectedCategory.variants).map(([key, variant]) => (
                    <option key={key} value={key}>
                      {variant.icon} {variant.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {formData.category && selectedCategory?.subcategories && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subcategory
                </label>
                <select
                  name="subcategory"
                  value={formData.subcategory}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-800"
                >
                  <option value="">Select Subcategory</option>
                  {selectedCategory.subcategories.map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SKU {requiresManualSku && <span className="text-red-600">*</span>}
              </label>
              {requiresManualSku && (
                <div className="mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                  <AlertCircle className="h-4 w-4 inline mr-1" />
                  Enter your existing TOAST SKU for this beer
                </div>
              )}
              <input
                type="text"
                name="sku"
                value={formData.sku}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-800 ${
                  !requiresManualSku ? 'bg-gray-50' : ''
                }`}
                placeholder={requiresManualSku ? "Enter TOAST SKU" : "Auto-generated"}
                readOnly={!requiresManualSku}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Supplier
              </label>
              <input
                type="text"
                name="supplier"
                value={formData.supplier}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-800"
                placeholder="e.g., Dickerson Distributors, Total Wine"
              />
            </div>
          </div>

          {/* Purchase Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <DollarSign className="h-5 w-5 mr-2" />
              Purchase Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Purchase Quantity *
                </label>
                <input
                  type="number"
                  step="0.1"
                  name="unitSize"
                  value={formData.unitSize}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-800"
                  placeholder="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Purchase Unit *
                </label>
                <select
                  name="unitType"
                  value={formData.unitType}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-800"
                >
                  <option value="">Select Purchase Unit</option>
                  {(selectedVariant?.purchaseUnits || selectedCategory?.purchaseUnits)?.map(unit => (
                    <option key={unit.value} value={unit.value}>
                      {unit.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cost Per Unit *
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="costPerUnit"
                  value={formData.costPerUnit}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-800"
                  placeholder="15.99"
                />
              </div>
            </div>
          </div>

          {/* Multiple Serving Options - For Final Products */}
          {!isIngredient && Object.keys(calculatedData.servingsPerUnit).length > 0 && (
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <Calculator className="h-5 w-5 mr-2" />
                  Serving Options & Pricing
                </h3>
                
                {remainingServingOptions.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <select
                      onChange={(e) => {
                        const option = remainingServingOptions.find(opt => opt.value === e.target.value);
                        if (option) addServingOption(option);
                      }}
                      className="px-3 py-1 border border-gray-300 rounded text-sm"
                      defaultValue=""
                    >
                      <option value="">Add Serving Option</option>
                      {remainingServingOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {formData.multipleServings.length === 0 && (
                <div className="text-center py-6 text-gray-500">
                  <Calculator className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p>No serving options configured</p>
                  <p className="text-sm">Add serving options to set pricing</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {formData.multipleServings.map((serving, index) => {
                  const servings = calculatedData.servingsPerUnit[serving.servingOption] || 0;
                  const costPerServing = calculatedData.costPerServing[serving.servingOption] || 0;
                  
                  return (
                    <div key={index} className="bg-white p-4 rounded border">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium text-gray-800">{serving.label}</div>
                        <button
                          onClick={() => removeServingOption(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-3">
                        <div>Servings: {servings.toFixed(1)}</div>
                        <div>Cost: ${costPerServing.toFixed(3)}</div>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="block text-xs font-medium text-gray-700">
                          Selling Price
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={serving.price}
                          onChange={(e) => updateServingPrice(index, parseFloat(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-800"
                        />
                        <div className={`text-xs ${
                          serving.margin >= 70 ? 'text-green-600' :
                          serving.margin >= 50 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          Margin: {serving.margin}%
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Additional Information */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-800"
                placeholder="Product description..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-800"
                placeholder="Internal notes..."
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleInputChange}
                className="h-4 w-4 text-green-800 focus:ring-green-800 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">
                Product is active
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-green-800 text-white rounded-lg hover:bg-green-900 transition-colors font-medium flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>{isEditing ? 'Update Product' : 'Add Product'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedProductForm;