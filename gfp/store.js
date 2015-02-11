/* globals GM_getValue, GM_setValue */
import {Filter} from 'gfp/filter';

export class FilterStore {
  static dump(filters){
    let res = [];
    for(let filter of filters)
      res.push(filter.toObject());
    GM_setValue('filters', JSON.stringify(res));
  }

  static load(){
    let res = [];
    for(let obj of JSON.parse(GM_getValue('filters', '[]')))
      res.push(Filter.fromObject(obj));
    return res;
  }
}
