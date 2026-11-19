import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      message = typeof body === 'string' ? body : (body as any).message ?? exception.message;
    }
    else if (exception instanceof QueryFailedError) {
      const code = (exception as any).driverError?.code;
      if (code === '23505') {
        status = HttpStatus.CONFLICT;
        message = 'A record with the same unique value already exists';
      } else if (code === '23503') {
        status = HttpStatus.CONFLICT;
        message = 'This record is linked with other records';
      } else if (code === '23514') {
        status = HttpStatus.BAD_REQUEST;
        message = 'A value breaks a database rule';
      }
    }

    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(exception);
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      error: HttpStatus[status] ?? 'ERROR',
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
