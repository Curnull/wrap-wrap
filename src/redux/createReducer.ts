import {Reducer, IAction} from './interfaces';

export function createReducer<T>(initialState: T, handlers: {[pn: string]: Reducer<T, any>}) {
  return (state: T, action: IAction<any>) => {
        if (handlers.hasOwnProperty(action.type)) {
          return handlers[action.type](state ||  initialState, action);
        } else {
          return state ||  initialState;
        }
  };
}
