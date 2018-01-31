import * as actionTypes from './dynamicStoreConstants';
import {IStoreInfo} from '../storage';
import { ActionCreator } from './interfaces';

export interface IAddStoreActionPayload {
  readonly stores: IStoreInfo[];
}

export interface IDeleteStoreActionPayload {
  readonly names: string[];
}

export interface ISetDynamicStoreStateActionPayload {
  readonly name: string;
  readonly nextState: object;
}

export const addStores: ActionCreator<IAddStoreActionPayload> = (stores: IStoreInfo[]) => ({
  type: actionTypes.ADD_STORES,
  payload: {
    stores
  },
});

export const deleteStores: ActionCreator<IDeleteStoreActionPayload> = (names: string[]) => ({
  type: actionTypes.DELETE_STORES,
  payload: {
    names
  },
});

export const setDynamicStoreState: ActionCreator<ISetDynamicStoreStateActionPayload> = (name: string, nextState: object) => ({
  type: actionTypes.SET_DYNAMIC_STORE_STATE,
  payload: {
    name,
    nextState
  },
});
