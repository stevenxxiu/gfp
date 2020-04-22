import { ActiveFilter, Filter as Filter_, InvalidFilter, RegExpFilter as RegExpFilter_ } from 'gfp/lib/filterClasses'

const RegExpFilter__ = Object.assign(new Function(), RegExpFilter_, { prototype: RegExpFilter_.prototype })
export class RegExpFilter extends RegExpFilter__ {
  constructor(regexpSource, matchCase, collapse) {
    super()
    if (matchCase) {
      this.matchCase = matchCase
    }
    if (collapse) {
      this.collapse = collapse
    }
    // convert regex filters immediately to catch syntax errors, normal filters on-demand
    if (regexpSource.length >= 2 && regexpSource.startsWith('/') && regexpSource.endsWith('/')) {
      const regexp = new RegExp(regexpSource.substr(1, regexpSource.length - 2), this.matchCase ? '' : 'i')
      Object.defineProperty(this, 'regexp', { value: regexp })
    } else {
      this.regexpSource = regexpSource
    }
  }

  matches(data) {
    return this.regexp.test(data)
  }

  static fromParts(text, optionsStr = '') {
    // text is not stored to save memory
    let matchCase = false
    let collapse = false
    const options = optionsStr.toUpperCase().split(',')
    for (const option of options) {
      switch (option) {
        case 'MATCH_CASE':
          matchCase = true
          break
        case 'COLLAPSE':
          collapse = true
          break
        case '':
          break
        default:
          return new InvalidFilter(`Unknown option: ${option}`)
      }
    }
    return new RegExpFilter(text, matchCase, collapse)
  }

  *[Symbol.iterator]() {
    yield this
  }
}

RegExpFilter.prototype.matchCase = false
RegExpFilter.prototype.collapse = false
// index to all subfilters
RegExpFilter.prototype.index = 0
// index to all non-null subfilters
RegExpFilter.prototype.dataIndex = 0

const ActiveFilter_ = Object.assign(new Function(), ActiveFilter, { prototype: RegExpFilter_.prototype })
export class MultiRegExpFilter extends ActiveFilter_ {
  constructor(text, filters) {
    super()
    this.text = text
    this.filters = filters
    for (const filter of filters) {
      filter.parent = this
    }
  }

  get collapse() {
    for (const filter of this.filters) {
      if (filter.collapse) {
        return true
      }
    }
    return false
  }

  static fromText(text) {
    const origText = text
    let filters = []
    let blocking = true
    if (text.indexOf('@@') === 0) {
      blocking = false
      text = text.substr(2)
    }
    const parts = text.split(/\$([\w,]*?)(?:\$|$)/)
    for (let i = 0; i < parts.length; i += 2) {
      const [part, options] = [parts[i], parts[i + 1]]
      if (!part) {
        continue
      }
      const filter = RegExpFilter.fromParts(part, options)
      if (filter instanceof InvalidFilter) {
        return new InvalidFilter(text)
      }
      if (i > 0) {
        filter.index = i / 2
      }
      if (filters.length > 0) {
        filter.dataIndex = filters.length
      }
      filters.push(filter)
    }
    if (filters.length == 1) {
      filters = filters[0]
    }
    return blocking ? new BlockingFilter(origText, filters) : new WhitelistFilter(origText, filters)
  }
}

export const Filter = Filter_

Filter.fromObject = function (text, obj) {
  const res = Filter.fromText(text)
  if (res instanceof ActiveFilter) {
    if ('disabled' in obj) {
      res._disabled = obj.disabled === true
    }
    if ('hitCount' in obj) {
      res._hitCount = parseInt(obj.hitCount) || 0
    }
    if ('lastHit' in obj) {
      res._lastHit = parseInt(obj.lastHit) || null
    }
  }
  return res
}

Filter.prototype.toObject = function () {
  const res = {}
  if (this instanceof ActiveFilter) {
    if (this._disabled) {
      res.disabled = true
    }
    if (this._hitCount) {
      res.hitCount = this._hitCount
    }
    if (this._lastHit) {
      res.lastHit = this._lastHit
    }
  }
  return res
}

Filter.fromText = MultiRegExpFilter.fromText

export class BlockingFilter extends MultiRegExpFilter {}
export class WhitelistFilter extends MultiRegExpFilter {}
