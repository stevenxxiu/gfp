
export function isInDom(element){
  while(true){
    element = element.parentNode;
    if(element == document)
      return true;
  }
  return false;
}
