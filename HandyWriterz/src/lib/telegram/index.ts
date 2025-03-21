export interface TelegramFile {
  id: string;
  file_name: string;
  file_size: number;
  mime_type?: string;
  download_url?: string;
}

interface TelegramSubscription {
  unsubscribe: () => void;
}

class TelegramService {
  private baseUrl = import.meta.env.VITE_API_URL;
  
  async downloadFile(fileId: string): Promise<TelegramFile> {
    try {
      const response = await fetch(`${this.baseUrl}/api/telegram/download/${fileId}`);
      if (!response.ok) {
        throw new Error('Failed to download file');
      }
      return response.json();
    } catch (error) {
      console.error('Download error:', error);
      throw new Error('Failed to download file');
    }
  }

  subscribeToNewFiles(submissionId: string, callback: (file: TelegramFile) => void): TelegramSubscription {
    // Set up WebSocket or polling mechanism here
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`${this.baseUrl}/api/telegram/files/${submissionId}`);
        if (response.ok) {
          const newFiles: TelegramFile[] = await response.json();
          newFiles.forEach(callback);
        }
      } catch (error) {
        console.error('Subscription error:', error);
      }
    }, 5000); // Poll every 5 seconds

    return {
      unsubscribe: () => {
        clearInterval(interval);
      }
    };
  }
}

export const telegramService = new TelegramService();