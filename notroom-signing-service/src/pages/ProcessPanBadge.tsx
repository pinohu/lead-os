import { useEffect, useState } from 'react';
import { loadImage, removeBackground } from '@/utils/removeBackground';
import { Button } from '@/components/ui/button';
import panBadgeOriginal from '@/assets/pan_member_badge_original.png';
import { logger } from '@/utils/logger';

const ProcessPanBadge = () => {
  const [processing, setProcessing] = useState(false);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const processBadge = async () => {
    try {
      setProcessing(true);
      setError(null);

      // Fetch the image
      const response = await fetch(panBadgeOriginal);
      const blob = await response.blob();

      // Load and process
      const imageElement = await loadImage(blob);
      const processedBlob = await removeBackground(imageElement);

      // Create preview URL
      const url = URL.createObjectURL(processedBlob);
      setProcessedImage(url);

      // Auto-download
      const link = document.createElement('a');
      link.href = url;
      link.download = 'pan_member_badge_transparent.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setProcessing(false);
    } catch (err) {
      logger.error('Error processing badge:', err);
      setError(err instanceof Error ? err.message : 'Failed to process badge');
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold">PAN Badge Background Removal</h1>
        
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Original Badge</h2>
            <img src={panBadgeOriginal} alt="Original PAN Badge" className="w-full max-w-xs" />
          </div>

          {processedImage && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Processed Badge (Transparent)</h2>
              <div className="bg-checkerboard p-4 rounded">
                <img src={processedImage} alt="Processed PAN Badge" className="w-full max-w-xs" />
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
            {error}
          </div>
        )}

        <Button 
          onClick={processBadge} 
          disabled={processing}
          size="lg"
        >
          {processing ? 'Processing...' : 'Remove Background'}
        </Button>

        <p className="text-sm text-muted-foreground">
          Click the button to remove the background and download the transparent PNG.
          Then replace src/assets/pan_member_badge.png with the downloaded file.
        </p>
      </div>
    </div>
  );
};

export default ProcessPanBadge;
