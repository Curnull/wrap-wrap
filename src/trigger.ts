let triggered: any[] = [];
let started = false;

export default function(obj: any) {
  if (started && triggered.indexOf(obj) === -1) {
    triggered.push(obj);
  }
}

export const start = () => {
  if (started) {
    throw Error('Trigger already started!');
  }
  started = true;
};

export const stop = () => {
  if (!started) {
    throw Error('Trigger already stopped!');
  }
  triggered = [];
  started = false;
};

export const getTriggered = () => {
  return [...triggered];
};
