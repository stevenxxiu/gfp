
export function clone(obj){
  if(Array.isArray(obj)){
    return Array.from(obj);
  }else if(typeof obj == 'object' && obj !== null){
    let res = {};
    for(let key of Object.keys(obj))
      res[key] = clone(obj[key]);
    return res;
  }
  return obj;
}
