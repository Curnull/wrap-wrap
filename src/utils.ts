import {Wrapper, IWrappersStructure} from './index';

export function or(...args: any[]) {
    let result = args[0];
    args.forEach((a) => {
      result = a || result;
    });
    return result;
  }

export function and(...args: any[]) {
    for (const index in args) {
        if (!args[index]) {
        return false;
        }
    }
    return true;
}

export const isWrapper = (obj: any) => obj && obj.withStore && obj.withMethods;

export interface IWrappersStructure {
    [propsName: string]: Wrapper<any, any, any> | IWrappersStructure;
}

export type WrappersStructureOrGetter<TProps> = IWrappersStructure | ((props: TProps) => IWrappersStructure);
export type NameOrGetter<TProps> = string | ((props: TProps) => string);
export const wrapperStructureToArray = (wrappers: IWrappersStructure): Array<Wrapper<any, any, any>> => {
    if (isWrapper(wrappers)) {
      return [(wrappers as any)];
    }
    let result: Array<Wrapper<any, any, any>> = [];
    Object.keys(wrappers).forEach((key) => {
       if (typeof wrappers[key] !== 'object') {
           return;
       }
       result = [...result, ...wrapperStructureToArray((wrappers as any)[key])];
    });
    return result;
};

export type ValueGetter = (obj: {}) => any;
export interface IForEachWrappersContext {
    valueGetter?: ValueGetter;
    path?: string;
}
export function forEachWrapper(
    wrappers: IWrappersStructure,
    cb: (wrapper: Wrapper<any, any>, context: IForEachWrappersContext) => void,
    context: IForEachWrappersContext = {}
) {
    if (!wrappers) {
        throw new Error('wrappers are required for forEachWrapper');
    }
    return Object.keys(wrappers).reduce((result: {}, key: string) => {
        const obj = wrappers[key];
        const nextValueGetter = (v: any) => ((context.valueGetter ? context.valueGetter(v) : v) || {})[key];
        const nextContext = {
            valueGetter: nextValueGetter,
            path: context.path ? context.path + `.${key}` : key,
        };
        if (isWrapper(obj)) {
            cb(obj as Wrapper<any, any>, nextContext);
        }
        else if (typeof obj === 'object') {
            forEachWrapper(obj as IWrappersStructure, cb, nextContext);
        }
        return result;
    }, {});
}
