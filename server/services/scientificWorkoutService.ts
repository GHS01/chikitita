/**
 * 🧬 Scientific Workout Service
 * Servicio para gestionar rutinas basadas en principios científicos
 */

import { supabaseStorage } from '../supabaseStorage';
import { supabase } from '../supabase'; // ✅ FIX: Importar supabase directamente

// Tipos para el sistema científico
export interface ScientificSplit {
  id: number;
  split_name: string;
  split_type: 'body_part_split' | 'push_pull_legs' | 'upper_lower';
  muscle_groups: string[];
  recovery_time_hours: number;
  scientific_rationale: string;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
}

export interface WorkoutMesocycle {
  id: number;
  user_id: number;
  mesocycle_name: string;
  start_date: string;
  end_date: string;
  duration_weeks: number;
  split_type: string;
  status: 'active' | 'completed' | 'paused';
  progression_data: any;
}

export interface WeeklySchedule {
  id: number;
  user_id: number;
  mesocycle_id: number;
  week_number: number;
  week_start_date: string;
  schedule_data: {
    monday?: { split_id: number; rest: boolean };
    tuesday?: { split_id: number; rest: boolean };
    wednesday?: { split_id: number; rest: boolean };
    thursday?: { split_id: number; rest: boolean };
    friday?: { split_id: number; rest: boolean };
    saturday?: { split_id: number; rest: boolean };
    sunday?: { split_id: number; rest: boolean };
  };
  completed: boolean;
}

export interface MuscleRecovery {
  id: number;
  user_id: number;
  muscle_group: string;
  last_trained_date: string;
  recovery_status: 'recovering' | 'ready' | 'overdue';
  next_available_date: string;
}

class ScientificWorkoutService {
  
  /**
   * 🔬 Obtener splits científicos disponibles
   */
  async getScientificSplits(): Promise<ScientificSplit[]> {
    const { data, error } = await supabase
      .from('scientific_splits')
      .select('*')
      .order('split_type', { ascending: true });

    if (error) {
      console.error('Error fetching scientific splits:', error);
      throw new Error('Failed to fetch scientific splits');
    }

    return data || [];
  }

