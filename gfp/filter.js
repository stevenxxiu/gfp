import {ActiveFilter, Filter as Filter_, InvalidFilter, RegExpFilter as RegExpFilter_} from 'gfp/lib/filterClasses';

export class RegExpFilter extends RegExpFilter_ {
  constructor(regexpSource, matchCase, collapse){
    if(matchCase)
      this.matchCase = matchCase;
    if(collapse)
      this.collapse = collapse;
    // convert regex filters immediately to catch syntax errors, normal filters on-demand
    if(regexpSource.length >= 2 && regexpSource.startsWith('/') && regexpSource.endsWith('/')){
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

  *[Symbol.iterator](){
    yield this;
  }
}

RegExpFilter.prototype.matchCase = false;
RegExpFilter.prototype.collapse = false;
RegExpFilter.prototype.index = 0;
RegExpFilter.prototype.dataIndex = 0;

export class MultiRegExpFilter extends ActiveFilter {
  constructor(text, filters){
    this.text = text;
    this.filters = filters;
    for(let filter of filters)
      filter.parent = this;
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
      let filter = RegExpFilter.fromParts(part, options);
      if(filter instanceof InvalidFilter)
        return new InvalidFilter(text);
      if(i > 0)
        filter.index = i/2;
      if(filters.length > 0)
        filter.dataIndex = filters.length;
      filters.push(filter);
    }
    if(filters.length == 1)
      filters = filters[0];
    return blocking ? new BlockingFilter(origText, filters) : new WhitelistFilter(origText, filters);
  }
}

export let Filter = Filter_;

Filter.fromObject = function(text, obj){
  let res = Filter.fromText(text);
  if(res instanceof ActiveFilter){
    if('disabled' in obj)
      res._disabled = (obj.disabled == 'true');
    if('hitCount' in obj)
      res._hitCount = parseInt(obj.hitCount) || 0;
    if('lastHit' in obj)
      res._lastHit = parseInt(obj.lastHit) || 0;
  }
  return res;
};

Filter.prototype.toObject = function(){
  let res = {};
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

Filter.fromText = MultiRegExpFilter.fromText;

export class BlockingFilter extends MultiRegExpFilter {}
export class WhitelistFilter extends MultiRegExpFilter {}
