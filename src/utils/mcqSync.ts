/**
 * Privacy-Focused MCQ Sync Module
 * 
 * This module provides anonymous syncing of MCQ test results to Supabase.
 * Privacy features:
 * - Uses hashed anonymous IDs instead of user names
 * - No PII (Personally Identifiable Information) stored
 * - Only stores: score, timestamp, hashed anonymous ID
 * - User can opt-out by not selecting sync
 */

import { createClient } from '@supabase/supabase-js';

// Privacy-focused Supabase project for MCQ results
const MCQ_SUPABASE_URL = 'https://tqtcsoxlxeauwcfkuglk.supabase.co';
const MCQ_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxdGNzb3hseGVhdXdjZmt1Z2xrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0NDgxMTksImV4cCI6MjA4ODAyNDExOX0.h2XXgxOXrT_-jReC3YbY10A1JuhXID4KrEWc-tssmO4';

const mcqSupabase = createClient(MCQ_SUPABASE_URL, MCQ_SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Simple hash function for privacy - creates a one-way hash of the ID
// This ensures the actual anonymous ID is never stored in plain text
const hashString = async (input: string): Promise<string> => {
  // Use Web Crypto API for secure hashing
  const encoder = new TextEncoder();
  const data = encoder.encode(input + 'mcq_salt_2024'); // Add salt for extra security
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return 'hashed_' + hashHex.substring(0, 16); // Use first 16 chars for shorter ID
};

// Generate a random anonymous ID for this device/profile and hash it
const generateHashedId = async (): Promise<string> => {
  const storedHashed = localStorage.getItem('mcq_hashed_id');
  if (storedHashed) return storedHashed;
  
  // Generate random device identifier
  const randomId = 'device_' + Math.random().toString(36).substring(2, 15) + 
                   Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
  
  // Hash it for privacy
  const hashed = await hashString(randomId);
  localStorage.setItem('mcq_hashed_id', hashed);
  return hashed;
};

export interface AnonymousTestResult {
  id?: number;
  anonymous_id: string;
  score: number;
  total: number;
  percentage: number;
  timestamp: string;
  synced: boolean;
}

// Get the hashed anonymous ID for this user
export const getAnonymousId = async (): Promise<string> => {
  return await generateHashedId();
};

// Save result to Supabase (with hashed ID for privacy)
export const syncResultToCloud = async (result: {
  score: number;
  total: number;
  percentage: number;
}): Promise<boolean> => {
  try {
    const hashedId = await getAnonymousId();
    
    const { error } = await mcqSupabase
      .from('mcq_results')
      .insert({
        anonymous_id: hashedId,
        score: result.score,
        total: result.total,
        percentage: result.percentage,
        timestamp: new Date().toISOString(),
        synced: true
      });

    if (error) {
      console.error('[MCQ Sync] Error saving result:', error);
      return false;
    }
    
    console.log('[MCQ Sync] Result synced successfully (hashed)');
    return true;
  } catch (error) {
    console.error('[MCQ Sync] Exception:', error);
    return false;
  }
};

// Get all results for this anonymous user (by hashed ID)
export const getSyncedResults = async (): Promise<AnonymousTestResult[]> => {
  try {
    const hashedId = await getAnonymousId();
    
    const { data, error } = await mcqSupabase
      .from('mcq_results')
      .select('*')
      .eq('anonymous_id', hashedId)
      .order('timestamp', { ascending: false })
      .limit(50);

    if (error) {
      console.error('[MCQ Sync] Error fetching results:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('[MCQ Sync] Exception:', error);
    return [];
  }
};

// Admin: Get ALL results (anonymized) for all users
export const getAllAnonymousResults = async (): Promise<AnonymousTestResult[]> => {
  try {
    const { data, error } = await mcqSupabase
      .from('mcq_results')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(500);

    if (error) {
      console.error('[MCQ Sync] Error fetching all results:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('[MCQ Sync] Exception:', error);
    return [];
  }
};

// Get aggregate statistics (no individual data)
export const getAggregateStats = async (): Promise<{
  totalTests: number;
  averageScore: number;
  uniqueUsers: number;
}> => {
  try {
    const { data, error } = await mcqSupabase
      .from('mcq_results')
      .select('percentage, anonymous_id');

    if (error) {
      console.error('[MCQ Sync] Error fetching stats:', error);
      return { totalTests: 0, averageScore: 0, uniqueUsers: 0 };
    }
    
    if (!data || data.length === 0) {
      return { totalTests: 0, averageScore: 0, uniqueUsers: 0 };
    }

    const uniqueIds = new Set(data.map((d: { anonymous_id: string }) => d.anonymous_id));
    const avgScore = Math.round(
      data.reduce((sum: number, d: { percentage: number }) => sum + d.percentage, 0) / data.length
    );

    return {
      totalTests: data.length,
      averageScore: avgScore,
      uniqueUsers: uniqueIds.size
    };
  } catch (error) {
    console.error('[MCQ Sync] Exception:', error);
    return { totalTests: 0, averageScore: 0, uniqueUsers: 0 };
  }
};

// Privacy: Clear all local data
export const clearLocalMCQData = (): void => {
  localStorage.removeItem('mcq_hashed_id');
  // Keep the profile, but clear sync data
};

// Privacy: Delete user's data from cloud
export const deleteUserCloudData = async (): Promise<boolean> => {
  try {
    const hashedId = await getAnonymousId();
    
    const { error } = await mcqSupabase
      .from('mcq_results')
      .delete()
      .eq('anonymous_id', hashedId);

    if (error) {
      console.error('[MCQ Sync] Error deleting data:', error);
      return false;
    }
    
    // Also clear local ID
    clearLocalMCQData();
    return true;
  } catch (error) {
    console.error('[MCQ Sync] Exception:', error);
    return false;
  }
};
