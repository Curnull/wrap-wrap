import { createReducer } from 'redux-create-reducer';
import { SET_SENDING, SET_ERRORS, SET_RESPONSE, ISetErrorsActionPayload, ISetSendingActionPayload, ISetResponseActionPayload } from './index';
import {IAction} from '../index';

export interface IRequestState<T> {
  response: T;
  sending: boolean;
  errors: string[];
  count: number;
}

export const requestInitialState: IRequestState<any> = {
  response: undefined,
  sending: false,
  errors: [],
  count: 0,
};

export const requestReducerSource = {
  [SET_SENDING]: <T>(state: IRequestState<T>) => ({
    ...state,
    sending: true,
    count: state.count + 1
  }),

  [SET_RESPONSE]: <T>(state: IRequestState<T>, action: IAction<ISetResponseActionPayload<T>>) => ({
    ...state,
    response: action.payload.response,
    sending: false,
  }),

  [SET_ERRORS]: <T>(state: IRequestState<T>, action: IAction<ISetErrorsActionPayload>) => ({
    ...state,
    errors: action.payload.errors,
    sending: false,
  }),
};

export const requestReducer = createReducer(requestInitialState, requestReducerSource);
