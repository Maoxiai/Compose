// Learn cc.Class:
//  - https://docs.cocos.com/creator/manual/en/scripting/class.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

var BombItem = require('./BombItem');
var RerollItem = require('./RerollItem');
var ShrinkItem = require('./ShrinkItem');
var UndoItem = require('./UndoItem');
var CoinManager = require('./CoinManager');
var AdManager = require('./AdManager');
var RankManager = require('./RankManager');

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
        // 道具按钮背景图
        ItemBgFrame: cc.SpriteFrame,
        // 炸弹道具图标
        BombIconFrame: cc.SpriteFrame,
        // 换果道具图标
        RerollIconFrame: cc.SpriteFrame,
        // 缩小道具图标
        ShrinkIconFrame: cc.SpriteFrame,
        // 撤回道具图标
        UndoIconFrame: cc.SpriteFrame,
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

        // 初始化道具系统
        this.initItems();
        this.migrateItems();
        this.createItemBar();
        this.createCoinHud();

        // 重置本局金币结算标记
        window.COIN_SETTLED = false;
        
        // 同步获取屏幕尺寸，确保创建广告前拿到真实宽高
        var sysInfo = wx.getSystemInfoSync();
        window.s_width = sysInfo.screenWidth;
        window.s_height = sysInfo.screenHeight;

        // 创建 Banner 广告实例，提前初始化
        bannerAd = wx.createBannerAd({
            adUnitId: 'adunit-b52fb2e2b1756c36',
            adIntervals: 30,
            style: {
                left: window.s_width * 0.09,
                top: window.s_height * 0.86,
                width: window.s_width * 0.75
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
        // 结算本局金币奖励
        this.settleCoins();
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
        // 上传分数到微信云存储（好友排行榜）
        RankManager.upload(window.SCORE);
    },

    // 触摸事件西瓜下落
    WatermelonDown(event){
        // 瞄准模式：当前选中了需要二次点选目标的道具（如炸弹），点选目标
        if(this.activeItem){
            this.handleItemTarget(event);
            return;
        }

        // 判断西瓜是否可以下落
        if(this.IsWatermelonDown){
            console.log("点击");
            this.IsWatermelonDown = false;
            this.scheduleOnce(function(){
                this.IsWatermelonDown = true;
            }, 0.3);

            // 记录本次下落类型，供撤回使用
            var dropType = window.WETERMELON_TYPE;

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

            // 记录一次下落操作（供撤回）
            this.pushDropHistory(PrefabWatermelon, dropType);

            // 随机下一个水果类型并刷新预览
            window.WETERMELON_TYPE = Math.floor(Math.random() * 5);
            this.updateNextPreview();
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

    // ==================== 道具系统 ====================

    // 初始化道具实例与下落历史
    initItems(){
        window.DROP_HISTORY = [];
        this.activeItem = null;
        this.activeItemIndex = -1;
        this.itemDefs = [
            { item: new BombItem(), icon: this.BombIconFrame, price: 80 },
            { item: new RerollItem(), icon: this.RerollIconFrame, price: 40 },
            { item: new ShrinkItem(), icon: this.ShrinkIconFrame, price: 60 },
            { item: new UndoItem(), icon: this.UndoIconFrame, price: 60 },
        ];
    },

    // 迁移旧版道具初始数量（3 → 5），仅执行一次
    migrateItems(){
        var migrated = cc.sys.localStorage.getItem('item_init_migrated');
        if(migrated === '1'){
            return;
        }
        for(var i = 0; i < this.itemDefs.length; i++){
            var id = this.itemDefs[i].item.itemId;
            var key = 'item_' + id;
            var val = cc.sys.localStorage.getItem(key);
            // 旧版初始为 3，若当前值正好为 3（未使用过），提升到新初始 5
            if(val !== null && val !== undefined && val !== '' && Number(val) === 3){
                cc.sys.localStorage.setItem(key, 5);
            }
        }
        cc.sys.localStorage.setItem('item_init_migrated', '1');
    },

    // 创建底部道具栏
    createItemBar(){
        var count = this.itemDefs.length;
        var itemSize = 110;
        var gap = 20;
        var totalWidth = count * itemSize + (count - 1) * gap;
        var startX = -totalWidth / 2 + itemSize / 2;

        for(var i = 0; i < count; i++){
            var btn = this.createItemButton(this.itemDefs[i], i);
            // 放在地面（floot y=-577）下方，避开水果堆积区
            btn.setPosition(cc.v2(startX + i * (itemSize + gap), -585));
            this.node.addChild(btn);
        }
    },

    // 创建单个道具按钮
    createItemButton(def, index){
        var btn = new cc.Node('item_bt_' + def.item.itemId);
        btn.setContentSize(cc.size(110, 110));

        // 背景
        if(this.ItemBgFrame){
            var bgSprite = btn.addComponent(cc.Sprite);
            bgSprite.spriteFrame = this.ItemBgFrame;
            bgSprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
            btn.setContentSize(cc.size(100, 100));
        }

        // 图标
        var iconNode = new cc.Node('icon');
        var iconSprite = iconNode.addComponent(cc.Sprite);
        iconSprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
        iconSprite.spriteFrame = def.icon;
        iconNode.setContentSize(cc.size(56, 56));
        iconNode.setPosition(cc.v2(0, 16));
        btn.addChild(iconNode);

        // 名称
        var nameNode = new cc.Node('name');
        var nameLabel = nameNode.addComponent(cc.Label);
        nameLabel.string = def.item.itemName;
        nameLabel.fontSize = 20;
        nameLabel.lineHeight = 20;
        nameLabel.node.color = new cc.Color(120, 70, 20);
        nameNode.setPosition(cc.v2(0, -26));
        btn.addChild(nameNode);

        // 数量角标
        var countNode = new cc.Node('count');
        var countLabel = countNode.addComponent(cc.Label);
        countLabel.string = 'x' + this.getItemCount(def.item.itemId);
        countLabel.fontSize = 18;
        countLabel.lineHeight = 18;
        countLabel.node.color = new cc.Color(200, 40, 40);
        countNode.setPosition(cc.v2(28, 32));
        btn.addChild(countNode);
        def.countLabel = countLabel;

        // 触摸事件（阻止冒泡，避免触发水果下落）
        btn.on(cc.Node.EventType.TOUCH_START, function(event){
            event.stopPropagation();
        }, this);
        btn.on(cc.Node.EventType.TOUCH_END, function(event){
            event.stopPropagation();
            this.onItemClick(index);
        }, this);

        return btn;
    },

    // 点击道具按钮
    onItemClick(index){
        var def = this.itemDefs[index];
        var item = def.item;
        var count = this.getItemCount(item.itemId);
        if(count <= 0){
            this.showItemShop(def, index);
            return;
        }
        // 冷却检查
        var now = Date.now();
        if(item._lastUse && now - item._lastUse < item.coolDown * 1000){
            return;
        }
        if(item.needTarget){
            // 进入瞄准模式，等待二次点选目标
            this.activeItem = item;
            this.activeItemIndex = index;
            this.showItemTip('请点击一个水果');
        }else if(item.canUse(this)){
            item.use(this);
            item._lastUse = now;
            this.consumeItem(item);
        }else{
            this.showItemTip('当前无法使用');
        }
    },

    // 瞄准模式下点选目标
    handleItemTarget(event){
        var item = this.activeItem;
        if(!item){
            return;
        }
        var localPos = this.node.convertToNodeSpaceAR(new cc.Vec2(event.getLocationX(), event.getLocationY()));
        var ok = item.canUse(this) && item.onPickTarget(this, localPos);
        if(ok){
            item._lastUse = Date.now();
            this.consumeItem(item);
        }
        // 无论是否命中，退出瞄准模式
        this.activeItem = null;
        this.activeItemIndex = -1;
    },

    // 刷新下一个水果预览
    updateNextPreview(){
        if(this.typeNode){
            var sprite = this.typeNode.getComponent(cc.Sprite);
            sprite.spriteFrame = this.spriteframe[window.WETERMELON_TYPE];
        }
    },

    // ==================== 供道具调用的游戏接口 ====================

    // 场上现有水果列表
    getWatermelons(){
        return window.WETERMELON_ARRAY || [];
    },

    // 命中测试：找到点击位置最近的水果
    findWatermelonAt(localPos){
        var arr = window.WETERMELON_ARRAY;
        var bestNode = null;
        var bestDist = 999999999;
        for(var i = 0; i < arr.length; i++){
            var node = arr[i];
            if(!cc.isValid(node)){
                continue;
            }
            var p = node.getPosition();
            var dx = p.x - localPos.x;
            var dy = p.y - localPos.y;
            var dist = dx * dx + dy * dy;
            var radius = 40;
            var collider = node.getComponent(cc.CircleCollider);
            if(collider){
                radius = collider.radius;
            }
            if(dist <= radius * radius && dist < bestDist){
                bestDist = dist;
                bestNode = node;
            }
        }
        return bestNode;
    },

    // 消除指定水果
    removeWatermelon(node){
        if(!cc.isValid(node)){
            return;
        }
        var idx = window.WETERMELON_ARRAY.indexOf(node);
        if(idx >= 0){
            window.WETERMELON_ARRAY.splice(idx, 1);
        }
        node.destroy();
    },

    // 换下一个水果（重抽）
    rerollNextFruit(){
        window.WETERMELON_TYPE = Math.floor(Math.random() * 5);
        this.updateNextPreview();
    },

    // 将场上最大的水果缩小一级
    shrinkLargestFruit(){
        var arr = window.WETERMELON_ARRAY;
        var target = null;
        var targetComp = null;
        for(var i = 0; i < arr.length; i++){
            var node = arr[i];
            if(!cc.isValid(node)){
                continue;
            }
            var comp = node.getComponent('WetermelonPrefab');
            if(!comp || typeof comp.type === 'undefined'){
                continue;
            }
            if(comp.type <= 0){
                continue;
            }
            if(!targetComp || comp.type > targetComp.type){
                target = node;
                targetComp = comp;
            }
        }
        if(target && targetComp){
            targetComp.changeType(targetComp.type - 1);
            return true;
        }
        return false;
    },

    // 记录一次下落操作（供撤回）
    pushDropHistory(node, type){
        if(!window.DROP_HISTORY){
            window.DROP_HISTORY = [];
        }
        window.DROP_HISTORY.push({ node: node, type: type });
    },

    canUndo(){
        return window.DROP_HISTORY && window.DROP_HISTORY.length > 0;
    },

    // 撤回上一次下落
    undoLastDrop(){
        if(!window.DROP_HISTORY || window.DROP_HISTORY.length === 0){
            return false;
        }
        var last = window.DROP_HISTORY.pop();
        // 恢复待下落类型
        window.WETERMELON_TYPE = last.type;
        // 若节点仍存在，销毁并从场上移除
        if(last.node && cc.isValid(last.node)){
            var idx = window.WETERMELON_ARRAY.indexOf(last.node);
            if(idx >= 0){
                window.WETERMELON_ARRAY.splice(idx, 1);
            }
            last.node.destroy();
        }
        this.updateNextPreview();
        return true;
    },

    // ==================== 道具数量管理 ====================

    getItemCount(id){
        var key = 'item_' + id;
        var val = cc.sys.localStorage.getItem(key);
        if(val === null || val === undefined || val === ''){
            cc.sys.localStorage.setItem(key, 5);
            return 5;
        }
        return Number(val);
    },

    addItemCount(id, delta){
        this.setItemCount(id, this.getItemCount(id) + delta);
    },

    setItemCount(id, count){
        cc.sys.localStorage.setItem('item_' + id, count);
    },

    consumeItem(item){
        var count = this.getItemCount(item.itemId) - 1;
        if(count < 0) count = 0;
        this.setItemCount(item.itemId, count);
        this.refreshItemCounts();
    },

    refreshItemCounts(){
        for(var i = 0; i < this.itemDefs.length; i++){
            var def = this.itemDefs[i];
            if(def.countLabel){
                def.countLabel.string = 'x' + this.getItemCount(def.item.itemId);
            }
        }
    },

    // ==================== 金币 & 道具获取 ====================

    // 结算本局金币奖励（主动退出时）
    settleCoins(){
        var reward = CoinManager.settleScore(window.SCORE);
        if(reward > 0 && window.wx){
            wx.showToast({ title: '+' + reward + ' 金币', icon: 'none' });
        }
    },

    // 创建金币余额显示
    createCoinHud(){
        this.coinNode = new cc.Node('coin_hud');
        var label = this.coinNode.addComponent(cc.Label);
        label.fontSize = 26;
        label.lineHeight = 26;
        label.node.color = new cc.Color(180, 110, 10);
        this.coinLabel = label;
        this.coinNode.setPosition(cc.v2(-290, 480));
        this.node.addChild(this.coinNode);
        this.refreshCoinHud();
    },

    // 刷新金币余额显示
    refreshCoinHud(){
        if(this.coinLabel){
            this.coinLabel.string = '金币 ' + CoinManager.get();
        }
    },

    // 弹出道具获取面板（道具数量为 0 时）
    showItemShop(def, index){
        if(this.shopRoot){
            this.closeItemShop();
        }
        var self = this;

        var root = new cc.Node('item_shop');
        root.setContentSize(cc.size(720, 1280));
        root.on(cc.Node.EventType.TOUCH_START, function(e){ e.stopPropagation(); }, this);
        root.on(cc.Node.EventType.TOUCH_END, function(e){ e.stopPropagation(); }, this);
        this.node.addChild(root);
        this.shopRoot = root;

        // 半透明遮罩
        var mask = new cc.Node('mask');
        var g = mask.addComponent(cc.Graphics);
        g.fillColor = new cc.Color(0, 0, 0, 150);
        g.rect(-360, -640, 720, 1280);
        g.fill();
        root.addChild(mask);

        // 面板背景
        var panel = new cc.Node('panel');
        if(this.ItemBgFrame){
            var panelSprite = panel.addComponent(cc.Sprite);
            panelSprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
            panelSprite.spriteFrame = this.ItemBgFrame;
        }
        panel.setContentSize(cc.size(380, 460));
        root.addChild(panel);

        // 标题
        var title = new cc.Node('title');
        var titleLabel = title.addComponent(cc.Label);
        titleLabel.string = '获取【' + def.item.itemName + '】';
        titleLabel.fontSize = 30;
        titleLabel.lineHeight = 30;
        titleLabel.node.color = new cc.Color(120, 70, 20);
        title.setPosition(cc.v2(0, 170));
        panel.addChild(title);

        // 看广告按钮
        var adBtn = this.createShopButton('看广告 +3', new cc.Color(100, 55, 15));
        adBtn.setPosition(cc.v2(0, 70));
        panel.addChild(adBtn);
        adBtn.on(cc.Node.EventType.TOUCH_END, function(e){
            e.stopPropagation();
            self.watchAdForItem(index);
        }, this);

        // 金币购买按钮
        var buyBtn = this.createShopButton('金币购买 x1（' + def.price + '金币）', new cc.Color(100, 55, 15));
        buyBtn.setPosition(cc.v2(0, -30));
        panel.addChild(buyBtn);
        buyBtn.on(cc.Node.EventType.TOUCH_END, function(e){
            e.stopPropagation();
            self.buyItemWithCoin(index);
        }, this);

        // 取消按钮
        var cancelBtn = this.createShopButton('取消', new cc.Color(100, 55, 15));
        cancelBtn.setPosition(cc.v2(0, -130));
        panel.addChild(cancelBtn);
        cancelBtn.on(cc.Node.EventType.TOUCH_END, function(e){
            e.stopPropagation();
            self.closeItemShop();
        }, this);
    },

    // 创建一个弹窗按钮
    createShopButton(text, textColor){
        var btn = new cc.Node('shop_bt');
        btn.setContentSize(cc.size(280, 74));
        if(this.ItemBgFrame){
            var bg = btn.addComponent(cc.Sprite);
            bg.sizeMode = cc.Sprite.SizeMode.CUSTOM;
            bg.spriteFrame = this.ItemBgFrame;
        }
        var labelNode = new cc.Node('label');
        var label = labelNode.addComponent(cc.Label);
        label.string = text;
        label.fontSize = 26;
        label.lineHeight = 26;
        label.node.color = textColor;
        btn.addChild(labelNode);
        btn.on(cc.Node.EventType.TOUCH_START, function(e){ e.stopPropagation(); }, this);
        return btn;
    },

    // 关闭道具获取面板
    closeItemShop(){
        if(this.shopRoot){
            this.shopRoot.destroy();
            this.shopRoot = null;
        }
    },

    // 看广告获得道具 +3
    watchAdForItem(index){
        var self = this;
        var def = this.itemDefs[index];
        AdManager.show(function(){
            self.addItemCount(def.item.itemId, 3);
            self.refreshItemCounts();
            self.closeItemShop();
            self.showItemTip(def.item.itemName + ' +3');
        }, function(reason){
            self.showItemTip(reason || '广告暂不可用');
        });
    },

    // 金币购买道具 x1
    buyItemWithCoin(index){
        var def = this.itemDefs[index];
        var amount = CoinManager.get();
        if(amount < def.price){
            this.showItemTip('金币不足，需要 ' + def.price + ' 金币');
            return;
        }
        if(!CoinManager.spend(def.price)){
            this.showItemTip('购买失败');
            return;
        }
        this.addItemCount(def.item.itemId, 1);
        this.refreshItemCounts();
        this.refreshCoinHud();
        this.closeItemShop();
        this.showItemTip(def.item.itemName + ' +1');
    },

    // 显示临时提示
    showItemTip(text){
        if(!this.tipNode){
            this.tipNode = new cc.Node('item_tip');
            var label = this.tipNode.addComponent(cc.Label);
            label.fontSize = 24;
            label.lineHeight = 24;
            label.node.color = new cc.Color(255, 60, 60);
            this.tipNode.setPosition(cc.v2(0, 260));
            this.node.addChild(this.tipNode);
        }
        var tipLabel = this.tipNode.getComponent(cc.Label);
        tipLabel.string = text;
        this.tipNode.active = true;

        // 提升到最顶层，避免被弹窗遮罩遮挡
        var lastIdx = this.node.childrenCount - 1;
        if(this.tipNode.getSiblingIndex() !== lastIdx){
            this.tipNode.setSiblingIndex(lastIdx);
        }

        if(this._hideTipFunc){
            this.unschedule(this._hideTipFunc);
        }
        var self = this;
        this._hideTipFunc = function(){
            if(self.tipNode){
                self.tipNode.active = false;
            }
        };
        this.scheduleOnce(this._hideTipFunc, 1.2);
    },

    // update (dt) {},
});
