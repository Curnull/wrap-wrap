import {Wrapper} from './index';

export function createWrapper() {
  return new Wrapper<{}, {}, {}>({
    name: '',
    methodsGetter: () => ({}),
    storeGetter: undefined,
    isPermanent: false,
    stateMapper: () => ({}),
  });
}
