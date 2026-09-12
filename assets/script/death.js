// Learn cc.Class:
//  - https://docs.cocos.com/creator/manual/en/scripting/class.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

var CoinManager = require('./CoinManager');
var RankManager = require('./RankManager');

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
       
        // 创建插屏广告实例（仅创建一次并复用，避免反复进出场景重复创建触发广告系统报错）
        if (window.wx && wx.createInterstitialAd && !interstitialAd){
            interstitialAd = wx.createInterstitialAd({
            adUnitId: 'adunit-ff8f2ee77c384d1e'
            })
        }

        // 静止结算判定相关状态
        this.watching = [];          // 进入死亡线区域、等待静止的水果：{node, frames}
        this.gameOver = false;       // 本局是否已结算
        this._flashAcc = 0;          // 死亡线闪烁计时
        this._flashOn = false;       // 死亡线当前是否处于闪烁亮态
        this._deathSprite = this.node.getComponent(cc.Sprite);
    },

    start () {

    },

    // 水果触碰死亡线：不立即结束，等待其静止后再判定
    onCollisionEnter: function(other, self){
        if(this.gameOver){
            return;
        }
        var node = other && other.node;
        if(!node || !cc.isValid(node)){
            return;
        }
        // 已在监测列表中则忽略
        for(var i = 0; i < this.watching.length; i++){
            if(this.watching[i].node === node){
                return;
            }
        }
        this.watching.push({ node: node, frames: 0 });
        log("进入死亡线区域，等待静止", this.watching.length);
    },

    // 水果离开死亡线区域（弹回安全区）：取消监测
    onCollisionExit: function(other, self){
        var node = other && other.node;
        if(!node){
            return;
        }
        this._removeWatching(node);
    },

    _removeWatching(node){
        for(var i = this.watching.length - 1; i >= 0; i--){
            if(this.watching[i].node === node){
                this.watching.splice(i, 1);
            }
        }
    },

    update: function(dt){
        // 死亡线视觉提示：监测期间红色闪烁
        this._updateFlash(dt);

        if(this.gameOver || this.watching.length === 0){
            return;
        }

        // 逐帧检查静止状态：速度持续低于阈值 N 帧则判定结束
        for(var i = this.watching.length - 1; i >= 0; i--){
            var item = this.watching[i];
            var node = item.node;

            // 水果已被销毁（如合并、道具消除），移出监测
            if(!node || !cc.isValid(node)){
                this.watching.splice(i, 1);
                continue;
            }

            var rb = node.getComponent(cc.RigidBody);
            if(!rb){
                this.watching.splice(i, 1);
                continue;
            }

            var v = rb.linearVelocity;
            var speed = Math.sqrt(v.x * v.x + v.y * v.y);
            if(speed < 2.0){
                item.frames++;
            }else{
                item.frames = 0;
            }

            if(item.frames >= 10){
                this.doGameOver(node);
                return;
            }
        }
    },

    // 死亡线闪烁提示（监测期间，未结束时闪烁）
    _updateFlash(dt){
        var active = !this.gameOver && this.watching.length > 0;
        if(!active){
            if(this._flashOn){
                this.node.opacity = 255;
                this._flashOn = false;
            }
            this._flashAcc = 0;
            return;
        }
        this._flashAcc += dt;
        if(this._flashAcc >= 0.25){
            this._flashAcc = 0;
            this._flashOn = !this._flashOn;
            this.node.opacity = this._flashOn ? 60 : 255;
        }
    },

    // 判定结束并结算
    doGameOver(node){
        if(this.gameOver){
            return;
        }
        this.gameOver = true;
        log("死亡（静止后结算）", node ? node.name : '');

        // 恢复死亡线颜色
        if(this._deathSprite){
            this.node.opacity = 255;
        }
        this._flashOn = false;

        // 保存数据
        var best = cc.sys.localStorage.getItem("score");
        if(best === null || best === undefined || best === "" || Number(best) < Number(window.SCORE)){
            cc.sys.localStorage.setItem('score', window.SCORE);
        }
        // 上传分数到微信云存储（好友排行榜）
        RankManager.upload(window.SCORE);
        this.DeathNode.setPosition(cc.v2(0,0));
        this.Background.off("touchstart", this.WatermelonDown, this)
        // 结算本局金币奖励
        var reward = CoinManager.settleScore(window.SCORE);
        if(reward > 0 && window.wx){
            wx.showToast({ title: '+' + reward + ' 金币', icon: 'none' });
        }
        // 在适合的场景显示插屏广告（安全调用，内部已兜底异常与 Promise 失败）
        safeAdCall(interstitialAd, 'show', 'interstitialAd');
    },

    // update (dt) {},
});