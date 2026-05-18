// src/pages/admin/PerformanceDashboard.tsx
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { RefreshCw, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { getLatestMetrics, getStoredMetrics, type Metric } from '@/utils/webVitals';
import { PERFORMANCE_THRESHOLDS, formatMetricValue, getPerformanceRating } from '@/utils/performanceAlerts';
import { format } from 'date-fns';
import { logger } from '@/utils/logger';

interface WebVitalDisplay {
  name: string;
  value: number;
  target: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  description: string;
  unit: string;
}

export default function PerformanceDashboard() {
  useAdminAuth();
  
  const [webVitals, setWebVitals] = useState<WebVitalDisplay[]>([]);
  const [recentMetrics, setRecentMetrics] = useState<Metric[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadPerformanceData = () => {
    setIsLoading(true);
    try {
      const latest = getLatestMetrics();
      const allMetrics = getStoredMetrics();
      
      // Define Web Vitals with descriptions
      const vitalDefinitions: Array<{
        name: string;
        description: string;
        unit: string;
      }> = [
        { name: 'LCP', description: 'Largest Contentful Paint', unit: 'ms' },
        { name: 'FID', description: 'First Input Delay', unit: 'ms' },
        { name: 'CLS', description: 'Cumulative Layout Shift', unit: '' },
        { name: 'FCP', description: 'First Contentful Paint', unit: 'ms' },
        { name: 'TTFB', description: 'Time to First Byte', unit: 'ms' },
        { name: 'INP', description: 'Interaction to Next Paint', unit: 'ms' },
      ];

      const vitals: WebVitalDisplay[] = vitalDefinitions.map((def) => {
        const metric = latest[def.name];
        const threshold = PERFORMANCE_THRESHOLDS[def.name];
        
        return {
          name: def.name,
          value: metric?.value ?? 0,
          target: threshold?.warning ?? 0,
          rating: metric ? getPerformanceRating(def.name, metric.value) : 'good',
          description: def.description,
          unit: def.unit,
        };
      });

      setWebVitals(vitals);
      
      // Get recent metrics (last 20)
      const recent = allMetrics
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 20);
      setRecentMetrics(recent);
      
      setLastUpdated(new Date());
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to load performance data:', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPerformanceData();
    
    // Refresh every 30 seconds
    const interval = setInterval(loadPerformanceData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getRatingColor = (rating: 'good' | 'needs-improvement' | 'poor') => {
    switch (rating) {
      case 'good':
        return 'bg-green-500';
      case 'needs-improvement':
        return 'bg-yellow-500';
      case 'poor':
        return 'bg-red-500';
    }
  };

  const getRatingVariant = (rating: 'good' | 'needs-improvement' | 'poor') => {
    switch (rating) {
      case 'good':
        return 'default';
      case 'needs-improvement':
        return 'secondary';
      case 'poor':
        return 'destructive';
    }
  };

  // Calculate bundle size info (mock data - would come from build stats)
  const bundleSizes = {
    'Initial Load': '245 KB',
    'Vendor Chunks': '180 KB',
    'Total Bundle': '425 KB',
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Performance Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Monitor Core Web Vitals and application performance metrics
          </p>
        </div>
        <div className="flex items-center gap-4">
          {lastUpdated && (
            <span className="text-sm text-muted-foreground">
              Last updated: {format(lastUpdated, 'HH:mm:ss')}
            </span>
          )}
          <Button
            onClick={loadPerformanceData}
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Core Web Vitals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {webVitals.map((vital) => (
          <Card key={vital.name}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{vital.name}</CardTitle>
                <Badge variant={getRatingVariant(vital.rating)}>
                  {vital.rating.replace('-', ' ')}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{vital.description}</p>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-bold">
                  {vital.value > 0 ? formatMetricValue(vital.name, vital.value) : 'N/A'}
                </div>
                {vital.unit && <span className="text-muted-foreground">{vital.unit}</span>}
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Target</span>
                  <span>{formatMetricValue(vital.name, vital.target)}</span>
                </div>
                <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getRatingColor(vital.rating)} transition-all`}
                    style={{
                      width: vital.value > 0
                        ? `${Math.min((vital.value / vital.target) * 100, 100)}%`
                        : '0%',
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bundle Sizes */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Bundle Sizes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(bundleSizes).map(([name, size]) => (
              <div key={name} className="text-center">
                <div className="text-2xl font-bold">{size}</div>
                <div className="text-sm text-muted-foreground mt-1">{name}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Metrics History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Metrics History</CardTitle>
        </CardHeader>
        <CardContent>
          {recentMetrics.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No metrics collected yet. Metrics will appear as users interact with the application.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Metric</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentMetrics.map((metric, index) => (
                    <TableRow key={`${metric.name}-${metric.timestamp}-${index}`}>
                      <TableCell className="font-medium">{metric.name}</TableCell>
                      <TableCell>{formatMetricValue(metric.name, metric.value)}</TableCell>
                      <TableCell>
                        <Badge variant={getRatingVariant(metric.rating)}>
                          {metric.rating.replace('-', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(metric.timestamp), 'MMM d, HH:mm:ss')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


