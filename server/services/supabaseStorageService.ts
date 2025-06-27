/**
 * 📸 Supabase Storage Service
 * Servicio para gestionar fotos de perfil en Supabase Storage
 * Reemplaza el almacenamiento local por almacenamiento en la nube
 */

import { supabase } from '../supabase';
import path from 'path';
import fs from 'fs/promises';

export interface UploadResult {
  publicUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

export class SupabaseStorageService {
  private readonly bucketName = 'profile-photos';

  /**
   * Inicializar bucket si no existe
   */
  async initializeBucket(): Promise<void> {
    try {
      // Verificar si el bucket existe
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();
      
      if (listError) {
        console.error('❌ Error listing buckets:', listError);
        throw listError;
      }

      const bucketExists = buckets?.some(bucket => bucket.name === this.bucketName);

      if (!bucketExists) {
        console.log('🪣 Creating profile-photos bucket...');
        
        const { error: createError } = await supabase.storage.createBucket(this.bucketName, {
          public: true,
          allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
          fileSizeLimit: 5 * 1024 * 1024, // 5MB
        });

        if (createError) {
          console.error('❌ Error creating bucket:', createError);
          throw createError;
        }

        console.log('✅ Profile photos bucket created successfully');
      } else {
        console.log('✅ Profile photos bucket already exists');
      }
    } catch (error) {
      console.error('❌ Error initializing bucket:', error);
      throw error;
    }
  }

  /**
   * Subir foto de perfil a Supabase Storage
   */
  async uploadProfilePhoto(
    userId: number,
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string
  ): Promise<UploadResult> {
    try {
      // Generar nombre único para el archivo
      const fileExtension = path.extname(fileName);
      const uniqueFileName = `${userId}/profile-${Date.now()}${fileExtension}`;

      console.log(`📸 Uploading profile photo for user ${userId}: ${uniqueFileName}`);

      // Subir archivo a Supabase Storage
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .upload(uniqueFileName, fileBuffer, {
          contentType: mimeType,
          upsert: false, // No sobrescribir, crear nuevo archivo
        });

      if (error) {
        console.error('❌ Error uploading to Supabase Storage:', error);
        throw error;
      }

      // Obtener URL pública
      const { data: publicUrlData } = supabase.storage
        .from(this.bucketName)
        .getPublicUrl(uniqueFileName);

      if (!publicUrlData?.publicUrl) {
        throw new Error('Failed to get public URL for uploaded file');
      }

      console.log(`✅ Photo uploaded successfully: ${publicUrlData.publicUrl}`);

      return {
        publicUrl: publicUrlData.publicUrl,
        fileName: uniqueFileName,
        fileSize: fileBuffer.length,
        mimeType,
      };
    } catch (error) {
      console.error('❌ Error in uploadProfilePhoto:', error);
      throw error;
    }
  }

  /**
   * Eliminar foto de perfil de Supabase Storage
   */
  async deleteProfilePhoto(fileName: string): Promise<boolean> {
    try {
      console.log(`🗑️ Deleting profile photo: ${fileName}`);

      const { error } = await supabase.storage
        .from(this.bucketName)
        .remove([fileName]);

      if (error) {
        console.error('❌ Error deleting from Supabase Storage:', error);
        return false;
      }

      console.log('✅ Photo deleted successfully');
      return true;
    } catch (error) {
      console.error('❌ Error in deleteProfilePhoto:', error);
      return false;
    }
  }

  /**
   * Migrar foto existente del almacenamiento local a Supabase Storage
   */
  async migrateLocalPhoto(
    userId: number,
    localFilePath: string
  ): Promise<UploadResult | null> {
    try {
      // Verificar si el archivo local existe
      const fileExists = await fs.access(localFilePath).then(() => true).catch(() => false);
      
      if (!fileExists) {
        console.log(`⚠️ Local file not found: ${localFilePath}`);
        return null;
      }

      // Leer archivo local
      const fileBuffer = await fs.readFile(localFilePath);
      const fileName = path.basename(localFilePath);
      
      // Detectar tipo MIME basado en extensión
      const extension = path.extname(fileName).toLowerCase();
      const mimeTypeMap: Record<string, string> = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.webp': 'image/webp',
      };
      
      const mimeType = mimeTypeMap[extension] || 'image/jpeg';

      console.log(`🔄 Migrating local photo for user ${userId}: ${fileName}`);

      // Subir a Supabase Storage
      const result = await this.uploadProfilePhoto(userId, fileBuffer, fileName, mimeType);

      // Eliminar archivo local después de migración exitosa
      await fs.unlink(localFilePath);
      console.log(`✅ Local file deleted: ${localFilePath}`);

      return result;
    } catch (error) {
      console.error('❌ Error migrating local photo:', error);
      return null;
    }
  }

  /**
   * Verificar si una URL es de Supabase Storage
   */
  isSupabaseStorageUrl(url: string): boolean {
    return url.includes('supabase.co/storage/v1/object/public/');
  }

  /**
   * Extraer nombre de archivo de URL de Supabase Storage
   */
  extractFileNameFromUrl(url: string): string | null {
    try {
      const match = url.match(/\/profile-photos\/(.+)$/);
      return match ? match[1] : null;
    } catch (error) {
      console.error('❌ Error extracting filename from URL:', error);
      return null;
    }
  }
}

// Exportar instancia singleton
export const supabaseStorageService = new SupabaseStorageService();
