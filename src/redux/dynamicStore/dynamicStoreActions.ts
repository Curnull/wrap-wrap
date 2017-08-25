import * as actionTypes from './dynamicStoreConstants';
import {
  ActionCreator,
  Reducer,
  IAction
} from '../index';

export interface IDynamicStoreItem<T> {
  name: string;
  reducer: Reducer<T, any>;
  initialState: T;
}

export interface IAddStoreActionPayload {
  readonly stores: Array<IDynamicStoreItem<any>>;
}

export interface IDeleteStoreActionPayload {
  readonly names: string[];
}

export interface ISendActionToDynamicStoreActionPayload {
  readonly name: string;
  readonly action: IAction<any>;
}

export const addStores: ActionCreator<IAddStoreActionPayload> = (stores: Array<IDynamicStoreItem<any>>) => ({
  type: actionTypes.ADD_STORES,
  payload: {
    stores,
  },
});

export const deleteStores: ActionCreator<IDeleteStoreActionPayload> = (names: string[]) => ({
  type: actionTypes.DELETE_STORES,
  payload: {
    names,
  },
});

export const sendActionToDynamicStore: ActionCreator<ISendActionToDynamicStoreActionPayload> = (name: string, action: any) => ({
  type: actionTypes.SEND_ACTION_TO_DYNAMIC_STORE,
  payload: {
    name,
    action,
  },
});
