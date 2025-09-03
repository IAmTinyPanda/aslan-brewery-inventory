// src/components/products/ProductFamilyForm.jsx
import React, { useState, useEffect } from 'react';
import { X, Save, Package, DollarSign, Calculator, Plus, Trash2, AlertCircle } from 'lucide-react';
import { fohCategories, calculateServingsFromPurchase, generateSKU } from '../../data/categories';

const ProductFamilyForm = ({ 
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
    recipeId: '', // For recipe-based products
    description: '',
    notes: '',
    isActive: true,
    productType: 'purchased',
    
    // Purchase information (for purchased items)
    purchaseInfo: {
      format: '', // For beer: 'draft' or 'packaged'
      quantity: '',
      unit: '',
      costPerUnit: ''
    },
    
    // Serving options with individual SKUs and pricing
    servingOptions: []
  });

  const [showServingForm, setShowServingForm] = useState(false);
  const [editingServingIndex, setEditingServingIndex] = useState(-1);
  const [servingFormData, setServingFormData] = useState({
    optionType: '',
    customName: '',
    sku: '',
    servingSize: '',
    servingUnit: 'oz',
    price: '',
    margin: '75'
  });

  // Reset form when opening
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
      recipeId: '',
      description: '',
      notes: '',
      isActive: true,
      productType: 'purchased',
      purchaseInfo: {
        format: '',
        quantity: '',
        unit: '',
        costPerUnit: ''
      },
      servingOptions: []
    });
    setShowServingForm(false);
    setEditingServingIndex(-1);
    resetServingForm();
  };

  const resetServingForm = () => {
    setServingFormData({
      optionType: '',
      customName: '',
      sku: '',
      servingSize: '',
      servingUnit: 'oz',
      price: '',
      margin: '75'
    });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handlePurchaseInfoChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      purchaseInfo: {
        ...prev.purchaseInfo,
        [name]: value
      }
    }));
  };

  const handleCategoryChange = (e) => {
    const category = e.target.value;
    const categoryData = fohCategories[category];
    
    setFormData(prev => ({
      ...prev,
      category,
      subcategory: '',
      productType: categoryData?.productType || 'purchased',
      purchaseInfo: {
        format: '',
        quantity: '',
        unit: '',
        costPerUnit: ''
      },
      servingOptions: []
    }));
  };

  const handleFormatChange = (e) => {
    const format = e.target.value;
    setFormData(prev => ({
      ...prev,
      purchaseInfo: {
        ...prev.purchaseInfo,
        format,
        unit: '' // Reset unit when format changes
      }
    }));
  };

  // Get available purchase units based on category and format
  const getAvailablePurchaseUnits = () => {
    const categoryData = fohCategories[formData.category];
    if (!categoryData) return [];

    if (categoryData.purchaseFormats && formData.purchaseInfo.format) {
      return categoryData.purchaseFormats[formData.purchaseInfo.format]?.purchaseUnits || [];
    }
    
    return categoryData.purchaseUnits || [];
  };

  // Get available serving options based on category and format
  const getAvailableServingOptions = () => {
    const categoryData = fohCategories[formData.category];
    if (!categoryData) return [];

    if (categoryData.purchaseFormats && formData.purchaseInfo.format) {
      return categoryData.purchaseFormats[formData.purchaseInfo.format]?.servingOptions || [];
    }
    
    return categoryData.servingOptions || [];
  };

  const handleServingFormChange = (e) => {
    const { name, value } = e.target;
    setServingFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleServingOptionTypeChange = (e) => {
    const optionType = e.target.value;
    const availableOptions = getAvailableServingOptions();
    const selectedOption = availableOptions.find(opt => opt.value === optionType);
    
    let autoSku = '';
    if (selectedOption && !fohCategories[formData.category]?.requiresManualSKU) {
      autoSku = generateSKU(formData.name, formData.category, optionType);
    }

    setServingFormData(prev => ({
      ...prev,
      optionType,
      customName: selectedOption?.label || '',
      servingSize: selectedOption?.defaultSize || '',
      servingUnit: selectedOption?.unit || 'oz',
      sku: autoSku
    }));
  };

  const calculateServingCost = () => {
    const { quantity, unit, costPerUnit } = formData.purchaseInfo;
    const { servingSize, servingUnit } = servingFormData;
    
    if (!quantity || !unit || !costPerUnit || !servingSize) return { servingsPerUnit: 0, costPerServing: 0 };

    const servingsPerUnit = calculateServingsFromPurchase(unit, parseFloat(quantity), parseFloat(servingSize), servingUnit);
    const totalCost = parseFloat(costPerUnit) * parseFloat(quantity);
    const costPerServing = totalCost / servingsPerUnit;

    return { servingsPerUnit, costPerServing };
  };

  const calculateSuggestedPrice = (costPerServing, margin) => {
    const marginDecimal = parseFloat(margin) / 100;
    return costPerServing / (1 - marginDecimal);
  };

  const handleAddServingOption = () => {
    const { servingsPerUnit, costPerServing } = calculateServingCost();
    const suggestedPrice = calculateSuggestedPrice(costPerServing, servingFormData.margin);
    
    const newServingOption = {
      id: Date.now().toString(),
      ...servingFormData,
      servingsPerUnit,
      costPerServing,
      suggestedPrice,
      price: servingFormData.price || suggestedPrice.toFixed(2)
    };

    if (editingServingIndex >= 0) {
      // Update existing serving option
      const updatedOptions = [...formData.servingOptions];
      updatedOptions[editingServingIndex] = newServingOption;
      setFormData(prev => ({ ...prev, servingOptions: updatedOptions }));
    } else {
      // Add new serving option
      setFormData(prev => ({
        ...prev,
        servingOptions: [...prev.servingOptions, newServingOption]
      }));
    }

    // Reset serving form
    resetServingForm();
    setShowServingForm(false);
    setEditingServingIndex(-1);
  };

  const handleEditServingOption = (index) => {
    const option = formData.servingOptions[index];
    setServingFormData({
      optionType: option.optionType,
      customName: option.customName,
      sku: option.sku,
      servingSize: option.servingSize,
      servingUnit: option.servingUnit,
      price: option.price,
      margin: option.margin
    });
    setEditingServingIndex(index);
    setShowServingForm(true);
  };

  const handleDeleteServingOption = (index) => {
    const updatedOptions = formData.servingOptions.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, servingOptions: updatedOptions }));
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

  const handleCloseServingForm = () => {
    setShowServingForm(false);
    setEditingServingIndex(-1);
    resetServingForm();
  };

  if (!isOpen) return null;

  const selectedCategory = fohCategories[formData.category];
  const isRecipeBased = selectedCategory?.productType === 'recipe-based';
  const isManufactured = selectedCategory?.productType === 'manufactured';
  const hasPurchaseFormats = selectedCategory?.purchaseFormats;
  const requiresManualSKU = selectedCategory?.requiresManualSKU;
  const availableServingOptions = getAvailableServingOptions();
  const usedServingTypes = formData.servingOptions.map(opt => opt.optionType);
  const remainingServingOptions = availableServingOptions.filter(opt => !usedServingTypes.includes(opt.value));

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

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Product Type Indicator */}
          {selectedCategory && (
            <div className={`p-3 rounded-lg border-l-4 ${
              isRecipeBased 
                ? 'bg-purple-50 border-purple-500' 
                : isManufactured 
                  ? 'bg-blue-50 border-blue-500'
                  : 'bg-green-50 border-green-500'
            }`}>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">
                  {isRecipeBased ? '🧪 Recipe-Based Product' : isManufactured ? '🏭 Manufactured In-House' : '🛒 Purchased Product'}
                </span>
                <span className="text-sm text-gray-600">
                  {isRecipeBased 
                    ? 'Made from recipes - costs calculated from ingredients' 
                    : isManufactured
                      ? 'Made in-house - purchase raw materials'
                      : 'Purchased from suppliers'
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
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-800"
                placeholder={selectedCategory?.name === 'Beer Family' ? "e.g., Batch 15, House IPA" : "e.g., Chateau Margaux 2018"}
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
                required
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

            {/* Purchase Format Selection (for categories like Beer Family) */}
            {hasPurchaseFormats && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Purchase Format *
                </label>
                <select
                  name="format"
                  value={formData.purchaseInfo.format}
                  onChange={handleFormatChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-800"
                >
                  <option value="">Select Format</option>
                  {Object.entries(selectedCategory.purchaseFormats).map(([key, format]) => (
                    <option key={key} value={key}>
                      {format.icon} {format.name}
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

            {/* Supplier (for purchased items) or Recipe (for recipe-based) */}
            {!isRecipeBased ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isManufactured ? 'Raw Material Supplier' : 'Supplier'}
                </label>
                <input
                  type="text"
                  name="supplier"
                  value={formData.supplier}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-800"
                  placeholder={isManufactured ? "e.g., Malt supplier, Hop supplier" : "e.g., Wine Distributor, ABC Company"}
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recipe *
                </label>
                <select
                  name="recipeId"
                  value={formData.recipeId}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-800"
                >
                  <option value="">Select Recipe</option>
                  <option value="margarita_classic">Classic Margarita</option>
                  <option value="old_fashioned">Old Fashioned</option>
                  <option value="moscow_mule">Moscow Mule</option>
                  <option value="whiskey_sour">Whiskey Sour</option>
                  {/* This would be populated from your recipe system */}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Select the recipe used to make this batch cocktail
                </p>
              </div>
            )}
          </div>

          {/* Purchase Information (only for purchased/manufactured items) */}
          {!isRecipeBased && (
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
                    name="quantity"
                    value={formData.purchaseInfo.quantity}
                    onChange={handlePurchaseInfoChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-800"
                    placeholder="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Purchase Unit *
                  </label>
                  <select
                    name="unit"
                    value={formData.purchaseInfo.unit}
                    onChange={handlePurchaseInfoChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-800"
                  >
                    <option value="">Select Purchase Unit</option>
                    {getAvailablePurchaseUnits().map(unit => (
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
                    value={formData.purchaseInfo.costPerUnit}
                    onChange={handlePurchaseInfoChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-800"
                    placeholder="85.00"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Serving Options */}
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <Calculator className="h-5 w-5 mr-2" />
                Serving Options & Pricing ({formData.servingOptions.length})
              </h3>
              
              <button
                type="button"
                onClick={() => setShowServingForm(true)}
                className="px-4 py-2 bg-green-800 text-white rounded-lg hover:bg-green-900 transition-colors font-medium flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Add Serving Option</span>
              </button>
            </div>

            {formData.servingOptions.length === 0 && (
              <div className="text-center py-6 text-gray-500">
                <Calculator className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p>No serving options configured</p>
                <p className="text-sm">Add serving options to set pricing and SKUs</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {formData.servingOptions.map((option, index) => (
                <div key={option.id} className="bg-white p-4 rounded border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-gray-800 truncate">{option.customName}</div>
                    <div className="flex items-center space-x-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handleEditServingOption(index)}
                        className="text-blue-600 hover:text-blue-800 p-1"
                        title="Edit serving option"
                      >
                        <Package className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteServingOption(index)}
                        className="text-red-600 hover:text-red-800 p-1"
                        title="Delete serving option"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-600 mb-3 space-y-1">
                    <div className="font-mono text-xs bg-gray-100 p-1 rounded truncate" title={option.sku}>{option.sku}</div>
                    <div>Size: {option.servingSize} {option.servingUnit}</div>
                    <div>Cost: ${option.costPerServing?.toFixed(3)}</div>
                    <div>Price: ${option.price}</div>
                    <div className={`${
                      parseFloat(option.margin) >= 70 ? 'text-green-600' :
                      parseFloat(option.margin) >= 50 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      Margin: {option.margin}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

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
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-800 text-white rounded-lg hover:bg-green-900 transition-colors font-medium flex items-center space-x-2"
              disabled={formData.servingOptions.length === 0}
            >
              <Save className="h-4 w-4" />
              <span>{isEditing ? 'Update Product' : 'Create Product'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Serving Option Form Modal */}
      {showServingForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-800 to-blue-900 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                {editingServingIndex >= 0 ? 'Edit Serving Option' : 'Add Serving Option'}
              </h3>
              <button
                type="button"
                onClick={handleCloseServingForm}
                className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Serving Option *
                </label>
                <select
                  name="optionType"
                  value={servingFormData.optionType}
                  onChange={handleServingOptionTypeChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-800"
                >
                  <option value="">Select Serving Option</option>
                  {availableServingOptions.map(option => (
                    <option 
                      key={option.value} 
                      value={option.value}
                      disabled={editingServingIndex === -1 && usedServingTypes.includes(option.value)}
                    >
                      {option.label} {editingServingIndex === -1 && usedServingTypes.includes(option.value) ? '(Already added)' : ''}
                    </option>
                  ))}
                  <option value="custom">Custom Serving Option</option>
                </select>
              </div>

              {servingFormData.optionType === 'custom' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Custom Name *
                  </label>
                  <input
                    type="text"
                    name="customName"
                    value={servingFormData.customName}
                    onChange={handleServingFormChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-800"
                    placeholder="e.g., Large Growler, Custom Glass"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Serving Size *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    name="servingSize"
                    value={servingFormData.servingSize}
                    onChange={handleServingFormChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-800"
                    placeholder="16"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unit
                  </label>
                  <select
                    name="servingUnit"
                    value={servingFormData.servingUnit}
                    onChange={handleServingFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-800"
                  >
                    <option value="oz">oz</option>
                    <option value="ml">ml</option>
                    <option value="cans">cans</option>
                    <option value="bottles">bottles</option>
                    <option value="item">item</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SKU {requiresManualSKU && <span className="text-red-600">*</span>}
                </label>
                {requiresManualSKU && (
                  <div className="mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                    <AlertCircle className="h-4 w-4 inline mr-1" />
                    Enter your TOAST SKU for this serving size
                  </div>
                )}
                <input
                  type="text"
                  name="sku"
                  value={servingFormData.sku}
                  onChange={handleServingFormChange}
                  required={requiresManualSKU}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-800 ${
                    !requiresManualSKU ? 'bg-gray-50' : ''
                  }`}
                  placeholder={requiresManualSKU ? "Enter TOAST SKU" : "Auto-generated"}
                  readOnly={!requiresManualSKU}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Selling Price
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="price"
                    value={servingFormData.price}
                    onChange={handleServingFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-800"
                    placeholder="Auto-calculated"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Margin %
                  </label>
                  <input
                    type="number"
                    step="1"
                    name="margin"
                    value={servingFormData.margin}
                    onChange={handleServingFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-800"
                    placeholder="75"
                  />
                </div>
              </div>

              {/* Calculated Preview */}
              {!isRecipeBased && formData.purchaseInfo.quantity && formData.purchaseInfo.unit && formData.purchaseInfo.costPerUnit && servingFormData.servingSize && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="text-md font-semibold text-gray-800 mb-2">Calculated Values</h4>
                  {(() => {
                    const { servingsPerUnit, costPerServing } = calculateServingCost();
                    const suggestedPrice = calculateSuggestedPrice(costPerServing, servingFormData.margin);
                    
                    return (
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-lg font-bold text-green-800">
                            {servingsPerUnit.toFixed(1)}
                          </div>
                          <div className="text-xs text-gray-600">Servings per Purchase</div>
                        </div>
                        
                        <div>
                          <div className="text-lg font-bold text-green-800">
                            ${costPerServing.toFixed(3)}
                          </div>
                          <div className="text-xs text-gray-600">Cost per Serving</div>
                        </div>
                        
                        <div>
                          <div className="text-lg font-bold text-green-800">
                            ${suggestedPrice.toFixed(2)}
                          </div>
                          <div className="text-xs text-gray-600">Suggested Price</div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Recipe-based products note */}
              {isRecipeBased && (
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-purple-600" />
                    <span className="text-sm text-purple-800">
                      Costs will be calculated from recipe ingredients when recipe is selected
                    </span>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={handleCloseServingForm}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddServingOption}
                  disabled={!servingFormData.optionType || !servingFormData.servingSize || (requiresManualSKU && !servingFormData.sku)}
                  className="px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-900 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>{editingServingIndex >= 0 ? 'Update' : 'Add'} Serving Option</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductFamilyForm;