import {IErrorResponse} from '../interfaces';

export class ErrorResponse implements IErrorResponse {
  code: number;
  message: string;
  stack?: string | undefined;
}
