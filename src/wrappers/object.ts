import { Wrapper } from '../Wrapper';
import {createWrapper} from './createWrapper';

export interface IObjectWrapperMethods<T> {
  set: <K extends keyof T>(objOrKey: K | T, val?: T[K]) => void;
  merge: (obj: Partial<T>) => void;
}

export type ObjectWrapper<T> = Wrapper<T, IObjectWrapperMethods<T>>;

export function object<T extends object>(initialState: T): ObjectWrapper<T> {
  return createWrapper()
    .withInitialState(() => initialState)
    .withMethods(({ setState, getState }) => {
      const set = <K extends keyof T>(objOrKey: K | T, val?: T[K]) => {
        if (typeof objOrKey === 'object') {
          setState(objOrKey);
        } else if (typeof objOrKey === 'string') {
          setState({...getState() as any, [objOrKey]: val});
        } else {
          throw new Error('Invalid params!');
        }
      };

      const merge = (obj: Partial<T>) => {
        setState({...getState() as any, ...obj as any});
      };
      return { set, merge };
    });
}
