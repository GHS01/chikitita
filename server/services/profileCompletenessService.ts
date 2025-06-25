/**
 * 📊 Profile Completeness Service
 * Servicio para calcular el porcentaje de completitud del perfil del usuario
 */

import { supabaseStorage } from '../supabaseStorage';

interface ProfileCompletenessResult {
  completionPercentage: number;
  missingFields: string[];
  completedFields: string[];
  recommendations: string[];
  isReadyForWorkouts: boolean;
}

interface ProfileField {
  key: string;
  label: string;
  weight: number; // Peso en el cálculo (1-10)
  isRequired: boolean;
  category: 'basic' | 'fitness' | 'preferences' | 'health';
}

export class ProfileCompletenessService {
  
  // 📋 Definición de campos del perfil con sus pesos
  private readonly profileFields: ProfileField[] = [
    // 🏃‍♂️ Básicos (peso alto)
    { key: 'fitnessLevel', label: 'Nivel de Fitness', weight: 10, isRequired: true, category: 'basic' },
    { key: 'fitnessGoal', label: 'Objetivo de Fitness', weight: 10, isRequired: true, category: 'basic' },
    { key: 'age', label: 'Edad', weight: 8, isRequired: true, category: 'basic' },
    { key: 'gender', label: 'Género', weight: 6, isRequired: false, category: 'basic' },
    
    // 💪 Fitness específico (peso alto)
    { key: 'experienceLevel', label: 'Nivel de Experiencia', weight: 9, isRequired: true, category: 'fitness' },
    { key: 'workoutFrequency', label: 'Frecuencia de Entrenamiento', weight: 9, isRequired: true, category: 'fitness' },
    { key: 'preferredWorkoutDuration', label: 'Duración Preferida', weight: 7, isRequired: false, category: 'fitness' },
    
    // 🏥 Salud (peso medio-alto)
    { key: 'limitations', label: 'Limitaciones Físicas', weight: 8, isRequired: false, category: 'health' },
    { key: 'injuries', label: 'Lesiones', weight: 7, isRequired: false, category: 'health' },
    
    // ⚙️ Preferencias (peso medio)
    { key: 'preferredEquipment', label: 'Equipamiento Preferido', weight: 5, isRequired: false, category: 'preferences' },
    { key: 'workoutLocation', label: 'Ubicación de Entrenamiento', weight: 4, isRequired: false, category: 'preferences' },
    { key: 'timePreferences', label: 'Horarios Preferidos', weight: 3, isRequired: false, category: 'preferences' }
  ];

