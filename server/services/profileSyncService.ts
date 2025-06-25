/**
 * 🔄 Profile Synchronization Service
 * Servicio para sincronizar datos entre tabla users y user_preferences
 * MANTIENE COMPATIBILIDAD con todos los servicios existentes
 */

import { supabaseStorage } from '../supabaseStorage';
import { supabase } from '../supabase';

interface ProfileUpdateData {
  // Datos básicos (tabla users)
  fullName?: string;
  age?: number;
  height?: number;
  currentWeight?: number;
  targetWeight?: number;
  fitnessLevel?: string;
  fitnessGoal?: string;
  gender?: string;
  
  // Datos de preferencias (tabla user_preferences)
  weeklyFrequency?: number;
  sessionDuration?: number;
  experienceLevel?: string;
  limitations?: string[];
  injuries?: string[];
  equipment?: string[];
  location?: string;
  timePreferences?: string;
}

interface CompleteProfileData {
  // Datos de users
  id: number;
  username: string;
  email: string;
  fullName: string;
  age?: number;
  height?: number;
  currentWeight?: number;
  targetWeight?: number;
  fitnessLevel?: string;
  fitnessGoal?: string;
  gender?: string;
  createdAt: Date;
  
  // Datos de user_preferences
  weeklyFrequency?: number;
  sessionDuration?: number;
  experienceLevel?: string;
  limitations?: string[];
  injuries?: string[];
  equipment?: string[];
  workoutLocation?: string;
  timePreferences?: string;
  exerciseTypes?: string[];
}

export class ProfileSyncService {
  
  /**
   * 🔍 Obtener perfil completo unificado
   */
  async getCompleteProfile(userId: number): Promise<CompleteProfileData | null> {
    try {
      console.log('🔍 [ProfileSync] Getting complete profile for user:', userId);

      // Obtener datos de ambas tablas
      const [userProfile, userPreferences] = await Promise.all([
        supabaseStorage.getUser(userId),
        supabaseStorage.getUserPreferences(userId)
      ]);

      if (!userProfile) {
        console.error('❌ [ProfileSync] User profile not found');
        return null;
      }

      // Combinar datos
      const completeProfile: CompleteProfileData = {
        // Datos de users
        id: userProfile.id,
        username: userProfile.username,
        email: userProfile.email,
        fullName: userProfile.fullName,
        age: userProfile.age,
        height: userProfile.height,
        currentWeight: userProfile.currentWeight,
        targetWeight: userProfile.targetWeight,
        fitnessLevel: userProfile.fitnessLevel,
        fitnessGoal: userProfile.fitnessGoal,
        gender: userProfile.gender,
        createdAt: userProfile.createdAt,
        
        // Datos de user_preferences
        weeklyFrequency: userPreferences?.weeklyFrequency,
        sessionDuration: userPreferences?.sessionDuration,
        experienceLevel: userPreferences?.experienceLevel,
        limitations: userPreferences?.limitations,
        equipment: userPreferences?.equipment,
        workoutLocation: userPreferences?.location,
        preferredTime: userPreferences?.preferredTime,
        timePreferences: userPreferences?.timePreferences,
        exerciseTypes: userPreferences?.exerciseTypes
      };

      console.log('✅ [ProfileSync] Complete profile retrieved successfully');
      return completeProfile;

    } catch (error) {
      console.error('❌ [ProfileSync] Error getting complete profile:', error);
      throw error;
    }
  }

