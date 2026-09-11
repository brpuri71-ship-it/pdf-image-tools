import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';

export interface SaveFileResult {
  uri: string;
  path: string;
}

export class FileService {
  /**
   * Save a blob file to the device's Documents directory
   */
  static async saveFile(filename: string, data: Blob, mimeType?: string): Promise<SaveFileResult> {
    try {
      const timestamp = new Date().getTime();
      const ext = this.getFileExtension(mimeType || data.type);
      const baseName = filename.replace(/\.[^/.]+$/, '');
      const uniqueFilename = `${baseName}_${timestamp}.${ext}`;

      // Convert blob to base64
      const base64Data = await this.blobToBase64(data);

      // Write file to Documents directory
      const result = await Filesystem.writeFile({
        path: uniqueFilename,
        data: base64Data,
        directory: Directory.Documents,
      });

      return {
        uri: result.uri,
        path: uniqueFilename
      };
    } catch (error) {
      console.error('Error saving file:', error);
      throw new Error(`Failed to save file: ${(error as Error).message}`);
    }
  }

  /**
   * Share a file using Capacitor Share
   */
  static async shareFile(filePath: string, title: string, text?: string): Promise<void> {
    try {
      const shareOptions: any = {
        title: title,
        text: text || title,
        url: filePath,
      };

      await Share.share(shareOptions);
    } catch (error) {
      console.error('Error sharing file:', error);
      throw new Error(`Failed to share file: ${(error as Error).message}`);
    }
  }

  /**
   * Convert a Blob to base64 string (without data URL prefix)
   */
  static async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64 = result.split(',')[1] || result;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Get file extension from MIME type
   */
  static getFileExtension(mimeType: string): string {
    const mimeToExt: Record<string, string> = {
      'application/pdf': 'pdf',
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
      'text/plain': 'txt',
    };
    return mimeToExt[mimeType.toLowerCase()] || 'bin';
  }

  /**
   * Get the Documents directory URI
   */
  static async getDocumentsPath(): Promise<string> {
    try {
      const result = await Filesystem.getUri({
        path: '',
        directory: Directory.Documents,
      });
      return result.uri;
    } catch (error) {
      console.error('Error getting documents path:', error);
      throw new Error(`Failed to get documents path: ${(error as Error).message}`);
    }
  }
}
