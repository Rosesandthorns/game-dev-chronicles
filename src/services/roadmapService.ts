
import { supabase } from "@/integrations/supabase/client";

export const updateFundingAmount = async (amount: number) => {
  try {
    // First check if the user is an admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
      .single();
    
    if (profileError) throw new Error("Failed to verify user role");
    
    // If the user is not an admin, don't allow the update
    if (profile.role !== 'admin') {
      return { 
        success: false, 
        error: "Only administrators can update funding amounts" 
      };
    }
    
    // Proceed with the update if user is admin
    const { data, error } = await supabase
      .from('roadmap')
      .update({ current_funding: amount })
      .eq('id', 1)
      .select()
      .single();
    
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error updating funding amount:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unknown error occurred' 
    };
  }
};

export const getFundingAmount = async () => {
  try {
    const { data, error } = await supabase
      .from('roadmap')
      .select('current_funding')
      .single();
    
    if (error) throw error;
    return { 
      success: true, 
      amount: data.current_funding 
    };
  } catch (error) {
    console.error('Error fetching funding amount:', error);
    return { 
      success: false, 
      amount: 0,
      error: error instanceof Error ? error.message : 'An unknown error occurred' 
    };
  }
};
