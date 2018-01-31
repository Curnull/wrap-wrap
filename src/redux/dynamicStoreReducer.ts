import * as types from './dynamicStoreConstants';
import {createReducer} from './createReducer';
import {Reducer, IAction} from './interfaces';
import {ISetDynamicStoreStateActionPayload, IDeleteStoreActionPayload, IAddStoreActionPayload} from './dynamicStoreActions';
import {putByName, deleteByName} from '../storage';

export interface IDynamicState {
  [storeName: string]: any;
}

export const dynamicStoreName = 'dynamic';
export const dynamicStoreInitialState: IDynamicState = {};
export const dynamicReducerActionsHandlers = {
  [types.SET_DYNAMIC_STORE_STATE]: (state: IDynamicState, action: IAction<ISetDynamicStoreStateActionPayload>) => {
    const name = action.payload.name;
    const newState = {
      ...state,
    };
    putByName(action.payload.nextState, name, newState);
    return newState;
  },
  [types.ADD_STORES]: (state: IDynamicState, action: IAction<IAddStoreActionPayload>) => {
    const newState = { ...state };
    action.payload.stores.forEach((store) => {
      putByName(store.initialState , store.name, newState);
    });
    return newState;
  },
  [types.DELETE_STORES]: (state: IDynamicState, action: IAction<IDeleteStoreActionPayload>) => {
    let newState = {...state};
    action.payload.names.forEach((name) => {
      newState = deleteByName(name, newState);
    });
    return newState;
  }
};

export const dynamicStoreReducer = createReducer(dynamicStoreInitialState, dynamicReducerActionsHandlers);