  /**
   * 🎯 Recomendar split óptimo basado en días disponibles del usuario
   */
  async recommendOptimalSplit(userId: number, weeklyFrequency: number, ignoreUserLimitations: boolean = false): Promise<{
    recommendedSplit: ScientificSplit[];
    rationale: string;
    weeklySchedule: any;
    limitationsMessage?: string;
  }> {
    const splits = await this.getScientificSplits();
    const userPreferences = await supabaseStorage.getUserPreferences(userId);
    const userLimitations = userPreferences?.limitations || [];

    console.log(`🚨 [ScientificWorkout] User limitations detected:`, userLimitations);
    console.log(`🏥 [ConsentSystem] Ignore limitations:`, ignoreUserLimitations);
    console.log(`🚨 [ScientificWorkout] Total splits before filtering:`, splits.length);
    console.log(`🚨 [ScientificWorkout] Splits before filtering:`, splits.map(s => ({ id: s.id, name: s.split_name, muscles: s.muscle_groups })));

    // 🏥 FILTRAR SPLITS SEGÚN LIMITACIONES FÍSICAS (SOLO SI NO SE IGNORAN)
    let safeSplits: ScientificSplit[];

    if (ignoreUserLimitations) {
      console.log(`🏥 [CONSENT] ✅ User accepted risks - using ALL ${splits.length} splits without filtering`);
      safeSplits = splits; // 🏥 Si acepta riesgos, usar todos los splits
    } else {
      console.log(`🛡️ [SAFETY] ⚠️ User chose safety - filtering splits by limitations`);
      safeSplits = this.filterSplitsByLimitations(splits, userLimitations); // 🛡️ Si no acepta, filtrar por seguridad
    }

    console.log(`🚨 [ScientificWorkout] Safe splits after filtering:`, safeSplits.length);
    console.log(`🚨 [ScientificWorkout] Safe splits:`, safeSplits.map(s => ({ id: s.id, name: s.split_name, muscles: s.muscle_groups })));

    // 🚨 GENERAR MENSAJE EXPLICATIVO SOBRE LIMITACIONES
    let limitationsMessage = '';
    if (userLimitations.length > 0) {
      const limitationLabels = {
        'knee_issues': 'problemas de rodilla',
        'back_problems': 'problemas de espalda',
        'shoulder_issues': 'problemas de hombros',
        'heart_condition': 'condición cardíaca',
        'asthma': 'asma',
        'pregnancy': 'embarazo'
      };

      const limitationTexts = userLimitations.map(limitation =>
        limitationLabels[limitation as keyof typeof limitationLabels] || limitation
      );

      const filteredCount = splits.length - safeSplits.length;
      if (filteredCount > 0) {
        limitationsMessage = `Te propongo lo siguiente ya que actualmente tus limitaciones indican que tienes ${limitationTexts.join(', ')}. Se han filtrado ${filteredCount} splits por seguridad.`;
      }
    }

    if (safeSplits.length === 0) {
      console.log('🚨 [ScientificWorkout] No safe splits found, generating alternative splits...');

      // 🏥 GENERAR SPLITS ALTERNATIVOS INTELIGENTES
      const alternativeSplits = this.generateAlternativeSplits(userLimitations);

      if (alternativeSplits.length === 0) {
        return {
          recommendedSplit: [],
          rationale: `⚠️ No se encontraron splits seguros para las limitaciones físicas detectadas. Consulta con un profesional de la salud.`,
          weeklySchedule: {},
          limitationsMessage
        };
      }

      // Usar splits alternativos
      safeSplits = alternativeSplits;
      limitationsMessage = `🏥 Se han creado splits alternativos seguros para tus limitaciones físicas. Estos entrenamientos evitan los grupos musculares problemáticos.`;
    }

    let recommendedSplits: ScientificSplit[] = [];
    let rationale = '';
    let splitType = '';

    // 🧬 LÓGICA CIENTÍFICA OPTIMIZADA PARA CADA FRECUENCIA
    if (weeklyFrequency === 1) {
      // 1 día: Full Body (máximo estímulo en sesión única)
      recommendedSplits = safeSplits.filter(s => s.split_type === 'full_body');
      if (recommendedSplits.length === 0) {
        recommendedSplits = safeSplits.filter(s => s.split_type === 'upper_lower');
      }
      splitType = recommendedSplits[0]?.split_type || 'upper_lower';
      rationale = `Con 1 día disponible, Full Body maximiza el estímulo muscular general. Adaptado según limitaciones físicas.`;
    } else if (weeklyFrequency === 2) {
      // 2 días: Upper/Lower (división óptima)
      recommendedSplits = safeSplits.filter(s => s.split_type === 'upper_lower');
      splitType = 'upper_lower';
      rationale = `Con 2 días disponibles, Upper/Lower permite recuperación óptima entre sesiones. Filtrado por seguridad.`;
    } else if (weeklyFrequency === 3) {
      // 3 días: Push/Pull/Legs (clásico y efectivo)
      recommendedSplits = safeSplits.filter(s => s.split_type === 'push_pull_legs');
      splitType = 'push_pull_legs';
      rationale = `Con 3 días disponibles, Push/Pull/Legs es el estándar científico para desarrollo muscular. Filtrado por limitaciones.`;
    } else if (weeklyFrequency === 4) {
      // 4 días: Body Part Split (especialización)
      recommendedSplits = safeSplits.filter(s => s.split_type === 'body_part_split');
      splitType = 'body_part_split';
      rationale = `Con 4 días disponibles, el split por grupos musculares permite máxima especialización y volumen. Filtrado por seguridad.`;
    } else if (weeklyFrequency === 5 || weeklyFrequency === 6) {
      // 5-6 días: Push/Pull/Legs x2 (frecuencia 2x por músculo)
      recommendedSplits = safeSplits.filter(s => s.split_type === 'push_pull_legs');
      splitType = 'push_pull_legs';
      rationale = `Con ${weeklyFrequency} días disponibles, Push/Pull/Legs repetido permite entrenar cada músculo 2x/semana (óptimo para síntesis proteica). Filtrado por limitaciones.`;
    } else if (weeklyFrequency >= 7) {
      // 7 días: Body Part Split + día activo
      recommendedSplits = safeSplits.filter(s => s.split_type === 'body_part_split');
      splitType = 'body_part_split';
      rationale = `Con 7 días disponibles, split por grupos musculares con un día de recuperación activa. Máximo volumen con recuperación inteligente. Filtrado por seguridad.`;
    }

    // Si no hay splits del tipo preferido, usar los mejores disponibles
    if (recommendedSplits.length === 0) {
      recommendedSplits = safeSplits.slice(0, 3);
      rationale += ` Se seleccionaron splits alternativos seguros debido a limitaciones físicas.`;
    }

    // Generar horario semanal sugerido
    const weeklySchedule = this.generateWeeklySchedule(weeklyFrequency, recommendedSplits);

    return {
      recommendedSplit: recommendedSplits,
      rationale,
      weeklySchedule,
      limitationsMessage
    };
  }

