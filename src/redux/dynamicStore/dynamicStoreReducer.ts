import { createReducer } from 'redux-create-reducer';
import * as types from './dynamicStoreConstants';
import {Reducer, IAction} from '../index';
import {SendActionToDynamicStoreActionPayload, DeleteStoreActionPayload, AddStoreActionPayload} from './index';

export interface IDynamicState {
  [storeName: string]: any;
}
export const dynamicStoreInitialState: IDynamicState = {};

interface IReducersStore {
  [reducerName: string]: Reducer<any, any>;
}

const dev = (window as any)['__DEVELOPMENT__'];

const reducers: IReducersStore = {};
export const NAME_SEPARATOR = '/';
export function getStateByName(name: string, state: IDynamicState): any {
  if (!dev) {
    return state[name];
  }
  const index = name.indexOf(NAME_SEPARATOR);
  if (index > -1) {
    const curName = name.substr(0, index);
    return getStateByName(name.substr(index + 1, name.length - index), state[curName]);
  }
  return state[name];
}

function putByName(value: any, name: string, state: IDynamicState) {
  if (!dev) {
    state[name] = value;
    return;
  }
  const index = name.indexOf(NAME_SEPARATOR);
  if (index > -1) {
    const curName = name.substr(0, index);
    state[curName] = {...state[curName]};
    putByName(value, name.substr(index + 1, name.length - index), state[curName]);
    return;
  }
  state[name] = value;
}

function deleteByName(name: string, state: IDynamicState) {
  if (!dev) {
    const index = name.indexOf(NAME_SEPARATOR);
    if (index > -1) {
      const curName = name.substr(0, index);
      state[curName] = deleteByName(name.substr(index + 1, name.length - index), state[curName]);
      if (!Object.keys(state[curName]).length) {
        return Object.keys(state).reduce((result, key) => {
          if (key !== curName) {
            result[key] = state[key];
          }
          return result;
        }, {} as IDynamicState);
      } else {
        return state;
      }
    }
  }
  return Object.keys(state).reduce((result, key) => {
    if (key !== name) {
      result[key] = state[key];
    }
    return result;
  }, {} as IDynamicState);
}

export const dynamicStoreReducer = createReducer(dynamicStoreInitialState, {
  [types.SEND_ACTION_TO_DYNAMIC_STORE]: (state: IDynamicState, action: IAction<SendActionToDynamicStoreActionPayload>) => {
    const name = action.payload.name;
    const subAction = action.payload.action;
    if (reducers[name]) {
      const reducer = reducers[name];
      const curState = getStateByName(name, state);
      const nextState = reducer(curState, subAction);
      const newState = {
        ...state,
      };
      putByName(nextState, name, newState);
      return newState;
    }
    return state;
  },
  [types.ADD_STORES]: (state: IDynamicState, action: IAction<AddStoreActionPayload>) => {
    const newState = { ...state };

    action.payload.stores.forEach((store) => {
      if (!reducers[store.name]) {
        reducers[store.name] = store.reducer;
        const reducedState = store.reducer(store.initialState, { type: '', payload: undefined });
        putByName(reducedState, store.name, newState);
      }
    });
    return newState;
  },
  [types.DELETE_STORES]: (state: IDynamicState, action: IAction<DeleteStoreActionPayload>) => {
    let newState = {...state};
    action.payload.names.forEach((name) => {
      delete reducers[name];
      newState = deleteByName(name, newState);
    });
    return newState;
  },
});
