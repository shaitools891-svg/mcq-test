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
    echo "📤 Pushing to GitHub Pages..."
    git add dist -f
    git commit -m "Deploy to GitHub Pages"
    git subtree push --prefix dist origin gh-pages
    
    echo "🎉 Deployment complete!"
    echo "🌐 Visit: https://shaitools891-svg.github.io/mcq-test"
else
    echo "❌ Build failed!"
    exit 1
fi
