import {
    IWrappersStructure,
    isWrapper,
    wrapperStructureToArray,
    NAME_SEPARATOR,
    Wrapper,
    extender,
    IExtender,
    createDomainHostComponent,
} from './index';

function domain(name: string, wrappers: IWrappersStructure) {
  return Object.keys(wrappers).reduce((result, key) => {
    const obj = wrappers[key];
    if (!isWrapper(obj)) {
      result[key] = domain(`${name}${NAME_SEPARATOR}${key}`, obj as IWrappersStructure);
    } else {
      result[key] = (wrappers[key] as Wrapper<any, any, any>).withName(`${name}${NAME_SEPARATOR}${key}`);
    }
    return result;
  }, {} as IWrappersStructure);
}

export function domainHost(name: string, wrappers: IWrappersStructure, subscribe: () => Array<() => void>) {
  const wrappersInDomain = domain(name, wrappers);
  return extender((ComponentToWrap) =>  createDomainHostComponent({
    wrappers: wrapperStructureToArray(wrappersInDomain),
    ComponentToWrap,
    subscribe,
  }));
}
