import { InAppBrowser } from 'react-native-inappbrowser-reborn';
import RNFS from 'react-native-fs';
import type { CloudAdapter, CloudConfig } from './types';
import type { CloudProvider, CloudAccount, CloudFile, CloudUploadResult } from '../../types';
import { CloudError, CloudErrorType, CLOUD_CONFIGS, CLOUD_BACKUP_FOLDER } from './types';

// ============================================================
// SMS Vault v2.0 - Dropbox Adapter
// ============================================================

interface DropboxTokens {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  account_id: string;
}

interface DropboxFile {
  name: string;
  path_lower: string;
  path_display: string;
  id: string;
  size: number;
  server_modified: string;
  is_downloadable: boolean;
}

interface DropboxFileList {
  entries: DropboxFile[];
  has_more: boolean;
  cursor?: string;
}

export class DropboxAdapter implements CloudAdapter {
  provider: CloudProvider = 'dropbox';
  private config: CloudConfig;
  private tokens: DropboxTokens | null = null;
  private backupFolderId: string | null = null;

  constructor() {
    this.config = CLOUD_CONFIGS.dropbox;
  }

  // === Authentication ===

  async authenticate(): Promise<void> {
    try {
      const authUrl = `https://www.dropbox.com/oauth2/authorize?` +
        `client_id=${this.config.clientId}` +
        `&redirect_uri=${encodeURIComponent(this.config.redirectUri)}` +
        `&response_type=code` +
        `&scope=${encodeURIComponent(this.config.scopes.join(' '))}`;

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
        'Failed to authenticate with Dropbox',
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
    console.log('Exchanging code for Dropbox tokens:', code);
    this.tokens = {
      access_token: 'simulated_dropbox_access_token',
      refresh_token: 'simulated_dropbox_refresh_token',
      expires_in: 14400,
      token_type: 'bearer',
      account_id: 'dbid:xxxx',
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
    console.log('Refreshing Dropbox tokens...');
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
      email: 'user@dropbox.com',
      storageUsed: 2 * 1024 * 1024 * 1024, // 2 GB
      storageTotal: 2 * 1024 * 1024 * 1024, // 2 GB (free tier)
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

      onProgress?.(0.1);
      const fileContent = await RNFS.readFile(filePath, 'base64');
      const dropboxPath = `/${folder}/${fileName}`;

      // In production, upload to Dropbox API
      console.log('Uploading to Dropbox:', dropboxPath);

      for (let i = 0.5; i <= 1; i += 0.1) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        onProgress?.(i);
      }

      return {
        success: true,
        fileId: `dropbox_file_${Date.now()}`,
        fileName,
      };
    } catch (error) {
      if (error instanceof CloudError) throw error;
      throw new CloudError(
        'Failed to upload file to Dropbox',
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
      console.log('Downloading from Dropbox:', fileId);

      for (let i = 0.1; i <= 1; i += 0.1) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        onProgress?.(i);
      }
    } catch (error) {
      if (error instanceof CloudError) throw error;
      throw new CloudError(
        'Failed to download file from Dropbox',
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
          id: 'dropbox_file_1',
          name: 'backup_123.enc',
          size: 1024 * 1024,
          lastModified: Date.now(),
          mimeType: 'application/octet-stream',
        },
      ];
    } catch (error) {
      console.error('Failed to list Dropbox files:', error);
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
      console.log('Deleting from Dropbox:', fileId);
    } catch (error) {
      if (error instanceof CloudError) throw error;
      throw new CloudError(
        'Failed to delete file from Dropbox',
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
    this.backupFolderId = `dropbox_folder_${Date.now()}`;
    return this.backupFolderId;
  }

  // === Disconnect ===

  async disconnect(): Promise<void> {
    this.tokens = null;
    this.backupFolderId = null;
  }
}
