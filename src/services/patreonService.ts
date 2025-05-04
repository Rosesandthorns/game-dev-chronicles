
import { supabase } from "@/integrations/supabase/client";

/**
 * Initiates the OAuth flow to connect a user's Patreon account
 */
export const connectPatreon = () => {
  // We'll redirect to our edge function that handles the OAuth flow
  const redirectUrl = `${window.location.origin}/api/patreon/connect`;
  window.location.href = `https://fdnmhbiwbmrqejbevyjf.supabase.co/functions/v1/patreon-oauth?redirect_url=${encodeURIComponent(redirectUrl)}`;
};

/**
 * Checks if the current user has connected their Patreon account
 * @returns Promise with the connection status and tier information
 */
export const checkPatreonConnection = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { connected: false };
    }
    
    // Get user profile to check Patreon connection
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('patreon_tier, patreon_connected')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (error) throw error;
    
    return { 
      connected: Boolean(profile?.patreon_connected), 
      tier: profile?.patreon_tier || null
    };
  } catch (error) {
    console.error("Error checking Patreon connection:", error);
    return { connected: false, error };
  }
};

/**
 * Disconnects the user's Patreon account from their Community Portal account
 */
export const disconnectPatreon = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }
    
    const { error } = await supabase
      .from('profiles')
      .update({ 
        patreon_connected: false,
        patreon_tier: null 
      })
      .eq('user_id', user.id);
    
    if (error) throw error;
    
    return { success: true };
  } catch (error) {
    console.error("Error disconnecting Patreon:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "An unknown error occurred" 
    };
  }
};
