type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: any;
  timestamp: string;
  component?: string;
}

class Logger {
  private isDevelopment = import.meta.env.DEV;

  private formatMessage(level: LogLevel, message: string, component?: string): string {
    const timestamp = new Date().toISOString();
    const componentPrefix = component ? `[${component}]` : '';
    return `${timestamp} ${level.toUpperCase()} ${componentPrefix} ${message}`;
  }

  private createLogEntry(level: LogLevel, message: string, data?: any, component?: string): LogEntry {
    return {
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
      component
    };
  }

  debug(message: string, data?: any, component?: string): void {
    if (this.isDevelopment) {
      console.debug(this.formatMessage('debug', message, component), data || '');
    }
  }

  info(message: string, data?: any, component?: string): void {
    if (this.isDevelopment) {
      console.info(this.formatMessage('info', message, component), data || '');
    }
  }

  warn(message: string, data?: any, component?: string): void {
    console.warn(this.formatMessage('warn', message, component), data || '');
  }

  error(message: string, error?: any, component?: string): void {
    console.error(this.formatMessage('error', message, component), error || '');
    
    // In production, you could send to external logging service
    if (!this.isDevelopment && error) {
      // this.sendToExternalService(this.createLogEntry('error', message, error, component));
    }
  }

  // Helper method for React components
  component(componentName: string) {
    return {
      debug: (message: string, data?: any) => this.debug(message, data, componentName),
      info: (message: string, data?: any) => this.info(message, data, componentName),
      warn: (message: string, data?: any) => this.warn(message, data, componentName),
      error: (message: string, error?: any) => this.error(message, error, componentName)
    };
  }
}

export const logger = new Logger();