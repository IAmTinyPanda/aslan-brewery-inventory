// src/components/products/RecipeBuilderComponent.jsx - Clean implementation
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Calculator, Beaker, Save, AlertCircle } from 'lucide-react';

const RecipeBuilderComponent = ({ 
  recipe = null, 
  isOpen = false, 
  onClose, 
  onSave, 
  isEditing = false,
  existingProducts = []
}) => {
  const [recipeData, setRecipeData] = useState({
    name: '',
    category: 'batchCocktails',
    subcategory: '',
    description: '',
    notes: '',
    isActive: true,
    recipeIngredients: [], // [{productId, quantityLiters}, ...]
    servingPrices: {}, // {servingOption: price}
    isRecipeBased: true,
    productType: 'final'
  });

  const [calculatedCosts, setCalculatedCosts] = useState(null);
  const [availableIngredients, setAvailableIngredients] = useState([]);

  // Filter ingredients from existing products
  useEffect(() => {
    const ingredients = existingProducts.filter(p => 
      p.productType === 'ingredient' && p.isActive !== false
    );
    setAvailableIngredients(ingredients);
  }, [existingProducts]);

  // Load existing recipe data
  useEffect(() => {
    if (recipe && isEditing) {
      setRecipeData(recipe);
    } else if (!isEditing && isOpen) {
      setRecipeData({
        name: '',
        category: 'batchCocktails',
        subcategory: '',
        description: '',
        notes: '',
        isActive: true,
        recipeIngredients: [],
        servingPrices: {},
        isRecipeBased: true,
        productType: 'final'
      });
    }
  }, [recipe, isEditing, isOpen]);

  // Calculate recipe costs when ingredients change
  useEffect(() => {
    if (recipeData.recipeIngredients.length > 0 && availableIngredients.length > 0) {
      calculateRecipeCosts();
    } else {
      setCalculatedCosts(null);
    }
  }, [recipeData.recipeIngredients, availableIngredients]);

  const calculateRecipeCosts = () => {
    let totalCost = 0;
    let totalLiters = 0;
    const ingredientBreakdown = [];

    recipeData.recipeIngredients.forEach(ingredient => {
      const product = availableIngredients.find(p => p.id === ingredient.productId);
      if (!product || !ingredient.quantityLiters) return;

      // Calculate cost per liter from product data
      const costPerUnit = parseFloat(product.costPerUnit) || 0;
      const unitSize = parseFloat(product.unitSize) || 0;
      
      // Convert unit to liters based on unit type
      let unitLiters = 0;
      switch (product.unitType) {
        case 'bottle-750ml':
          unitLiters = 0.75 * unitSize;
          break;
        case 'bottle-1L':
          unitLiters = 1.0 * unitSize;
          break;
        case 'bottle-1.75L':
          unitLiters = 1.75 * unitSize;
          break;
        case 'gallon':
          unitLiters = 3.785 * unitSize;
          break;
        case 'bottle-1.89L':
          unitLiters = 1.89 * unitSize;
          break;
        case 'liter':
          unitLiters = 1.0 * unitSize;
          break;
        default:
          unitLiters = unitSize; // Assume liters if unknown
      }

      if (unitLiters > 0) {
        const costPerLiter = costPerUnit / unitLiters;
        const ingredientCost = costPerLiter * parseFloat(ingredient.quantityLiters);
        
        totalCost += ingredientCost;
        totalLiters += parseFloat(ingredient.quantityLiters);
        
        ingredientBreakdown.push({
          name: product.name,
          quantityLiters: parseFloat(ingredient.quantityLiters),
          costPerLiter,
          totalCost: ingredientCost,
          percentage: 0 // Will calculate after total is known
        });
      }
    });

    // Calculate percentages
    ingredientBreakdown.forEach(ing => {
      ing.percentage = totalCost > 0 ? (ing.totalCost / totalCost) * 100 : 0;
    });

    // Batch cocktail specs: 5 gallons = 18.93 liters = 106.7 servings at 6oz each
    const batchLiters = 18.93;
    const servingsPerBatch = 106.7;
    const costPerLiter = totalCost / batchLiters;
    const costPerServing = totalCost / servingsPerBatch;

    setCalculatedCosts({
      totalCost,
      totalLiters,
      costPerLiter,
      costPerServing,
      servingsPerBatch,
      ingredientBreakdown
    });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setRecipeData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const addIngredient = () => {
    setRecipeData(prev => ({
      ...prev,
      recipeIngredients: [
        ...prev.recipeIngredients,
        { productId: '', quantityLiters: '' }
      ]
    }));
  };

  const updateIngredient = (index, field, value) => {
    setRecipeData(prev => ({
      ...prev,
      recipeIngredients: prev.recipeIngredients.map((ingredient, i) => 
        i === index ? { ...ingredient, [field]: value } : ingredient
      )
    }));
  };

  const removeIngredient = (index) => {
    setRecipeData(prev => ({
      ...prev,
      recipeIngredients: prev.recipeIngredients.filter((_, i) => i !== index)
    }));
  };

  const updateServingPrice = (servingOption, price) => {
    setRecipeData(prev => ({
      ...prev,
      servingPrices: {
        ...prev.servingPrices,
        [servingOption]: price
      }
    }));
  };

  const handleSubmit = () => {
    if (!calculatedCosts) {
      alert('Please add ingredients to calculate costs');
      return;
    }

    const recipeProduct = {
      ...recipeData,
      id: isEditing ? recipe.id : Date.now().toString(),
      costPerServing: calculatedCosts.costPerServing,
      totalRecipeCost: calculatedCosts.totalCost,
      ingredientBreakdown: calculatedCosts.ingredientBreakdown,
      servingsPerBatch: calculatedCosts.servingsPerBatch,
      createdAt: isEditing ? recipe.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSave(recipeProduct);
  };

  if (!isOpen) return null;

  const servingOptions = [
    { value: '6oz-cocktail', label: '6oz Cocktail', oz: 6 },
    { value: '9oz-cocktail', label: '9oz Large Cocktail', oz: 9 },
    { value: '2oz-sample', label: '2oz Sample', oz: 2 }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-800 to-purple-900 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Beaker className="h-6 w-6 text-white" />
            <h2 className="text-xl font-bold text-white">
              {isEditing ? 'Edit Recipe' : 'Create New Recipe'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
          >
            <div className="h-5 w-5">×</div>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Recipe Information */}
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Recipe Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recipe Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={recipeData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-800"
                  placeholder="e.g., Summer Margarita, Moscow Mule"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recipe Family
                </label>
                <select
                  name="subcategory"
                  value={recipeData.subcategory}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-800"
                >
                  <option value="">Select Family</option>
                  <option value="Margarita Family">Margarita Family</option>
                  <option value="Moscow Mule Family">Moscow Mule Family</option>
                  <option value="Seasonal Cocktails">Seasonal Cocktails</option>
                  <option value="Sangria Family">Sangria Family</option>
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={recipeData.description}
                onChange={handleInputChange}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-800"
                placeholder="Describe this batch cocktail..."
              />
            </div>
          </div>

          {/* Recipe Ingredients */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <Beaker className="h-5 w-5 mr-2" />
                Recipe Ingredients (5 Gallon Batch)
              </h3>
              <button
                type="button"
                onClick={addIngredient}
                className="px-3 py-1 bg-purple-800 text-white rounded-lg hover:bg-purple-900 text-sm flex items-center space-x-1"
              >
                <Plus className="h-4 w-4" />
                <span>Add Ingredient</span>
              </button>
            </div>

            {recipeData.recipeIngredients.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Beaker className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>No ingredients added yet</p>
                <p className="text-sm">Click "Add Ingredient" to start building your recipe</p>
              </div>
            )}

            <div className="space-y-3">
              {recipeData.recipeIngredients.map((ingredient, index) => {
                const selectedProduct = availableIngredients.find(p => p.id === ingredient.productId);
                
                return (
                  <div key={index} className="bg-white p-3 rounded border flex items-center space-x-3">
                    <div className="flex-1">
                      <select
                        value={ingredient.productId}
                        onChange={(e) => updateIngredient(index, 'productId', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-800"
                        required
                      >
                        <option value="">Select Ingredient</option>
                        {availableIngredients.map(ing => (
                          <option key={ing.id} value={ing.id}>
                            {ing.name} ({ing.subcategory})
                          </option>
                        ))}
                      </select>
                      {selectedProduct && (
                        <div className="text-xs text-gray-500 mt-1">
                          Cost: ${selectedProduct.costPerUnit} per {selectedProduct.unitType} • {selectedProduct.supplier}
                        </div>
                      )}
                    </div>
                    
                    <div className="w-32">
                      <input
                        type="number"
                        step="0.1"
                        value={ingredient.quantityLiters}
                        onChange={(e) => updateIngredient(index, 'quantityLiters', e.target.value)}
                        placeholder="Liters"
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-800"
                        required
                      />
                      <div className="text-xs text-gray-500 mt-1">Liters</div>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => removeIngredient(index)}
                      className="text-red-600 hover:text-red-800 p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Calculated Costs */}
          {calculatedCosts && (
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Calculator className="h-5 w-5 mr-2" />
                Recipe Cost Analysis
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-800">
                    ${calculatedCosts.totalCost.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600">Total Recipe Cost</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-800">
                    {calculatedCosts.servingsPerBatch}
                  </div>
                  <div className="text-sm text-gray-600">Servings (6oz)</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-800">
                    ${calculatedCosts.costPerServing.toFixed(3)}
                  </div>
                  <div className="text-sm text-gray-600">Cost per 6oz Serving</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-800">
                    ${calculatedCosts.costPerLiter.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600">Cost per Liter</div>
                </div>
              </div>

              {/* Ingredient Breakdown */}
              <div className="bg-white p-4 rounded border">
                <h4 className="font-medium text-gray-800 mb-3">Ingredient Cost Breakdown</h4>
                <div className="space-y-2">
                  {calculatedCosts.ingredientBreakdown.map((ing, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex-1">
                        <span className="font-medium">{ing.name}</span>
                        <span className="text-gray-500 ml-2">{ing.quantityLiters}L</span>
                      </div>
                      <div className="flex items-center space-x-3 text-right">
                        <span className="text-gray-600">{ing.percentage.toFixed(1)}%</span>
                        <span className="font-medium w-16">${ing.totalCost.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Serving Options & Pricing */}
          {calculatedCosts && (
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Serving Options & Pricing</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {servingOptions.map(option => {
                  const servingCost = (calculatedCosts.costPerServing * option.oz) / 6; // Adjust for serving size
                  const suggestedPrice = servingCost / 0.25; // 75% margin
                  
                  return (
                    <div key={option.value} className="bg-white p-4 rounded border">
                      <div className="font-medium text-gray-800 mb-2">{option.label}</div>
                      <div className="text-sm text-gray-600 mb-3">
                        Cost: ${servingCost.toFixed(3)}
                      </div>
                      
                      <div className="space-y-2">
                        <label className="block text-xs font-medium text-gray-700">
                          Selling Price
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={recipeData.servingPrices[option.value] || ''}
                          onChange={(e) => updateServingPrice(option.value, e.target.value)}
                          placeholder={`${suggestedPrice.toFixed(2)}`}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-800"
                        />
                        <div className="text-xs text-gray-500">
                          Suggested: ${suggestedPrice.toFixed(2)} (75% margin)
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recipe Notes
            </label>
            <textarea
              name="notes"
              value={recipeData.notes}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-800"
              placeholder="Preparation notes, seasonal adjustments, etc..."
            />
          </div>

          {/* Warnings */}
          {availableIngredients.length === 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <div className="text-sm font-medium text-red-800">
                    No Ingredients Available
                  </div>
                  <div className="text-sm text-red-700 mt-1">
                    You need to add ingredient products (spirits, mixers) before creating recipes.
                    Go to Products → Add Product and create your spirits and mixers first.
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
              onClick={handleSubmit}
              disabled={!calculatedCosts || availableIngredients.length === 0}
              className="px-4 py-2 bg-purple-800 text-white rounded-lg hover:bg-purple-900 transition-colors font-medium flex items-center space-x-2 disabled:bg-gray-400"
            >
              <Save className="h-4 w-4" />
              <span>{isEditing ? 'Update Recipe' : 'Create Recipe'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecipeBuilderComponent;