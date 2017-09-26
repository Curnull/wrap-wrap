import * as React from 'react';
import {object} from 'prop-types';
import * as hoistNonReactStatic from 'hoist-non-react-statics';
import * as actions from './redux/dynamicStore/dynamicStoreActions';
import {WrapChain, Omit} from './index';
import {isWrapper, wrapperStructureToArray, forEachWrapper, NameOrGetter, WrappersStructureOrGetter} from './utils';

export interface IDomainHOCParams<TDomain, TProps, TChainInternalProps, TChainExternalProps> {
    ComponentToWrap: React.ComponentType<TProps>;
    chainGetter: (domain: TDomain) => WrapChain<TChainInternalProps, any, TChainExternalProps>;
    nameGetter: (props: any) => string;
}

export function createDomainComponent<TDomain, TChainInternalProps, TChainExternalProps, TProps extends Partial<TChainInternalProps>>({
    ComponentToWrap,
    chainGetter,
    nameGetter
}: IDomainHOCParams<TDomain, TProps, TChainInternalProps, TChainExternalProps>
) {

  type ResultProps = Omit<TProps, keyof TChainInternalProps> & TChainExternalProps;
  class DomainComponent extends React.PureComponent<ResultProps> {
    public static contextTypes = {
        domains: object
    };
    public static WrappedComponent = ComponentToWrap;
    public static displayName = `domain(${ComponentToWrap.displayName || ComponentToWrap.name})`;
    private FinalComponent: React.ComponentType<ResultProps>;

    public constructor(props: ResultProps, context: any) {
        super(props);
        const name = nameGetter(props);
        if (!context || !context.domains || !context.domains[name]) {
            throw new Error(`Domain with name ${name} not found in react context! Make sure you hosted the domain and host component is mounted!`);
        }
        const domain = context.domains[name];
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
