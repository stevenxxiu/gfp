
export default {
  init: function(){
    //initialize searchGui if we haven't already (e.g. on the home page)
    if(!searchGui.initialized)
      searchGui.init();

    //results parent node
    let resultsNode;
    //pref link
    let _prefLink;

    let resultsObserver=new MutationObserver(function(mutations){
      mutations.forEach(function(mutation) {
        //filter nodes whenever they are added, instead of doing batch filters
        for(let i=0;i<mutation.addedNodes.length;i++){
          addedNode=mutation.addedNodes[i];
          if(addedNode.id=='ires'){
            //update prefLink (google instant inserts a new one every time)
            if(!_prefLink || !isInDom(_prefLink))
              _prefLink=prefLink.createLinkSettings();
            //we have a new query, google only adds this node with all results added (to test this properly, disable all other userscripts)
            searchGui.filterResults();
            prefMeta.isUpdated=false;
            //other extensions might use this
            window.dispatchEvent(new CustomEvent('instantResults'));
          }
        };
      });
    });

    let mainNode=document.getElementById('main');
    if(!mainNode)
      return false;
    resultsObserver.observe(mainNode,{subtree: true, childList: true});
  },
};
