import { SET_VALUE } from './valueTypes';

export interface ISetValueActionPayload<T> {
  value: T;
}

export const setValue = <T>(value: T) => ({
  type: SET_VALUE,
  payload: {
    value,
  },
});
