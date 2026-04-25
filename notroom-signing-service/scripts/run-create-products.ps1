# PowerShell script to create Stripe products for Transaction Coordination
# This script invokes the Supabase edge function to create the products

param(
    [string]$SupabaseUrl = "",
    [string]$SupabaseAnonKey = "",
    [string]$AccessToken = ""
)

Write-Host "🚀 Stripe Product Creation Script" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Check if Supabase URL is provided
if ([string]::IsNullOrEmpty($SupabaseUrl)) {
    $SupabaseUrl = Read-Host "Enter your Supabase Project URL (e.g., https://xxxxx.supabase.co)"
}

# Check if we have an access token
if ([string]::IsNullOrEmpty($AccessToken)) {
    Write-Host "⚠️  This function requires authentication." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Option 1: Use Supabase Dashboard" -ForegroundColor Green
    Write-Host "  1. Go to Edge Functions → create-tc-stripe-products"
    Write-Host "  2. Click 'Invoke' button"
    Write-Host "  3. Copy the price IDs from the response"
    Write-Host ""
    Write-Host "Option 2: Get an access token and run this script with:" -ForegroundColor Green
    Write-Host "  .\scripts\run-create-products.ps1 -SupabaseUrl 'https://xxx.supabase.co' -AccessToken 'your-token'"
    Write-Host ""
    exit 0
}

# Invoke the function
Write-Host "📞 Invoking create-tc-stripe-products function..." -ForegroundColor Yellow
Write-Host ""

try {
    $headers = @{
        "Authorization" = "Bearer $AccessToken"
        "Content-Type" = "application/json"
        "apikey" = $SupabaseAnonKey
    }

    $response = Invoke-RestMethod -Uri "$SupabaseUrl/functions/v1/create-tc-stripe-products" `
        -Method POST `
        -Headers $headers `
        -ContentType "application/json"

    Write-Host "✅ Success!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Mode: $($response.mode)" -ForegroundColor Cyan
    Write-Host "Products Created: $($response.products.Count)" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📋 Price IDs:" -ForegroundColor Yellow
    Write-Host ""
    
    foreach ($product in $response.products) {
        Write-Host "  $($product.planKey):" -ForegroundColor White
        Write-Host "    Price ID: $($product.priceId)" -ForegroundColor Green
        Write-Host "    Product ID: $($product.productId)" -ForegroundColor Gray
        Write-Host ""
    }

    Write-Host "=" * 80 -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📝 Copy this code to src/constants/tcPlans.ts:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host $response.codeOutput -ForegroundColor White
    Write-Host ""
    Write-Host "=" * 80 -ForegroundColor Cyan

} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Response:" -ForegroundColor Yellow
    Write-Host $_.Exception.Response -ForegroundColor Red
    exit 1
}

