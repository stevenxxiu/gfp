
export function cache(obj, prop, value){
  Object.defineProperty(obj, prop, {value: value});
  return value;
}

export function pad(num, size){
  return Array(Math.max(size - num.toString().length + 1, 0)).join(0) + num;
}
