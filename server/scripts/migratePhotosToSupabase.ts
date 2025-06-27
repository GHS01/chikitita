/**
 * 🔄 Script de Migración: Fotos Locales → Supabase Storage
 * Migra todas las fotos de perfil existentes del almacenamiento local a Supabase Storage
 */

// ⚠️ CRÍTICO: Cargar variables de entorno PRIMERO
import 'dotenv/config';

import { supabaseStorageService } from '../services/supabaseStorageService';
import { storage } from '../storageNew';
import path from 'path';
import fs from 'fs/promises';

interface MigrationResult {
  totalPhotos: number;
  migrated: number;
  failed: number;
  skipped: number;
  errors: string[];
}

async function migratePhotosToSupabase(): Promise<MigrationResult> {
  const result: MigrationResult = {
    totalPhotos: 0,
    migrated: 0,
    failed: 0,
    skipped: 0,
    errors: []
  };

  try {
    console.log('🚀 Iniciando migración de fotos a Supabase Storage...');

    // Inicializar bucket
    await supabaseStorageService.initializeBucket();

    // Obtener todas las fotos de perfil de la base de datos
    const allPhotos = await storage.getAllProfilePhotos();
    result.totalPhotos = allPhotos.length;

    console.log(`📊 Total de fotos encontradas: ${result.totalPhotos}`);

    if (result.totalPhotos === 0) {
      console.log('✅ No hay fotos para migrar');
      return result;
    }

    // Procesar cada foto
    for (const photo of allPhotos) {
      try {
        console.log(`\n🔄 Procesando foto del usuario ${photo.userId}...`);

        // Verificar si ya es una URL de Supabase Storage
        if (supabaseStorageService.isSupabaseStorageUrl(photo.photoUrl)) {
          console.log(`⏭️ Foto ya está en Supabase Storage: ${photo.photoUrl}`);
          result.skipped++;
          continue;
        }

        // Construir ruta del archivo local
        const localFilePath = path.join(process.cwd(), 'uploads', 'profiles', photo.fileName);

        // Verificar si el archivo local existe
        try {
          await fs.access(localFilePath);
        } catch (error) {
          console.log(`⚠️ Archivo local no encontrado: ${localFilePath}`);
          result.failed++;
          result.errors.push(`Usuario ${photo.userId}: Archivo no encontrado - ${photo.fileName}`);
          continue;
        }

        // Migrar foto a Supabase Storage
        const migrationResult = await supabaseStorageService.migrateLocalPhoto(
          photo.userId,
          localFilePath
        );

        if (migrationResult) {
          // Actualizar URL en base de datos
          await storage.updateProfilePhotoUrl(photo.userId, {
            photoUrl: migrationResult.publicUrl,
            fileName: migrationResult.fileName,
            fileSize: migrationResult.fileSize,
            mimeType: migrationResult.mimeType,
          });

          console.log(`✅ Migración exitosa para usuario ${photo.userId}`);
          console.log(`   Antigua URL: ${photo.photoUrl}`);
          console.log(`   Nueva URL: ${migrationResult.publicUrl}`);
          result.migrated++;
        } else {
          console.log(`❌ Falló migración para usuario ${photo.userId}`);
          result.failed++;
          result.errors.push(`Usuario ${photo.userId}: Error en migración`);
        }

      } catch (error) {
        console.error(`❌ Error procesando foto del usuario ${photo.userId}:`, error);
        result.failed++;
        result.errors.push(`Usuario ${photo.userId}: ${error.message}`);
      }
    }

    // Resumen final
    console.log('\n📊 RESUMEN DE MIGRACIÓN:');
    console.log(`   Total de fotos: ${result.totalPhotos}`);
    console.log(`   ✅ Migradas: ${result.migrated}`);
    console.log(`   ⏭️ Ya en Supabase: ${result.skipped}`);
    console.log(`   ❌ Fallidas: ${result.failed}`);

    if (result.errors.length > 0) {
      console.log('\n❌ ERRORES ENCONTRADOS:');
      result.errors.forEach(error => console.log(`   - ${error}`));
    }

    if (result.migrated > 0) {
      console.log('\n🎉 ¡Migración completada exitosamente!');
      console.log('💡 Puedes eliminar la carpeta uploads/profiles/ manualmente si lo deseas');
    }

    return result;

  } catch (error) {
    console.error('❌ Error crítico en migración:', error);
    result.errors.push(`Error crítico: ${error.message}`);
    throw error;
  }
}

// Ejecutar migración si se llama directamente (ES Modules compatible)
if (import.meta.url === `file://${process.argv[1]}`) {
  migratePhotosToSupabase()
    .then((result) => {
      console.log('\n✅ Script de migración finalizado');
      process.exit(result.failed > 0 ? 1 : 0);
    })
    .catch((error) => {
      console.error('❌ Script de migración falló:', error);
      process.exit(1);
    });
}

export { migratePhotosToSupabase };
