import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://eyaeohoyskehzhjorxol.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5YWVvaG95c2tlaHpoam9yeG9sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3MzM1NjksImV4cCI6MjA4NzMwOTU2OX0.b283inQJvB6tX1DmW-zT1OigywtW4xhkQTB92WWDZfo'

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// MCQ Results table operations
interface MCQResult {
  id?: number;
  anonymous_id: string;
  score: number;
  total: number;
  percentage: number;
  timestamp: string;
  synced: boolean;
}

// Save MCQ result to Supabase
export async function saveMCQResult(result: {
  profileId: string;
  score: number;
  total: number;
  percentage: number;
  answers: number[];
}): Promise<boolean> {
  try {
    console.log('Saving MCQ result to Supabase:', result);
    
    const { data, error } = await supabase
      .from('mcq_results')
      .insert({
        anonymous_id: result.profileId,
        score: result.score,
        total: result.total,
        percentage: result.percentage,
        timestamp: new Date().toISOString(),
        synced: true
      })
      .select()
    
    if (error) {
      console.error('Supabase MCQ save error:', JSON.stringify(error));
      return false;
    }
    
    console.log('MCQ result saved successfully:', data);
    return true;
  } catch (error: any) {
    console.error('MCQ save failed:', error?.message || error);
    return false;
  }
}

// Load all MCQ results for a profile
export async function loadMCQResults(profileId: string): Promise<MCQResult[]> {
  try {
    const { data, error } = await supabase
      .from('mcq_results')
      .select('*')
      .eq('anonymous_id', profileId)
      .order('timestamp', { ascending: false })
    
    if (error) {
      console.error('Supabase MCQ load error:', JSON.stringify(error));
      return [];
    }
    
    return data || [];
  } catch (error: any) {
    console.error('MCQ load failed:', error?.message || error);
    return [];
  }
}

// Load all MCQ results (for admin)
export async function loadAllMCQResults(): Promise<MCQResult[]> {
  try {
    const { data, error } = await supabase
      .from('mcq_results')
      .select('*')
      .order('timestamp', { ascending: false })
    
    if (error) {
      console.error('Supabase MCQ load all error:', JSON.stringify(error));
      return [];
    }
    
    return data || [];
  } catch (error: any) {
    console.error('MCQ load all failed:', error?.message || error);
    return [];
  }
}

// Sync keys for different data types
export const SYNC_KEYS = {
  SCHEDULE: 'class_schedule',
  TEACHERS: 'teachers',
  STUDENTS: 'students',
  SETTINGS: 'settings',
  APP_VERSION: 'app_version'
}

// Current app version
export const APP_VERSION = '1.0.10'

// Get latest app version info from cloud
export async function getLatestVersion(): Promise<{ version: string; downloadUrl: string } | null> {
  try {
    const { data, error } = await supabase
      .from('app_data')
      .select('data')
      .eq('id', SYNC_KEYS.APP_VERSION)
      .single()
    
    if (error || !data?.data) {
      return null
    }
    return data.data as { version: string; downloadUrl: string }
  } catch (error) {
    console.error('Failed to get version info:', error)
    return null
  }
}

// Save data to Supabase
export async function syncSave(key: string, data: any): Promise<boolean> {
  try {
    console.log('Attempting to save to Supabase:', key)
    
    // Try with a simple fetch first to test connectivity
    const testResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    })
    
    console.log('Test connectivity result:', testResponse.status)
    
    const { data: result, error } = await supabase
      .from('app_data')
      .upsert({ 
        id: key, 
        data: data,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' })
      .select()
    
    if (error) {
      console.error('Supabase save error:', JSON.stringify(error))
      return false
    }
    console.log('Supabase save result:', result)
    return true
  } catch (error: any) {
    console.error('Sync save failed:', error?.message || error)
    return false
  }
}

// Load data from Supabase
export async function syncLoad(key: string): Promise<any | null> {
  try {
    const { data, error } = await supabase
      .from('app_data')
      .select('data')
      .eq('id', key)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        // No record found
        return null
      }
      console.error('Supabase load error:', JSON.stringify(error))
      return null
    }
    return data?.data ?? null
  } catch (error: any) {
    console.error('Sync load failed:', error?.message || error)
    return null
  }
}

// Enable real-time subscription for a key
export function subscribeToChanges(key: string, callback: (payload: any) => void) {
  const channel = supabase
    .channel(`sync:${key}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'app_data', filter: `id=eq.${key}` }, callback)
    .subscribe()
  
  // Return unsubscribe function
  return () => {
    supabase.removeChannel(channel)
  }
}
