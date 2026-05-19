import { redirect } from "next/navigation"

type PageProps = { params: Promise<{ providerId: string }> }

export default async function ProviderClaimBridgePage({ params }: PageProps) {
  const { providerId } = await params
  redirect(`/for-business/claim?provider=${providerId}`)
}
