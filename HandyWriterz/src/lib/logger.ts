import pino from 'pino';

// Configure logger with proper log levels and formatting
export const logger = pino({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      ignore: 'pid,hostname',
      translateTime: 'yyyy-mm-dd HH:MM:ss',
    },
  },
  base: {
    env: process.env.NODE_ENV,
  },
  redact: {
    paths: ['password', 'passwordHash', 'token', 'resetToken', 'verificationToken'],
    remove: true,
  },
});

// Add request context middleware
export const requestLogger = (req: any, res: any, next: Function) => {
  req.log = logger.child({ 
    requestId: req.id,
    method: req.method,
    url: req.url,
    ip: req.ip 
  });
  next();
};
