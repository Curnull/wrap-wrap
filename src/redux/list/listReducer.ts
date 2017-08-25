import { createReducer } from 'redux-create-reducer';
import * as types from './listTypes';
import {IAddItemActionPayload, IDeleteItemActionPayload, ISetItemsActionPayload} from './index';
import {IAction} from '../index';

export interface IListReducerState<T> {
  items: T[];
}

export const listInitialState: IListReducerState<any> = {
  items: [],
};

export const listReducerSource = {
  [types.SET_ITEMS]: <T>(state: IListReducerState<T>, action: IAction<ISetItemsActionPayload<T>>) => ({
    ...state,
    items: action.payload.items,
  }),
  [types.ADD_ITEM]: <T>(state: IListReducerState<T>, action: IAction<IAddItemActionPayload<T>>) => ({
    ...state,
    items: [...state.items, action.payload.item],
  }),
  [types.DELETE_ITEM]: <T>(state: IListReducerState<T>, action: IAction<IDeleteItemActionPayload<T>>) => {
    const items = [...state.items];
    items.splice(items.indexOf(action.payload.item), 1);
    return {
      ...state,
      items,
    };
  },
};

export const listReducer = createReducer(listInitialState, listReducerSource);