  /**
   * 📅 Generar horario semanal basado en días disponibles
   */
  private generateWeeklySchedule(weeklyFrequency: number, splits: ScientificSplit[]): any {
    const schedule: any = {};
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    if (weeklyFrequency === 1 && splits.length >= 1) {
      // 1 día: Miércoles (centro de semana para máxima recuperación)
      schedule.monday = { rest: true };
      schedule.tuesday = { rest: true };
      schedule.wednesday = { split_id: splits[0].id, rest: false, split_name: splits[0].split_name };
      schedule.thursday = { rest: true };
      schedule.friday = { rest: true };
      schedule.saturday = { rest: true };
      schedule.sunday = { rest: true };
    } else if (weeklyFrequency === 2 && splits.length >= 2) {
      // Lunes y Jueves (máxima recuperación)
      schedule.monday = { split_id: splits[0].id, rest: false, split_name: splits[0].split_name };
      schedule.tuesday = { rest: true };
      schedule.wednesday = { rest: true };
      schedule.thursday = { split_id: splits[1].id, rest: false, split_name: splits[1].split_name };
      schedule.friday = { rest: true };
      schedule.saturday = { rest: true };
      schedule.sunday = { rest: true };
    } else if (weeklyFrequency === 3 && splits.length >= 3) {
      // Lunes, Miércoles, Viernes
      schedule.monday = { split_id: splits[0].id, rest: false, split_name: splits[0].split_name };
      schedule.tuesday = { rest: true };
      schedule.wednesday = { split_id: splits[1].id, rest: false, split_name: splits[1].split_name };
      schedule.thursday = { rest: true };
      schedule.friday = { split_id: splits[2].id, rest: false, split_name: splits[2].split_name };
      schedule.saturday = { rest: true };
      schedule.sunday = { rest: true };
    } else if (weeklyFrequency === 4 && splits.length >= 4) {
      // Lunes, Martes, Jueves, Viernes
      schedule.monday = { split_id: splits[0].id, rest: false, split_name: splits[0].split_name };
      schedule.tuesday = { split_id: splits[1].id, rest: false, split_name: splits[1].split_name };
      schedule.wednesday = { rest: true };
      schedule.thursday = { split_id: splits[2].id, rest: false, split_name: splits[2].split_name };
      schedule.friday = { split_id: splits[3].id, rest: false, split_name: splits[3].split_name };
      schedule.saturday = { rest: true };
      schedule.sunday = { rest: true };
    } else if (weeklyFrequency === 5) {
      // 5 días: Push/Pull/Legs x2 + descanso estratégico
      // Lunes: Push, Martes: Pull, Miércoles: Legs, Jueves: Push, Viernes: Pull
      const pplPattern = [0, 1, 2, 0, 1]; // Índices para Push/Pull/Legs
      const trainingDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

      trainingDays.forEach((day, index) => {
        const splitIndex = pplPattern[index];
        if (splitIndex < splits.length) {
          schedule[day] = {
            split_id: splits[splitIndex].id,
            rest: false,
            split_name: splits[splitIndex].split_name
          };
        }
      });

      schedule.saturday = { rest: true };
      schedule.sunday = { rest: true };
    } else if (weeklyFrequency === 6) {
      // 6 días: Push/Pull/Legs x2 completo
      // Lunes: Push, Martes: Pull, Miércoles: Legs, Jueves: Push, Viernes: Pull, Sábado: Legs
      const pplPattern = [0, 1, 2, 0, 1, 2]; // Push/Pull/Legs repetido
      const trainingDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

      trainingDays.forEach((day, index) => {
        const splitIndex = pplPattern[index];
        if (splitIndex < splits.length) {
          schedule[day] = {
            split_id: splits[splitIndex].id,
            rest: false,
            split_name: splits[splitIndex].split_name
          };
        }
      });

      schedule.sunday = { rest: true };
    } else if (weeklyFrequency >= 7) {
      // 7 días: Body Part Split con día de recuperación activa
      let splitIndex = 0;
      for (let i = 0; i < 7; i++) {
        const day = days[i];
        if (i === 6) { // Domingo = recuperación activa/cardio
          schedule[day] = { rest: true, active_recovery: true };
        } else if (splitIndex < splits.length) {
          schedule[day] = {
            split_id: splits[splitIndex % splits.length].id,
            rest: false,
            split_name: splits[splitIndex % splits.length].split_name
          };
          splitIndex++;
        } else {
          schedule[day] = { rest: true };
        }
      }
    }

    return schedule;
  }

