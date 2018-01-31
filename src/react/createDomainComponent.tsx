import * as React from 'react';
import {object} from 'prop-types';
import {Omit} from '../';
import * as hoistNonReactStatic from 'hoist-non-react-statics';
import {isWrapper, wrapperStructureToArray, forEachWrapper, NameOrGetter, WrappersStructureOrGetter} from '../utils';
import { WrapChain } from './WrapChain';
import {IDomainHost} from '../domainHost';

export interface IDomainHOCParams<TDomain, TProps, TChainInternalProps, TChainExternalProps> {
    ComponentToWrap: React.ComponentType<TProps>;
    chainGetter: (domain: TDomain) => WrapChain<TChainInternalProps, any, TChainExternalProps>;
}

export function createDomainComponent<TDomain, TChainInternalProps, TChainExternalProps, TProps extends Partial<TChainInternalProps>>({
    ComponentToWrap,
    chainGetter,
}: IDomainHOCParams<TDomain, TProps, TChainInternalProps, TChainExternalProps>
) {

  type ResultProps = Omit<TProps, keyof TChainInternalProps> & TChainExternalProps;
  class DomainComponent extends React.PureComponent<ResultProps> {
    public static contextTypes = {
        domain: object
    };
    public static WrappedComponent = ComponentToWrap;
    public static displayName = `domain(${ComponentToWrap.displayName || ComponentToWrap.name})`;
    private FinalComponent: React.ComponentType<ResultProps>;

    public constructor(props: ResultProps, context: any) {
        super(props);
        if (!context || !context.domain) {
            throw new Error(`Domain not found in react context! Make sure you hosted the domain and host component is mounted!`);
        }
        const domain = context.domain;
        const chain = chainGetter(domain);
        this.FinalComponent = chain.component(ComponentToWrap);
    }

    public render() {
        const Component = this.FinalComponent;
        return <Component {...this.props} />;
    }
  }

  return (hoistNonReactStatic as any)(DomainComponent, ComponentToWrap) as React.ComponentType<ResultProps>;
}

export function domain<TExternalProps, TDomain>(domainHostGetter: (props: TExternalProps) => IDomainHost<TDomain>) {
    return {
      host: domainHostGetter,
      use: <TChainInternalProps, TChainExternalProps>(chainGetter: (domain: TDomain) => WrapChain<TChainInternalProps, any, TChainExternalProps>) => ({
        component:  <TProps extends Partial<TChainInternalProps>>(ComponentToWrap: React.ComponentType<TProps>) => createDomainComponent({
          ComponentToWrap,
          chainGetter
        })
      }),
    };
  }
