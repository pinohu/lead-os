import { useState } from "react";
import { Button } from "@/components/ui/button";
import { removeBackground, loadImage } from "@/utils/removeBackground";
import notroomLogo from "@/assets/notroom-logo.png";
import { logger } from "@/utils/logger";

const LogoProcessor = () => {
  const [processing, setProcessing] = useState(false);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const processLogo = async () => {
    try {
      setProcessing(true);
      setError(null);
      
      // Fetch the logo image
      const response = await fetch(notroomLogo);
      const blob = await response.blob();
      
      // Load as image element
      const img = await loadImage(blob);
      
      // Remove background
      const resultBlob = await removeBackground(img);
      
      // Create object URL for preview
      const url = URL.createObjectURL(resultBlob);
      setProcessedImage(url);
      
      // Trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = 'notroom-logo-transparent.png';
      link.click();
      
    } catch (err) {
      logger.error('Error processing logo:', err);
      setError(err instanceof Error ? err.message : 'Failed to process logo');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Logo Background Remover</h1>
          <p className="text-muted-foreground mb-8">
            Click the button below to remove the background from the Notroom logo
          </p>
        </div>

        <div className="bg-card p-8 rounded-lg border space-y-6">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Original Logo</h2>
            <div className="bg-muted p-8 rounded-lg flex items-center justify-center">
              <img src={notroomLogo} alt="Original Logo" className="max-h-32" />
            </div>
          </div>

          <Button
            onClick={processLogo}
            disabled={processing}
            size="lg"
            className="w-full"
          >
            {processing ? "Processing... (this may take a minute)" : "Remove Background"}
          </Button>

          {error && (
            <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
              <p className="font-semibold">Error:</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {processedImage && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Processed Logo (Transparent)</h2>
              <div className="bg-muted p-8 rounded-lg flex items-center justify-center" style={{ backgroundImage: 'repeating-conic-gradient(#80808020 0% 25%, transparent 0% 50%) 50% / 20px 20px' }}>
                <img src={processedImage} alt="Processed Logo" className="max-h-32" />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                The transparent logo has been downloaded. Replace the file at src/assets/notroom-logo.png with the downloaded version.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LogoProcessor;
