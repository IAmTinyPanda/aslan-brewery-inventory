// src/components/products/ProductFamilyForm.jsx
import React, { useState, useEffect } from 'react';
import { X, Save, Package, DollarSign, Calculator, Plus, Trash2, Link } from 'lucide-react';
import { fohCategories, calculateServings, convertCustomUnit } from '../../data/categories';

const ProductFamilyForm = ({ 
  product = null, 
  isOpen = false, 
  onClose, 
  onSave, 
  isEditing = false 
}) => {
  const [formType, setFormType] = useState('simple'); // 'simple' or 'family'
  const [familyData, setFamilyData] = useState({
    name: '',
    category: '',
    subcategory: '',
    description: '',
    isActive: true,
    variants: []
  });
  
  const [variantData, setVariantData] = useState({
    name: '',
    sku: '',
    category: '',
    subcategory: '',
    supplier: '',
    unitSize: '',
    unitType: '',
    customUnit: '',
    costPerUnit: '',
    servingSize: '1',
    servingUnit: '',
    targetMargin: '75',
    description: '',
    notes: '',
    isActive: true
  });

  const [calculatedData, setCalculatedData] = useState({
    costPerServing: 0,
    suggestedPrice: 0,
    servingsPerUnit: 0
  });

  const [showVariantForm, setShowVariantForm] = useState(false);
  const [editingVariantIndex, setEditingVariantIndex] = useState(-1);

  // Determine if category supports families
  const selectedCategory = fohCategories[formType === 'family' ? familyData.category : variantData.category];
  const isFamilyCategory = selectedCategory?.isFamily;
  const isVariantCategory = selectedCategory?.isVariant;

  // Reset form when opening
  useEffect(() => {
    if (isOpen && !isEditing) {
      setFormType('simple');
      setFamilyData({
        name: '',
        category: '',
        subcategory: '',
        description: '',
        isActive: true,
        variants: []
      });
      setVariantData({
        name: '',
        sku: '',
        category: '',
        subcategory: '',
        supplier: '',
        unitSize: '',
        unitType: '',
        customUnit: '',
        costPerUnit: '',
        servingSize: '1',
        servingUnit: '',
        targetMargin: '75',
        description: '',
        notes: '',
        isActive: true
      });
      setShowVariantForm(false);
      setEditingVariantIndex(-1);
    }
  }, [isOpen, isEditing]);

  // Calculate servings and costs for variants
  useEffect(() => {
    const { costPerUnit, unitSize, servingSize, unitType, servingUnit, targetMargin, category } = variantData;
    
    if (costPerUnit && unitSize && servingSize && unitType && servingUnit && category) {
      const cost = parseFloat(costPerUnit);
      const margin = parseFloat(targetMargin) / 100;
      
      // Use the enhanced calculation function
      const servingsPerUnit = calculateServings(
        unitType, 
        parseFloat(unitSize), 
        parseFloat(servingSize), 
        servingUnit, 
        category
      );

      if (servingsPerUnit > 0) {
        const costPerServing = cost / servingsPerUnit;
        const suggestedPrice = costPerServing / (1 - margin);
        
        setCalculatedData({
          costPerServing,
          suggestedPrice,
          servingsPerUnit
        });
      } else {
        setCalculatedData({ costPerServing: 0, suggestedPrice: 0, servingsPerUnit: 0 });
      }
    }
  }, [variantData.costPerUnit, variantData.unitSize, variantData.servingSize, variantData.unitType, variantData.servingUnit, variantData.targetMargin, variantData.category]);

  const handleFamilyChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFamilyData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleVariantChange = (e) => {
    const { name, value, type, checked } = e.target;
    setVariantData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleCategoryChange = (e, isFamily = false) => {
    const category = e.target.value;
    
    if (isFamily) {
      setFamilyData(prev => ({
        ...prev,
        category,
        subcategory: ''
      }));
    } else {
      // Auto-set defaults based on category
      const categoryData = fohCategories[category];
      let defaults = {};
      
      if (categoryData?.servingOptions?.length > 0) {
        defaults.servingUnit = categoryData.servingOptions[0].value;
      }
      
      setVariantData(prev => ({
        ...prev,
        category,
        subcategory: '',
        sku: generateSKU(prev.name, category),
        ...defaults
      }));
    }
  };

  const generateSKU = (name, category) => {
    if (!name || !category) return '';
    
    const categoryCode = {
      'draftBeer': 'DBR',
      'packagedBeer': 'PKG',
      'cocktailIngredient': 'ING',
      'cider': 'CDR',
      'kombucha': 'KMB',
      'wine': 'WIN',
      'naBeverages': 'NAB',
      'retail': 'RTL'
    };

    const nameCode = name.substring(0, 3).toUpperCase().replace(/\s/g, '');
    const catCode = categoryCode[category] || 'GEN';
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    return `ASL-${catCode}-${nameCode}-${randomNum}`;
  };

  const handleAddVariant = () => {
    const newVariant = {
      ...variantData,
      ...calculatedData,
      id: Date.now().toString()
    };

    if (editingVariantIndex >= 0) {
      // Update existing variant
      const updatedVariants = [...familyData.variants];
      updatedVariants[editingVariantIndex] = newVariant;
      setFamilyData(prev => ({ ...prev, variants: updatedVariants }));
    } else {
      // Add new variant
      setFamilyData(prev => ({
        ...prev,
        variants: [...prev.variants, newVariant]
      }));
    }

    // Reset variant form
    setVariantData({
      name: '',
      sku: '',
      category: '',
      subcategory: '',
      supplier: '',
      unitSize: '',
      unitType: '',
      customUnit: '',
      costPerUnit: '',
      servingSize: '1',
      servingUnit: '',
      targetMargin: '75',
      description: '',
      notes: '',
      isActive: true
    });
    setShowVariantForm(false);
    setEditingVariantIndex(-1);
  };

  const handleEditVariant = (index) => {
    setVariantData(familyData.variants[index]);
    setEditingVariantIndex(index);
    setShowVariantForm(true);
  };

  const handleDeleteVariant = (index) => {
    const updatedVariants = familyData.variants.filter((_, i) => i !== index);
    setFamilyData(prev => ({ ...prev, variants: updatedVariants }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    let productData;
    
    if (formType === 'family') {
      // Save family with variants
      productData = {
        ...familyData,
        id: isEditing ? product.id : Date.now().toString(),
        type: 'family',
        createdAt: isEditing ? product.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    } else {
      // Save simple product
      productData = {
        ...variantData,
        ...calculatedData,
        id: isEditing ? product.id : Date.now().toString(),
        type: 'simple',
        createdAt: isEditing ? product.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }
    
    onSave(productData);
  };

  if (!isOpen) return null;

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
          {/* Product Type Selection */}
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Product Type</h3>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="simple"
                  checked={formType === 'simple'}
                  onChange={(e) => setFormType(e.target.value)}
                  className="h-4 w-4 text-green-800 focus:ring-green-800"
                />
                <span className="ml-2 text-sm font-medium text-gray-700">
                  Simple Product (Wine, Retail, Individual Items)
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="family"
                  checked={formType === 'family'}
                  onChange={(e) => setFormType(e.target.value)}
                  className="h-4 w-4 text-green-800 focus:ring-green-800"
                />
                <span className="ml-2 text-sm font-medium text-gray-700">
                  Product Family (Beer Styles, Batch Cocktails)
                </span>
              </label>
            </div>
          </div>

          {formType === 'family' ? (
            <>
              {/* Family Information */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <Link className="h-5 w-5 mr-2" />
                  Family Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Family Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={familyData.name}
                      onChange={handleFamilyChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-800"
                      placeholder="e.g., Batch 15, Margarita Family"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Family Category *
                    </label>
                    <select
                      name="category"
                      value={familyData.category}
                      onChange={(e) => handleCategoryChange(e, true)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-800"
                    >
                      <option value="">Select Family Type</option>
                      {Object.entries(fohCategories)
                        .filter(([key, cat]) => cat.isFamily)
                        .map(([key, cat]) => (
                          <option key={key} value={key}>
                            {cat.icon} {cat.name}
                          </option>
                        ))
                      }
                    </select>
                  </div>

                  {familyData.category && fohCategories[familyData.category]?.subcategories && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Subcategory
                      </label>
                      <select
                        name="subcategory"
                        value={familyData.subcategory}
                        onChange={handleFamilyChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-800"
                      >
                        <option value="">Select Subcategory</option>
                        {fohCategories[familyData.category].subcategories.map(sub => (
                          <option key={sub} value={sub}>{sub}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Family Description
                  </label>
                  <textarea
                    name="description"
                    value={familyData.description}
                    onChange={handleFamilyChange}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-800"
                    placeholder="Describe this product family..."
                  />
                </div>
              </div>

              {/* Variants Section */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Product Variants ({familyData.variants.length})
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowVariantForm(true)}
                    className="px-4 py-2 bg-green-800 text-white rounded-lg hover:bg-green-900 transition-colors font-medium flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Variant</span>
                  </button>
                </div>

                {familyData.variants.length > 0 && (
                  <div className="space-y-2">
                    {familyData.variants.map((variant, index) => (
                      <div key={variant.id} className="bg-white p-3 rounded border flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">{variant.name}</div>
                          <div className="text-sm text-gray-500">
                            {variant.unitSize} {variant.unitType} • ${variant.costPerUnit} • 
                            {variant.servingsPerUnit?.toFixed(1)} servings @ ${variant.costPerServing?.toFixed(3)} each
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => handleEditVariant(index)}
                            className="text-blue-600 hover:text-blue-800 p-1"
                          >
                            <Package className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteVariant(index)}
                            className="text-red-600 hover:text-red-800 p-1"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Simple Product Form */
            <>
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={variantData.name}
                    onChange={handleVariantChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-800"
                    placeholder="e.g., Chateau Margaux 2018, Aslan T-Shirt"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Generated SKU
                  </label>
                  <input
                    type="text"
                    name="sku"
                    value={variantData.sku}
                    onChange={handleVariantChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    placeholder="Auto-generated"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    name="category"
                    value={variantData.category}
                    onChange={handleCategoryChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-800"
                  >
                    <option value="">Select Category</option>
                    {Object.entries(fohCategories)
                      .filter(([key, cat]) => !cat.isFamily && !cat.isVariant)
                      .map(([key, cat]) => (
                        <option key={key} value={key}>
                          {cat.icon} {cat.name}
                        </option>
                      ))
                    }
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subcategory
                  </label>
                  <select
                    name="subcategory"
                    value={variantData.subcategory}
                    onChange={handleVariantChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-800"
                  >
                    <option value="">Select Subcategory</option>
                    {variantData.category && fohCategories[variantData.category]?.subcategories?.map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Supplier
                  </label>
                  <input
                    type="text"
                    name="supplier"
                    value={variantData.supplier}
                    onChange={handleVariantChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-800"
                    placeholder="e.g., Wine Distributor, Retail Supplier"
                  />
                </div>
              </div>

              {/* Cost & Unit Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <DollarSign className="h-5 w-5 mr-2" />
                  Cost & Unit Information
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
                      value={variantData.unitSize}
                      onChange={handleVariantChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-800"
                      placeholder="1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Purchase Unit *
                    </label>
                    {variantData.category && fohCategories[variantData.category]?.hasCustomUnits ? (
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          step="0.01"
                          name="customUnit"
                          value={variantData.customUnit}
                          onChange={handleVariantChange}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-800"
                          placeholder="1.89"
                        />
                        <select
                          name="unitType"
                          value={variantData.unitType}
                          onChange={handleVariantChange}
                          required
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-800"
                        >
                          <option value="">Unit</option>
                          {fohCategories[variantData.category].customUnits?.map(unit => (
                            <option key={unit.value} value={unit.value}>
                              {unit.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <select
                        name="unitType"
                        value={variantData.unitType}
                        onChange={handleVariantChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-800"
                      >
                        <option value="">Select Purchase Unit</option>
                        {variantData.category && fohCategories[variantData.category]?.purchaseUnits?.map(unit => (
                          <option key={unit.value} value={unit.value}>
                            {unit.label}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cost Per Unit *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="costPerUnit"
                      value={variantData.costPerUnit}
                      onChange={handleVariantChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-800"
                      placeholder="15.99"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Serving Size *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      name="servingSize"
                      value={variantData.servingSize}
                      onChange={handleVariantChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-800"
                      placeholder="1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Serving Unit *
                    </label>
                    <select
                      name="servingUnit"
                      value={variantData.servingUnit}
                      onChange={handleVariantChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-800"
                    >
                      <option value="">Select Serving</option>
                      {variantData.category && fohCategories[variantData.category]?.servingOptions?.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Target Margin %
                    </label>
                    <input
                      type="number"
                      step="1"
                      name="targetMargin"
                      value={variantData.targetMargin}
                      onChange={handleVariantChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-800"
                      placeholder="75"
                    />
                  </div>
                </div>
              </div>

              {/* Calculated Values */}
              {calculatedData.servingsPerUnit > 0 && (
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <Calculator className="h-5 w-5 mr-2" />
                    Calculated Values
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-800">
                        {calculatedData.servingsPerUnit.toFixed(1)}
                      </div>
                      <div className="text-sm text-gray-600">Servings per Unit</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-800">
                        ${calculatedData.costPerServing.toFixed(3)}
                      </div>
                      <div className="text-sm text-gray-600">Cost per Serving</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-800">
                        ${calculatedData.suggestedPrice.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-600">Suggested Price</div>
                    </div>
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
                    value={variantData.description}
                    onChange={handleVariantChange}
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
                    value={variantData.notes}
                    onChange={handleVariantChange}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-800"
                    placeholder="Internal notes..."
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={variantData.isActive}
                    onChange={handleVariantChange}
                    className="h-4 w-4 text-green-800 focus:ring-green-800 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-700">
                    Product is active
                  </label>
                </div>
              </div>
            </>
          )}

          {/* Variant Form Modal */}
          {showVariantForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-screen overflow-y-auto">
                <div className="bg-gradient-to-r from-blue-800 to-blue-900 px-6 py-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">
                    {editingVariantIndex >= 0 ? 'Edit Variant' : 'Add Variant'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowVariantForm(false)}
                    className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  {/* Basic Variant Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Variant Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={variantData.name}
                        onChange={handleVariantChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-800"
                        placeholder="e.g., Batch 15 1/2 BBL, Tequila Blanco"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Variant Category *
                      </label>
                      <select
                        name="category"
                        value={variantData.category}
                        onChange={handleCategoryChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-800"
                      >
                        <option value="">Select Variant Type</option>
                        {Object.entries(fohCategories)
                          .filter(([key, cat]) => cat.isVariant || (!cat.isFamily && !cat.isVariant))
                          .map(([key, cat]) => (
                            <option key={key} value={key}>
                              {cat.icon} {cat.name}
                            </option>
                          ))
                        }
                      </select>
                    </div>

                    {variantData.category && fohCategories[variantData.category]?.subcategories && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Subcategory
                        </label>
                        <select
                          name="subcategory"
                          value={variantData.subcategory}
                          onChange={handleVariantChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-800"
                        >
                          <option value="">Select Subcategory</option>
                          {fohCategories[variantData.category].subcategories.map(sub => (
                            <option key={sub} value={sub}>{sub}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        SKU {variantData.category?.includes('Beer') && <span className="text-xs text-blue-600">(Manual entry for beer)</span>}
                      </label>
                      <input
                        type="text"
                        name="sku"
                        value={variantData.sku}
                        onChange={handleVariantChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-800"
                        placeholder={variantData.category?.includes('Beer') ? "Enter TOAST SKU" : "Auto-generated"}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Supplier
                      </label>
                      <input
                        type="text"
                        name="supplier"
                        value={variantData.supplier}
                        onChange={handleVariantChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-800"
                        placeholder="e.g., Aslan Brewery, ABC Distributors"
                      />
                    </div>
                  </div>

                  {/* Purchase Information */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-md font-semibold text-gray-800 mb-4 flex items-center">
                      <DollarSign className="h-4 w-4 mr-2" />
                      Purchase Information
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Purchase Quantity *
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          name="unitSize"
                          value={variantData.unitSize}
                          onChange={handleVariantChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-800"
                          placeholder="1"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Purchase Unit *
                        </label>
                        {variantData.category && fohCategories[variantData.category]?.hasCustomUnits ? (
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="number"
                              step="0.01"
                              name="customUnit"
                              value={variantData.customUnit}
                              onChange={handleVariantChange}
                              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-800"
                              placeholder="1.89"
                            />
                            <select
                              name="unitType"
                              value={variantData.unitType}
                              onChange={handleVariantChange}
                              required
                              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-800"
                            >
                              <option value="">Unit</option>
                              {fohCategories[variantData.category].customUnits?.map(unit => (
                                <option key={unit.value} value={unit.value}>
                                  {unit.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <select
                            name="unitType"
                            value={variantData.unitType}
                            onChange={handleVariantChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-800"
                          >
                            <option value="">Select Purchase Unit</option>
                            {variantData.category && fohCategories[variantData.category]?.purchaseUnits?.map(unit => (
                              <option key={unit.value} value={unit.value}>
                                {unit.label}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Cost Per Unit *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          name="costPerUnit"
                          value={variantData.costPerUnit}
                          onChange={handleVariantChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-800"
                          placeholder="85.00"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Serving Information */}
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h4 className="text-md font-semibold text-gray-800 mb-4 flex items-center">
                      <Calculator className="h-4 w-4 mr-2" />
                      Primary Serving Size
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Serving Size *
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          name="servingSize"
                          value={variantData.servingSize}
                          onChange={handleVariantChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-800"
                          placeholder="1"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Serving Unit *
                        </label>
                        <select
                          name="servingUnit"
                          value={variantData.servingUnit}
                          onChange={handleVariantChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-800"
                        >
                          <option value="">Select Serving</option>
                          {variantData.category && fohCategories[variantData.category]?.servingOptions?.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Target Margin %
                        </label>
                        <input
                          type="number"
                          step="1"
                          name="targetMargin"
                          value={variantData.targetMargin}
                          onChange={handleVariantChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-800"
                          placeholder="75"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Calculated Values */}
                  {calculatedData.servingsPerUnit > 0 && (
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="text-md font-semibold text-gray-800 mb-4">
                        Calculated Values
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-800">
                            {calculatedData.servingsPerUnit.toFixed(1)}
                          </div>
                          <div className="text-sm text-gray-600">Servings per Unit</div>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-800">
                            ${calculatedData.costPerServing.toFixed(3)}
                          </div>
                          <div className="text-sm text-gray-600">Cost per Serving</div>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-800">
                            ${calculatedData.suggestedPrice.toFixed(2)}
                          </div>
                          <div className="text-sm text-gray-600">Suggested Price</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Additional Info */}
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        name="description"
                        value={variantData.description}
                        onChange={handleVariantChange}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-800"
                        placeholder="Variant description..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Notes
                      </label>
                      <textarea
                        name="notes"
                        value={variantData.notes}
                        onChange={handleVariantChange}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-800"
                        placeholder="Internal notes..."
                      />
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="isActive"
                        checked={variantData.isActive}
                        onChange={handleVariantChange}
                        className="h-4 w-4 text-blue-800 focus:ring-blue-800 border-gray-300 rounded"
                      />
                      <label className="ml-2 block text-sm text-gray-700">
                        Variant is active
                      </label>
                    </div>
                  </div>

                  {/* Variant Actions */}
                  <div className="flex justify-end space-x-2 pt-4 border-t">
                    <button
                      type="button"
                      onClick={() => setShowVariantForm(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleAddVariant}
                      className="px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-900 flex items-center space-x-2"
                    >
                      <Save className="h-4 w-4" />
                      <span>{editingVariantIndex >= 0 ? 'Update' : 'Add'} Variant</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

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
            >
              <Save className="h-4 w-4" />
              <span>{isEditing ? 'Update' : 'Create'} {formType === 'family' ? 'Family' : 'Product'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductFamilyForm;