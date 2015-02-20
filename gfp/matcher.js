import {WhitelistFilter} from 'gfp/filter';
import {Matcher} from 'gfp/lib/matcher';

export class SubMatcher extends Matcher {
  clear(){
    this.filterByKeyword = new Map();
  }

  static _findCandidates(filter){
    if(filter.regexpSource === null)
      return null;
    return filter.regexpSource.toLowerCase().match(/[^a-z0-9%*][a-z0-9%]{3,}(?=[^a-z0-9%*])/g);
  }

  static isSlowFilter(filter){
    return !this._findCandidates(filter);
  }

  findKeyword(filter){
    let res = '';
    let candidates = this.constructor._findCandidates(filter);
    if (!candidates)
      return res;
    let hash = this.filterByKeyword;
    let resCount = 0xFFFFFF;
    let resLength = 0;
    for(let i = 0, l = candidates.length; i < l; i++){
      let candidate = candidates[i].substr(1);
      let count = (candidate in hash ? hash[candidate].length : 0);
      if(count < resCount || (count == resCount && candidate.length > resLength)){
        res = candidate;
        resCount = count;
        resLength = candidate.length;
      }
    }
    return res;
  }

  add(filter){
    // duplicates are ignored for memory efficiency, otherwise we need to store subFilter text maps.
    let keyword = this.findKeyword(filter);
    let oldEntry = this.filterByKeyword.get(keyword);
    if(oldEntry === undefined){
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

  *_iterMatches(filters, data, parents){
    for(let filter of filters){
      let parent = filter.parent;
      if((filter.dataIndex === 0 || parents.has(parent)) && filter.matches(data))
        yield filter;
    }
  }

  *iterMatches(data, parents){
    /**
    Args:
      parents: All parent filters matched so far, excluding the ones whose subFilters have so far been null.
    */
    let candidates = data.toLowerCase().match(/[a-z0-9%]{3,}/g);
    if(candidates === null)
      candidates = [];
    candidates.push('');
    for(let keyword of candidates){
      let filters = this.filterByKeyword.get(keyword);
      if(filters){
        for(let res of this._iterMatches(filters, data, parents))
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
    for(let matcher of this.matchers)
      matcher.clear();
  }

  static isSlowFilter(filter){
    for(let subFilter of filter.filters){
      if(SubMatcher.isSlowFilter(subFilter))
        return true;
    }
    return false;
  }

  add(filter){
    // duplicates are ignored for memory efficiency
    for(let subFilter of filter.filters)
      this.matchers[subFilter.index].add(subFilter);
  }

  matchesAny(data, attrs){
    // {filter: nextNullNum}
    let [prevFilters, curFilters] = [new Map(), new Map()];
    for(let i = 0; i < this.n; i++){
      let hasNext = i != this.n - 1;
      for(let subFilter of this.matchers[i].iterMatches(data[attrs[i]], prevFilters)){
        if(subFilter.dataIndex == subFilter.parent.filters.length - 1)
          return subFilter.parent;
        if(hasNext)
          curFilters.set(subFilter.parent, subFilter.parent.filters[subFilter.dataIndex + 1].index - i);
      }
      if(hasNext){
        // include null subFilters whose parents have so far matched
        for(let [filter, nextNullNum] of prevFilters.entries()){
          if(nextNullNum > 0)
            curFilters.set(filter, nextNullNum - 1);
        }
        [prevFilters, curFilters] = [curFilters, new Map()];
      }
    }
    return null;
  }
}

export class CombinedMultiMatcher {
  constructor(n){
    // caching is not required since we have one instance per tab, and past filter results are easily accessible
    this.blacklist = new MultiMatcher(n);
    this.whitelist = new MultiMatcher(n);
  }

  clear(){
    this.blacklist.clear();
    this.whitelist.clear();
  }

  static isSlowFilter(filter){
    return MultiMatcher.isSlowFilter(filter);
  }

  add(filter){
    if(filter instanceof WhitelistFilter){
      this.whitelist.add(filter);
    }else{
      this.blacklist.add(filter);
    }
  }

  matchesAny(data, attrs){
    return this.whitelist.matchesAny(data, attrs) || this.blacklist.matchesAny(data, attrs);
  }
}
