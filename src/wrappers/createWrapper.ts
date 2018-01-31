import {Wrapper} from '../Wrapper';

export function createWrapper() {
  return new Wrapper<{}, {}, {}>({
    name: '',
    isPermanent: false,
  });
}
