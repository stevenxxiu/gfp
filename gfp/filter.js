import {ActiveFilter, Filter, InvalidFilter, RegExpFilter} from 'gfp/lib/filterClasses';

Filter.prototype.toObject = function(){
  let res = Object.create(null);
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

class RegExpFilter extends RegExpFilter {
  constructor(text, regexpSource, matchCase, collapse){
    ActiveFilter.call(this, text);
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

  static fromParts(text, optionsStr){
    if(optionsStr)
      text += `$${optionsStr}`;
    let matchCase = false;
    let collapse = true;
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
    return new RegExpFilter(text, options);
  }
}

export class MultiRegExpFilter extends ActiveFilter {
  constructor(filters){
    // text is stored in subfilters to save memory
    super();
    for(let filter of filters){
      if(filter)
        filter.parent = this;
    }
    this.filters = filters;
  }

  get text(){
    let parts = [];
    for(let filter of this.filters)
      parts.push(filter.text);
    return parts.join('$');
  }

  get collapse(){
    for(let filter of this.filters)
      if(filter.collapse)
        return true;
    return false;
  }

  static fromText(text){
    let filters = [];
    let blocking = true;
    if(text.indexOf('@@') === 0){
      blocking = false;
      text = text.substr(2);
    }
    let parts = text.split(/\$([\w,]*?)(?:\$|$)/);
    for(let i = 0; i < parts.length; i += 2){
      let [part, options] = [parts[i], parts[i+1]];
      if(!part){
        filters.push(null);
      }else{
        let filter = RegExpFilter.fromParts(part, options);
        if(filter instanceof InvalidFilter)
          return InvalidFilter(part);
        filters.push(RegExpFilter.fromParts(part, options));
      }
    }
    return blocking ? new BlockingFilter(filters) : WhitelistFilter(filters);
  }
}

export class BlockingFilter extends MultiRegExpFilter {}
export class WhitelistFilter extends MultiRegExpFilter {
  get text(){
    return '@@' + super.text;
  }
}
