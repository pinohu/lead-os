# How to Create Stripe Products for Transaction Coordination

## Option 1: Using Supabase Dashboard (Easiest)

1. **Go to Supabase Dashboard**
   - Navigate to your project
   - Go to **Edge Functions** → **create-tc-stripe-products**

2. **Invoke the Function**
   - Click **Invoke** button
   - The function will create all 3 products automatically
   - Copy the `priceId` values from the response

3. **Update Code**
   - Open `src/constants/tcPlans.ts`
   - Replace the placeholder `priceId` values with the real ones from the response

---

## Option 2: Using Supabase CLI

```bash
# Make sure you're logged in
supabase login

# Link to your project (if not already linked)
supabase link --project-ref your-project-ref

# Invoke the function
supabase functions invoke create-tc-stripe-products

# The response will contain the price IDs
```

---

## Option 3: Using cURL (Direct API Call)

```bash
# Get your Supabase anon key and project URL
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"

# Invoke the function
curl -X POST \
  "${SUPABASE_URL}/functions/v1/create-tc-stripe-products" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json"

# Copy the price IDs from the response
```

---

## Option 4: Using the Deno Script (Local)

```bash
# Set your Stripe secret key
export STRIPE_SECRET_KEY=sk_test_...

# Run the script
deno run --allow-env --allow-net scripts/create-stripe-products.ts

# Copy the price IDs from the output
```

---

## After Creating Products

1. **Copy the Price IDs** from the response
2. **Update `src/constants/tcPlans.ts`**:

```typescript
export const TC_PLANS = {
  basic: {
    priceId: "price_1ABC123...", // Paste your actual price ID here
    // ... rest stays the same
  },
  standard: {
    priceId: "price_1XYZ789...", // Paste your actual price ID here
    // ... rest stays the same
  },
  premium: {
    priceId: "price_1DEF456...", // Paste your actual price ID here
    // ... rest stays the same
  }
}
```

3. **Test the Checkout Flow**
   - Submit a test Transaction Coordination application
   - Use test card: `4242 4242 4242 4242`
   - Verify payment goes through

---

## Important Notes

- **Test Mode First**: Create products in test mode first, test everything, then create in live mode
- **Separate Products**: Test mode and live mode products are separate - you'll need to create them twice
- **One-Time Use**: After products are created, you can delete/disable the `create-tc-stripe-products` function
- **Security**: The function requires `STRIPE_SECRET_KEY` to be set in Supabase Edge Function secrets

---

## Troubleshooting

**Error: "STRIPE_SECRET_KEY is not set"**
- Go to Supabase Dashboard → Project Settings → Edge Functions → Secrets
- Add `STRIPE_SECRET_KEY` with your Stripe secret key

**Error: "Invalid API key"**
- Make sure you're using the correct secret key (starts with `sk_test_` or `sk_live_`)
- Test mode key: `sk_test_...`
- Live mode key: `sk_live_...`

**Products Already Exist**
- If products with the same name already exist, Stripe will return an error
- Either delete existing products in Stripe Dashboard, or use different names

