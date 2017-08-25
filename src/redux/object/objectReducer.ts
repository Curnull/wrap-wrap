import { createReducer } from 'redux-create-reducer';
import { SET_OBJECT, SET_PROPERTY, ISetObjectPropertyActionPayload } from './index';
import {IAction} from '../index';

export const objectInitialState = {};

export const objectReducerSource = {
  [SET_OBJECT]: <T extends object>(state: T, action: IAction<T>) => action.payload,

  [SET_PROPERTY]: (state: object, action: IAction<ISetObjectPropertyActionPayload>) => ({
    ...state,
    [action.payload.key]: action.payload.value,
  }),
};

export const objectReducer = createReducer(objectInitialState, objectReducerSource);
