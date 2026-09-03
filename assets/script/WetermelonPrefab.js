// Learn cc.Class:
//  - https://docs.cocos.com/creator/manual/en/scripting/class.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

var ComboManager = require('./ComboManager');

cc.Class({
    extends: cc.Component,

    properties: {
       spriteframe:[cc.SpriteFrame],
       type:cc.Number,
       // 西瓜预制体
       PrefabWATERMELON:cc.Prefab,
       // 西瓜合并
       BoomFrame:[cc.SpriteFrame],
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        // 开启物理碰撞
        cc.director.getPhysicsManager().enabled = true;
        //设置重力
        cc.director.getPhysicsManager().gravity = cc.v2(0, -1200);
        var manager = cc.director.getCollisionManager();
        // 开启碰撞检测系统
        manager.enabled = true;
        this.changeType(window.WETERMELON_TYPE);
    },

    start () {

    },


    // 改变西瓜类型
    changeType(type){
        this.type = type > 10 ? 10 : type;
        type = this.type;
        // 1. 换图
        console.log("换图");
        this.sprite = this.node.getComponent(cc.Sprite);
        this.sprite.spriteFrame = this.spriteframe[type];

        // 2. 改变西瓜的半径
        this.physicsCircleCollider = this.node.getComponent(cc.PhysicsCircleCollider);
        this.circleCollider = this.node.getComponent(cc.CircleCollider);
        this.circleCollider.tag = type - 1;
        if(type == 0){
            this.physicsCircleCollider.radius = (54/2);
            this.circleCollider.radius =  (54/2+5);
        }else if(type==1){
            this.physicsCircleCollider.radius = (80/2);
            this.circleCollider.radius =  (80/2+5);
        }else if(type==2){
            this.physicsCircleCollider.radius = (110/2);
            this.circleCollider.radius =  (110/2+5);
        }else if(type==3){
            this.physicsCircleCollider.radius = (122/2);
            this.circleCollider.radius =  (122/2+5);
        }else if(type==4){
            this.physicsCircleCollider.radius = (154/2);
            this.circleCollider.radius =  (154/2+5);
        }else if(type==5){
            this.physicsCircleCollider.radius = (186/2);
            this.circleCollider.radius =  (186/2+5);
        }else if(type==6){
            this.physicsCircleCollider.radius = (188/2);
            this.circleCollider.radius =  (188/2+5);
        }else if(type==7){
            this.physicsCircleCollider.radius = (260/2);
            this.circleCollider.radius =  (260/2+5);
        }else if(type==8){
            this.physicsCircleCollider.radius = (310/2);
            this.circleCollider.radius =  (310/2+5);
        }else if(type==9){
            this.physicsCircleCollider.radius = (304/2);
            this.circleCollider.radius =  (304/2+5);
        }
        else if(type==10){
            this.physicsCircleCollider.radius = (406/2);
            this.circleCollider.radius =  (406/2+5);
        }
        this.node.getComponent(cc.PhysicsCircleCollider).apply();

    },

    // 西瓜碰撞事件
    onCollisionEnter: function(other, self){
        if(other.tag == self.tag && other.tag != 10){
            if(self.node.y < other.node.y){
                console.log("碰撞", other.tag);
                other.node.destroy();
                this.watermelonBoom(self.tag + 1);
            }else{
                this.node.destroy();
                return;
            }
        }
    },

    onCollisionStay: function(other, self){
        if(other.tag == self.tag && other.tag != 10){
            if(self.node.y < other.node.y){
                other.node.destroy();
                this.watermelonBoom(self.tag + 1);
            }else{
                this.node.destroy();
                return;
            }
        }
    },

    // 西瓜结合爆炸
    watermelonBoom(type){
        // 播放音效（根据音效开关决定）
        if(window.SOUND_ON){
            this.node.getComponent(cc.AudioSource).play();
        }

        // 登记连击：时间窗口内连续合成获得分数倍率加成
        var multiplier = ComboManager.onMerge();
        // 连击飘字特效（从 Combo x2 开始提示）
        this.showComboText(ComboManager.comboCount);

        this.sprite = this.node.getComponent(cc.Sprite);
        this.sprite.spriteFrame = this.BoomFrame[type];
        this.physicsCircleCollider = this.node.getComponent(cc.PhysicsCircleCollider);
        this.circleCollider = this.node.getComponent(cc.CircleCollider);
        this.circleCollider.tag = type;
        this.node.getComponent(cc.PhysicsCircleCollider).apply();

        this.scheduleOnce(function(){
            this.changeType(type + 1);
            window.SCORE += Math.round((type + 1) * 2 * multiplier);
            console.log("得分", window.SCORE, "连击倍率", multiplier);
        }, 0.2);

    },

    // 连击飘字：在合成位置弹出「Combo xN!」，弹出后渐隐上浮
    showComboText(comboCount){
        // 首次合成不算连击，从连续第 2 次开始提示
        if(comboCount < 2){
            return;
        }
        var parent = this.node.parent;
        if(!parent){
            return;
        }
        var pos = this.node.getPosition();

        var textNode = new cc.Node('combo_text');
        textNode.setPosition(cc.v2(pos.x, pos.y));
        parent.addChild(textNode);

        var label = textNode.addComponent(cc.Label);
        label.string = 'Combo x' + comboCount + '!';
        label.fontSize = 46;
        label.lineHeight = 46;
        textNode.color = new cc.Color(255, 236, 88);

        // 描边保证飘字在水果上方也可读
        var outline = textNode.addComponent(cc.LabelOutline);
        outline.color = new cc.Color(160, 50, 10);
        outline.width = 3;

        // 弹出缩放
        textNode.setScale(0.5);
        textNode.runAction(cc.sequence(
            cc.scaleTo(0.15, 1.15),
            cc.scaleTo(0.1, 1.0)
        ));
        // 上浮渐隐后销毁
        textNode.runAction(cc.sequence(
            cc.spawn(
                cc.moveBy(0.8, 0, 90).easing(cc.easeOut(2.5)),
                cc.fadeOut(0.8)
            ),
            cc.callFunc(function(){
                if(cc.isValid(textNode)){
                    textNode.destroy();
                }
            })
        ));
    },

    // 死亡结束游戏
    deathGame(){
        // 保存游戏
        var best = cc.sys.localStorage.getItem("score");
        if(best === null || best === undefined || best === "" || Number(best) < Number(window.SCORE)){
            cc.sys.localStorage.setItem('score', window.SCORE);
        }
    },

});
