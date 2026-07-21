declare module 'react-native' {
  interface NativeModulesStatic {
    SmsBridge: {
      readSms(sinceTimestamp: number): Promise<string>;
      getSmsCount(): Promise<number>;
      readMms(sinceTimestamp: number): Promise<string>;
    };
    CallLogBridge: {
      readCallLogs(sinceTimestamp: number): Promise<string>;
      getCallLogCount(): Promise<number>;
    };
    RestoreBridge: {
      writeSms(messagesJson: string): Promise<number>;
      writeCallLogs(entriesJson: string): Promise<number>;
    };
    SmsDefaultAppBridge: {
      isDefaultSmsApp(): Promise<boolean>;
      requestDefaultSmsApp(): Promise<boolean>;
    };
  }
}

export {};
