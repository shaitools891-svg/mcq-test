/**
 * PaperKnife - The Swiss Army Knife for PDFs
 * Copyright (C) 2026 potatameister
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { STORAGE_KEY } from './routineStorage';

/**
 * Export app data to a JSON file
 * Works on both Web and Android platforms
 */
export const exportBackup = async (): Promise<{ success: boolean; filePath?: string; error?: string }> => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      return { success: false, error: 'No data to export' };
    }

    const fileName = `paperknife-backup-${new Date().toISOString().split('T')[0]}.json`;

    if (Capacitor.isNativePlatform()) {
      // For Android, use the Filesystem API to save to Documents folder
      const base64Data = btoa(data);

      // Resolve duplicate filenames
      let finalName = fileName;
      let counter = 1;
      const baseName = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
      const extension = fileName.substring(fileName.lastIndexOf('.'));

      while (true) {
        try {
          await Filesystem.stat({
            path: finalName,
            directory: Directory.Documents
          });
          // If stat succeeds, file exists
          finalName = `${baseName} (${counter})${extension}`;
          counter++;
        } catch (e) {
          // If stat fails, file doesn't exist, we can use this name
          break;
        }
      }

      await Filesystem.writeFile({
        path: finalName,
        data: base64Data,
        directory: Directory.Documents,
        recursive: true
      });

      return { success: true, filePath: finalName };
    } else {
      // Standard Web Download
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      return { success: true };
    }
  } catch (error) {
    console.error('Export failed:', error);
    return { success: false, error: String(error) };
  }
};

/**
 * Share app data as a JSON file
 * Works on both Web and Android platforms
 */
export const shareBackup = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      return { success: false, error: 'No data to share' };
    }

    const fileName = `paperknife-backup-${new Date().toISOString().split('T')[0]}.json`;

    if (Capacitor.isNativePlatform()) {
      // For Android, save to Cache directory first, then share
      const base64Data = btoa(data);
      const cachePath = `${Date.now()}_${fileName}`;

      await Filesystem.writeFile({
        path: cachePath,
        data: base64Data,
        directory: Directory.Cache,
        recursive: true
      });

      const fileUri = await Filesystem.getUri({
        path: cachePath,
        directory: Directory.Cache
      });

      await Share.share({
        title: fileName,
        text: `Shared via PaperKnife`,
        url: fileUri.uri,
        dialogTitle: 'Share Backup'
      });

      return { success: true };
    } else {
      // Web Share API
      const blob = new Blob([data], { type: 'application/json' });
      const file = new File([blob], fileName, { type: 'application/json' });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: fileName,
            text: 'Shared via PaperKnife'
          });
          return { success: true };
        } catch (e) {
          console.error('Web share failed, falling back to export');
        }
      }

      // Fallback to download if sharing is not supported
      return await exportBackup();
    }
  } catch (error) {
    console.error('Share failed:', error);
    return { success: false, error: String(error) };
  }
};

/**
 * Import app data from a JSON file string
 * @param jsonString The JSON string to import
 * @returns Success status
 */
export const importBackup = (jsonString: string): { success: boolean; error?: string } => {
  try {
    const data = JSON.parse(jsonString);

    // Validate the data structure
    if (!data.students || !data.teachers || !data.schedule) {
      return { success: false, error: 'Invalid backup file format' };
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return { success: true };
  } catch (error) {
    console.error('Import failed:', error);
    return { success: false, error: String(error) };
  }
};

/**
 * Import app data from a content URI (Android)
 * Used when receiving a shared file
 * @param uri The content URI of the file
 * @returns Success status
 */
export const importBackupFromUri = async (uri: string): Promise<{ success: boolean; error?: string }> => {
  if (!Capacitor.isNativePlatform()) {
    return { success: false, error: 'This feature is only available on Android' };
  }

  try {
    // Read the file from the content URI
    const result = await Filesystem.readFile({
      path: uri,
      encoding: Encoding.UTF8
    });

    return importBackup(result.data as string);
  } catch (error) {
    console.error('Import from URI failed:', error);
    return { success: false, error: String(error) };
  }
};