  /**
   * 🔄 Actualizar perfil completo (sincronización bidireccional)
   */
  async updateCompleteProfile(userId: number, updateData: ProfileUpdateData): Promise<CompleteProfileData> {
    try {
      console.log('🔄 [ProfileSync] Updating complete profile for user:', userId);
      console.log('📝 [ProfileSync] Update data:', updateData);

      // Separar datos por tabla
      const usersData: any = {};
      const preferencesData: any = {};

      // Mapear campos a tabla users
      if (updateData.fullName !== undefined) usersData.full_name = updateData.fullName;
      if (updateData.age !== undefined) usersData.age = updateData.age;
      if (updateData.height !== undefined) usersData.height = updateData.height;
      if (updateData.currentWeight !== undefined) usersData.current_weight = updateData.currentWeight;
      if (updateData.targetWeight !== undefined) usersData.target_weight = updateData.targetWeight;
      if (updateData.fitnessLevel !== undefined) usersData.fitness_level = updateData.fitnessLevel;
      if (updateData.fitnessGoal !== undefined) usersData.fitness_goal = updateData.fitnessGoal;
      if (updateData.gender !== undefined) usersData.gender = updateData.gender;

      // Mapear campos a tabla user_preferences
      if (updateData.weeklyFrequency !== undefined) preferencesData.weekly_frequency = updateData.weeklyFrequency;
      if (updateData.sessionDuration !== undefined) preferencesData.session_duration = updateData.sessionDuration;
      if (updateData.experienceLevel !== undefined) preferencesData.experience_level = updateData.experienceLevel;
      if (updateData.limitations !== undefined) preferencesData.limitations = updateData.limitations;
      if (updateData.equipment !== undefined) preferencesData.equipment = updateData.equipment;
      if (updateData.location !== undefined) preferencesData.location = updateData.location;
      if (updateData.timePreferences !== undefined) preferencesData.time_preferences = updateData.timePreferences;

      // Ejecutar actualizaciones en paralelo
      const updatePromises = [];

      // Actualizar tabla users si hay datos
      if (Object.keys(usersData).length > 0) {
        console.log('📊 [ProfileSync] Updating users table:', usersData);
        updatePromises.push(
          supabase
            .from('users')
            .update(usersData)
            .eq('id', userId)
        );
      }

      // Actualizar tabla user_preferences si hay datos
      if (Object.keys(preferencesData).length > 0) {
        console.log('⚙️ [ProfileSync] Updating user_preferences table:', preferencesData);
        updatePromises.push(
          supabase
            .from('user_preferences')
            .upsert({ user_id: userId, ...preferencesData }, {
              onConflict: 'user_id',
              ignoreDuplicates: false
            })
        );
      }

      // Ejecutar todas las actualizaciones
      if (updatePromises.length > 0) {
        const results = await Promise.all(updatePromises);
        
        // Verificar errores
        for (const result of results) {
          if (result.error) {
            console.error('❌ [ProfileSync] Update error:', result.error);
            throw new Error(`Database update failed: ${result.error.message}`);
          }
        }
      }

      console.log('✅ [ProfileSync] Profile updated successfully');

      // Retornar perfil actualizado
      const updatedProfile = await this.getCompleteProfile(userId);
      if (!updatedProfile) {
        throw new Error('Failed to retrieve updated profile');
      }

      return updatedProfile;

    } catch (error) {
      console.error('❌ [ProfileSync] Error updating complete profile:', error);
      throw error;
    }
  }

  /**
   * 📊 Calcular completitud real del perfil unificado
   */
  async calculateRealCompleteness(userId: number): Promise<{
    percentage: number;
    missingFields: string[];
    completedFields: string[];
    fieldsByCategory: {
      basic: { completed: string[]; missing: string[] };
      fitness: { completed: string[]; missing: string[] };
      health: { completed: string[]; missing: string[] };
      preferences: { completed: string[]; missing: string[] };
    };
  }> {
    try {
      const profile = await this.getCompleteProfile(userId);
      if (!profile) {
        throw new Error('Profile not found');
      }

      // Definir campos por categoría con pesos
      const fieldDefinitions = {
        basic: [
          { key: 'fullName', label: 'Nombre Completo', weight: 5 },
          { key: 'age', label: 'Edad', weight: 10 },
          { key: 'height', label: 'Altura', weight: 8 },
          { key: 'currentWeight', label: 'Peso Actual', weight: 8 },
          { key: 'gender', label: 'Género', weight: 6 }
        ],
        fitness: [
          { key: 'fitnessLevel', label: 'Nivel de Fitness', weight: 10 },
          { key: 'fitnessGoal', label: 'Objetivo de Fitness', weight: 10 },
          { key: 'experienceLevel', label: 'Nivel de Experiencia', weight: 9 },
          { key: 'weeklyFrequency', label: 'Frecuencia Semanal', weight: 9 }
        ],
        health: [
          { key: 'limitations', label: 'Limitaciones Físicas', weight: 8 }
        ],
        preferences: [
          { key: 'equipment', label: 'Equipamiento Preferido', weight: 5 },
          { key: 'workoutLocation', label: 'Ubicación de Entrenamiento', weight: 4 },
          { key: 'preferredTime', label: 'Horarios Preferidos', weight: 3 }
        ]
      };

      let totalWeight = 0;
      let completedWeight = 0;
      const missingFields: string[] = [];
      const completedFields: string[] = [];
      const fieldsByCategory: any = {
        basic: { completed: [], missing: [] },
        fitness: { completed: [], missing: [] },
        health: { completed: [], missing: [] },
        preferences: { completed: [], missing: [] }
      };

      // Evaluar cada categoría
      for (const [category, fields] of Object.entries(fieldDefinitions)) {
        for (const field of fields) {
          totalWeight += field.weight;
          
          const value = profile[field.key as keyof CompleteProfileData];
          const isCompleted = this.isFieldCompleted(value);
          
          if (isCompleted) {
            completedWeight += field.weight;
            completedFields.push(field.label);
            fieldsByCategory[category].completed.push(field.label);
          } else {
            missingFields.push(field.label);
            fieldsByCategory[category].missing.push(field.label);
          }
        }
      }

      const percentage = Math.round((completedWeight / totalWeight) * 100);

      return {
        percentage,
        missingFields,
        completedFields,
        fieldsByCategory
      };

    } catch (error) {
      console.error('❌ [ProfileSync] Error calculating completeness:', error);
      throw error;
    }
  }

  /**
   * 🔍 Verificar si un campo está completado
   */
  private isFieldCompleted(value: any): boolean {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string' && value.trim() === '') return false;
    if (Array.isArray(value) && value.length === 0) return false;
    return true;
  }
}

export const profileSyncService = new ProfileSyncService();
