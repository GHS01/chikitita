import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface ProfilePhoto {
  id: number;
  userId: number;
  photoUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  updatedAt: string;
}

export function useProfilePhoto() {
  const [photo, setPhoto] = useState<ProfilePhoto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchPhoto = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('No authentication token found');
        setPhoto(null);
        return;
      }

      const response = await fetch('/api/profile/photo', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.status === 404) {
        // No photo found, this is normal
        setPhoto(null);
        return;
      }

      if (response.status === 401) {
        console.warn('Authentication failed for profile photo');
        setPhoto(null);
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Profile photo fetch failed:', response.status, errorText);
        throw new Error(`Failed to fetch profile photo: ${response.status}`);
      }

      const photoData = await response.json();
      setPhoto(photoData);
    } catch (err) {
      console.error('Error fetching profile photo:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setPhoto(null); // Set to null on error
    } finally {
      setIsLoading(false);
    }
  };

  const updatePhoto = (photoUrl: string | null) => {
    if (photoUrl) {
      // If we have a new photo URL, update the photo object
      setPhoto(prev => prev ? { ...prev, photoUrl } : null);
    } else {
      // If photo was deleted, clear it
      setPhoto(null);
    }
  };

  const getPhotoUrl = (): string | null => {
    if (!photo?.photoUrl) return null;
    
    // If it's already a full URL, return as is
    if (photo.photoUrl.startsWith('http')) {
      return photo.photoUrl;
    }
    
    // Otherwise, construct the full URL
    return `${window.location.origin}${photo.photoUrl}`;
  };

  const refreshPhoto = () => {
    fetchPhoto();
  };

  useEffect(() => {
    fetchPhoto();
  }, []);

  return {
    photo,
    photoUrl: getPhotoUrl(),
    isLoading,
    error,
    updatePhoto,
    refreshPhoto,
  };
}
