export interface IAction<T extends object> {
    readonly type: string;
    readonly payload: Readonly<T>;
}

export type ActionCreator<T extends object> = (...params: any[]) => IAction<T>;

export type Reducer<T, TPayload extends object> = (state: T, action: IAction<TPayload>) => T;
