-- Migration: Add Profile Photos and Notifications tables
-- Date: 2024-01-XX
-- Description: Adds support for profile photos and comprehensive notification system

-- 📸 Profile Photos Table
CREATE TABLE IF NOT EXISTS profile_photos (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size INTEGER, -- in bytes
    mime_type TEXT NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster user lookups
CREATE INDEX IF NOT EXISTS idx_profile_photos_user_id ON profile_photos(user_id);

-- 🔔 Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'workout', 'nutrition', 'progress', 'ai_trainer', 'system'
    category TEXT NOT NULL, -- 'reminder', 'achievement', 'update', 'alert'
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    icon TEXT, -- emoji or icon name
    action_url TEXT, -- optional deep link
    action_label TEXT, -- optional action button text
    priority TEXT DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
    is_read BOOLEAN DEFAULT FALSE,
    is_archived BOOLEAN DEFAULT FALSE,
    metadata JSONB, -- additional data for the notification
    expires_at TIMESTAMP WITH TIME ZONE, -- optional expiration
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_is_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_created_at ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications(priority);
CREATE INDEX IF NOT EXISTS idx_notifications_expires_at ON notifications(expires_at) WHERE expires_at IS NOT NULL;

-- Add constraints
ALTER TABLE notifications ADD CONSTRAINT chk_notification_type 
    CHECK (type IN ('workout', 'nutrition', 'progress', 'ai_trainer', 'system'));

ALTER TABLE notifications ADD CONSTRAINT chk_notification_category 
    CHECK (category IN ('reminder', 'achievement', 'update', 'alert'));

ALTER TABLE notifications ADD CONSTRAINT chk_notification_priority 
    CHECK (priority IN ('low', 'normal', 'high', 'urgent'));

-- Function to automatically update updated_at timestamp for profile_photos
CREATE OR REPLACE FUNCTION update_profile_photos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER trigger_update_profile_photos_updated_at
    BEFORE UPDATE ON profile_photos
    FOR EACH ROW
    EXECUTE FUNCTION update_profile_photos_updated_at();

-- Function to automatically set read_at when is_read is set to true
CREATE OR REPLACE FUNCTION update_notification_read_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_read = TRUE AND OLD.is_read = FALSE THEN
        NEW.read_at = NOW();
    ELSIF NEW.is_read = FALSE THEN
        NEW.read_at = NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update read_at
CREATE TRIGGER trigger_update_notification_read_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_notification_read_at();

-- Function to clean up expired notifications (to be called by a cron job)
CREATE OR REPLACE FUNCTION cleanup_expired_notifications()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM notifications 
    WHERE expires_at IS NOT NULL 
    AND expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Insert some sample notifications for testing (optional)
-- These will be created by the application, but here are examples:

/*
INSERT INTO notifications (user_id, type, category, title, message, icon, priority) VALUES
(1, 'system', 'update', '¡Bienvenido a Fitbro! 🎉', 'Estamos emocionados de acompañarte en tu viaje fitness.', '🎉', 'high'),
(1, 'workout', 'reminder', '¡Hora de entrenar! 💪', 'No olvides completar tu rutina de hoy.', '🏋️', 'normal'),
(1, 'nutrition', 'achievement', '¡Meta de hidratación alcanzada! 💧', 'Has completado tu objetivo diario de agua.', '💧', 'normal');
*/

-- Comments for documentation
COMMENT ON TABLE profile_photos IS 'Stores user profile photos with metadata';
COMMENT ON TABLE notifications IS 'Comprehensive notification system for user engagement';

COMMENT ON COLUMN profile_photos.user_id IS 'Reference to the user who owns this photo';
COMMENT ON COLUMN profile_photos.photo_url IS 'URL path to the uploaded photo file';
COMMENT ON COLUMN profile_photos.file_name IS 'Original filename of the uploaded photo';
COMMENT ON COLUMN profile_photos.file_size IS 'Size of the photo file in bytes';
COMMENT ON COLUMN profile_photos.mime_type IS 'MIME type of the photo (image/jpeg, image/png, etc.)';

COMMENT ON COLUMN notifications.user_id IS 'Reference to the user who should receive this notification';
COMMENT ON COLUMN notifications.type IS 'Type of notification: workout, nutrition, progress, ai_trainer, system';
COMMENT ON COLUMN notifications.category IS 'Category: reminder, achievement, update, alert';
COMMENT ON COLUMN notifications.title IS 'Short title for the notification';
COMMENT ON COLUMN notifications.message IS 'Detailed message content';
COMMENT ON COLUMN notifications.icon IS 'Emoji or icon identifier for visual representation';
COMMENT ON COLUMN notifications.action_url IS 'Optional URL to navigate to when notification is clicked';
COMMENT ON COLUMN notifications.action_label IS 'Optional label for the action button';
COMMENT ON COLUMN notifications.priority IS 'Priority level: low, normal, high, urgent';
COMMENT ON COLUMN notifications.metadata IS 'Additional JSON data for the notification';
COMMENT ON COLUMN notifications.expires_at IS 'Optional expiration timestamp for temporary notifications';

-- Grant permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON profile_photos TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON notifications TO your_app_user;
-- GRANT USAGE ON SEQUENCE profile_photos_id_seq TO your_app_user;
-- GRANT USAGE ON SEQUENCE notifications_id_seq TO your_app_user;
