import { HttpErrorResponse } from '@angular/common/http';
import { FormControl } from '@angular/forms';

export type FormGroupType<T> = {
  [K in keyof T]: FormControl<T[K]>;
};

export interface RequestConfig<T, U = unknown> {
  onError?: (error?: HttpErrorResponse) => void;
  onSuccess?: (response?: U) => void;
  payload: T;
}
