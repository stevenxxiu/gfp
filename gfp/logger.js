import Config from 'gfp/config';

export let Logger = {
	msg(msg){
		console.log(msg);
	},

	error(msg){
		console.log(`Error: ${msg}`);
	}
};

export let LogTime = {
	curTime: null,

	start(){
		LogTime.curTime = new Date().getTime();
	},

	snap(msg){
		console.log(`${msg}: ${new Date().getTime() - LogTime.curTime}ms`);
	},

	restart(msg){
		LogTime.snap(msg);
		LogTime.start();
	},

	profile(obj, funcName){
		let func = obj[funcName];
		obj[funcName] = () => {
			this.start();
			let res = func.apply(this, arguments);
			this.snap(funcName);
			return res;
		};
	}
};

if(!Config.logTime){
	for(let key of Object.keys(LogTime)){
		if(LogTime[key].constructor == Function)
			LogTime[key] = () => null;
	}
}
