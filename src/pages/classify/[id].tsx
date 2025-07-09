import { GetServerSideProps } from 'next';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { ClassificationForm } from '../../components/forms/ClassificationForm';
import { GalaxyImages } from '../../components/galaxy/GalaxyImages';
import { Button } from '../../components/ui/Button';
import { Layout } from '../../components/layout/Layout';
import { useResponsive } from '../../hooks/useResponsive';
import { prisma } from '../../lib/db';
import { ImageService } from '../../lib/services/imageService';

interface ClassifyPageProps {
  galaxy: any;
  nextGalaxy?: any;
  previousGalaxy?: any;
  currentClassification?: any;
  images: any[];
  queryParams: string;
}

export default function ClassifyPage({
  galaxy,
  nextGalaxy,
  previousGalaxy,
  currentClassification,
  images,
  queryParams
}: ClassifyPageProps) {
  const router = useRouter();
  const { isMobile, isSmallScreen } = useResponsive();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (formData: any) => {
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/classifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          galaxyId: galaxy.id,
          ...formData
        })
      });

      if (response.ok) {
        if (nextGalaxy) {
          router.push(`/classify/${nextGalaxy.id}${queryParams ? `?${queryParams}` : ''}`);
        } else {
          router.push('/results');
        }
      }
    } catch (error) {
      console.error('Classification submission failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    try {
      await fetch('/api/skip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ galaxyId: galaxy.id })
      });

      if (nextGalaxy) {
        router.push(`/classify/${nextGalaxy.id}${queryParams ? `?${queryParams}` : ''}`);
      }
    } catch (error) {
      console.error('Skip failed:', error);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-6">
            <span className="hidden md:inline">LSB Galaxy Classification - </span>
            <span className="text-blue-600">{galaxy.id}</span>
          </h1>

          <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-4'}`}>
            {/* Images - shown first on mobile */}
            <div className={`${isMobile ? 'order-1' : 'lg:col-span-3'}`}>
              <GalaxyImages 
                galaxyId={galaxy.id} 
                initialImages={images}
              />
              
              {/* Aladin button - below images on mobile */}
              <div className="mt-4">
                <Button
                  variant="info"
                  onClick={() => window.open(`/aladin/${galaxy.ra}/${galaxy.dec}`, '_blank')}
                  className="w-full md:w-auto"
                >
                  Open Aladin
                </Button>
              </div>
            </div>

            {/* Form - shown second on mobile */}
            <div className={`space-y-4 ${isMobile ? 'order-2' : ''}`}>
              <ClassificationForm
                onSubmit={handleSubmit}
                currentClassification={currentClassification}
                galaxy={galaxy}
                disabled={isSubmitting}
              />

              {/* Navigation buttons */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <Button
                  type="submit"
                  form="classification-form"
                  disabled={isSubmitting}
                  className="col-span-2 md:col-span-1"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit'}
                </Button>
                
                {previousGalaxy ? (
                  <Button
                    variant="secondary"
                    onClick={() => router.push(`/classify/${previousGalaxy.id}${queryParams ? `?${queryParams}` : ''}`)}
                    disabled={isSubmitting}
                  >
                    Previous
                  </Button>
                ) : (
                  <Button variant="secondary" disabled>Previous</Button>
                )}

                {nextGalaxy ? (
                  <Button
                    variant="secondary"
                    onClick={() => router.push(`/classify/${nextGalaxy.id}${queryParams ? `?${queryParams}` : ''}`)}
                    disabled={isSubmitting}
                  >
                    Next
                  </Button>
                ) : (
                  <Button variant="secondary" disabled>Next</Button>
                )}

                {nextGalaxy ? (
                  <Button
                    variant="warning"
                    onClick={handleSkip}
                    disabled={isSubmitting}
                  >
                    Skip
                  </Button>
                ) : (
                  <Button variant="warning" disabled>Skip</Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  // ... existing logic for fetching galaxy data
  
  // Generate initial images (URLs only, actual loading happens client-side)
  const images = await ImageService.getGalaxyImages(galaxy.id, {
    vmaxPercentile: 99.0,
    vmaxPercentileRaw: 99.7
  });

  // Preserve query parameters for navigation
  const queryParams = new URLSearchParams(context.query as any).toString();

  return {
    props: {
      galaxy,
      nextGalaxy,
      previousGalaxy,
      currentClassification,
      images,
      queryParams
    }
  };
};
