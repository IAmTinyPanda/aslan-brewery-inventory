// src/components/products/ProductForm.jsx
import React, { useState, useEffect } from 'react';
import { X, Save, Package, DollarSign, Calculator } from 'lucide-react';
import { aslanTheme } from '../../utils/aslanBranding';
import { fohCategories } from '../../data/categories';

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
    sku: '',
    supplier: '',
    unitSize: '',
    unitType: '',
    costPerUnit: '',
    servingSize: '',
    servingUnit: 'oz',
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

  useEffect(() => {
    if (product && isEditing) {
      setFormData({ ...product });
    } else if (!isEditing) {
      // Reset form for new product
      setFormData({
        name: '',
        category: '',
        subcategory: '',
        sku: '',
        supplier: '',
        unitSize: '',
        unitType: '',
        costPerUnit: '',
        servingSize: '',
        servingUnit: 'oz',
        targetMargin: '75',
        description: '',
        notes: '',
        isActive: true
      });
    }
  }, [product, isEditing, isOpen]);

  // Calculate cost per serving and suggested price
  useEffect(() => {
    const { costPerUnit, unitSize, servingSize, unitType, servingUnit, targetMargin } = formData;
    
    if (costPerUnit && unitSize && servingSize && unitType && servingUnit) {
      const cost = parseFloat(costPerUnit);
      const unit = parseFloat(unitSize);
      const serving = parseFloat(servingSize);
      const margin = parseFloat(targetMargin) / 100;

      let servingsPerUnit = 0;
      let costPerServing = 0;

      // Convert unit size to oz for standardized calculation
      let unitSizeInOz = 0;
      
      // Unit conversions to oz
      switch (unitType) {
        case 'oz':
          unitSizeInOz = unit;
          break;
        case 'ml':
          unitSizeInOz = unit / 29.5735; // ml to oz
          break;
        case 'gallons':
          unitSizeInOz = unit * 128; // gallons to oz
          break;
        case 'liters':
          unitSizeInOz = unit * 33.814; // liters to oz
          break;
        case 'bottles':
          unitSizeInOz = unit * 25.36; // assume 750ml bottles
          break;
        case 'cases':
          unitSizeInOz = unit * 288; // assume 12 x 24oz bottles per case
          break;
        default:
          unitSizeInOz = unit; // fallback: assume same unit
      }

      // Convert serving size to oz for standardized calculation
      let servingSizeInOz = 0;
      
      switch (servingUnit) {
        case 'oz':
          servingSizeInOz = serving;
          break;
        case 'ml':
          servingSizeInOz = serving / 29.5735; // ml to oz
          break;
        default:
          servingSizeInOz = serving; // fallback
      }

      // Calculate servings per unit
      if (unitSizeInOz > 0 && servingSizeInOz > 0) {
        servingsPerUnit = unitSizeInOz / servingSizeInOz;
        costPerServing = cost / servingsPerUnit;
        const suggestedPrice = costPerServing / (1 - margin);
        
        setCalculatedData({
          costPerServing: costPerServing,
          suggestedPrice: suggestedPrice,
          servingsPerUnit: servingsPerUnit
        });
      } else {
        // Reset calculations if invalid
        setCalculatedData({
          costPerServing: 0,
          suggestedPrice: 0,
          servingsPerUnit: 0
        });
      }
    } else {
      // Reset calculations if missing data
      setCalculatedData({
        costPerServing: 0,
        suggestedPrice: 0,
        servingsPerUnit: 0
      });
    }
  }, [formData.costPerUnit, formData.unitSize, formData.servingSize, formData.unitType, formData.servingUnit, formData.targetMargin]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleCategoryChange = (e) => {
    const category = e.target.value;
    setFormData(prev => ({
      ...prev,
      category,
      subcategory: '', // Reset subcategory when category changes
      sku: generateSKU(formData.name, category)
    }));
  };

  const generateSKU = (name, category) => {
    if (!name || !category) return '';
    
    const categoryCode = {
      'beer': 'BER',
      'wine': 'WIN',
      'spirits': 'SPR',
      'mixers': 'MIX',
      'batchCocktails': 'BCK',
      'nonAlcoholic': 'NAL'
    };

    const nameCode = name.substring(0, 3).toUpperCase().replace(/\s/g, '');
    const catCode = categoryCode[category] || 'GEN';
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    return `${catCode}-${nameCode}-${randomNum}`;
  };

  const handleNameChange = (e) => {
    const name = e.target.value;
    setFormData(prev => ({
      ...prev,
      name,
      sku: generateSKU(name, prev.category)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const productData = {
      ...formData,
      ...calculatedData,
      id: isEditing ? product.id : Date.now().toString(),
      createdAt: isEditing ? product.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    onSave(productData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-screen overflow-y-auto">
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
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-800 focus:border-transparent"
                placeholder="e.g., B'ham Brown Ale"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Generated SKU
              </label>
              <input
                type="text"
                name="sku"
                value={formData.sku}
                onChange={handleInputChange}
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
                {formData.category && fohCategories[formData.category]?.subcategories.map(sub => (
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
                value={formData.supplier}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-800"
                placeholder="e.g., Dickerson Distributors"
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
                  Unit Size *
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="unitSize"
                  value={formData.unitSize}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-800"
                  placeholder="750"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unit Type *
                </label>
                <select
                  name="unitType"
                  value={formData.unitType}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-800"
                >
                  <option value="">Select Unit</option>
                  <option value="ml">ml</option>
                  <option value="oz">oz</option>
                  <option value="gallons">gallons</option>
                  <option value="liters">liters</option>
                  <option value="bottles">bottles</option>
                  <option value="cases">cases</option>
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
                  step="0.01"
                  name="servingSize"
                  value={formData.servingSize}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-800"
                  placeholder="5"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Serving Unit *
                </label>
                <select
                  name="servingUnit"
                  value={formData.servingUnit}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-800"
                >
                  <option value="oz">oz</option>
                  <option value="ml">ml</option>
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
                  value={formData.targetMargin}
                  onChange={handleInputChange}
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
            >
              <Save className="h-4 w-4" />
              <span>{isEditing ? 'Update Product' : 'Add Product'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;