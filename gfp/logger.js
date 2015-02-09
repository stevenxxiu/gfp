
let logger={
	msg: GM_log,
	
	error: function(msg) GM_log('Error: '+msg),
	
	init: function(){
		if(!config.logTime){
			for(let key in logTime){
				if(logTime[key].constructor==Function){
					logTime[key]=function(){};
				}
			}
		}
	},
}

let logTime={
	currTime: null,
	
	start: function(){
		logTime.currTime=new Date().getTime();
	},
	
	snap: function(msg){
		GM_log(msg+': '+(new Date().getTime()-logTime.currTime)+'ms');
	},
	
	end: function(msg){
		logTime.snap(msg);
		logTime.currTime=null;
	},
	
	restart: function(msg){
		logTime.snap(msg);
		logTime.start();
	},
	
	profile: function(parent,funcName){
		let tTime=0;
		let func=parent[funcName];
		
		parent[funcName]=function(){
			let currTime=new Date().getTime();
			let ret=func.apply(this,arguments);
			tTime+=new Date().getTime()-currTime;
			return ret;
		};
		
		this.snap=function(msg){
			GM_log(msg+': '+tTime+'ms');
		};
		
		this.end=function(msg){
			this.snap(msg);
			tTime=0;
		};
	},
};
