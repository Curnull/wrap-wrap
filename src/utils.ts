import {Wrapper} from './index';

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

export const wrapperStructureToArray = (wrappers: IWrappersStructure): Array<Wrapper<any, any, any>> => {
    if (isWrapper(wrappers)) {
      return [(wrappers as any)];
    }
    let result: Array<Wrapper<any, any, any>> = [];
    Object.keys(wrappers).forEach((key) => {
      result = [...result, ...wrapperStructureToArray((wrappers as any)[key])];
    });
    return result;
};
