import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, Video, Fingerprint, Eye, Clock } from "lucide-react";
import { Label } from "@/components/ui/label";

interface BiometricConsentProps {
  onConsent: (consented: boolean) => void;
  required?: boolean;
}

const BiometricConsent = ({ onConsent, required = false }: BiometricConsentProps) => {
  const [acknowledged, setAcknowledged] = useState(false);
  const [understandRetention, setUnderstandRetention] = useState(false);
  const [canRevoke, setCanRevoke] = useState(false);

  const allChecked = acknowledged && understandRetention && canRevoke;

  return (
    <Card className="p-6 bg-amber-50 dark:bg-amber-950/20 border-2 border-amber-500">
      <div className="flex items-start gap-3 mb-4">
        <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-bold text-amber-900 dark:text-amber-100 text-lg mb-2">
            Biometric Data Collection Notice & Consent
          </h3>
          <p className="text-sm text-amber-800 dark:text-amber-200 mb-4">
            <strong>REQUIRED FOR REMOTE ONLINE NOTARIZATION (RON)</strong>
          </p>
        </div>
      </div>

      <div className="space-y-4 text-sm text-amber-900 dark:text-amber-100">
        <div className="bg-primary-foreground p-4 rounded-lg space-y-3">
          <div className="flex items-start gap-3">
            <Fingerprint className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold mb-1">Biometric Identifiers We Collect:</h4>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li><strong>Facial Recognition Data:</strong> Geometry, landmarks, and unique facial features extracted from your live video and government-issued ID photo</li>
                <li><strong>Identity Verification Scans:</strong> High-resolution digital copies of your government ID (driver's license, passport, state ID)</li>
                <li><strong>Voice Recordings:</strong> Audio from the RON session for identity verification and record-keeping</li>
                <li><strong>Behavioral Biometrics:</strong> Movement patterns during identity verification process</li>
              </ul>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Eye className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold mb-1">Purpose of Collection:</h4>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Verify your identity as required by Pennsylvania RON law (57 Pa.C.S. § 319)</li>
                <li>Prevent fraud, identity theft, and unauthorized notarizations</li>
                <li>Create legally required audio-video recording of notarial act</li>
                <li>Comply with federal and state record-keeping requirements</li>
              </ul>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold mb-1">Retention & Storage:</h4>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li><strong>10-Year Retention:</strong> Pennsylvania law requires retention of all RON recordings for 10 years minimum</li>
                <li><strong>Secure Storage:</strong> Encrypted storage on secure servers with access controls</li>
                <li><strong>Third-Party Processors:</strong> Your biometric data is processed through our PA-approved RON platform provider</li>
                <li><strong>No Sale:</strong> We will NEVER sell your biometric data to third parties</li>
              </ul>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Video className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold mb-1">Your Rights:</h4>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li><strong>Right to Know:</strong> You may request a copy of biometric data we have collected about you</li>
                <li><strong>Right to Delete:</strong> After the 10-year legal retention period, you may request deletion</li>
                <li><strong>Right to Withdraw:</strong> You may withdraw consent at any time BEFORE the RON session begins</li>
                <li><strong>No Discrimination:</strong> We will not discriminate against you for exercising your rights</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-destructive/10 border-l-4 border-destructive p-4 rounded">
          <p className="text-sm font-semibold text-destructive mb-2">⚠️ Important Legal Notice:</p>
          <p className="text-xs text-destructive">
            Illinois residents: This collection is subject to Illinois Biometric Information Privacy Act (BIPA).
            California residents: This collection is subject to California Consumer Privacy Act (CCPA).
            Texas residents: This collection is subject to Texas Capture or Use of Biometric Identifier Act.
          </p>
        </div>

        {/* Consent Checkboxes */}
        <div className="space-y-4 pt-4 border-t border-amber-300">
          <div className="flex items-start gap-3">
            <Checkbox
              id="acknowledge-collection"
              checked={acknowledged}
              onCheckedChange={(checked) => setAcknowledged(checked as boolean)}
            />
            <Label htmlFor="acknowledge-collection" className="text-sm font-normal cursor-pointer">
              I acknowledge that Notroom will collect my biometric identifiers (facial recognition data, voice recordings, and identity document scans) during the Remote Online Notarization session for identity verification purposes.
            </Label>
          </div>

          <div className="flex items-start gap-3">
            <Checkbox
              id="understand-retention"
              checked={understandRetention}
              onCheckedChange={(checked) => setUnderstandRetention(checked as boolean)}
            />
            <Label htmlFor="understand-retention" className="text-sm font-normal cursor-pointer">
              I understand that my biometric data and RON session recording will be retained for a minimum of 10 years as required by Pennsylvania law, stored securely, and will not be sold to third parties.
            </Label>
          </div>

          <div className="flex items-start gap-3">
            <Checkbox
              id="can-revoke"
              checked={canRevoke}
              onCheckedChange={(checked) => setCanRevoke(checked as boolean)}
            />
            <Label htmlFor="can-revoke" className="text-sm font-normal cursor-pointer">
              I understand that I may withdraw this consent at any time BEFORE the RON session begins, and I have the right to request access to or deletion of my biometric data (after the legal retention period).
            </Label>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            onClick={() => onConsent(true)}
            disabled={!allChecked}
            className="flex-1"
          >
            I Consent to Biometric Data Collection
          </Button>
          {!required && (
            <Button
              variant="outline"
              onClick={() => onConsent(false)}
              className="flex-1"
            >
              Decline (Use Mobile Service Instead)
            </Button>
          )}
        </div>

        <p className="text-xs text-center text-muted-foreground">
          By clicking "I Consent," you provide explicit, informed consent for the collection and use of your biometric identifiers as described above.
        </p>
      </div>
    </Card>
  );
};

export default BiometricConsent;
