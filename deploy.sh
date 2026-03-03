#!/bin/bash

# Deploy script for MCQ Test to GitHub Pages
# Run this script from the MCQ TEST directory

echo "🚀 Starting deployment to GitHub Pages..."

# Build the project
echo "📦 Building project..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    
    # Add dist folder to git
    echo "📤 Pushing to main branch..."
    git add dist -f
    git commit -m "Deploy to main branch"
    git push origin HEAD:main --force
    
    echo "🎉 Deployment complete!"
    echo "🌐 Visit: https://shaitools891-svg.github.io/mcq-test"
else
    echo "❌ Build failed!"
    exit 1
fi
