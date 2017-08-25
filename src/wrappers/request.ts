import { requestReducer, requestInitialState, setSending, setErrors, setResponse } from '../redux/index';
import { createWrapper, Wrapper } from './index';

export default function request<TResp, TLoader extends (...p: any[]) => Promise<TResp>>(loader: TLoader, initialResponse?: TResp) {
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
