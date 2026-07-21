import { InAppBrowser } from 'react-native-inappbrowser-reborn';
import RNFS from 'react-native-fs';
import type { CloudAdapter, CloudConfig } from './types';
import type { CloudProvider, CloudAccount, CloudFile, CloudUploadResult } from '../../types';
import { CloudError, CloudErrorType, CLOUD_CONFIGS, CLOUD_BACKUP_FOLDER } from './types';

// ============================================================
// SMS Vault v2.0 - OneDrive Adapter
// ============================================================

interface OneDriveTokens {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

interface OneDriveFile {
  id: string;
  name: string;
  size: number;
  lastModifiedDateTime: string;
  file?: object;
  folder?: object;
}

interface OneDriveFileList {
  value: OneDriveFile[];
  '@odata.nextLink'?: string;
}

export class OneDriveAdapter implements CloudAdapter {
  provider: CloudProvider = 'onedrive';
  private config: CloudConfig;
  private tokens: OneDriveTokens | null = null;
  private backupFolderId: string | null = null;

  constructor() {
    this.config = CLOUD_CONFIGS.onedrive;
  }

  // === Authentication ===

  async authenticate(): Promise<void> {
    try {
      const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
        `client_id=${this.config.clientId}` +
        `&redirect_uri=${encodeURIComponent(this.config.redirectUri)}` +
        `&response_type=code` +
        `&scope=${encodeURIComponent(this.config.scopes.join(' '))}` +
        `&response_mode=query`;

      if (await InAppBrowser.isAvailable()) {
        const result = await InAppBrowser.openAuth(
          authUrl,
          this.config.redirectUri,
          {
            ephemeralWebSession: true,
            showTitle: true,
            enableUrlBarHiding: true,
            enableDefaultShare: false,
          }
        );

        if (result.type === 'success' && result.url) {
          const code = this.extractCodeFromUrl(result.url);
          if (code) {
            await this.exchangeCodeForTokens(code);
          }
        }
      }
    } catch (error) {
      throw new CloudError(
        'Failed to authenticate with OneDrive',
        this.provider,
        CloudErrorType.AUTH_FAILED
      );
    }
  }

  private extractCodeFromUrl(url: string): string | null {
    const match = url.match(/[?&]code=([^&]+)/);
    return match ? match[1] : null;
  }

  private async exchangeCodeForTokens(code: string): Promise<void> {
    // In production, this would call your backend to exchange the code
    console.log('Exchanging code for OneDrive tokens:', code);
    this.tokens = {
      access_token: 'simulated_onedrive_access_token',
      refresh_token: 'simulated_onedrive_refresh_token',
      expires_in: 3600,
      token_type: 'Bearer',
    };
  }

  async isAuthenticated(): Promise<boolean> {
    if (!this.tokens) return false;
    return true;
  }

  async refreshTokens(): Promise<void> {
    if (!this.tokens?.refresh_token) {
      throw new CloudError(
        'No refresh token available',
        this.provider,
        CloudErrorType.TOKEN_EXPIRED
      );
    }
    console.log('Refreshing OneDrive tokens...');
  }

  // === Account Operations ===

  async getAccountInfo(): Promise<CloudAccount> {
    const isAuthenticated = await this.isAuthenticated();
    if (!isAuthenticated) {
      return {
        provider: this.provider,
        isConnected: false,
      };
    }

    return {
      provider: this.provider,
      isConnected: true,
      email: 'user@outlook.com',
      storageUsed: 3 * 1024 * 1024 * 1024, // 3 GB
      storageTotal: 5 * 1024 * 1024 * 1024, // 5 GB (free tier)
      lastSyncDate: Date.now(),
    };
  }

  // === File Operations ===

  async uploadFile(
    filePath: string,
    fileName: string,
    folder: string = CLOUD_BACKUP_FOLDER,
    onProgress?: (progress: number) => void
  ): Promise<CloudUploadResult> {
    try {
      const isAuthenticated = await this.isAuthenticated();
      if (!isAuthenticated) {
        throw new CloudError(
          'Not authenticated',
          this.provider,
          CloudErrorType.AUTH_FAILED
        );
      }

      const folderId = await this.getOrCreateFolder(folder);
      onProgress?.(0.1);

      // Read file content
      const fileContent = await RNFS.readFile(filePath, 'base64');

      // In production, upload to Microsoft Graph API
      console.log('Uploading to OneDrive:', fileName);

      // Simulate upload progress
      for (let i = 0.5; i <= 1; i += 0.1) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        onProgress?.(i);
      }

      return {
        success: true,
        fileId: `onedrive_file_${Date.now()}`,
        fileName,
      };
    } catch (error) {
      if (error instanceof CloudError) throw error;
      throw new CloudError(
        'Failed to upload file to OneDrive',
        this.provider,
        CloudErrorType.UPLOAD_FAILED
      );
    }
  }

  async downloadFile(
    fileId: string,
    destPath: string,
    onProgress?: (progress: number) => void
  ): Promise<void> {
    try {
      const isAuthenticated = await this.isAuthenticated();
      if (!isAuthenticated) {
        throw new CloudError(
          'Not authenticated',
          this.provider,
          CloudErrorType.AUTH_FAILED
        );
      }

      onProgress?.(0.1);
      console.log('Downloading from OneDrive:', fileId);

      for (let i = 0.1; i <= 1; i += 0.1) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        onProgress?.(i);
      }
    } catch (error) {
      if (error instanceof CloudError) throw error;
      throw new CloudError(
        'Failed to download file from OneDrive',
        this.provider,
        CloudErrorType.DOWNLOAD_FAILED
      );
    }
  }

  async listFiles(folder: string = CLOUD_BACKUP_FOLDER): Promise<CloudFile[]> {
    try {
      const isAuthenticated = await this.isAuthenticated();
      if (!isAuthenticated) return [];

      return [
        {
          id: 'onedrive_file_1',
          name: 'backup_123.enc',
          size: 1024 * 1024,
          lastModified: Date.now(),
          mimeType: 'application/octet-stream',
        },
      ];
    } catch (error) {
      console.error('Failed to list OneDrive files:', error);
      return [];
    }
  }

  async deleteFile(fileId: string): Promise<void> {
    try {
      const isAuthenticated = await this.isAuthenticated();
      if (!isAuthenticated) {
        throw new CloudError(
          'Not authenticated',
          this.provider,
          CloudErrorType.AUTH_FAILED
        );
      }
      console.log('Deleting from OneDrive:', fileId);
    } catch (error) {
      if (error instanceof CloudError) throw error;
      throw new CloudError(
        'Failed to delete file from OneDrive',
        this.provider,
        CloudErrorType.UNKNOWN_ERROR
      );
    }
  }

  // === Folder Operations ===

  private async getOrCreateFolder(folderName: string): Promise<string> {
    if (this.backupFolderId) {
      return this.backupFolderId;
    }
    this.backupFolderId = `onedrive_folder_${Date.now()}`;
    return this.backupFolderId;
  }

  // === Disconnect ===

  async disconnect(): Promise<void> {
    this.tokens = null;
    this.backupFolderId = null;
  }
}
