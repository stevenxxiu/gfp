/* globals GM_getValue, GM_setValue */
import {Filter} from 'gfp/filter';

export default {
  // enabled plugins
  plugins: ['customSearch', 'instant'],
  // log component times
  logTime: true,

  get allowHidden(){
    // allow hiding of filter results
    return GM_getValue('allowHidden', true);
  },

  set allowHidden(value){
    GM_setValue('allowHidden', value);
  },

  get filters(){
    let res = [];
    for(let obj of JSON.parse(GM_getValue('filters', '[]')))
      res.push(Filter.fromObject(obj));
    return res;
  },

  set filters(filters){
    let res = [];
    for(let filter of filters)
      res.push(filter.toObject());
    GM_setValue('filters', JSON.stringify(res));
  },
};
