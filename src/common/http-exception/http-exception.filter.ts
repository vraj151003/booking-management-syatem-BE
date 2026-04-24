import { ArgumentsHost, Catch, ExceptionFilter, HttpException, BadRequestException, HttpStatus } from '@nestjs/common';
import * as messageConfig from '../config/message.json';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private messageConfig: any = messageConfig;

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorMessage = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      errorMessage = exception.message || 'Error occurred';

      // Handle validation errors
      if (exception instanceof BadRequestException) {
        if (typeof exceptionResponse === 'object' && (exceptionResponse as any).message) {
          const responseMessage = (exceptionResponse as any).message;
          if (Array.isArray(responseMessage)) {
            errorMessage = responseMessage.join(', ');
          } else {
            errorMessage = responseMessage;
          }
        }
        errorMessage = errorMessage || this.messageConfig.messages.ERROR.VALIDATION;
      }

      // Use message from config based on status code if available
      const statusMessage = this.messageConfig.messages.ERROR[status.toString()];
      if (statusMessage && !exception.message) {
        errorMessage = statusMessage;
      }
    } else if (exception instanceof Error) {
      errorMessage = exception.message;
    }

    response.status(status).json({
      statusCode: status,
      success: false,
      message: errorMessage,
    });
  }
}
