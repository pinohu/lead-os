import { flags } from "../../../config/src/flags.js";

export interface ProductDynoPublishRequest {
  jobId: string;
  productId: string;
  assetUri: string;
  title: string;
}

export interface ProductDynoPublishResult {
  jobId: string;
  status: "queued" | "published" | "mocked" | "blocked_by_flag";
  externalRef?: string;
  error?: string;
}

export async function publishToProductDyno(req: ProductDynoPublishRequest): Promise<ProductDynoPublishResult> {
  if (!flags.productdynoEnabled || !flags.publicPublishingEnabled) {
    return {
      jobId: req.jobId,
      status: "mocked",
      externalRef: `productdyno://mock/${req.productId}/${req.jobId}`,
    };
  }
  return {
    jobId: req.jobId,
    status: "blocked_by_flag",
    error: "PRODUCTDYNO_ENABLED + SAFE_PUBLIC_PUBLISHING_ENABLED both required, plus HTTP implementation.",
  };
}
