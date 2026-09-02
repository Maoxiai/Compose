// Learn cc.Class:
//  - https://docs.cocos.com/creator/manual/en/scripting/class.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

cc.Class({
    extends: cc.Component,

    properties: {
        // 西瓜预制体
        PrefabWatermelon: cc.Prefab,
        // 节点类型
        typeNode: cc.Node, 
        typeNode2: cc.Node,
        // 西瓜图片
        spriteframe:[cc.SpriteFrame],
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        // 开启物理系统
        cc.director.getPhysicsManager().enabled;
        // 设置重力
        cc.director.getPhysicsManager().gravity = cc.v2(0, -1200);
        // 获取开启碰撞
        var cmanager = cc.director.getCollisionManager;
        cmanager.enabled = true;

        // 注册触摸事件
        this.node.on("touchstart", this.WatermelonDown, this);
        this.IsWatermelonDown = true;
        window.BACKGROUND_NODE = this.node;
        
        wx.getSystemInfo({
            success (res) {
                window.s_width = res.screenWidth;
                window.s_height = res.screenHeight;
            
            }
        });

        // 创建 Banner 广告实例，提前初始化
        bannerAd = wx.createBannerAd({
            adUnitId: 'adunit-b52fb2e2b1756c36',
            adIntervals: 30,
            style: {
                left: 9,
                top: window.s_height * 0.83,
                width: window.s_width * 0.95
            }
        });
        
        bannerAd.onError(err => {
            console.log(err)
        });
        
        // 在适合的场景显示 Banner 广告
        bannerAd.show();
        
    },

    start () {

    },

    onDestroy(){
        this.node.off("touchstart", this.WatermelonDown, this);
    },

    // 返回主页面
    goMainWindow(){
        window.SCORE = 0;
        window.WETERMELON_TYPE = 0;
        // 保存数据
        if(cc.sys.localStorage.getItem("score") < window.SCORE){
            cc.sys.localStorage.setItem('score', window.SCORE);
        }
        // 在适合的场景显示 Banner 广告
        bannerAd.hide();
        cc.director.loadScene("main_scene");
    },

    // 触摸事件西瓜下落
    WatermelonDown(event){
        // 判断西瓜是否可以下落
        if(this.IsWatermelonDown){
            console.log("点击");
            this.IsWatermelonDown = false;
            this.scheduleOnce(function(){
                this.IsWatermelonDown = true;
            }, 0.3);

            // 实例化一个西瓜
            let PrefabWatermelon = cc.instantiate(this.PrefabWatermelon);
            // 设置西瓜位置
            let position_x = event.getLocationX() - 360;
            this.circleCollider = PrefabWatermelon.getComponent(cc.CircleCollider);
            let position_y = 490 - this.circleCollider.radius * 2;
            PrefabWatermelon.setPosition(cc.v2(position_x, position_y));
            // 加入场景
            this.node.addChild(PrefabWatermelon);
            window.WETERMELON_ARRAY.push(PrefabWatermelon);

            // 获取0到5的随机整数
            window.WETERMELON_TYPE = Math.floor(Math.random() * 5);
            var next = window.WETERMELON_TYPE

            // 显示下一个
            var sprite = this.typeNode.getComponent(cc.Sprite);
            sprite.spriteFrame = this.spriteframe[next]
            
        }
    },

    // 重新开始游戏
    againGame(){
        window.SCORE = 0;
        window.WETERMELON_TYPE = 0;
        this.node.on("touchstart", this.WatermelonDown, this);

        cc.director.loadScene("game_scene");
        // 保存数据
        if(cc.sys.localStorage.getItem("score") < window.SCORE){
            cc.sys.localStorage.setItem('score', window.SCORE);
        }
    },

    // update (dt) {},
});
