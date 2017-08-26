import { getValueReducer, setValue, IValueState } from '../redux/index';
import { createWrapper, Wrapper } from './index';

export interface IValueWrapperMethods<T> {
  set: (T) => void;
}

export type ValueWrapper<T> = Wrapper<IValueState<T>, IValueWrapperMethods<T>>;

export function value<T = any>(value?: T): ValueWrapper<T>{
  return createWrapper()
    .withStore(() => {
      return {
        initialState: {
          value: value!,
        },
        reducer: getValueReducer<T>(value!),
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
