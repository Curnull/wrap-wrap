import { objectReducer, objectInitialState, setObject, setProperty } from '../redux/index';
import { createWrapper, Wrapper } from './index';

export default function object<T extends object>(initialState?: T) {
  return createWrapper()
    .withStore(() => {
      return {
        initialState,
        reducer: objectReducer,
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
