import { WhitelistFilter } from 'gfp/filter'
import { Matcher } from 'gfp/lib/matcher'

export class SubMatcher extends Matcher {
  static _findCandidates(filter) {
    if (filter.regexpSource === null) return null
    return filter.regexpSource.toLowerCase().match(/[^a-z0-9%*][a-z0-9%]{3,}(?=[^a-z0-9%*])/g)
  }

  static isSlowFilter(filter) {
    return !this._findCandidates(filter)
  }

  findKeyword(filter) {
    let res = ''
    const candidates = this.constructor._findCandidates(filter)
    if (candidates === null) return res
    let resCount = 0xffffff
    let resLength = 0
    for (let candidate of candidates) {
      candidate = candidate.substr(1)
      let count = this.filterByKeyword.has(candidate) ? this.filterByKeyword.get(candidate).length : 0
      if (count < resCount || (count == resCount && candidate.length > resLength)) {
        res = candidate
        resCount = count
        resLength = candidate.length
      }
    }
    return res
  }

  add(filter) {
    // Duplicates are rare and not checked for efficiency, otherwise we need to store sub filter text maps, and multiple
    // parents per sub filter.
    const keyword = this.findKeyword(filter)
    const prevEntry = this.filterByKeyword.get(keyword)
    if (prevEntry === undefined) {
      this.filterByKeyword.set(keyword, filter)
    } else if (prevEntry.length == 1) {
      this.filterByKeyword.set(keyword, [prevEntry, filter])
    } else {
      prevEntry.push(filter)
    }
  }

  remove(filter) {
    // only used by pref, doesn't need to be efficient
    let candidates = this.constructor._findCandidates(filter)
    if (candidates === null) candidates = ['']
    for (let candidate of candidates) {
      candidate = candidate.substr(1)
      const prevEntry = this.filterByKeyword.get(candidate)
      if (prevEntry === undefined) {
      } else if (prevEntry.length == 1) {
        if (prevEntry == filter) {
          this.filterByKeyword.delete(candidate)
          break
        }
      } else {
        const i = prevEntry.indexOf(filter)
        if (i > -1) {
          if (prevEntry.length == 2) this.filterByKeyword.set(candidate, prevEntry[1 - i])
          else prevEntry.splice(i, 1)
          break
        }
      }
    }
  }

  clear() {
    this.filterByKeyword = new Map()
  }

  hasFilter() {
    throw 'not implemented'
  }

  getKeywordForFilter() {
    throw 'not implemented'
  }

  *_iterMatches(filters, data, parents) {
    for (const filter of filters) {
      const parent = filter.parent
      if ((filter.dataIndex === 0 || parents.has(parent)) && filter.matches(data)) yield filter
    }
  }

  *iterMatches(data, parents) {
    /**
    args:
      parents: All parent filters matched so far, excluding the ones whose subFilters have so far been null.
    */
    if (data === null) return
    let candidates = data.toLowerCase().match(/[a-z0-9%]{3,}/g)
    if (candidates === null) candidates = []
    candidates.push('')
    for (const keyword of candidates) {
      const filters = this.filterByKeyword.get(keyword)
      if (filters) {
        for (const res of this._iterMatches(filters, data, parents)) yield res
      }
    }
  }
}

export class MultiMatcher {
  constructor(n) {
    this.n = n
    this.matchers = []
    for (let i = 0; i < n; i++) this.matchers.push(new SubMatcher())
  }

  static isSlowFilter(filter) {
    for (const subFilter of filter.filters) {
      if (SubMatcher.isSlowFilter(subFilter)) return true
    }
    return false
  }

  add(filter) {
    if (filter.disabled) return
    for (const subFilter of filter.filters) this.matchers[subFilter.index].add(subFilter)
  }

  remove(filter) {
    for (const subFilter of filter.filters) this.matchers[subFilter.index].remove(subFilter)
  }

  clear() {
    for (const matcher of this.matchers) matcher.clear()
  }

  matchesAny(data, attrs) {
    // for each filter, nextNullNum counts how many subfilters there are left until the next non-null subfilter
    // {filter: nextNullNum}
    let [prevFilters, curFilters] = [new Map(), new Map()]
    for (let i = 0; i < this.n; i++) {
      for (const subFilter of this.matchers[i].iterMatches(data[attrs[i]], prevFilters)) {
        if (subFilter.dataIndex == subFilter.parent.filters.length - 1) return subFilter.parent
        curFilters.set(subFilter.parent, subFilter.parent.filters[subFilter.dataIndex + 1].index - i)
      }
      if (i != this.n - 1) {
        // include null subFilters whose parents have so far matched
        for (const [filter, nextNullNum] of prevFilters.entries()) {
          if (nextNullNum > 0) curFilters.set(filter, nextNullNum - 1)
        }
        [prevFilters, curFilters] = [curFilters, new Map()]
      }
    }
    return null
  }
}

export class CombinedMultiMatcher {
  constructor(n) {
    // caching is not required since we have one instance per tab, and past filter results are easily accessible
    this.blacklist = new MultiMatcher(n)
    this.whitelist = new MultiMatcher(n)
  }

  static isSlowFilter(filter) {
    return MultiMatcher.isSlowFilter(filter)
  }

  add(filter) {
    if (filter instanceof WhitelistFilter) {
      this.whitelist.add(filter)
    } else {
      this.blacklist.add(filter)
    }
  }

  remove(filter) {
    if (filter instanceof WhitelistFilter) {
      this.whitelist.remove(filter)
    } else {
      this.blacklist.remove(filter)
    }
  }

  clear() {
    this.blacklist.clear()
    this.whitelist.clear()
  }

  matchesAny(data, attrs) {
    return this.whitelist.matchesAny(data, attrs) || this.blacklist.matchesAny(data, attrs)
  }
}
