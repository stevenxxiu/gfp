import {WhitelistFilter} from 'gfp/filter';
import {Matcher} from 'gfp/lib/matcher';

class SubMatcher extends Matcher {
  clear(){
    this.filterByKeyword = new Map();
  }

  add(filter){
    // duplicates are ignored for memory efficiency, otherwise we need to store subfilter text maps.
    let keyword = this.findKeyword(filter);
    let oldEntry = this.filterByKeyword.get(keyword);
    if(typeof oldEntry == 'undefined'){
      this.filterByKeyword.set(keyword, filter);
    }else if(oldEntry.length == 1){
      this.filterByKeyword.set(keyword, [oldEntry, filter]);
    }else{
      oldEntry.push(filter);
    }
  }

  remove(){
    throw 'not implemented';
  }

  hasFilter(){
    throw 'not implemented';
  }

  getKeywordForFilter(){
    throw 'use findKeyword() instead';
  }

  *_iterMatches(keyword, data, parents=null){
    let list = this.filterByKeyword.get(keyword);
    for(let filter of list){
      if((!parents || parents.has(filter.parent)) && filter.matches(data))
        yield filter;
    }
  }

  *iterMatches(data, parents=null){
    let candidates = data.toLowerCase().match(/[a-z0-9%]{3,}/g);
    if(candidates === null)
      candidates = [];
    candidates.push('');
    for(let keyword of candidates){
      if(this.filterByKeyword.has(keyword)){
        for(let res of this._checkEntryMatch(keyword, data, parents))
          yield res;
      }
    }
  }
}

export class MultiMatcher {
  constructor(n){
    this.n = n;
    this.matchers = [];
    for(let i = 0; i < n; i++)
      this.matchers.push(new SubMatcher());
  }

  clear(){
    for(let i = 0; i < this.n; i++)
      this.matchers[i].clear();
  }

  add(filter){
    // duplicates are ignored for memory efficiency
    for(let i = 0; i < this.n; i++){
      let subfilter = filter.filters[i];
      if(subfilter)
        this.matchers[i].add(subfilter);
    }
  }

  matchesAny(data, attrs){
    let prevFilters = null;
    let curFilters = new Set();
    for(let i = 0; i < this.n; i++){
      for(let subfilter of this.matchers.iterMatches(i, data[attrs[i]], prevFilters)){
        if(subfilter.parent.filters.length == 1)
          return subfilter.parent;
        if(i != this.n - 1)
          curFilters.add(subfilter.parent);
      }
      prevFilters = curFilters;
      curFilters = new Set();
    }
    return null;
  }
}

export class CombinedMultiMatcher {
  constructor(n){
    // caching is not required since we have one instance per tab, and past filter results are easily accessible
    this.blacklist = new MultiMatcher();
    this.whitelist = new MultiMatcher();
  }

  clear(){
    this.blacklist.clear();
    this.whitelist.clear();
  }

  add(filter){
    if (filter instanceof WhitelistFilter){
      this.whitelist.add(filter);
    }else{
      this.blacklist.add(filter);
    }
  }

  isSlowFilter(filter){
    let matcher = (filter instanceof WhitelistFilter ? this.whitelist : this.blacklist);
    return !matcher.findKeyword(filter);
  }

  matchesAny(data, attrs){
    return this.whitelist.matchesAny(data, attrs) || this.blacklist.matchesAny(data, attrs);
  }
}
