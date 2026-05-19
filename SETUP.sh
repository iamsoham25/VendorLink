#!/bin/bash

# VendorLink Recommendation System - Quick Start Setup
# Run this script from the project root to verify everything is set up correctly

echo "🚀 VendorLink Recommendation System - Setup Verification"
echo "=========================================================="
echo ""

# Check if backend files exist
echo "✅ Checking Backend Files..."
if [ -f "VendorLink_Project/server/controllers/recommendationController.js" ]; then
    echo "   ✓ recommendationController.js"
else
    echo "   ✗ recommendationController.js MISSING"
fi

if [ -f "VendorLink_Project/server/routes/recommendationRoutes.js" ]; then
    echo "   ✓ recommendationRoutes.js"
else
    echo "   ✗ recommendationRoutes.js MISSING"
fi

# Check if frontend files exist
echo ""
echo "✅ Checking Frontend Files..."
if [ -f "VendorLink_Project/frontend/assets/js/recommendations.js" ]; then
    echo "   ✓ recommendations.js"
else
    echo "   ✗ recommendations.js MISSING"
fi

if [ -f "VendorLink_Project/frontend/css/recommendations.css" ]; then
    echo "   ✓ recommendations.css"
else
    echo "   ✗ recommendations.css MISSING"
fi

# Check if documentation exists
echo ""
echo "✅ Checking Documentation..."
if [ -f "VendorLink_Project/RECOMMENDATION_SYSTEM_DOCS.md" ]; then
    echo "   ✓ RECOMMENDATION_SYSTEM_DOCS.md"
else
    echo "   ✗ RECOMMENDATION_SYSTEM_DOCS.md MISSING"
fi

if [ -f "VendorLink_Project/API_TESTING_GUIDE.md" ]; then
    echo "   ✓ API_TESTING_GUIDE.md"
else
    echo "   ✗ API_TESTING_GUIDE.md MISSING"
fi

if [ -f "VendorLink_Project/IMPLEMENTATION_SUMMARY.md" ]; then
    echo "   ✓ IMPLEMENTATION_SUMMARY.md"
else
    echo "   ✗ IMPLEMENTATION_SUMMARY.md MISSING"
fi

if [ -f "VendorLink_Project/MARKETPLACE_INTEGRATION_GUIDE.md" ]; then
    echo "   ✓ MARKETPLACE_INTEGRATION_GUIDE.md"
else
    echo "   ✗ MARKETPLACE_INTEGRATION_GUIDE.md MISSING"
fi

echo ""
echo "=========================================================="
echo "📝 Next Steps:"
echo "=========================================================="
echo ""
echo "1. BACKEND SETUP"
echo "   - Verify recommendationRoutes is added to server/index.js"
echo "   - No new npm packages needed"
echo "   - Start server: npm run dev"
echo ""
echo "2. FRONTEND SETUP"
echo "   - Add to marketplace.html <head>:"
echo "     <link rel=\"stylesheet\" href=\"css/recommendations.css\">"
echo "     <script src=\"assets/js/recommendations.js\"></script>"
echo ""
echo "   - Add HTML section to marketplace.html:"
echo "     <section class=\"recommendations-section\">"
echo "       <div id=\"recommended-vendors\">Loading...</div>"
echo "     </section>"
echo ""
echo "   - Add initialization script:"
echo "     <script>"
echo "       document.addEventListener('DOMContentLoaded', async () => {"
echo "         if (window.recommendationSystem?.userId) {"
echo "           const recs = await window.recommendationSystem.fetchRecommendations(5);"
echo "           window.recommendationSystem.displayRecommendations(recs);"
echo "         }"
echo "       });"
echo "     </script>"
echo ""
echo "3. DATABASE SETUP"
echo "   - Create test vendors with role='vendor'"
echo "   - Create suppliers with role='supplier'"
echo "   - Create products and orders for testing"
echo ""
echo "4. TESTING"
echo "   - Refer to API_TESTING_GUIDE.md for curl commands"
echo "   - Test endpoints in browser console"
echo "   - Check server logs for recommendation calculation"
echo ""
echo "5. DOCUMENTATION"
echo "   - Read IMPLEMENTATION_SUMMARY.md for full overview"
echo "   - Read RECOMMENDATION_SYSTEM_DOCS.md for algorithm details"
echo "   - Use API_TESTING_GUIDE.md for testing"
echo "   - Follow MARKETPLACE_INTEGRATION_GUIDE.md for UI integration"
echo ""
echo "=========================================================="
echo "🎉 Setup Complete!"
echo "=========================================================="
