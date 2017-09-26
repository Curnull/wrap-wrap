import {
    IWrappersStructure,
    WrappersStructureOrGetter,
    isWrapper,
    wrapperStructureToArray,
    NAME_SEPARATOR,
    Wrapper,
    extender,
    IExtender,
    createDomainHostComponent,
    NameOrGetter,
    createDomainComponent,
    WrapChain,
} from './index';

export function domainHost<TExternalProps>(name: NameOrGetter<TExternalProps>, wrappers: IWrappersStructure | ((props: TExternalProps) => any), subscribe?: (props: TExternalProps) => Array<() => void>) {
  return extender<{}, never, any, TExternalProps>((ComponentToWrap: React.ComponentType) => createDomainHostComponent<any, TExternalProps>({
    wrappersOrGetter: wrappers,
    ComponentToWrap,
    subscribe,
    nameOrGetter: name,
  }));
}
