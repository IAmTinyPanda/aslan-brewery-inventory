#!/bin/bash
echo "🦁 Quick Start - Aslan Brewing Inventory"
echo "Installing dependencies..."
npm install

echo "Setting up Tailwind CSS..."
npx tailwindcss init -p

echo "Copying environment file..."
cp .env.example .env.local

echo "✅ Setup complete!"
echo "🚀 Run 'npm start' to begin development"
