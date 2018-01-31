import { Wrapper } from '../Wrapper';
import { object } from './object';

export interface IRequestWrapperMethods<T, TLoader extends (...p: any[]) => Promise<T>> {
  send: TLoader;
}
export interface IRequestState<T> {
  response: T;
  sending: boolean;
  errors: string[];
  count: number;
}

export type RequestWrapper<T, TLoader extends (...p: any[]) => Promise<T>> = Wrapper<IRequestState<T>, IRequestWrapperMethods<T, TLoader>>;

export function request<TResp, TLoader extends (...p: any[]) => Promise<TResp>>(loader: TLoader, initialResponse?: TResp): RequestWrapper<TResp, TLoader> {
  return object({
      response: initialResponse,
      sending: false,
      errors: [],
      count: 0,
    } as IRequestState<TResp>)
    .withMethods(({ getState }, {merge}) => {
      const send = (...loadDataParams: any[]) => {
        const count = getState().count + 1;
        merge({ sending: true });
        const promise = loader(...loadDataParams);
        promise.then((response) => {
          if (count === getState().count) {
            merge({response, sending: false});
          }
        }).catch((errors) => {
          if (count === getState().count) {
            merge({errors, sending: false});
            throw errors;
          }
        });
        return promise;
      };

      return { send } as { send: TLoader };
    });
}
