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
        // 音效开关图片（开启 / 静音）
        SoundOnFrame: cc.SpriteFrame,
        SoundOffFrame: cc.SpriteFrame,
        // 金币图标
        CoinFrame: cc.SpriteFrame,
        // 设置齿轮图标
        SettingFrame: cc.SpriteFrame,
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

         // 恢复音效开关状态
         var savedSound = cc.sys.localStorage.getItem("sound_on");
         if(savedSound !== null && savedSound !== undefined){
             window.SOUND_ON = (savedSound === true || savedSound === "true");
         }

         // 每日签到发放金币
         var sign = CoinManager.dailySign();
         if(sign.ok && window.wx){
             wx.showToast({ title: '签到成功 +' + sign.coin + ' 金币', icon: 'none' });
         }

         // 创建金币展示、设置入口与设置面板
        this.createCoinHud();
        this.createSettingsButton();
        this.createSettingsPanel();

        // 开始游戏按钮 Q 弹动效
        this.playStartButtonBounce();

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
    },

    // ==================== 金币展示 & 设置功能 ====================

    // 创建金币展示（图标 + 数量）
    createCoinHud(){
        this.coinNode = new cc.Node('coin_hud');
        this.coinNode.setPosition(cc.v2(-245, 560));
        this.node.addChild(this.coinNode);

        // 金币图标（与设置图标同尺寸）
        var iconNode = new cc.Node('coin_icon');
        var iconSprite = iconNode.addComponent(cc.Sprite);
        iconSprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
        iconSprite.spriteFrame = this.CoinFrame;
        iconNode.setContentSize(64, 64);
        iconNode.setPosition(cc.v2(-64, 0));
        this.coinNode.addChild(iconNode);

        // 数量文字（垂直居中对齐图标，左对齐向右展开）
        var labelNode = new cc.Node('coin_count');
        var label = labelNode.addComponent(cc.Label);
        label.fontSize = 34;
        label.lineHeight = 40;
        label.horizontalAlign = cc.Label.HorizontalAlign.LEFT;
        label.verticalAlign = cc.Label.VerticalAlign.CENTER;
        label.overflow = cc.Label.Overflow.NONE;
        label.node.color = new cc.Color(180, 110, 10);
        labelNode.setAnchorPoint(0, 0.5);
        labelNode.setPosition(cc.v2(-24, 0));
        this.coinNode.addChild(labelNode);
        this.coinLabel = label;

        this.refreshCoinHud();
    },

    // 刷新金币展示
    refreshCoinHud(){
        if(this.coinLabel){
            this.coinLabel.string = String(CoinManager.get());
        }
    },

    // 创建设置入口按钮（右上角齿轮）
    createSettingsButton(){
        this.settingNode = new cc.Node('setting_bt');
        var sprite = this.settingNode.addComponent(cc.Sprite);
        sprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
        sprite.spriteFrame = this.SettingFrame;
        this.settingNode.setContentSize(64, 64);
        this.settingNode.on(cc.Node.EventType.TOUCH_START, function(e){ e.stopPropagation(); }, this);
        this.settingNode.on(cc.Node.EventType.TOUCH_END, this.openSettings, this);
        this.node.addChild(this.settingNode);
        this.settingNode.setPosition(cc.v2(300, 560));
    },

    // 创建设置面板（默认隐藏）
    createSettingsPanel(){
        var panel = new cc.Node('settings_panel');
        panel.setPosition(cc.v2(0, 0));
        panel.active = false;
        this.node.addChild(panel);
        this.settingsPanel = panel;

        // 半透明遮罩，阻止点击穿透，点击遮罩关闭
        var mask = new cc.Node('mask');
        mask.setContentSize(720, 1280);
        var maskGraph = mask.addComponent(cc.Graphics);
        maskGraph.lineWidth = 0;
        maskGraph.fillColor = new cc.Color(0, 0, 0, 150);
        maskGraph.rect(-360, -640, 720, 1280);
        maskGraph.fill();
        mask.on(cc.Node.EventType.TOUCH_START, function(e){ e.stopPropagation(); }, this);
        mask.on(cc.Node.EventType.TOUCH_END, this.closeSettings, this);
        panel.addChild(mask);

        // 面板背景
        var box = new cc.Node('box');
        var boxGraph = box.addComponent(cc.Graphics);
        boxGraph.fillColor = new cc.Color(255, 246, 220, 255);
        boxGraph.roundRect(-220, -170, 440, 340, 24);
        boxGraph.fill();
        boxGraph.lineWidth = 5;
        boxGraph.strokeColor = new cc.Color(140, 80, 25, 255);
        boxGraph.stroke();
        panel.addChild(box);

        // 标题
        var titleNode = new cc.Node('title');
        var titleLabel = titleNode.addComponent(cc.Label);
        titleLabel.string = '设置';
        titleLabel.fontSize = 44;
        titleLabel.lineHeight = 44;
        titleLabel.node.color = new cc.Color(140, 80, 25);
        titleNode.setPosition(cc.v2(0, 110));
        panel.addChild(titleNode);

        // 音效文字
        var soundTextNode = new cc.Node('sound_text');
        var soundLabel = soundTextNode.addComponent(cc.Label);
        soundLabel.string = '音效';
        soundLabel.fontSize = 34;
        soundLabel.lineHeight = 34;
        soundLabel.node.color = new cc.Color(120, 70, 20);
        soundTextNode.setPosition(cc.v2(-90, 20));
        panel.addChild(soundTextNode);

        // 音效开关按钮（图标，点击切换）
        var soundBtn = new cc.Node('sound_bt');
        var soundSprite = soundBtn.addComponent(cc.Sprite);
        soundSprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
        soundSprite.spriteFrame = window.SOUND_ON ? this.SoundOnFrame : this.SoundOffFrame;
        soundBtn.setContentSize(70, 70);
        soundBtn.setPosition(cc.v2(130, 20));
        soundBtn.on(cc.Node.EventType.TOUCH_START, function(e){ e.stopPropagation(); }, this);
        soundBtn.on(cc.Node.EventType.TOUCH_END, this.toggleSound, this);
        panel.addChild(soundBtn);
        this.soundSprite = soundSprite;

        // 关闭按钮
        var closeBtn = new cc.Node('close_bt');
        closeBtn.setContentSize(180, 60);
        var closeGraph = closeBtn.addComponent(cc.Graphics);
        closeGraph.fillColor = new cc.Color(240, 150, 60, 255);
        closeGraph.roundRect(-90, -30, 180, 60, 30);
        closeGraph.fill();
        closeGraph.lineWidth = 3;
        closeGraph.strokeColor = new cc.Color(140, 80, 25, 255);
        closeGraph.stroke();
        var closeLabel = closeBtn.addComponent(cc.Label);
        closeLabel.string = '关闭';
        closeLabel.fontSize = 30;
        closeLabel.lineHeight = 30;
        closeLabel.node.color = new cc.Color(120, 60, 10);
        closeBtn.setPosition(cc.v2(0, -110));
        closeBtn.on(cc.Node.EventType.TOUCH_START, function(e){ e.stopPropagation(); }, this);
        closeBtn.on(cc.Node.EventType.TOUCH_END, this.closeSettings, this);
        panel.addChild(closeBtn);
    },

    // 打开设置面板
    openSettings(event){
        if(event && event.stopPropagation){
            event.stopPropagation();
        }
        if(this.settingsPanel){
            this.refreshPanelSound();
            this.settingsPanel.active = true;
        }
    },

    // 关闭设置面板
    closeSettings(event){
        if(event && event.stopPropagation){
            event.stopPropagation();
        }
        if(this.settingsPanel){
            this.settingsPanel.active = false;
        }
    },

    // 刷新面板内音效图标状态
    refreshPanelSound(){
        if(this.soundSprite){
            this.soundSprite.spriteFrame = window.SOUND_ON ? this.SoundOnFrame : this.SoundOffFrame;
        }
    },

    // 切换音效开关
    toggleSound(event){
        if(event && event.stopPropagation){
            event.stopPropagation();
        }
        window.SOUND_ON = !window.SOUND_ON;
        cc.sys.localStorage.setItem("sound_on", window.SOUND_ON ? "true" : "false");
        this.refreshPanelSound();
    },

    // 开始游戏按钮 Q 弹动效（左右伸缩循环）
    playStartButtonBounce(){
        var btn = this.node.getChildByName('start_bt');
        if(!btn){
            return;
        }
        // 隐藏时停止动画
        if(this._startBtnTween){
            this._startBtnTween.stop();
        }
        btn.scaleX = 1;
        btn.scaleY = 1;
        // 左右伸缩：scaleX 拉伸回弹，scaleY 反向轻微挤压，形成果冻感
        this._startBtnTween = cc.tween(btn)
            .to(0.25, { scaleX: 1.12, scaleY: 0.92 }, { easing: 'quadOut' })
            .to(0.45, { scaleX: 0.90, scaleY: 1.08 }, { easing: 'quadInOut' })
            .to(0.30, { scaleX: 1.05, scaleY: 0.97 }, { easing: 'quadOut' })
            .to(0.20, { scaleX: 1.0, scaleY: 1.0 }, { easing: 'quadOut' })
            .delay(0.4)
            .union()
            .repeatForever()
            .start();
    },

});