import {ActiveFilter, Filter, InvalidFilter, RegExpFilter as RegExpFilter_} from 'gfp/lib/filterClasses';

Filter.prototype.toObject = function(){
  let res = {text: this.text};
  if(this instanceof ActiveFilter){
    if(this._disabled)
      res.disabled = true;
    if(this._hitCount)
      res.hitCount = this._hitCount;
    if(this._lastHit)
      res.lastHit = this._lastHit;
  }
  return res;
};

export class RegExpFilter extends RegExpFilter_ {
  constructor(regexpSource, matchCase, collapse){
    if(matchCase)
      this.matchCase = matchCase;
    if(collapse)
      this.collapse = collapse;
    // convert regex filters immediately to catch syntax errors, normal filters on-demand
    if(regexpSource.length >= 2 && regexpSource[0] == '/' && regexpSource[regexpSource.length - 1] == '/'){
      let regexp = new RegExp(regexpSource.substr(1, regexpSource.length - 2), this.matchCase ? '' : 'i');
      Object.defineProperty(this, 'regexp', {value: regexp});
    }else{
      this.regexpSource = regexpSource;
    }
  }

  matches(data){
    return this.regexp.test(data);
  }

  static fromParts(text, optionsStr=''){
    // text is not stored to save memory
    let matchCase = false;
    let collapse = false;
    let options = optionsStr.toUpperCase().split(',');
    for(let option of options){
      switch(option){
        case 'MATCH_CASE': matchCase = true; break;
        case 'COLLAPSE': collapse = true; break;
        case '': break;
        default:
          return new InvalidFilter(`Unknown option: ${option}`);
      }
    }
    return new RegExpFilter(text, matchCase, collapse);
  }
}

RegExpFilter.prototype.matchCase = false;
RegExpFilter.prototype.collapse = false;

export class MultiRegExpFilter extends ActiveFilter {
  constructor(text, filters){
    ActiveFilter.call(this, text);
    for(let filter of filters){
      if(filter)
        filter.parent = this;
    }
    this.filters = filters;
  }

  get collapse(){
    for(let filter of this.filters)
      if(filter.collapse)
        return true;
    return false;
  }

  static fromText(text){
    let origText = text;
    let filters = [];
    let blocking = true;
    if(text.indexOf('@@') === 0){
      blocking = false;
      text = text.substr(2);
    }
    let parts = text.split(/\$([\w,]*?)(?:\$|$)/);
    for(let i = 0; i < parts.length; i += 2){
      let [part, options] = [parts[i], parts[i+1]];
      if(!part)
        continue;
      for(let j = filters.length*2; j < i; j += 2)
        filters.push(null);
      let filter = RegExpFilter.fromParts(part, options);
      if(filter instanceof InvalidFilter)
        return InvalidFilter(part);
      filters.push(filter);
    }
    return blocking ? new BlockingFilter(origText, filters) : new WhitelistFilter(origText, filters);
  }
}

export class BlockingFilter extends MultiRegExpFilter {}
export class WhitelistFilter extends MultiRegExpFilter {}
