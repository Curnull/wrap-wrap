import { createReducer } from '../createReducer';
import { ISetObjectPropertyActionPayload } from './objectActions';
import { SET_OBJECT, SET_PROPERTY} from './objectTypes';
import {IAction} from '../index';

export const objectInitialState = {};

export const objectReducerSource = {
  [SET_OBJECT]: <T extends object>(state: T, action: IAction<T>) => action.payload,

  [SET_PROPERTY]: <T extends object>(state: T, action: IAction<ISetObjectPropertyActionPayload>) => ({
    ...state as any,
    [action.payload.key]: action.payload.value,
  }),
};

export const getObjectReducer = <T extends object>() => createReducer<T>(objectInitialState as T, objectReducerSource);
