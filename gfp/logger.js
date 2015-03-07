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
    this.curTime = new Date().getTime();
  },

  snap(msg){
    console.log(`${msg}: ${new Date().getTime() - this.curTime}ms`);
  }
};

if(!Config.logTime){
  for(let key in LogTime){
    if(LogTime[key].constructor == Function)
      LogTime[key] = () => null;
  }
}
