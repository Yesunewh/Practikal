declare module 'redux-logger' {
  import { Middleware } from 'redux';
  
  interface LoggerOptions {
    collapsed?: boolean;
    duration?: boolean;
    timestamp?: boolean;
    level?: string;
    logErrors?: boolean;
    diff?: boolean;
    diffPredicate?: any;
  }
  
  function createLogger(options?: LoggerOptions): Middleware;
  export default createLogger;
}
