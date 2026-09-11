import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

/**
 * Converts a Blob to a Base64 string.
 */
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Saves a file to the device's Documents/Downloads directory.
 */
export async function saveToPhone(blob: Blob, fileName: string) {
  if (Capacitor.isNativePlatform()) {
    try {
      const base64Data = await blobToBase64(blob);

      // On Android, we try to save to Documents which is visible to the user.
      const result = await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Documents,
        recursive: true
      });

      alert(`File saved to Documents: ${fileName}`);
      return result.uri;
    } catch (error) {
      console.error('Error saving file:', error);
      alert('Failed to save file. Please check permissions.');
      throw error;
    }
  } else {
    // Web fallback
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

/**
 * Opens the native share sheet for the given file.
 */
export async function shareFile(blob: Blob, fileName: string) {
  if (Capacitor.isNativePlatform()) {
    try {
      const base64Data = await blobToBase64(blob);

      // Share requires the file to be on disk first
      const result = await Filesystem.writeFile({
        path: `share_${fileName}`,
        data: base64Data,
        directory: Directory.Cache
      });

      await Share.share({
        title: fileName,
        text: 'Sharing your file from PDF & Image Tools',
        url: result.uri,
        dialogTitle: 'Share File',
      });
    } catch (error) {
      console.error('Error sharing file:', error);
      alert('Failed to share file.');
      throw error;
    }
  } else {
    // Web fallback for sharing
    const file = new File([blob], fileName, { type: blob.type });
    if (navigator.share) {
      try {
        await navigator.share({
          files: [file],
          title: fileName,
        });
      } catch (e) {
        console.error('Web share failed:', e);
        saveToPhone(blob, fileName); // Fallback to download
      }
    } else {
      saveToPhone(blob, fileName); // Fallback to download
    }
  }
}

/**
 * Legacy support or quick save from DataURL.
 */
export async function saveFileFromDataUrl(dataUrl: string, fileName: string, action: 'save' | 'share' = 'save') {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  if (action === 'share') {
    await shareFile(blob, fileName);
  } else {
    await saveToPhone(blob, fileName);
  }
}
