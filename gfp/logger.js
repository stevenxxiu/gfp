export let LogTime = {
  curTime: null,

  start(){
    this.curTime = new Date().getTime()
  },

  snap(msg){
    console.log(`${msg}: ${new Date().getTime() - this.curTime}ms`)
  },
}
