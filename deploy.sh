#!/bin/bash

echo "🚀 Dsign Accounting - Vercel Deployment Script"
echo "=============================================="
echo ""

# Check if logo.png exists, if not use logo.svg
if [ ! -f "logo.png" ]; then
    echo "ℹ️  Using placeholder logo.svg (you can add logo.png later)"
else
    echo "✅ Found logo.png"
fi

echo ""
echo "📦 Deploying to Vercel..."
echo ""

# Deploy to Vercel
npx vercel --prod --yes

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Copy the deployment URL shown above"
echo "2. To add custom domain dsign-accounting.com:"
echo "   - Go to https://vercel.com/dashboard"
echo "   - Click on your project"
echo "   - Go to Settings → Domains"
echo "   - Add: dsign-accounting.com"
echo "   - Follow DNS instructions"
echo ""
