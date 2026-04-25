import { useState } from 'react';
import { loadImage, removeBackground } from '@/utils/removeBackground';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import nsaBadge from '@/assets/nsa_member_badge.png';
import nnaMemberBadge from '@/assets/nna_member_badge.png';
import panMemberBadge from '@/assets/pan_member_badge.png';
import nngUxcBadge from '@/assets/nng_uxc_badge.png';
import { logger } from '@/utils/logger';

interface BadgeState {
  original: string;
  processed: string | null;
  processing: boolean;
  name: string;
  filename: string;
}

const AllBadgesProcessor = () => {
  const { toast } = useToast();
  const [badges, setBadges] = useState<BadgeState[]>([
    { original: nsaBadge, processed: null, processing: false, name: 'NSA Badge', filename: 'nsa_member_badge_transparent.png' },
    { original: nnaMemberBadge, processed: null, processing: false, name: 'NNA Badge', filename: 'nna_member_badge_transparent.png' },
    { original: panMemberBadge, processed: null, processing: false, name: 'PAN Badge', filename: 'pan_member_badge_transparent.png' },
    { original: nngUxcBadge, processed: null, processing: false, name: 'NNG UX Badge', filename: 'nng_uxc_badge_transparent.png' },
  ]);

  const processBadge = async (index: number) => {
    try {
      setBadges(prev => prev.map((b, i) => i === index ? { ...b, processing: true } : b));

      const response = await fetch(badges[index].original);
      const blob = await response.blob();
      const imageElement = await loadImage(blob);
      const processedBlob = await removeBackground(imageElement);
      const url = URL.createObjectURL(processedBlob);

      setBadges(prev => prev.map((b, i) => i === index ? { ...b, processed: url, processing: false } : b));

      toast({
        title: "Background removed",
        description: `${badges[index].name} is ready to download`,
      });
    } catch (err) {
      logger.error('Error processing badge:', err);
      setBadges(prev => prev.map((b, i) => i === index ? { ...b, processing: false } : b));
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to process badge',
        variant: "destructive",
      });
    }
  };

  const processAll = async () => {
    toast({
      title: "Processing all badges",
      description: "This may take a minute...",
    });

    for (let i = 0; i < badges.length; i++) {
      await processBadge(i);
    }

    toast({
      title: "All badges processed",
      description: "You can now download them individually",
    });
  };

  const downloadBadge = (index: number) => {
    if (!badges[index].processed) return;

    const link = document.createElement('a');
    link.href = badges[index].processed!;
    link.download = badges[index].filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Downloaded",
      description: `${badges[index].name} saved successfully`,
    });
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="space-y-4">
          <h1 className="text-3xl font-bold">Certification Badges Background Removal</h1>
          <p className="text-muted-foreground">
            Process all three certification badges to remove their backgrounds and create transparent PNGs.
          </p>
        </div>

        <Button onClick={processAll} size="lg" disabled={badges.some(b => b.processing)}>
          {badges.some(b => b.processing) ? 'Processing...' : 'Process All Badges'}
        </Button>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {badges.map((badge, index) => (
            <div key={index} className="space-y-4 border rounded-lg p-6">
              <h2 className="text-xl font-semibold">{badge.name}</h2>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Original</p>
                  <div className="bg-muted/20 p-4 rounded">
                    <img src={badge.original} alt={`Original ${badge.name}`} className="w-full max-w-[150px] mx-auto" />
                  </div>
                </div>

                {badge.processed && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Transparent</p>
                    <div className="bg-checkerboard p-4 rounded">
                      <img src={badge.processed} alt={`Processed ${badge.name}`} className="w-full max-w-[150px] mx-auto" />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Button 
                  onClick={() => processBadge(index)} 
                  disabled={badge.processing}
                  variant="outline"
                  size="sm"
                >
                  {badge.processing ? 'Processing...' : 'Process This Badge'}
                </Button>
                
                {badge.processed && (
                  <Button 
                    onClick={() => downloadBadge(index)}
                    size="sm"
                  >
                    Download
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-muted/50 p-6 rounded-lg space-y-2">
          <h3 className="font-semibold">Instructions:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
            <li>Click "Process All Badges" to remove backgrounds from all four badges</li>
            <li>Download each processed badge individually</li>
            <li>Replace the original files in src/assets/ with the downloaded transparent versions</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default AllBadgesProcessor;
