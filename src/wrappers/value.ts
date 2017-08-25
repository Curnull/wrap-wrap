import { valueReducer, valueInitialState, setValue } from '../redux/index';
import { createWrapper, Wrapper } from './index';

export function value<T>(value: T) {
  return createWrapper()
    .withStore(() => {
      return {
        initialState: {
          ...valueInitialState,
          value,
        },
        reducer: valueReducer,
      };
    })
    .withMethods(({ dispatch, getState }) => {
      const set = (val: T) => {
        if (getState().value !== val) {
          dispatch(setValue(val));
        }
      };
      return { set };
    });
}
