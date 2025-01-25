import { supabase } from './supabase';
import { GlossaryWord, WordRating } from '@/types/Glossary';

export async function getAllWords(): Promise<GlossaryWord[]> {
  try {
    const { data, error } = await supabase
      .from('glossary')
      .select('*')
      .order('word');

    if (error) {
      console.error('Error fetching words:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getAllWords:', error);
    return [];
  }
}

export async function getWordsByRating(rating: string): Promise<GlossaryWord[]> {
  try {
    const { data, error } = await supabase
      .from('glossary')
      .select('*')
      .eq('rating', rating)
      .order('word');

    if (error) {
      console.error('Error fetching words by rating:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getWordsByRating:', error);
    return [];
  }
}

export async function getClockWords(): Promise<GlossaryWord[]> {
  try {
    const { data, error } = await supabase
      .from('glossary')
      .select('*')
      .gte('grade', 4)  // Only words with grade 4 or higher
      .order('word');

    if (error) {
      console.error('Error fetching clock words:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getClockWords:', error);
    return [];
  }
}

export async function addUserWord(word: Omit<GlossaryWord, 'id' | 'created_at'>): Promise<GlossaryWord | null> {
  try {
    const { data, error } = await supabase
      .from('glossary')
      .insert([word])
      .select()
      .single();

    if (error) {
      console.error('Error adding word:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in addUserWord:', error);
    return null;
  }
}

export async function updateUserWord(id: string, updates: Partial<GlossaryWord>): Promise<GlossaryWord | null> {
  try {
    const { data, error } = await supabase
      .from('glossary')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating word:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in updateUserWord:', error);
    return null;
  }
}

export async function deleteUserWord(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('glossary')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting word:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteUserWord:', error);
    return false;
  }
}

export async function searchWords(query: string): Promise<GlossaryWord[]> {
  try {
    const { data, error } = await supabase
      .from('glossary')
      .select('*')
      .or(`word.ilike.%${query}%,definition.ilike.%${query}%`)
      .order('word');

    if (error) {
      console.error('Error searching words:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in searchWords:', error);
    return [];
  }
} 