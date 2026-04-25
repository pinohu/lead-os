// Site Configuration
// IMPORTANT: Set isOfficialCropApproved = true once BCCO approval letter is received
// from the PA Department of State Bureau of Corporations and Charitable Organizations

export const siteConfig = {
  /**
   * CROP Approval Status
   * 
   * Set to false until official CROP registration is approved by PA Department of State.
   * Once you receive the BCCO approval letter confirming your CROP registration,
   * set this to true to update all site language from "CROP-ready" to "approved CROP".
   * 
   * Approval Process:
   * 1. Submit CROP Registration Statement to PA DOS Bureau of Corporations
   * 2. Wait for approval letter/confirmation
   * 3. Set isOfficialCropApproved = true
   * 4. Update any additional messaging as needed
   */
  isOfficialCropApproved: false,
} as const;

