
export function cache(obj, prop, value){
  Object.defineProperty(obj, prop, {value: value});
  return value;
}
