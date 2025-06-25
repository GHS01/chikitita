import React, { useState, useRef } from 'react';
import { Camera, Upload, X, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface ProfilePhotoUploadProps {
  currentPhotoUrl?: string;
  onPhotoUpdate: (photoUrl: string | null) => void;
  className?: string;
}

export function ProfilePhotoUpload({ 
  currentPhotoUrl, 
  onPhotoUpdate, 
  className = "" 
}: ProfilePhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentPhotoUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Tipo de archivo no válido",
        description: "Solo se permiten archivos JPEG, PNG y WebP",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Archivo muy grande",
        description: "El archivo debe ser menor a 5MB",
        variant: "destructive",
      });
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    uploadPhoto(file);
  };

  const uploadPhoto = async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('photo', file);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token');
      }

      const response = await fetch('/api/profile/photo', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Upload failed:', response.status, errorText);
        throw new Error(`Failed to upload photo: ${response.status}`);
      }

      const result = await response.json();
      onPhotoUpdate(result.photoUrl);

      toast({
        title: "Foto actualizada",
        description: "Tu foto de perfil se ha actualizado correctamente",
      });

      // Update preview
      setPreviewUrl(result.photoUrl);

      // Disparar evento global para actualizar toda la app
      window.dispatchEvent(new CustomEvent('profilePhotoUpdated', {
        detail: { photoUrl: result.photoUrl }
      }));
    } catch (error) {
      console.error('Error uploading photo:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast({
        title: "Error al subir foto",
        description: `No se pudo actualizar la foto de perfil: ${errorMessage}`,
        variant: "destructive",
      });
      // Reset preview on error
      setPreviewUrl(currentPhotoUrl || null);
    } finally {
      setIsUploading(false);
    }
  };

  const deletePhoto = async () => {
    setIsUploading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/profile/photo', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete photo');
      }

      setPreviewUrl(null);
      onPhotoUpdate(null);

      toast({
        title: "Foto eliminada",
        description: "Tu foto de perfil se ha eliminado correctamente",
      });

      // Disparar evento global para actualizar toda la app
      window.dispatchEvent(new CustomEvent('profilePhotoUpdated', {
        detail: { photoUrl: null }
      }));
    } catch (error) {
      console.error('Error deleting photo:', error);
      toast({
        title: "Error al eliminar foto",
        description: "No se pudo eliminar la foto de perfil",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`flex flex-col items-center space-y-4 ${className}`}>
      {/* Photo Display */}
      <div className="relative">
        <div className="w-32 h-32 rounded-full overflow-hidden bg-muted border-4 border-background shadow-lg">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/10">
              <User className="w-12 h-12 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Upload Button Overlay */}
        <Button
          size="sm"
          variant="secondary"
          className="absolute bottom-0 right-0 rounded-full w-10 h-10 p-0 shadow-lg border-2 border-background"
          onClick={triggerFileInput}
          disabled={isUploading}
        >
          <Camera className="w-4 h-4" />
        </Button>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={triggerFileInput}
          disabled={isUploading}
          className="flex items-center space-x-2"
        >
          <Upload className="w-4 h-4" />
          <span>{previewUrl ? 'Cambiar' : 'Subir'} foto</span>
        </Button>

        {previewUrl && (
          <Button
            variant="outline"
            size="sm"
            onClick={deletePhoto}
            disabled={isUploading}
            className="flex items-center space-x-2 text-destructive hover:text-destructive"
          >
            <X className="w-4 h-4" />
            <span>Eliminar</span>
          </Button>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Upload Status */}
      {isUploading && (
        <div className="text-sm text-muted-foreground">
          Subiendo foto...
        </div>
      )}
    </div>
  );
}
