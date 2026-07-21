// ============================================================
// SMS Vault v2.0 - Logger unit tests
// ============================================================

import { logger, log } from '../src/utils/logger';

describe('logger', () => {
  let debugSpy: jest.SpyInstance;
  let infoSpy: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    debugSpy = jest.spyOn(console, 'debug').mockImplementation(() => undefined);
    infoSpy = jest.spyOn(console, 'info').mockImplementation(() => undefined);
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    debugSpy.mockRestore();
    infoSpy.mockRestore();
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it('debug emits in dev', () => {
    logger.debug('test', 'hello');
    expect(debugSpy).toHaveBeenCalled();
  });

  it('info emits in dev', () => {
    logger.info('test', 'hi');
    expect(infoSpy).toHaveBeenCalled();
  });

  it('warn emits and includes a level label', () => {
    logger.warn('test', 'careful');
    const arg = warnSpy.mock.calls[0][0];
    expect(arg).toContain('WARN');
    expect(arg).toContain('careful');
  });

  it('error records message', () => {
    logger.error('test', 'broken');
    expect(errorSpy).toHaveBeenCalled();
  });

  it('exception captures error.message + name', () => {
    logger.exception('test', new Error('boom'));
    const arg = errorSpy.mock.calls[0][0];
    expect(arg).toContain('boom');
    expect(arg).toContain('Error');
  });

  it('redacts sensitive keys from objects', () => {
    const data = { username: 'u', password: 's3cret', n: { token: 'abc', ok: true } };
    logger.info('test', 'logging', data);
    const arg = infoSpy.mock.calls[0][0];
    expect(arg).toContain('[REDACTED]');
    expect(arg).not.toContain('s3cret');
    expect(arg).not.toContain('"abc"');
    expect(arg).toContain('"ok":true');
  });

  it('domain loggers route through the base logger', () => {
    log.cloud('warn', 'cloud-warn');
    expect(warnSpy).toHaveBeenCalled();
  });
});
