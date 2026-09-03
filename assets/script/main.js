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
        // 音效开关图片（开启 / 静音）
        SoundOnFrame: cc.SpriteFrame,
        SoundOffFrame: cc.SpriteFrame,
        // 金币图标
        CoinFrame: cc.SpriteFrame,
        // 设置齿轮图标
        SettingFrame: cc.SpriteFrame,
        // 排行榜奖杯图标
        RankFrame: cc.SpriteFrame,
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
        this.createLeaderboardButton();
        this.createLeaderboardPanel();

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
        this.maskGraph = maskGraph;
        mask.on(cc.Node.EventType.TOUCH_START, function(e){ e.stopPropagation(); }, this);
        mask.on(cc.Node.EventType.TOUCH_END, this.closeSettings, this);
        panel.addChild(mask);
        this._drawMask();

        // 面板背景
        var box = new cc.Node('box');
        var boxGraph = box.addComponent(cc.Graphics);
        this.boxGraph = boxGraph;
        panel.addChild(box);
        this._drawBox();

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

        // 关闭按钮（容器节点承载点击；背景 Graphics 与文字 Label 分离到不同节点，避免同节点共存导致首次渲染异常）
        var closeBtn = new cc.Node('close_bt');
        closeBtn.setContentSize(180, 60);
        closeBtn.setPosition(cc.v2(0, -110));

        var closeBg = new cc.Node('close_bg');
        var closeGraph = closeBg.addComponent(cc.Graphics);
        this.closeBtnGraph = closeGraph;
        closeBtn.addChild(closeBg);

        var closeLabelNode = new cc.Node('close_label');
        var closeLabel = closeLabelNode.addComponent(cc.Label);
        closeLabel.string = '关闭';
        closeLabel.fontSize = 30;
        closeLabel.lineHeight = 30;
        closeLabel.node.color = new cc.Color(120, 60, 10);
        closeBtn.addChild(closeLabelNode);

        closeBtn.on(cc.Node.EventType.TOUCH_START, function(e){ e.stopPropagation(); }, this);
        closeBtn.on(cc.Node.EventType.TOUCH_END, this.closeSettings, this);
        panel.addChild(closeBtn);
        this._drawCloseBtn();
    },

    // 绘制遮罩、面板背景、关闭按钮（inactive 时绘制不会随首次激活渲染，需在激活后重绘一次）
    _drawMask(){
        var g = this.maskGraph;
        if(!g){ return; }
        g.clear();
        g.lineWidth = 0;
        g.fillColor = new cc.Color(0, 0, 0, 150);
        g.rect(-360, -640, 720, 1280);
        g.fill();
    },

    _drawBox(){
        var g = this.boxGraph;
        if(!g){ return; }
        g.clear();
        g.fillColor = new cc.Color(255, 246, 220, 255);
        g.roundRect(-220, -170, 440, 340, 24);
        g.fill();
        g.lineWidth = 5;
        g.strokeColor = new cc.Color(140, 80, 25, 255);
        g.stroke();
    },

    _drawCloseBtn(){
        var g = this.closeBtnGraph;
        if(!g){ return; }
        g.clear();
        g.fillColor = new cc.Color(240, 150, 60, 255);
        g.roundRect(-90, -30, 180, 60, 30);
        g.fill();
        g.lineWidth = 3;
        g.strokeColor = new cc.Color(140, 80, 25, 255);
        g.stroke();
    },

    // 打开设置面板
    openSettings(event){
        if(event && event.stopPropagation){
            event.stopPropagation();
        }
        if(this.settingsPanel){
            this.refreshPanelSound();
            this.settingsPanel.active = true;
            // 激活后重绘，修复遮罩/背景/关闭按钮首次打开不显示
            this._drawMask();
            this._drawBox();
            this._drawCloseBtn();
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

    // ==================== 好友排行榜 ====================

    // 创建排行榜入口按钮（奖杯图标，对齐金币图标下方）
    createLeaderboardButton(){
        var btn = new cc.Node('rank_bt');
        btn.setContentSize(64, 64);
        var sprite = btn.addComponent(cc.Sprite);
        sprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
        sprite.spriteFrame = this.RankFrame;
        btn.on(cc.Node.EventType.TOUCH_START, function(e){ e.stopPropagation(); }, this);
        btn.on(cc.Node.EventType.TOUCH_END, this.openLeaderboard, this);
        this.node.addChild(btn);
        // 金币图标中心 (-309, 560)，奖杯位于其正下方
        btn.setPosition(cc.v2(-309, 476));
        console.log('[排行榜] 入口图标已创建 pos=(' + btn.position.x + ',' + btn.position.y +
            ') active=' + btn.activeInHierarchy);
    },

    // 创建排行榜面板（默认隐藏）
    createLeaderboardPanel(){
        this.rankType = 'all'; // 'all' 历史最高，'week' 本周最高

        var panel = new cc.Node('rank_panel');
        panel.setPosition(cc.v2(0, 0));
        panel.active = false;
        this.node.addChild(panel);
        this.rankPanel = panel;

        // 半透明遮罩
        var mask = new cc.Node('mask');
        mask.setContentSize(720, 1280);
        var maskGraph = mask.addComponent(cc.Graphics);
        maskGraph.lineWidth = 0;
        maskGraph.fillColor = new cc.Color(0, 0, 0, 150);
        maskGraph.rect(-360, -640, 720, 1280);
        maskGraph.fill();
        mask.on(cc.Node.EventType.TOUCH_START, function(e){ e.stopPropagation(); }, this);
        mask.on(cc.Node.EventType.TOUCH_END, this.closeLeaderboard, this);
        panel.addChild(mask);

        // 面板背景
        var box = new cc.Node('box');
        var boxGraph = box.addComponent(cc.Graphics);
        boxGraph.fillColor = new cc.Color(255, 246, 220, 255);
        boxGraph.roundRect(-300, -480, 600, 960, 24);
        boxGraph.fill();
        boxGraph.lineWidth = 5;
        boxGraph.strokeColor = new cc.Color(140, 80, 25, 255);
        boxGraph.stroke();
        panel.addChild(box);

        // 标题
        var title = new cc.Node('title');
        var titleLabel = title.addComponent(cc.Label);
        titleLabel.string = '好友排行榜';
        titleLabel.fontSize = 44;
        titleLabel.lineHeight = 44;
        titleLabel.node.color = new cc.Color(140, 80, 25);
        title.setPosition(cc.v2(0, 400));
        panel.addChild(title);

        // 榜单类型切换按钮
        this.rankAllTab = this.createRankTab('历史最高', cc.v2(-108, 320), 'all');
        this.rankWeekTab = this.createRankTab('本周最高', cc.v2(108, 320), 'week');
        panel.addChild(this.rankAllTab);
        panel.addChild(this.rankWeekTab);

        // 列表容器：SubContextView 渲染开放数据域 sharedCanvas
        var listNode = new cc.Node('rank_list');
        listNode.setContentSize(540, 580);
        listNode.setPosition(cc.v2(0, -30));
        panel.addChild(listNode);
        this.rankListNode = listNode;

        console.log('[排行榜] available =', RankManager.available(), 'hasSubContextView =', !!cc.SubContextView);
        if (RankManager.available() && cc.SubContextView) {
            try {
                this.rankSubView = listNode.addComponent(cc.SubContextView);
                console.log('[排行榜] SubContextView 已创建');
            } catch (e) {
                console.log('[排行榜] 创建 SubContextView 失败:', e);
            }
        } else {
            // 非微信环境占位提示
            var tipNode = new cc.Node('tip');
            var tipLabel = tipNode.addComponent(cc.Label);
            tipLabel.string = '好友排行榜仅在小游戏环境可用';
            tipLabel.fontSize = 26;
            tipLabel.lineHeight = 26;
            tipLabel.node.color = new cc.Color(180, 120, 60);
            listNode.addChild(tipNode);
        }

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
        closeBtn.setPosition(cc.v2(0, -410));
        closeBtn.on(cc.Node.EventType.TOUCH_START, function(e){ e.stopPropagation(); }, this);
        closeBtn.on(cc.Node.EventType.TOUCH_END, this.closeLeaderboard, this);
        panel.addChild(closeBtn);

        this.refreshRankTabs();
    },

    // 创建一个榜单类型切换按钮
    createRankTab(text, pos, type){
        var btn = new cc.Node('rank_tab');
        btn.setContentSize(180, 64);
        var graph = btn.addComponent(cc.Graphics);
        btn.rankTabGraph = graph;
        btn.rankTabType = type;
        var labelNode = new cc.Node('label');
        var label = labelNode.addComponent(cc.Label);
        label.string = text;
        label.fontSize = 28;
        label.lineHeight = 28;
        btn.addChild(labelNode);
        btn.rankTabLabel = label;
        btn.setPosition(pos);
        btn.on(cc.Node.EventType.TOUCH_START, function(e){ e.stopPropagation(); }, this);
        btn.on(cc.Node.EventType.TOUCH_END, function(e){
            e.stopPropagation();
            this.switchRankType(type);
        }, this);
        return btn;
    },

    // 打开排行榜
    openLeaderboard(event){
        if(event && event.stopPropagation){ event.stopPropagation(); }
        if(!this.rankPanel){ return; }

        var self = this;
        // 好友关系需用户授权才能读取；必须在点击手势内发起授权才弹窗
        this._ensureFriendAuth(function(){
            self.rankPanel.active = true;
            self.refreshRankTabs();
            self.scheduleOnce(function(){
                RankManager.send({ command: 'show', type: self.rankType });
            }, 0.1);
        });
    },

    // 确保好友关系已授权，成功才回调；未授权则发起授权/引导开启
    _ensureFriendAuth(callback){
        if(!window.wx || !wx.getSetting){
            callback();
            return;
        }
        wx.getSetting({
            success: function(res){
                var auth = (res && res.authSetting) || {};
                var status = auth['scope.WxFriendInteraction'];
                if(status === true){
                    callback(); // 已授权
                } else if(status === false){
                    // 之前拒绝过，不再弹授权框，引导去设置页开启
                    wx.showModal({
                        title: '需要好友授权',
                        content: '查看好友排行榜需授权使用微信朋友信息，请在设置中开启「好友信息」。',
                        success: function(m){
                            if(m.confirm){
                                wx.openSetting({});
                            }
                        }
                    });
                } else {
                    // 从未授权，主动弹出授权框
                    wx.authorize({
                        scope: 'scope.WxFriendInteraction',
                        success: function(){ callback(); },
                        fail: function(err){
                            console.log('[排行榜] 好友授权被拒绝', err && err.errMsg);
                            wx.showModal({
                                title: '未授权好友信息',
                                content: '未获得好友信息授权，无法显示好友排行榜。',
                                showCancel: false
                            });
                        }
                    });
                }
            },
            fail: function(){
                callback(); // getSetting 失败时放行，交给子域处理
            }
        });
    },

    // 关闭排行榜
    closeLeaderboard(event){
        if(event && event.stopPropagation){ event.stopPropagation(); }
        if(this.rankPanel){
            this.rankPanel.active = false;
        }
        RankManager.send({ command: 'hide' });
    },

    // 切换榜单类型
    switchRankType(type){
        this.rankType = type;
        this.refreshRankTabs();
        RankManager.send({ command: 'show', type: type });
    },

    // 刷新榜单切换按钮的选中态
    refreshRankTabs(){
        if(!this.rankAllTab || !this.rankWeekTab){ return; }
        this._drawRankTab(this.rankAllTab, this.rankType === 'all');
        this._drawRankTab(this.rankWeekTab, this.rankType === 'week');
    },

    // 绘制单个榜单切换按钮（选中高亮）
    _drawRankTab(btn, active){
        var graph = btn.rankTabGraph;
        graph.clear();
        graph.fillColor = active ? new cc.Color(240, 150, 60, 255) : new cc.Color(255, 220, 150, 255);
        graph.roundRect(-90, -32, 180, 64, 32);
        graph.fill();
        graph.lineWidth = 3;
        graph.strokeColor = new cc.Color(140, 80, 25, 255);
        graph.stroke();
        btn.rankTabLabel.node.color = active ? new cc.Color(120, 60, 10) : new cc.Color(140, 80, 25);
    },

});