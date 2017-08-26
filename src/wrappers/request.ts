import { requestReducer, requestInitialState, setSending, setErrors, setResponse, IRequestState } from '../redux/index';
import { createWrapper, Wrapper } from './index';

export interface RequestWrapperMethods<T, TLoader extends (...p: any[]) => Promise<T>> {
  send: TLoader;
}

export type RequestWrapper<T, TLoader extends (...p: any[]) => Promise<T>> = Wrapper<IRequestState<T>, RequestWrapperMethods<T, TLoader>>;

export function request<TResp, TLoader extends (...p: any[]) => Promise<TResp>>(loader: TLoader, initialResponse?: TResp): RequestWrapper<TResp, TLoader> {
  return createWrapper()
    .withStore(() => {
      return {
        initialState: {
          ...requestInitialState,
          response: initialResponse,
        },
        reducer: requestReducer,
      };
    })
    .withMethods(({ dispatch, getState }) => {
      const send = (...loadDataParams: any[]) => {
        const count = getState().count + 1;
        dispatch(setSending());
        const promise = loader(...loadDataParams);
        promise.then((response) => {
          if (count === getState().count) {
            dispatch(setResponse(response));
          }
        }).catch((errors) => {
          if (count === getState().count) {
            dispatch(setErrors(errors));
            throw errors;
          }
        });
        return promise;
      };

      return { send } as { send: TLoader };
    });
}
