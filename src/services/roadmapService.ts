
import { supabase } from "@/integrations/supabase/client";

export const updateFundingAmount = async (amount: number) => {
  try {
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
