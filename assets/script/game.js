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
        // 音效开关图片（开启 / 静音）
        SoundOnFrame: cc.SpriteFrame,
        SoundOffFrame: cc.SpriteFrame,
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        // 开启物理系统
        cc.director.getPhysicsManager().enabled = true;
        // 设置重力
        cc.director.getPhysicsManager().gravity = cc.v2(0, -1200);
        // 获取开启碰撞
        var cmanager = cc.director.getCollisionManager();
        cmanager.enabled = true;

        // 恢复音效开关状态
        var savedSound = cc.sys.localStorage.getItem("sound_on");
        if(savedSound !== null && savedSound !== undefined){
            window.SOUND_ON = (savedSound === true || savedSound === "true");
        }

        // 注册触摸事件
        this.node.on("touchstart", this.WatermelonDown, this);
        this.IsWatermelonDown = true;
        window.BACKGROUND_NODE = this.node;

        // 创建音效开关按钮
        this.createSoundButton();
        
        // 同步获取屏幕尺寸，确保创建广告前拿到真实宽高
        var sysInfo = wx.getSystemInfoSync();
        window.s_width = sysInfo.screenWidth;
        window.s_height = sysInfo.screenHeight;

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
        // 保存数据（在重置前比较最高分）
        this.saveBestScore();
        window.SCORE = 0;
        window.WETERMELON_TYPE = 0;
        window.WETERMELON_ARRAY = [];
        // 在适合的场景显示 Banner 广告
        bannerAd.hide();
        cc.director.loadScene("main_scene");
    },

    // 保存最高分
    saveBestScore(){
        var best = cc.sys.localStorage.getItem("score");
        if(best === null || best === undefined || best === "" || Number(best) < Number(window.SCORE)){
            cc.sys.localStorage.setItem('score', window.SCORE);
        }
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
        // 保存数据（在重置前比较最高分）
        this.saveBestScore();
        window.SCORE = 0;
        window.WETERMELON_TYPE = 0;
        window.WETERMELON_ARRAY = [];
        cc.director.loadScene("game_scene");
    },

    // 切换音效开关
    toggleSound(event){
        // 阻止事件冒泡，避免触发水果下落
        if(event && event.stopPropagation){
            event.stopPropagation();
        }
        window.SOUND_ON = !window.SOUND_ON;
        cc.sys.localStorage.setItem("sound_on", window.SOUND_ON ? "true" : "false");
        if(this.soundSprite){
            this.soundSprite.spriteFrame = window.SOUND_ON ? this.SoundOnFrame : this.SoundOffFrame;
        }
    },

    // 创建音效开关按钮
    createSoundButton(){
        this.soundNode = new cc.Node("sound_bt");
        var sprite = this.soundNode.addComponent(cc.Sprite);
        sprite.spriteFrame = window.SOUND_ON ? this.SoundOnFrame : this.SoundOffFrame;
        this.soundSprite = sprite;

        this.soundNode.setContentSize(70, 70);
        this.soundNode.on(cc.Node.EventType.TOUCH_START, function(event){
            event.stopPropagation();
        }, this);
        this.soundNode.on(cc.Node.EventType.TOUCH_END, this.toggleSound, this);

        // 将按钮放置在右上角（位于“下一个水果”预览下方，避免与 slice1 重叠）
        this.node.addChild(this.soundNode);
        this.soundNode.setPosition(cc.v2(300, 460));
    },

    // update (dt) {},
});
