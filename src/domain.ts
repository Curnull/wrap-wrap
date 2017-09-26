import {
    domainHost,
    WrapChain,
    createDomainComponent,
    IExtender
} from './index';

export function domain<TExternalProps, TDomain>(nameGetter: (props: TExternalProps) => string, domainGetter: (props: TExternalProps) => TDomain) {
    return {
      host: domainHost(nameGetter, domainGetter),
      use: <TChainInternalProps, TChainExternalProps>(chainGetter: (domain: TDomain) => WrapChain<TChainInternalProps, any, TChainExternalProps>) => ({
        component:  <TProps extends Partial<TChainInternalProps>>(ComponentToWrap: React.ComponentType<TProps>) => createDomainComponent({
          ComponentToWrap,
          chainGetter,
          nameGetter
        })
      }),
    };
  }
