import { GetServerSideProps } from 'next';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { ClassificationForm } from '../../components/forms/ClassificationForm';
import { GalaxyImages } from '../../components/galaxy/GalaxyImages';
import { Button } from '../../components/ui/Button';
import { prisma } from '../../lib/db';

interface ClassifyPageProps {
  galaxy: any;
  nextGalaxy?: any;
  previousGalaxy?: any;
  currentClassification?: any;
  imageUrls: string[];
}

export default function ClassifyPage({
  galaxy,
  nextGalaxy,
  previousGalaxy,
  currentClassification,
  imageUrls
}: ClassifyPageProps) {
  const router = useRouter();
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
          router.push(`/classify/${nextGalaxy.id}`);
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
        router.push(`/classify/${nextGalaxy.id}`);
      }
    } catch (error) {
      console.error('Skip failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">
          LSB Galaxy Classification - <span className="text-blue-600">{galaxy.id}</span>
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <GalaxyImages images={imageUrls} galaxyId={galaxy.id} />
          </div>

          <div className="space-y-4">
            <ClassificationForm
              onSubmit={handleSubmit}
              currentClassification={currentClassification}
              galaxy={galaxy}
            />

            <div className="flex space-x-2">
              {previousGalaxy && (
                <Button
                  variant="secondary"
                  onClick={() => router.push(`/classify/${previousGalaxy.id}`)}
                >
                  Previous
                </Button>
              )}
              
              {nextGalaxy && (
                <Button
                  variant="warning"
                  onClick={handleSkip}
                >
                  Skip
                </Button>
              )}
            </div>

            <Button
              variant="info"
              onClick={() => window.open(`/aladin/${galaxy.ra}/${galaxy.dec}`, '_blank')}
            >
              Open Aladin
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params!;
  
  // Fetch galaxy data, next/previous galaxies, classification, etc.
  // This would include the image processing logic
  
  return {
    props: {
      galaxy: {}, // populated galaxy data
      imageUrls: [], // processed image URLs
      // ... other props
    }
  };
};
