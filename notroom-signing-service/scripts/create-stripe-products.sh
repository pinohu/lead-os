#!/bin/bash

# Script to create Stripe products for Transaction Coordination
# This script runs the Deno script with proper environment setup

echo "🚀 Stripe Product Creation Script"
echo "=================================="
echo ""

# Check if STRIPE_SECRET_KEY is set
if [ -z "$STRIPE_SECRET_KEY" ]; then
    echo "❌ ERROR: STRIPE_SECRET_KEY environment variable is not set"
    echo ""
    echo "To set it:"
    echo "  export STRIPE_SECRET_KEY=sk_test_..."
    echo ""
    echo "Or run with:"
    echo "  STRIPE_SECRET_KEY=sk_test_... ./scripts/create-stripe-products.sh"
    exit 1
fi

# Check if Deno is installed
if ! command -v deno &> /dev/null; then
    echo "❌ ERROR: Deno is not installed"
    echo "Install from: https://deno.land"
    exit 1
fi

# Run the script
deno run --allow-env --allow-net scripts/create-stripe-products.ts

