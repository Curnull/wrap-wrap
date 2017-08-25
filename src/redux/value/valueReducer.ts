import { createReducer } from 'redux-create-reducer';
import {SET_VALUE, ISetValueActionPayload} from './index';
import {IAction} from '../index';

export interface IValueState<T> {
  value: T;
}

export const valueInitialState = {
  value: undefined,
};

export const valueReducerSource = {
  [SET_VALUE]: <T>(state: IValueState<T>, action: IAction<ISetValueActionPayload<T>>) =>
    ({ value: action.payload.value }),
};

export const valueReducer = createReducer(valueInitialState, valueReducerSource);
