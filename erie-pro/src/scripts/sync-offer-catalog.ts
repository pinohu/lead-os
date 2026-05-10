import { syncAutomatedOfferCatalog } from "@/lib/offer-catalog-sync"

async function main() {
  const result = await syncAutomatedOfferCatalog()
  console.log(JSON.stringify({ success: true, ...result }, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
