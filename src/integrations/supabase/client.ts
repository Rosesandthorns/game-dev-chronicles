
// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://fdnmhbiwbmrqejbevyjf.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkbm1oYml3Ym1ycWVqYmV2eWpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU5ODY0MzcsImV4cCI6MjA2MTU2MjQzN30.UmGUQoixXlC7vyWrXQvN-rm0bwlINUCExc-wQB_mgZY";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
