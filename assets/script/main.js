// Learn cc.Class:
//  - https://docs.cocos.com/creator/manual/en/scripting/class.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

var CoinManager = require('./CoinManager');

cc.Class({
    extends: cc.Component,

    properties: {
       
    },

    // LIFE-CYCLE CALLBACKS:

     onLoad () {
         if(cc.sys.localStorage.getItem("score") == null){
             console.log("无最高得分");
             cc.sys.localStorage.setItem('score', window.SCORE);
             console.log(cc.sys.localStorage.getItem("score"));
         }else{
             console.log("最高得分", cc.sys.localStorage.getItem("score"));
         }

         // 同步获取屏幕尺寸，确保创建广告前拿到真实宽高
         var sysInfo = wx.getSystemInfoSync();
         window.s_width = sysInfo.screenWidth;
         window.s_height = sysInfo.screenHeight;

         // 每日签到发放金币
         var sign = CoinManager.dailySign();
         if(sign.ok && window.wx){
             wx.showToast({ title: '签到成功 +' + sign.coin + ' 金币', icon: 'none' });
         }

         // 创建原生广告
         customAd = wx.createCustomAd({
            adUnitId: 'adunit-afa7553d5987db0e',
            adIntervals: 30,
            style: {
                left: window.s_width * 0.12,
                top: window.s_height * 0.68,
            }
         });
         
         customAd.onError(err => {
            console.log(err)
         });

         customAd.show()
     },

    start () {

    },

    //开始游戏加载游戏场景
    startGame()
    {
        customAd.destroy()
        cc.director.loadScene("game_scene");
    },

    exitGame()
    {
        cc.game.end();
    }

});
