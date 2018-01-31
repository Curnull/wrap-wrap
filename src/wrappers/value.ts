import { Wrapper } from '../Wrapper';
import { object } from './object';

export interface IValueWrapperMethods<T> {
  set: (value: T) => void;
}
export interface IValueState<T> {
  value: T;
}
export type ValueWrapper<T> = Wrapper<IValueState<T>, IValueWrapperMethods<T>>;

export function value<T = any>(value?: T): ValueWrapper<T>{
  return object({value} as IValueState<T>)
    .withMethods(({getState}, {merge}) => {
      const set = (val: T) => {
        if (getState().value !== val) {
          merge({ value: val });
        }
      };
      return { set };
    });
}
