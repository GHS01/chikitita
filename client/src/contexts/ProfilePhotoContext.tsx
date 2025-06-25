import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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

interface ProfilePhotoContextType {
  photo: ProfilePhoto | null;
  photoUrl: string | null;
  isLoading: boolean;
  error: string | null;
  uploadPhoto: (file: File) => Promise<void>;
  deletePhoto: () => Promise<void>;
  refreshPhoto: () => Promise<void>;
}

const ProfilePhotoContext = createContext<ProfilePhotoContextType | undefined>(undefined);

export function ProfilePhotoProvider({ children }: { children: ReactNode }) {
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
        // Silently skip if no token (user not authenticated)
        setPhoto(null);
        setIsLoading(false);
        return;
      }

      const response = await fetch('/api/profile/photo', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.status === 404) {
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
      setPhoto(null);
    } finally {
      setIsLoading(false);
    }
  };

  const uploadPhoto = async (file: File) => {
    try {
      setIsLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const formData = new FormData();
      formData.append('photo', file);

      const response = await fetch('/api/profile/photo', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload photo');
      }

      const newPhoto = await response.json();
      setPhoto(newPhoto);
      
      toast({
        title: "Foto actualizada",
        description: "Tu foto de perfil se ha actualizado correctamente",
      });

      // Forzar actualización en toda la app
      window.dispatchEvent(new CustomEvent('profilePhotoUpdated', { 
        detail: { photoUrl: newPhoto.photoUrl } 
      }));

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deletePhoto = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('/api/profile/photo', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete photo');
      }

      setPhoto(null);
      
      toast({
        title: "Foto eliminada",
        description: "Tu foto de perfil se ha eliminado correctamente",
      });

      // Forzar actualización en toda la app
      window.dispatchEvent(new CustomEvent('profilePhotoUpdated', { 
        detail: { photoUrl: null } 
      }));

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshPhoto = async () => {
    await fetchPhoto();
  };

  const getPhotoUrl = (): string | null => {
    if (!photo?.photoUrl) return null;
    
    if (photo.photoUrl.startsWith('http')) {
      return photo.photoUrl;
    }
    
    return `${window.location.origin}${photo.photoUrl}`;
  };

  useEffect(() => {
    fetchPhoto();
  }, []);

  const value = {
    photo,
    photoUrl: getPhotoUrl(),
    isLoading,
    error,
    uploadPhoto,
    deletePhoto,
    refreshPhoto,
  };

  return (
    <ProfilePhotoContext.Provider value={value}>
      {children}
    </ProfilePhotoContext.Provider>
  );
}

export function useProfilePhoto() {
  const context = useContext(ProfilePhotoContext);
  if (context === undefined) {
    throw new Error('useProfilePhoto must be used within a ProfilePhotoProvider');
  }
  return context;
}
