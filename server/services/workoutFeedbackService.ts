import { supabase } from '../supabase';

interface PreWorkoutFeedbackData {
  energy: number;
  motivation: number;
  availableTime: number;
  limitations: string;
}

interface PostWorkoutFeedbackData {
  rpe: number;
  satisfaction: number;
  fatigue: number;
  progressFeeling: number;
  preferredExercises: string[];
  dislikedExercises: string[];
  notes: string;
}

interface SetFeedbackData {
  exerciseLogId: number;
  setRpe: number;
  completedAsPlanned: boolean;
  weightFeeling: 'too_light' | 'perfect' | 'too_heavy';
  notes?: string;
}

class WorkoutFeedbackService {
  /**
   * 🎯 Crear feedback pre-entrenamiento
   */
  async createPreWorkoutFeedback(
    userId: number,
    sessionId: number,
    feedbackData: PreWorkoutFeedbackData
  ) {
    console.log('📝 [WorkoutFeedback] Creating pre-workout feedback:', {
      userId,
      sessionId,
      feedbackData
    });

    try {
      // Verificar si ya existe feedback para esta sesión
      const { data: existing } = await supabase
        .from('workout_feedback_sessions')
        .select('id')
        .eq('session_id', sessionId)
        .single();

      if (existing) {
        // Actualizar feedback existente
        const { data, error } = await supabase
          .from('workout_feedback_sessions')
          .update({
            pre_energy: feedbackData.energy,
            pre_motivation: feedbackData.motivation,
            pre_available_time: feedbackData.availableTime,
            pre_limitations: feedbackData.limitations || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        console.log('✅ [WorkoutFeedback] Pre-workout feedback updated:', data);
        return data;
      } else {
        // Crear nuevo feedback
        const { data, error } = await supabase
          .from('workout_feedback_sessions')
          .insert({
            user_id: userId,
            session_id: sessionId,
            pre_energy: feedbackData.energy,
            pre_motivation: feedbackData.motivation,
            pre_available_time: feedbackData.availableTime,
            pre_limitations: feedbackData.limitations || null
          })
          .select()
          .single();

        if (error) throw error;
        console.log('✅ [WorkoutFeedback] Pre-workout feedback created:', data);
        return data;
      }
    } catch (error) {
      console.error('❌ [WorkoutFeedback] Error creating pre-workout feedback:', error);
      throw error;
    }
  }

  /**
   * 🎯 Crear feedback post-entrenamiento
   */
  async createPostWorkoutFeedback(
    sessionId: number,
    feedbackData: PostWorkoutFeedbackData
  ) {
    console.log('📝 [WorkoutFeedback] Creating post-workout feedback:', {
      sessionId,
      feedbackData
    });

    try {
      // 🔍 Primero verificar si existe un registro para esta sesión
      const { data: existing } = await supabase
        .from('workout_feedback_sessions')
        .select('id, user_id')
        .eq('session_id', sessionId)
        .single();

      if (existing) {
        // ✅ Actualizar registro existente
        console.log('📝 [WorkoutFeedback] Updating existing feedback record:', existing.id);
        const { data, error } = await supabase
          .from('workout_feedback_sessions')
          .update({
            post_rpe: feedbackData.rpe,
            post_satisfaction: feedbackData.satisfaction,
            post_fatigue: feedbackData.fatigue,
            post_progress_feeling: feedbackData.progressFeeling,
            preferred_exercises: feedbackData.preferredExercises,
            disliked_exercises: feedbackData.dislikedExercises,
            notes: feedbackData.notes || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        console.log('✅ [WorkoutFeedback] Post-workout feedback updated:', data);
        return data;
      } else {
        // 🆕 Crear nuevo registro (necesitamos obtener user_id de la sesión)
        console.log('📝 [WorkoutFeedback] No existing feedback record, creating new one...');

        // Obtener user_id de la sesión de workout
        const { data: session, error: sessionError } = await supabase
          .from('workout_sessions')
          .select('user_id')
          .eq('id', sessionId)
          .single();

        if (sessionError) {
          console.error('❌ [WorkoutFeedback] Error getting session data:', sessionError);
          throw new Error(`Session ${sessionId} not found: ${sessionError.message}`);
        }

        if (!session) {
          throw new Error(`Session ${sessionId} not found`);
        }

        // Crear nuevo registro de feedback
        const { data, error } = await supabase
          .from('workout_feedback_sessions')
          .insert({
            user_id: session.user_id,
            session_id: sessionId,
            post_rpe: feedbackData.rpe,
            post_satisfaction: feedbackData.satisfaction,
            post_fatigue: feedbackData.fatigue,
            post_progress_feeling: feedbackData.progressFeeling,
            preferred_exercises: feedbackData.preferredExercises,
            disliked_exercises: feedbackData.dislikedExercises,
            notes: feedbackData.notes || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) throw error;
        console.log('✅ [WorkoutFeedback] Post-workout feedback created:', data);
        return data;
      }
    } catch (error) {
      console.error('❌ [WorkoutFeedback] Error creating post-workout feedback:', error);
      throw error;
    }
  }

  /**
   * 🎯 Crear feedback de set individual
   */
  async createSetFeedback(feedbackData: SetFeedbackData) {
    console.log('📝 [WorkoutFeedback] Creating set feedback:', feedbackData);

    try {
      // Verificar si ya existe feedback para este exercise log
      const { data: existing } = await supabase
        .from('exercise_set_feedback')
        .select('id')
        .eq('exercise_log_id', feedbackData.exerciseLogId)
        .single();

      if (existing) {
        // Actualizar feedback existente
        const { data, error } = await supabase
          .from('exercise_set_feedback')
          .update({
            set_rpe: feedbackData.setRpe,
            completed_as_planned: feedbackData.completedAsPlanned,
            weight_feeling: feedbackData.weightFeeling,
            notes: feedbackData.notes || null
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        console.log('✅ [WorkoutFeedback] Set feedback updated:', data);
        return data;
      } else {
        // Crear nuevo feedback
        const { data, error } = await supabase
          .from('exercise_set_feedback')
          .insert({
            exercise_log_id: feedbackData.exerciseLogId,
            set_rpe: feedbackData.setRpe,
            completed_as_planned: feedbackData.completedAsPlanned,
            weight_feeling: feedbackData.weightFeeling,
            notes: feedbackData.notes || null
          })
          .select()
          .single();

        if (error) throw error;
        console.log('✅ [WorkoutFeedback] Set feedback created:', data);
        return data;
      }
    } catch (error) {
      console.error('❌ [WorkoutFeedback] Error creating set feedback:', error);
      throw error;
    }
  }

  /**
   * 📊 Obtener feedback de una sesión
   */
  async getSessionFeedback(sessionId: number) {
    console.log('📊 [WorkoutFeedback] Getting session feedback:', sessionId);

    try {
      const { data, error } = await supabase
        .from('workout_feedback_sessions')
        .select('*')
        .eq('session_id', sessionId)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows found
      console.log('✅ [WorkoutFeedback] Session feedback retrieved:', data);
      return data;
    } catch (error) {
      console.error('❌ [WorkoutFeedback] Error getting session feedback:', error);
      throw error;
    }
  }

  /**
   * 📊 Obtener feedback de usuario en un rango de fechas
   */
  async getUserFeedbackInRange(userId: number, startDate: string, endDate: string) {
    console.log('📊 [WorkoutFeedback] Getting user feedback in range:', {
      userId,
      startDate,
      endDate
    });

    try {
      const { data, error } = await supabase
        .from('workout_feedback_sessions')
        .select(`
          *,
          workout_sessions!inner(
            started_at,
            completed_at,
            workout_plans(name)
          )
        `)
        .eq('user_id', userId)
        .gte('workout_sessions.started_at', startDate)
        .lte('workout_sessions.started_at', endDate)
        .order('workout_sessions.started_at', { ascending: false });

      if (error) throw error;
      console.log('✅ [WorkoutFeedback] User feedback retrieved:', data?.length, 'records');
      return data || [];
    } catch (error) {
      console.error('❌ [WorkoutFeedback] Error getting user feedback:', error);
      throw error;
    }
  }

  /**
   * 📈 Calcular métricas promedio de feedback
   */
  async calculateAverageMetrics(userId: number, days: number = 30) {
    console.log('📈 [WorkoutFeedback] Calculating average metrics:', { userId, days });

    try {
      const endDate = new Date().toISOString();
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

      const feedbackData = await this.getUserFeedbackInRange(userId, startDate, endDate);

      if (!feedbackData.length) {
        return {
          avgRpe: null,
          avgSatisfaction: null,
          avgFatigue: null,
          avgEnergy: null,
          avgMotivation: null,
          totalSessions: 0
        };
      }

      const validSessions = feedbackData.filter(f => 
        f.post_rpe !== null || f.pre_energy !== null
      );

      const metrics = {
        avgRpe: this.calculateAverage(validSessions.map(f => f.post_rpe).filter(Boolean)),
        avgSatisfaction: this.calculateAverage(validSessions.map(f => f.post_satisfaction).filter(Boolean)),
        avgFatigue: this.calculateAverage(validSessions.map(f => f.post_fatigue).filter(Boolean)),
        avgEnergy: this.calculateAverage(validSessions.map(f => f.pre_energy).filter(Boolean)),
        avgMotivation: this.calculateAverage(validSessions.map(f => f.pre_motivation).filter(Boolean)),
        totalSessions: validSessions.length
      };

      console.log('✅ [WorkoutFeedback] Average metrics calculated:', metrics);
      return metrics;
    } catch (error) {
      console.error('❌ [WorkoutFeedback] Error calculating metrics:', error);
      throw error;
    }
  }

  /**
   * 🔧 Helper: Calcular promedio
   */
  private calculateAverage(values: number[]): number | null {
    if (!values.length) return null;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }
}

export const workoutFeedbackService = new WorkoutFeedbackService();
