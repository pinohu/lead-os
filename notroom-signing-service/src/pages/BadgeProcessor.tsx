import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Download, Upload } from "lucide-react";
import { removeBackground, loadImage } from "@/utils/removeBackground";
import { logger } from "@/utils/logger";

const BadgeProcessor = () => {
  const [processing, setProcessing] = useState(false);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Show original
    const reader = new FileReader();
    reader.onload = (e) => {
      setOriginalImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    setProcessing(true);
    try {
      toast.info("Processing badge... This may take a moment.");
      
      const img = await loadImage(file);
      const processedBlob = await removeBackground(img);
      const url = URL.createObjectURL(processedBlob);
      
      setProcessedImage(url);
      toast.success("Background removed successfully!");
    } catch (error) {
      logger.error("Error processing badge:", error);
      toast.error("Failed to remove background. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!processedImage) return;
    
    const link = document.createElement('a');
    link.href = processedImage;
    link.download = 'badge-transparent.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Badge downloaded!");
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-4 text-center">Badge Background Remover</h1>
        <p className="text-muted-foreground text-center mb-8">
          Upload your badge images to remove backgrounds and create transparent PNGs
        </p>

        <Card className="p-8">
          <div className="space-y-6">
            <div className="flex flex-col items-center">
              <label htmlFor="badge-upload" className="cursor-pointer">
                <div className="border-2 border-dashed border-primary/50 rounded-lg p-12 hover:border-primary transition-colors">
                  <Upload className="w-12 h-12 mx-auto mb-4 text-primary" />
                  <p className="text-center font-semibold">Click to upload badge</p>
                  <p className="text-sm text-muted-foreground text-center mt-2">
                    Supports PNG, JPG, JPEG
                  </p>
                </div>
                <input
                  id="badge-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={processing}
                />
              </label>
            </div>

            {processing && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Processing badge...</p>
              </div>
            )}

            {(originalImage || processedImage) && (
              <div className="grid md:grid-cols-2 gap-6">
                {originalImage && (
                  <div>
                    <h3 className="font-semibold mb-2">Original</h3>
                    <div className="bg-muted/50 rounded-lg p-4 flex items-center justify-center min-h-[200px]">
                      <img src={originalImage} alt="Original" className="max-w-full max-h-[300px]" />
                    </div>
                  </div>
                )}
                {processedImage && (
                  <div>
                    <h3 className="font-semibold mb-2">Transparent Background</h3>
                    <div className="bg-[repeating-linear-gradient(45deg,hsl(var(--muted))_0px,hsl(var(--muted))_10px,transparent_10px,transparent_20px)] rounded-lg p-4 flex items-center justify-center min-h-[200px]">
                      <img src={processedImage} alt="Processed" className="max-w-full max-h-[300px]" />
                    </div>
                    <Button onClick={handleDownload} className="w-full mt-4">
                      <Download className="w-4 h-4 mr-2" />
                      Download Transparent PNG
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>

        <div className="mt-8 p-4 bg-muted/50 rounded-lg">
          <h3 className="font-semibold mb-2">Instructions:</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>Upload each badge image (NSA, NNA Member, PAN)</li>
            <li>Wait for the background to be removed</li>
            <li>Download the transparent PNG</li>
            <li>Save to src/assets/ folder with appropriate name</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default BadgeProcessor;
