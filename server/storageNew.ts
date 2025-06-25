import { SupabaseStorage } from './supabaseStorage';
import { testSupabaseConnection } from './supabase';

// Initialize Supabase storage
const supabaseStorage = new SupabaseStorage();

// Test connection on startup
testSupabaseConnection().then(connected => {
  if (connected) {
    console.log('🚀 Supabase storage initialized successfully');
  } else {
    console.error('❌ Failed to initialize Supabase storage');
  }
});

// Export the storage instance
export const storage = supabaseStorage;

// Export specific methods for easier access
export const {
  // Profile Photos
  getProfilePhoto,
  createOrUpdateProfilePhoto,
  deleteProfilePhoto,

  // Notifications
  getNotifications,
  createNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getUnreadNotificationCount,
} = storage;
