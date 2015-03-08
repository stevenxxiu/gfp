/* global GM_addStyle, GM_getResourceText, GM_getResourceURL */

export function cache(obj, prop, value){
  Object.defineProperty(obj, prop, {value: value});
  return value;
}

export function pad(num, size){
  return Array(Math.max(size - num.toString().length + 1, 0)).join(0) + num;
}

export function addStyleResolve(name){
  GM_addStyle(GM_getResourceText(name).replace(
    /url\("?([^":]+)"?\)/g, (match, url) => `url("${GM_getResourceURL(`${name}/${url}`)}")`
  ));
}
