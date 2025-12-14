
import { createClient } from '@supabase/supabase-js';

// Direct configuration to bypass environment variable loading issues
const supabaseUrl = 'https://qpcwafekbnhioojlzrux.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwY3dhZmVrYm5oaW9vamx6cnV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3MjY5MTYsImV4cCI6MjA4MTMwMjkxNn0.OecRvPHTv8PQAw4Y7zOH73wByz352lUnRHDxoqexID8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
