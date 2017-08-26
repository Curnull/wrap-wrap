import { getObjectReducer, setObject, setProperty } from '../redux/index';
import { createWrapper, Wrapper } from './index';

export interface ObjectWrapperMethods<T> {
  set: <K extends keyof T>(objOrKey: K | T, val?: T[K]) => void;
}

export type ObjectWrapper<T> = Wrapper<T, ObjectWrapperMethods<T>>;

export function object<T extends object>(initialState: T): ObjectWrapper<T> {
  return createWrapper()
    .withStore(() => {
      return {
        initialState,
        reducer: getObjectReducer<T>(),
      };
    })
    .withMethods(({ dispatch }) => {
      const set = <K extends keyof T>(objOrKey: K | T, val?: T[K]) => {
        if (typeof objOrKey === 'object') {
          dispatch(setObject(objOrKey as T));
        } else if (typeof objOrKey === 'string') {
          dispatch(setProperty(objOrKey, val));
        } else {
          throw new Error('Invalid params!');
        }
      };
      return { set };
    });
}
