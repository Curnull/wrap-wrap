import { createReducer } from '../createReducer';
import {ISetValueActionPayload} from './valueActions';
import {SET_VALUE} from './valueTypes';
import {IAction} from '../index';

export interface IValueState<T> {
  value: T;
}

export const valueReducerSource = {
  [SET_VALUE]: <T>(state: IValueState<T>, action: IAction<ISetValueActionPayload<T>>) =>
    ({ value: action.payload.value }),
};

export const getValueReducer = <T>(value: T) => createReducer<IValueState<T>>({ value }, valueReducerSource);
