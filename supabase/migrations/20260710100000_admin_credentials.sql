-- supabase/migrations/20260710100000_admin_credentials.sql

-- Insert admin credentials into the settings table
INSERT INTO public.settings (key, value) 
VALUES 
    ('admin_username', 'gueylo'),
    ('admin_pass', 'mubarak')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
