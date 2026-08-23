import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ResponseFormat<T> {
  statusCode: number;
  data: T;
  meta?: any;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ResponseFormat<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ResponseFormat<T>> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse();

    return next.handle().pipe(
      map((res) => {
        // If response already has data & meta structure (like pagination)
        if (res && typeof res === 'object' && 'data' in res && 'meta' in res) {
          return {
            statusCode: response.statusCode,
            data: res.data,
            meta: res.meta,
          };
        }

        return {
          statusCode: response.statusCode,
          data: res,
        };
      }),
    );
  }
}
