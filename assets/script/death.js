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
        DeathNode:cc.Node,
        Background:cc.Node,
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        // 开启物理系统
        cc.director.getPhysicsManager().enabled = true;
       
        // 创建插屏广告实例，提前初始化
        if (wx.createInterstitialAd){
            interstitialAd = wx.createInterstitialAd({
            adUnitId: 'adunit-ff8f2ee77c384d1e'
            })
        }
    },

    start () {

    },

    // 西瓜碰撞死亡
    onCollisionEnter: function(other, self){
        console.log("死亡");
        // 保存数据
        var best = cc.sys.localStorage.getItem("score");
        if(best === null || best === undefined || best === "" || Number(best) < Number(window.SCORE)){
            cc.sys.localStorage.setItem('score', window.SCORE);
        }
        this.DeathNode.setPosition(cc.v2(0,0));
        this.Background.off("touchstart", this.WatermelonDown, this)
        // 结算本局金币奖励
        var reward = CoinManager.settleScore(window.SCORE);
        if(reward > 0 && window.wx){
            wx.showToast({ title: '+' + reward + ' 金币', icon: 'none' });
        }
        // 在适合的场景显示插屏广告
        if (interstitialAd) {
            interstitialAd.show().catch((err) => {
            console.error(err)
            })
        }
    },

    // update (dt) {},
});
