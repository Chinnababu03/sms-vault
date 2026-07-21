// ============================================================
// SMS Vault v2.0 - useBackup Hook
// Thin wrapper around AppContext backup state with helpers that
// screens can consume, exposing progress, canStart, etc.
// ============================================================

import { useCallback, useMemo } from 'react';
import { useApp } from '../services/AppContext';
import type { BackupProgress, BackupStep, BackupMetadata } from '../types';
import { log } from '../utils/logger';

export interface UsePermissionsResult {
  backups: BackupMetadata[];
  latestBackup: BackupMetadata | null;
  isBackingUp: boolean;
  isRestoring: boolean;
  progress: BackupProgress | null;
  canStartBackup: boolean;
  currentStep: BackupStep | null;
  completion: number; // 0..1
  startBackup: () => Promise<void>;
  startRestore: (backupId: string) => Promise<void>;
}

export function useBackup(): UsePermissionsResult {
  const { state, startBackup, startRestore } = useApp();
  const isBackingUp = state.isBackingUp;
  const progress = state.backupProgress;
  const backups = state.backups;
  const latestBackup = backups.length > 0 ? backups[0] : null;
  const canStartBackup = !isBackingUp && !state.isRestoring;

  const startBackupSafe = useCallback(async (): Promise<void> => {
    if (!canStartBackup) {
      log.backup('warn', 'Backup already in progress, ignoring start');
      return;
    }
    try {
      await startBackup();
    } catch (e) {
      log.backup('error', 'Backup failed', e);
    }
  }, [canStartBackup, startBackup]);

  const startRestoreSafe = useCallback(
    async (backupId: string): Promise<void> => {
      if (state.isRestoring) {
        log.backup('warn', 'Restore already in progress, ignoring');
        return;
      }
      try {
        await startRestore(backupId);
      } catch (e) {
        log.backup('error', 'Restore failed', e);
      }
    },
    [startRestore, state.isRestoring]
  );

  const completion = useMemo(() => {
    if (!progress) return 0;
    if (progress.step === 'complete') return 1;
    if (progress.step === 'error') return 0;
    if (typeof progress.progress === 'number') return Math.max(0, Math.min(1, progress.progress));
    return 0;
  }, [progress]);

  return {
    backups,
    latestBackup,
    isBackingUp,
    isRestoring: state.isRestoring,
    progress,
    canStartBackup,
    currentStep: progress?.step ?? null,
    completion,
    startBackup: startBackupSafe,
    startRestore: startRestoreSafe,
  };
}

export default useBackup;