  /**
   * 🎯 Calcular completitud del perfil del usuario
   */
  async calculateProfileCompleteness(userId: number): Promise<ProfileCompletenessResult> {
    try {
      console.log('📊 [ProfileCompleteness] Calculating for user:', userId);

      // Obtener datos del usuario
      const [userProfile, userPreferences] = await Promise.all([
        supabaseStorage.getUser(userId),
        supabaseStorage.getUserPreferences(userId)
      ]);

      if (!userProfile) {
        throw new Error(`User profile not found for user ${userId}`);
      }

      // Combinar datos para análisis
      const combinedData = {
        ...userProfile,
        ...userPreferences,
        // Mapear campos específicos
        workoutFrequency: userPreferences?.weeklyFrequency,
        preferredWorkoutDuration: userPreferences?.sessionDuration,
        limitations: userPreferences?.limitations,
        injuries: userPreferences?.injuries,
        preferredEquipment: userPreferences?.equipment,
        workoutLocation: userPreferences?.location,
        timePreferences: userPreferences?.timePreferences
      };

      // Analizar cada campo
      const completedFields: string[] = [];
      const missingFields: string[] = [];
      let totalWeight = 0;
      let completedWeight = 0;

      this.profileFields.forEach(field => {
        totalWeight += field.weight;
        
        const value = combinedData[field.key as keyof typeof combinedData];
        const isCompleted = this.isFieldCompleted(value);
        
        if (isCompleted) {
          completedFields.push(field.label);
          completedWeight += field.weight;
        } else {
          missingFields.push(field.label);
        }
      });

      // Calcular porcentaje
      const completionPercentage = Math.round((completedWeight / totalWeight) * 100);

      // Generar recomendaciones
      const recommendations = this.generateRecommendations(missingFields, completionPercentage);

      // Determinar si está listo para entrenamientos
      const isReadyForWorkouts = this.isReadyForWorkouts(combinedData, completionPercentage);

      const result: ProfileCompletenessResult = {
        completionPercentage,
        missingFields,
        completedFields,
        recommendations,
        isReadyForWorkouts
      };

      console.log('📊 [ProfileCompleteness] Detailed Analysis:', {
        userId,
        completionPercentage,
        missingFieldsCount: missingFields.length,
        isReady: isReadyForWorkouts,
        missingFields,
        completedFields,
        totalWeight,
        completedWeight,
        userData: {
          fitnessLevel: combinedData.fitnessLevel,
          fitnessGoal: combinedData.fitnessGoal,
          age: combinedData.age,
          gender: combinedData.gender,
          experienceLevel: combinedData.experienceLevel,
          workoutFrequency: combinedData.workoutFrequency,
          preferredWorkoutDuration: combinedData.preferredWorkoutDuration,
          limitations: combinedData.limitations,
          injuries: combinedData.injuries,
          preferredEquipment: combinedData.preferredEquipment,
          workoutLocation: combinedData.workoutLocation,
          timePreferences: combinedData.timePreferences
        }
      });

      return result;

    } catch (error) {
      console.error('❌ [ProfileCompleteness] Error calculating completeness:', error);
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

  /**
   * 💡 Generar recomendaciones basadas en campos faltantes
   */
  private generateRecommendations(missingFields: string[], completionPercentage: number): string[] {
    const recommendations: string[] = [];

    if (completionPercentage < 50) {
      recommendations.push('Completa tu información básica para rutinas más precisas');
    }

    if (missingFields.includes('Nivel de Fitness')) {
      recommendations.push('Define tu nivel de fitness para ejercicios apropiados');
    }

    if (missingFields.includes('Objetivo de Fitness')) {
      recommendations.push('Establece tu objetivo para rutinas enfocadas');
    }

    if (missingFields.includes('Limitaciones Físicas')) {
      recommendations.push('Indica limitaciones físicas para entrenamientos seguros');
    }

    if (missingFields.includes('Frecuencia de Entrenamiento')) {
      recommendations.push('Define cuántos días puedes entrenar por semana');
    }

    if (completionPercentage >= 80) {
      recommendations.push('¡Perfil casi completo! Pequeños ajustes mejorarán tus rutinas');
    }

    return recommendations;
  }

  /**
   * ✅ Determinar si el usuario está listo para entrenamientos automáticos
   */
  private isReadyForWorkouts(userData: any, completionPercentage: number): boolean {
    // Campos mínimos requeridos para entrenamientos
    const requiredFields = ['fitnessLevel', 'fitnessGoal', 'experienceLevel'];
    
    const hasRequiredFields = requiredFields.every(field => 
      this.isFieldCompleted(userData[field])
    );

    // Necesita al menos 60% de completitud y campos requeridos
    return hasRequiredFields && completionPercentage >= 60;
  }

  /**
   * 📈 Obtener estadísticas por categoría
   */
  async getCompletnessByCategory(userId: number): Promise<{ [category: string]: number }> {
    const result = await this.calculateProfileCompleteness(userId);
    const categories: { [key: string]: { total: number; completed: number } } = {};

    // Inicializar categorías
    this.profileFields.forEach(field => {
      if (!categories[field.category]) {
        categories[field.category] = { total: 0, completed: 0 };
      }
      categories[field.category].total += field.weight;
    });

    // Calcular completitud por categoría
    // (Lógica simplificada - se puede expandir)
    
    const categoryPercentages: { [category: string]: number } = {};
    Object.keys(categories).forEach(category => {
      categoryPercentages[category] = Math.round(Math.random() * 100); // Placeholder
    });

    return categoryPercentages;
  }
}

export const profileCompletenessService = new ProfileCompletenessService();
