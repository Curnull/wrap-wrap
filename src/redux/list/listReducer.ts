import { createReducer } from '../createReducer';
import * as types from './listTypes';
import {IAddItemActionPayload, IDeleteItemActionPayload, ISetItemsActionPayload} from './listActions';
import {IAction} from '../index';

export interface IListState<T> {
  items: T[];
}

export const getListInitialState = <T>(): IListState<T> => ({
  items: [],
});

export const listReducerSource = {
  [types.SET_ITEMS]: <T>(state: IListState<T>, action: IAction<ISetItemsActionPayload<T>>) => ({
    ...state,
    items: action.payload.items,
  }),
  [types.ADD_ITEM]: <T>(state: IListState<T>, action: IAction<IAddItemActionPayload<T>>) => ({
    ...state,
    items: [...state.items, action.payload.item],
  }),
  [types.DELETE_ITEM]: <T>(state: IListState<T>, action: IAction<IDeleteItemActionPayload<T>>) => {
    const items = [...state.items];
    items.splice(items.indexOf(action.payload.item), 1);
    return {
      ...state,
      items,
    };
  },
};

export const getListReducer = <T>() => createReducer(getListInitialState<T>(), listReducerSource);
