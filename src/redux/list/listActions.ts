import * as types from './listTypes';
import {IAction} from '../index';

export interface ISetItemsActionPayload<T> {
  items: T[];
}
export const setItems = <T>(items: T[]): IAction<ISetItemsActionPayload<T>> => ({
  type: types.SET_ITEMS,
  payload: {
    items,
  },
});

export interface IAddItemActionPayload<T> {
  item: T;
}
export const addItem = <T>(item: T): IAction<IAddItemActionPayload<T>> => ({
  type: types.ADD_ITEM,
  payload: {
    item,
  },
});

export interface IDeleteItemActionPayload<T> {
  item: T;
}

export const deleteItem = <T>(item: T): IAction<IDeleteItemActionPayload<T>> => ({
  type: types.DELETE_ITEM,
  payload: {
    item,
  },
});
