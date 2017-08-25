import * as types from './requestTypes';

export interface ISetSendingActionPayload {

}

export const setSending = () => ({
  type: types.SET_SENDING,
  payload: {},
});

export interface ISetResponseActionPayload<T> {
  response: T;
}

export const setResponse = <T>(response: T) => ({
  type: types.SET_RESPONSE,
  payload: {
    response,
  },
});

export interface ISetErrorsActionPayload {
  errors: string[];
}

export const setErrors = (errors: string[]) => ({
  type: types.SET_ERRORS,
  payload: {
    errors,
  },
});