  /**
   * 🔄 Crear nuevo mesociclo para usuario
   */
  async createMesocycle(userId: number, splitType: string, durationWeeks: number = 6): Promise<WorkoutMesocycle> {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + (durationWeeks * 7));

    const mesocycleName = `Mesociclo ${splitType.replace('_', ' ')} - ${startDate.toLocaleDateString()}`;

    const { data, error } = await supabase
      .from('workout_mesocycles')
      .insert({
        user_id: userId,
        mesocycle_name: mesocycleName,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        duration_weeks: durationWeeks,
        split_type: splitType,
        status: 'active',
        progression_data: {}
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating mesocycle:', error);
      throw new Error('Failed to create mesocycle');
    }

    return data;
  }

  /**
   * 📊 Obtener mesociclo activo del usuario
   */
  async getActiveMesocycle(userId: number): Promise<WorkoutMesocycle | null> {
    const { data, error } = await supabase
      .from('workout_mesocycles')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching active mesocycle:', error);
      throw new Error('Failed to fetch active mesocycle');
    }

    return data || null;
  }

  /**
   * 💪 Verificar recuperación muscular
   */
  async checkMuscleRecovery(userId: number, muscleGroups: string[]): Promise<{
    ready: boolean;
    recoveryStatus: { [muscle: string]: MuscleRecovery };
    recommendation: string;
  }> {
    const recoveryData: { [muscle: string]: MuscleRecovery } = {};
    let allReady = true;
    let recommendation = '';

    for (const muscle of muscleGroups) {
      const { data, error } = await supabase
        .from('muscle_recovery')
        .select('*')
        .eq('user_id', userId)
        .eq('muscle_group', muscle)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data) {
        recoveryData[muscle] = data;
        if (data.recovery_status !== 'ready') {
          allReady = false;
        }
      } else {
        // Si no hay datos, el músculo está listo
        recoveryData[muscle] = {
          id: 0,
          user_id: userId,
          muscle_group: muscle,
          last_trained_date: '',
          recovery_status: 'ready',
          next_available_date: new Date().toISOString().split('T')[0]
        };
      }
    }

    if (!allReady) {
      const notReady = Object.entries(recoveryData)
        .filter(([_, data]) => data.recovery_status !== 'ready')
        .map(([muscle, _]) => muscle);
      
      recommendation = `Los siguientes músculos aún están en recuperación: ${notReady.join(', ')}. Considera entrenar otros grupos musculares.`;
    } else {
      recommendation = 'Todos los grupos musculares están listos para entrenar. ¡Perfecto timing!';
    }

    return {
      ready: allReady,
      recoveryStatus: recoveryData,
      recommendation
    };
  }

  /**
   * 🔄 Actualizar estado de recuperación muscular después del entrenamiento
   */
  async updateMuscleRecovery(userId: number, muscleGroups: string[], recoveryHours: number = 48): Promise<void> {
    const today = new Date();
    const nextAvailable = new Date();
    nextAvailable.setHours(nextAvailable.getHours() + recoveryHours);

    for (const muscle of muscleGroups) {
      await supabase
        .from('muscle_recovery')
        .upsert({
          user_id: userId,
          muscle_group: muscle,
          last_trained_date: today.toISOString().split('T')[0],
          recovery_status: 'recovering',
          next_available_date: nextAvailable.toISOString().split('T')[0],
          updated_at: new Date().toISOString()
        });
    }
  }

  /**
   * 🔄 Verificar si el mesociclo actual debe cambiar automáticamente
   */
  async checkMesocycleProgression(userId: number): Promise<{
    shouldChange: boolean;
    reason: string;
    currentMesocycle: WorkoutMesocycle | null;
    suggestedAction: string;
  }> {
    const activeMesocycle = await this.getActiveMesocycle(userId);

    if (!activeMesocycle) {
      return {
        shouldChange: true,
        reason: 'No hay mesociclo activo',
        currentMesocycle: null,
        suggestedAction: 'Crear primer mesociclo'
      };
    }

    const today = new Date();
    const endDate = new Date(activeMesocycle.end_date);
    const startDate = new Date(activeMesocycle.start_date);

    // Verificar si el mesociclo ha terminado
    if (today >= endDate) {
      return {
        shouldChange: true,
        reason: `Mesociclo completado (${activeMesocycle.duration_weeks} semanas)`,
        currentMesocycle: activeMesocycle,
        suggestedAction: 'Crear nuevo mesociclo con diferente split'
      };
    }

    // Verificar si está cerca del final (última semana)
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const elapsedDays = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const remainingDays = totalDays - elapsedDays;

    if (remainingDays <= 7 && remainingDays > 0) {
      return {
        shouldChange: false,
        reason: `Última semana del mesociclo (${remainingDays} días restantes)`,
        currentMesocycle: activeMesocycle,
        suggestedAction: 'Preparar transición al siguiente mesociclo'
      };
    }

    return {
      shouldChange: false,
      reason: `Mesociclo en progreso (semana ${Math.ceil(elapsedDays / 7)} de ${activeMesocycle.duration_weeks})`,
      currentMesocycle: activeMesocycle,
      suggestedAction: 'Continuar con mesociclo actual'
    };
  }

  /**
   * 🚨 FILTRAR SPLITS SEGÚN LIMITACIONES FÍSICAS
   * Evita recomendar splits que incluyan grupos musculares peligrosos para el usuario
   */
  private filterSplitsByLimitations(splits: ScientificSplit[], limitations: string[]): ScientificSplit[] {
    if (!limitations || limitations.length === 0) {
      return splits;
    }

    console.log('🚨 [ScientificWorkout] Filtering splits by limitations:', { limitations, totalSplits: splits.length });

    // Definir qué grupos musculares evitar según cada limitación
    const limitationFilters = {
      'knee_issues': ['legs', 'glutes', 'calves', 'quadriceps', 'hamstrings'],
      'back_problems': ['back', 'legs'],
      'shoulder_issues': ['shoulders', 'chest', 'arms'],
      'heart_condition': [], // Permitir todos pero con intensidad controlada
      'asthma': [], // Permitir todos pero con intensidad controlada
      'pregnancy': ['abs', 'back'],
      'wrist_problems': ['arms', 'chest'],
      'ankle_injury': ['legs', 'calves'],
      'hip_problems': ['legs', 'glutes']
    };

    // Recopilar todos los grupos musculares a evitar
    const muscleGroupsToAvoid = new Set<string>();
    for (const limitation of limitations) {
      const groupsToAvoid = limitationFilters[limitation as keyof typeof limitationFilters] || [];
      groupsToAvoid.forEach(group => muscleGroupsToAvoid.add(group.toLowerCase()));
    }

    console.log('🚨 [ScientificWorkout] Muscle groups to avoid:', Array.from(muscleGroupsToAvoid));

    // Filtrar splits que NO contengan grupos musculares peligrosos
    const safeSplits = splits.filter(split => {
      const splitMuscleGroups = split.muscle_groups.map(mg => mg.toLowerCase());

      // Verificar si algún grupo muscular del split está en la lista de evitar
      const hasConflict = splitMuscleGroups.some(mg =>
        Array.from(muscleGroupsToAvoid).some(avoid =>
          mg.includes(avoid) || avoid.includes(mg)
        )
      );

      if (hasConflict) {
        console.log(`🚨 [ScientificWorkout] Filtering out split "${split.split_name}" due to conflict with limitations`);
      }

      return !hasConflict;
    });

    console.log(`🚨 [ScientificWorkout] Filtered splits: ${safeSplits.length}/${splits.length} safe splits found`);

    return safeSplits;
  }

  /**
   * 🏥 GENERAR SPLITS ALTERNATIVOS INTELIGENTES
   * Crea splits seguros específicos para las limitaciones del usuario
   */
  private generateAlternativeSplits(limitations: string[]): ScientificSplit[] {
    console.log('🏥 [ScientificWorkout] Generating alternative splits for limitations:', limitations);

    const alternativeSplits: ScientificSplit[] = [];
    let splitId = 9000; // ID alto para evitar conflictos

    // Analizar limitaciones y crear splits apropiados
    const hasLowerBodyIssues = limitations.some(l =>
      ['knee_issues', 'ankle_injury', 'hip_problems'].includes(l)
    );

    const hasUpperBodyIssues = limitations.some(l =>
      ['shoulder_issues', 'wrist_problems'].includes(l)
    );

    const hasBackIssues = limitations.includes('back_problems');
    const isPregnant = limitations.includes('pregnancy');
    const hasCardiacIssues = limitations.some(l =>
      ['heart_condition', 'asthma'].includes(l)
    );

    // 🦵 Si tiene problemas de tren inferior → Splits de tren superior
    if (hasLowerBodyIssues && !hasUpperBodyIssues) {
      alternativeSplits.push({
        id: splitId++,
        split_name: "Upper Body Focus",
        split_type: "upper_body_focus" as any,
        muscle_groups: ["chest", "back", "shoulders", "arms", "biceps", "triceps"],
        recovery_time_hours: 48,
        scientific_rationale: "Split diseñado para usuarios con limitaciones en tren inferior. Permite entrenamiento completo del tren superior con máxima seguridad.",
        difficulty_level: "intermediate"
      });

      alternativeSplits.push({
        id: splitId++,
        split_name: "Torso Power",
        split_type: "torso_focus" as any,
        muscle_groups: ["chest", "back", "shoulders", "core"],
        recovery_time_hours: 48,
        scientific_rationale: "Enfoque en torso y core, evitando completamente el tren inferior. Ideal para mantener fuerza funcional.",
        difficulty_level: "beginner"
      });

      alternativeSplits.push({
        id: splitId++,
        split_name: "Arms & Back Specialist",
        split_type: "arms_back_focus" as any,
        muscle_groups: ["back", "biceps", "triceps", "forearms"],
        recovery_time_hours: 48,
        scientific_rationale: "Especialización en brazos y espalda, sin comprometer articulaciones del tren inferior.",
        difficulty_level: "intermediate"
      });
    }

    // 🤕 Si tiene problemas de tren superior → Splits de tren inferior
    if (hasUpperBodyIssues && !hasLowerBodyIssues && !hasBackIssues) {
      alternativeSplits.push({
        id: splitId++,
        split_name: "Lower Body Focus",
        split_type: "lower_body_focus" as any,
        muscle_groups: ["legs", "glutes", "calves", "quadriceps", "hamstrings"],
        recovery_time_hours: 72,
        scientific_rationale: "Split centrado en tren inferior para usuarios con limitaciones en hombros o brazos.",
        difficulty_level: "intermediate"
      });

      alternativeSplits.push({
        id: splitId++,
        split_name: "Core & Legs",
        split_type: "core_legs_focus" as any,
        muscle_groups: ["legs", "glutes", "core", "calves"],
        recovery_time_hours: 48,
        scientific_rationale: "Combinación de core y piernas, evitando movimientos que comprometan hombros o muñecas.",
        difficulty_level: "beginner"
      });
    }

    // 🤰 Si está embarazada → Split prenatal seguro
    if (isPregnant) {
      alternativeSplits.push({
        id: splitId++,
        split_name: "Prenatal Safe",
        split_type: "prenatal_safe" as any,
        muscle_groups: ["arms", "shoulders", "legs", "glutes"],
        recovery_time_hours: 24,
        scientific_rationale: "Split diseñado para embarazo, evitando ejercicios abdominales y de espalda riesgosos.",
        difficulty_level: "beginner"
      });
    }

    // 💓 Si tiene problemas cardíacos → Split de baja intensidad
    if (hasCardiacIssues) {
      alternativeSplits.push({
        id: splitId++,
        split_name: "Cardiac Safe",
        split_type: "cardiac_safe" as any,
        muscle_groups: ["arms", "legs", "chest", "back"],
        recovery_time_hours: 48,
        scientific_rationale: "Split de baja intensidad para usuarios con condiciones cardíacas.",
        difficulty_level: "beginner"
      });
    }

    // 🔄 Split universal para casos complejos
    if (alternativeSplits.length === 0 || limitations.length > 2) {
      alternativeSplits.push({
        id: splitId++,
        split_name: "Universal Safe",
        split_type: "universal_safe" as any,
        muscle_groups: ["arms", "shoulders"],
        recovery_time_hours: 24,
        scientific_rationale: "Split ultra-seguro para usuarios con múltiples limitaciones. Movimientos básicos y seguros.",
        difficulty_level: "beginner"
      });
    }

    console.log(`🏥 [ScientificWorkout] Generated ${alternativeSplits.length} alternative splits:`,
      alternativeSplits.map(s => s.split_name));

    return alternativeSplits;
  }

  /**
   * 🔄 Cambiar automáticamente al siguiente mesociclo
   */
  async autoProgressMesocycle(userId: number): Promise<{
    success: boolean;
    newMesocycle: WorkoutMesocycle | null;
    message: string;
  }> {
    const progressCheck = await this.checkMesocycleProgression(userId);

    if (!progressCheck.shouldChange) {
      return {
        success: false,
        newMesocycle: null,
        message: progressCheck.reason
      };
    }

    // Obtener preferencias del usuario para determinar el nuevo split
    const userPreferences = await supabaseStorage.getUserPreferences(userId);
    const weeklyFrequency = userPreferences?.weeklyFrequency || 3;

    // Determinar el siguiente split (rotar entre tipos)
    let newSplitType = '';
    const currentSplitType = progressCheck.currentMesocycle?.split_type;

    if (currentSplitType === 'body_part_split') {
      newSplitType = weeklyFrequency >= 4 ? 'push_pull_legs' : 'upper_lower';
    } else if (currentSplitType === 'push_pull_legs') {
      newSplitType = weeklyFrequency >= 4 ? 'body_part_split' : 'upper_lower';
    } else {
      newSplitType = weeklyFrequency >= 4 ? 'body_part_split' : 'push_pull_legs';
    }

    // Completar mesociclo anterior si existe
    if (progressCheck.currentMesocycle) {
      await supabase
        .from('workout_mesocycles')
        .update({ status: 'completed' })
        .eq('id', progressCheck.currentMesocycle.id);
    }

    // Crear nuevo mesociclo
    const newMesocycle = await this.createMesocycle(userId, newSplitType, 6);

    return {
      success: true,
      newMesocycle,
      message: `Nuevo mesociclo ${newSplitType} iniciado automáticamente`
    };
  }

  /**
   * 📊 Obtener estadísticas de progresión del usuario
   */
  async getUserProgressionStats(userId: number): Promise<{
    totalMesocycles: number;
    completedMesocycles: number;
    currentStreak: number;
    preferredSplitType: string;
    averageDuration: number;
  }> {
    const { data: mesocycles, error } = await supabase
      .from('workout_mesocycles')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user progression stats:', error);
      throw new Error('Failed to fetch progression stats');
    }

    const totalMesocycles = mesocycles?.length || 0;
    const completedMesocycles = mesocycles?.filter(m => m.status === 'completed').length || 0;

    // Calcular racha actual (mesociclos completados consecutivos)
    let currentStreak = 0;
    for (const mesocycle of mesocycles || []) {
      if (mesocycle.status === 'completed') {
        currentStreak++;
      } else {
        break;
      }
    }

    // Determinar split preferido
    const splitCounts: { [key: string]: number } = {};
    mesocycles?.forEach(m => {
      splitCounts[m.split_type] = (splitCounts[m.split_type] || 0) + 1;
    });

    const preferredSplitType = Object.keys(splitCounts).reduce((a, b) =>
      splitCounts[a] > splitCounts[b] ? a : b, 'body_part_split'
    );

    // Duración promedio
    const averageDuration = mesocycles?.length > 0
      ? mesocycles.reduce((sum, m) => sum + m.duration_weeks, 0) / mesocycles.length
      : 6;

    return {
      totalMesocycles,
      completedMesocycles,
      currentStreak,
      preferredSplitType,
      averageDuration: Math.round(averageDuration)
    };
  }
}

export const scientificWorkoutService = new ScientificWorkoutService();
