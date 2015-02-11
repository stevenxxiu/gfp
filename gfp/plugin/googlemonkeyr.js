
export default {
  /**
  filters results whenever googlemonkeyr adds a results page
  the initial results page (including the initial page of instant results) is not processed by this extension
  */

  init: function(){
    o_getResults=searchGui.getResults;
    searchGui.getResults=function(){
      return _$('GoogleTabledResults') || o_getResults();
    };

    let o_getResultType=searchGui.getResultType;
    searchGui.getResultType=function(node,filterClass){
      if(node==null)
        return null;
      else if(node.id=='GoogleTabledResults')
        return searchGui.r.res;
      else
        return o_getResultType(node,filterClass);
    };
  },

  loaded: function(){
    let isDescendent=function(node,ancestor){
      while(node){
        if(node==ancestor)
          return true;
        node=node.parentNode;
      }
      return false;
    }

    let procNodeNum=0;

    let resultsObserver=new MutationObserver(function(mutations){
      mutations.forEach(function(mutation){
        for(let i=0;i<mutation.addedNodes.length;i++){
          node=mutation.addedNodes[i];
          if(!node || node.nodeName!='LI'){
            continue;
          }
          if(procNodeNum>0){
            procNodeNum--;
            continue;
          }
          let res=searchGui._filterResults(node,searchGui.r.res);
          if(res){
            searchGui.remNodes.push(res);
          }
          //the pref window could be opened before loading the next page
          //  and it isn't known whether there are new hits, so default to this being false
          prefMeta.isUpdated=false;
          gfpFilter.save();
        }
      });
    });

    let observeResults=function(results){
      //use parentNode, since googlemonkeyr creates the 'GoogleTabledResults' node and add results there, the results node won't have anything added to it
      resultsObserver.observe(results.parentNode,{childList: true, subtree: true});
    };

    let results=searchGui.getResults();
    if(results){
      if(!_$('GoogleMonkeyRLink')){
        procNodeNum=searchGui.r.res.getResults(results).length;
      }
      observeResults(results);
    }
    //use instant if the extension's enabled
    if(config.ext.indexOf('instant')>-1){
      window.addEventListener('instantResults',function(e){
        results=searchGui.getResults();
        //googlemonkeyr moves existing results nodes into the 'GoogleTabledResults' node created by it, these are already processed so don't process them again
        //we run after googlemnokeyr due to our own event being triggered
        procNodeNum=searchGui.r.res.getResults(results).length;
        observeResults(results);
      },false);
    }
  },
};
