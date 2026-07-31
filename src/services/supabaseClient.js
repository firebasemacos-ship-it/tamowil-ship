import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://sxbyyxexufcyannkwthh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4Ynl5eGV4dWZjeWFubmt3dGhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM3NzUyMzcsImV4cCI6MjA5OTM1MTIzN30.OpKtNPBUvexB9S9CExOHYz6xOjvRHxikQadSnDm5Lr4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
