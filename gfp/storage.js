
//string operations

stringifyRawS: function(filters,buffer,simpleStore){
  /**
  stringify a sub, uncompiled filter
  */
  let serialize=ActiveFilter.prototype.serialize;
  for(let text in filters){
    let filter=filters[text];
    filter=filter[filter.length-1];
    let o_len=buffer.length;
    filter.text=escape(text);
    serialize.call(filter,buffer);
    if(buffer.length==o_len){
      simpleStore.push(text);
    }
  }
},

stringifyRawC: function(filters,buffer,simpleStore,isSub){
  /**
  stringify a compiled filter
  */
  for each(let filter in filters){
    if('subfilters' in filter){
      if(filter.compiled){
        gfpFilter.stringifyRawC(filter.subfilters,buffer,simpleStore,true);
      }else{
        gfpFilter.stringifyRawS(filter.subfilters,buffer,simpleStore);
      }
    }else{
      let o_len=buffer.length;
      let text=isSub?filter.fullText:filter.text;
      filter.text=escape(text);
      filter.serialize(buffer);
      filter.text=text;
      if(buffer.length==o_len){
        //simpleStore does not need escaping
        simpleStore.push(text);
      }
    }
  }
},

stringify: function(filters){
  let buffer=[];
  let simpleStore=['[Simple Store]'];
  gfpFilter.stringifyRawC(filters,buffer,simpleStore,false);
  let ret='';
  if(buffer.length!=0) ret+=buffer.join('\n')+'\n';
  ret+=simpleStore.join('\n');
  return ret;
},

_parse: function(s,fromObject){
  /**
  verifies s
  returns: parsed filters
  */
  let ret={};
  let buffer=s.split('\n');
  let i=0;
  for(i=0;i<buffer.length;){
    if(buffer[i]=='[Filter]'){
      let filter={};
      for(i++;buffer[i][0]!='[' && i<buffer.length;i++){
        let [key,val]=buffer[i].split('=');
        filter[key]=val;
      }
      if(filter.text==undefined){
        throw 'invalid serialized string';
      }
      filter.text=unescape(filter.text);
      fromObject(filter,ret);
    }else if(buffer[i]=='[Simple Store]'){
      i++;
      break;
    }else{
      throw 'invalid serialized string';
    }
  }
  if(i==0 && i<buffer.length){
    throw 'invalid serialized string';
  }
  for(;i<buffer.length;i++){
    gfpFilter.fromText(buffer[i],ret);
  }
  return ret;
},

parse: function(s){
  return gfpFilter._parse(s,gfpFilter.fromObject);
},

parseCompiled: function(s){
  return gfpFilter._parse(s,gfpFilter.fromObjectCompiled);
},

//Filter class hooks

fromObject: function(obj,filters){
  let ret=gfpFilter.fromText(obj.text,filters);
  if(ret instanceof ActiveFilter || ret.constructor==Object){
    if('disabled' in obj)
      ret.disabled=(obj.disabled=='true');
    if('hitCount' in obj)
      ret.hitCount=parseInt(obj.hitCount)||0;
    if('lastHit' in obj)
      ret.lastHit=parseInt(obj.lastHit)||0;
  }
  return ret;
},

fromObjectCompiled: function(obj,filters){
  let ret=gfpFilter.fromTextCompiled(obj.text,filters);
  if(!ret) return null;
  if(ret instanceof ActiveFilter || ret.constructor==Object){
    if('disabled' in obj)
      ret.disabled=(obj.disabled=='true');
    if('hitCount' in obj)
      ret.hitCount=parseInt(obj.hitCount)||0;
    if('lastHit' in obj)
      ret.lastHit=parseInt(obj.lastHit)||0;
  }
  return ret;
},

//storage

flush: function(filters){
  /**
  flushes filters to Filter.knownFilters
  */
  Filter.knownFilters=filters;
},

isPtr: function(filters){
  return Filter.knownFilters==filters;
},

save: function(){
  GM_setValue('filters',gfpFilter.stringify(Filter.knownFilters));
},

load: function(){
  let s=GM_getValue('filters');
  if(s==undefined){
    //load filters from default config
    let textFilters=config.filters;
    let filters=Filter.knownFilters;
    for(let i=0;i<textFilters.length;i++){
      gfpFilter.fromText(textFilters[i],filters);
    }
    gfpFilter.save();
  }else{
    gfpFilter.flush(gfpFilter.parse(s));
  }
},

//init
