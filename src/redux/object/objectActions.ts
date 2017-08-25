import * as types from './objectTypes';
import {IAction} from '../index';

export const setObject = <T extends object>(obj: T): IAction<T> => ({
  type: types.SET_OBJECT,
  payload: obj,
});

export interface ISetObjectPropertyActionPayload {
  key: string;
  value: any;
}

export const setProperty = (key: string, value: any): IAction<ISetObjectPropertyActionPayload> => ({
  type: types.SET_PROPERTY,
  payload: {
    key, value
  }
});
