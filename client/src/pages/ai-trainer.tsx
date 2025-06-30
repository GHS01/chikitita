import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import TrainerSetup from '@/components/trainer/TrainerSetup';
import AITrainerChat from '@/components/trainer/AITrainerChat';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { TrainerConfig } from '@shared/schema';
import { useTranslation } from 'react-i18next';

export default function AITrainerPage() {
  console.log('🎯 [AITrainerPage] Component rendered');
  const { t } = useTranslation();

  // Check if trainer is configured
  const { data: trainerConfig, isLoading, refetch } = useQuery({
    queryKey: ['/api/trainer/config'],
    queryFn: async () => {
      console.log('📡 [AITrainerPage] Fetching trainer config...');
      const response = await apiRequest('GET', '/api/trainer/config');
      const result = await response.json();
      console.log('📡 [AITrainerPage] Trainer config response:', result);
      return result;
    },
    retry: false,
  });

  console.log('🎯 [AITrainerPage] Current state - isLoading:', isLoading, 'trainerConfig:', trainerConfig);

  const handleConfigured = () => {
    console.log('🔄 [AITrainerPage] handleConfigured called - refetching...');
    refetch();
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-luxury-black overflow-hidden">
        <div className="fixed inset-0 flex items-center justify-center pt-16 pb-4 md:pt-20 md:pb-6">
          <div className="w-full max-w-2xl h-full flex flex-col">
          <Card className="border border-luxury-gold/40 shadow-2xl bg-luxury-charcoal/95 backdrop-blur-sm overflow-hidden rounded-3xl ring-1 ring-luxury-gold/30 shadow-luxury-gold/20">
            <CardHeader className="relative text-center bg-gradient-to-r from-luxury-gold to-light-gold backdrop-blur-sm border-b border-luxury-gold/20 py-8 rounded-t-3xl shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-r from-luxury-black/10 via-transparent to-white/5 rounded-t-3xl"></div>
              <div className="relative">
                <Skeleton className="h-8 w-64 mx-auto bg-luxury-black/20" />
                <Skeleton className="h-4 w-96 mx-auto mt-2 bg-luxury-black/20" />
              </div>
            </CardHeader>
            <CardContent className="p-8 pt-8 bg-luxury-black/60 text-white">
              <div className="space-y-6">
                <Skeleton className="h-12 w-full bg-luxury-gold/20" />
                <Skeleton className="h-12 w-full bg-luxury-gold/20" />
                <Skeleton className="h-12 w-full bg-luxury-gold/20" />
                <Skeleton className="h-10 w-32 bg-luxury-gold/30" />
              </div>
            </CardContent>
          </Card>
          </div>
        </div>
      </div>
    );
  }

  // Show setup if trainer is not configured
  if (!trainerConfig || !trainerConfig.isConfigured) {
    console.log('🔧 [AITrainerPage] Showing TrainerSetup - config not found or not configured');
    return (
      <div className="h-screen bg-luxury-black overflow-hidden">
        <TrainerSetup onConfigured={handleConfigured} />
      </div>
    );
  }

  // Show chat interface if trainer is configured
  console.log('💬 [AITrainerPage] Showing AITrainerChat - trainer is configured');
  return (
    <div className="h-screen bg-luxury-black overflow-hidden">
      <AITrainerChat trainerConfig={trainerConfig} />
    </div>
  );
}
