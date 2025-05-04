
import { supabase } from "@/integrations/supabase/client";

export type Question = {
  id: string;
  user_id: string;
  question: string;
  answer: string | null;
  created_at: string;
  answered_at: string | null;
};

export const fetchQuestionsAdmin = async () => {
  try {
    const { data, error } = await supabase
      .from('qna_questions')
      .select(`
        *,
        profiles(username)
      `)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching questions:', error);
    return [];
  }
};

export const answerQuestion = async (questionId: string, answer: string) => {
  try {
    const { data, error } = await supabase
      .from('qna_questions')
      .update({
        answer,
        answered_at: new Date().toISOString()
      })
      .eq('id', questionId)
      .select()
      .single();
    
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error answering question:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unknown error occurred' 
    };
  }
};

export const deleteQuestion = async (questionId: string) => {
  try {
    const { error } = await supabase
      .from('qna_questions')
      .delete()
      .eq('id', questionId);
    
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error deleting question:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unknown error occurred' 
    };
  }
};
