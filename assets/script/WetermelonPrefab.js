// Learn cc.Class:
//  - https://docs.cocos.com/creator/manual/en/scripting/class.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

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
        
        this.sprite = this.node.getComponent(cc.Sprite);
        this.sprite.spriteFrame = this.BoomFrame[type];
        this.physicsCircleCollider = this.node.getComponent(cc.PhysicsCircleCollider);
        this.circleCollider = this.node.getComponent(cc.CircleCollider);
        this.circleCollider.tag = type;
        this.node.getComponent(cc.PhysicsCircleCollider).apply();

        this.scheduleOnce(function(){
            this.changeType(type + 1);
            window.SCORE += (type + 1) * 2;
            console.log("得分", window.SCORE);
        }, 0.2);

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
