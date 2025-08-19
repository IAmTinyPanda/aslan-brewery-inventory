// src/hooks/useRole.js
import { useState, useEffect } from 'react';

export const useRole = () => {
  const [role, setRole] = useState('foh'); // Default to Front of House

  // Load role from localStorage on mount
  useEffect(() => {
    const savedRole = localStorage.getItem('aslan_user_role');
    if (savedRole && (savedRole === 'foh' || savedRole === 'boh')) {
      setRole(savedRole);
    }
  }, []);

  // Save role to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('aslan_user_role', role);
    console.log(`Role switched to: ${role}`);
  }, [role]);

  // Role information
  const roleInfo = {
    foh: {
      title: 'Bar Manager',
      description: 'Managing beverages, batch cocktails, and bar operations',
      responsibilities: [
        'Beverage inventory tracking',
        'Batch cocktail recipes',
        'Bar supplier management',
        'Drink cost analysis'
      ],
      color: '#2D5016' // Forest green
    },
    boh: {
      title: 'Chef',
      description: 'Managing kitchen ingredients, recipes, and food operations',
      responsibilities: [
        'Kitchen inventory tracking',
        'Recipe cost calculations',
        'Food supplier management',
        'Menu profitability analysis'
      ],
      color: '#8B4513' // Rich brown
    }
  };

  return {
    role,
    setRole,
    roleInfo: roleInfo[role]
  };
};