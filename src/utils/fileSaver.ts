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
      if (!base64) {
        reject(new Error('Failed to convert blob to base64'));
        return;
      }
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('FileReader error'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Get the MIME type from a filename or blob.
 */
function getMimeType(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();
  const mimeMap: { [key: string]: string } = {
    'pdf': 'application/pdf',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'webp': 'image/webp',
    'gif': 'image/gif',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  };
  return mimeMap[ext || ''] || 'application/octet-stream';
}

/**
 * Saves a file to the device's Documents directory.
 * On web, triggers a download.
 * On Android/iOS, uses Capacitor Filesystem.
 */
export async function saveToPhone(blob: Blob, fileName: string): Promise<string> {
  if (!blob || blob.size === 0) {
    throw new Error('Cannot save empty blob');
  }

  if (Capacitor.isNativePlatform()) {
    try {
      const base64Data = await blobToBase64(blob);

      // Save to Documents directory which is typically in /storage/emulated/0/Documents
      // or /sdcard/Documents depending on the Android version and device
      const result = await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Documents,
        recursive: true,
      });

      console.log(`✅ File saved: ${result.uri}`);
      return result.uri;
    } catch (error: any) {
      console.error('❌ Error saving file:', error);
      
      // Provide user-friendly error message
      const errorMsg = error?.message || 'Unknown error';
      if (errorMsg.includes('permission')) {
        alert('Storage permission denied. Please enable storage access in app settings.');
      } else {
        alert(`Failed to save file: ${errorMsg}`);
      }
      throw error;
    }
  } else {
    // Web fallback: trigger browser download
    const url = URL.createObjectURL(blob);
    try {
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      console.log(`✅ File downloaded: ${fileName}`);
      return 'downloaded';
    } finally {
      // Clean up the object URL after a short delay to ensure download completes
      setTimeout(() => URL.revokeObjectURL(url), 100);
    }
  }
}

/**
 * Shares a file using the native share sheet.
 * On web, falls back to download or native share if available.
 */
export async function shareFile(blob: Blob, fileName: string): Promise<void> {
  if (!blob || blob.size === 0) {
    throw new Error('Cannot share empty blob');
  }

  if (Capacitor.isNativePlatform()) {
    try {
      const base64Data = await blobToBase64(blob);
      const mimeType = getMimeType(fileName);

      // Write to cache directory for sharing
      const tempResult = await Filesystem.writeFile({
        path: `share_${Date.now()}_${fileName}`,
        data: base64Data,
        directory: Directory.Cache,
      });

      console.log(`📤 Sharing: ${tempResult.uri}`);

      // Open share sheet
      await Share.share({
        title: fileName,
        text: `Sharing: ${fileName}`,
        url: tempResult.uri,
        dialogTitle: 'Share File',
      });

      // Note: iOS/Android will handle file cleanup after sharing
    } catch (error: any) {
      console.error('❌ Error sharing file:', error);
      
      // If sharing fails, offer to save instead
      const errorMsg = error?.message || 'Unknown error';
      if (errorMsg.includes('not available') || errorMsg.includes('not supported')) {
        console.log('Share not available, falling back to save');
        await saveToPhone(blob, fileName);
        alert('Share not available on this device. File saved to Documents instead.');
      } else {
        alert(`Failed to share: ${errorMsg}`);
      }
    }
  } else {
    // Web fallback
    const file = new File([blob], fileName, { type: getMimeType(fileName) });
    
    if (navigator.share) {
      try {
        await navigator.share({
          files: [file],
          title: fileName,
        });
        console.log('✅ File shared via web');
      } catch (e: any) {
        if (e.name !== 'AbortError') {
          console.error('Web share failed:', e);
          // Fallback to download
          await saveToPhone(blob, fileName);
        }
      }
    } else {
      // No share API, fallback to download
      console.log('Share API not available, falling back to download');
      await saveToPhone(blob, fileName);
    }
  }
}

/**
 * Preview a file by opening it with the system default app.
 * On web, opens in a new tab if possible.
 */
export async function previewFile(blob: Blob, fileName: string): Promise<void> {
  const mimeType = getMimeType(fileName);

  if (Capacitor.isNativePlatform()) {
    try {
      const base64Data = await blobToBase64(blob);

      // Write to cache for preview
      const tempFile = await Filesystem.writeFile({
        path: `preview_${Date.now()}_${fileName}`,
        data: base64Data,
        directory: Directory.Cache,
      });

      // Android: we can show images in a modal or use intent
      // For PDFs, system will use default handler
      console.log(`Preview: ${tempFile.uri}`);
      
      // For now, just notify that file is ready
      alert(`File ready to open: ${fileName}`);
    } catch (error) {
      console.error('Preview error:', error);
      alert('Cannot preview file at this time');
    }
  } else {
    // Web: open in new tab
    const url = URL.createObjectURL(blob);
    try {
      const iframeWindow = window.open();
      if (iframeWindow) {
        iframeWindow.location.href = url;
      }
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (e) {
      console.error('Preview failed:', e);
      URL.revokeObjectURL(url);
    }
  }
}

/**
 * Legacy support: save from DataURL.
 */
export async function saveFileFromDataUrl(
  dataUrl: string,
  fileName: string,
  action: 'save' | 'share' = 'save'
): Promise<void> {
  try {
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    if (action === 'share') {
      await shareFile(blob, fileName);
    } else {
      await saveToPhone(blob, fileName);
    }
  } catch (error) {
    console.error('Error converting data URL:', error);
    throw error;
  }
}
