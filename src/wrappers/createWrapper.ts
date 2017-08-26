import {Wrapper} from './index';

export function createWrapper() {
  return new Wrapper<{}, {}, {}>({
    name: '',
    storeGetter: undefined,
    isPermanent: false,
  });
}
