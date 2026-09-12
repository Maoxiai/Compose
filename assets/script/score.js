// Learn cc.Class:
//  - https://docs.cocos.com/creator/manual/en/scripting/class.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

cc.Class({
    extends: cc.Component,

    properties: {
        // 数字预制体
        NumberPrefab: cc.Prefab,
        // 数字图片
        Numberframe:[cc.SpriteFrame]
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        // 开启更新得分
        this.updataScore();
    },

    start () {

    },


    // 生成数字
    setScorenumber(){
        // 移出所有孩子节点 
        this.node.removeAllChildren();

        this.numberArray = [];
        var x = Math.floor(window.SCORE || 0);
        do{
            // 实例化
            let number = cc.instantiate(this.NumberPrefab);
            let sprite = number.getComponent(cc.Sprite);
            sprite.spriteFrame = this.Numberframe[Math.floor(x%10)];
            this.numberArray.push(number);
            x = Math.floor(x/10);
        }while(x > 0)
        //将数组元素倒序
        this.numberArray.reverse();
        for(let i = 0; i < this.numberArray.length;i++){
            this.numberArray[i].setPosition(cc.v2(i * 42, 0));
            // 加入游戏场景
            this.node.addChild(this.numberArray[i]); 
        }
    },

    // 更新得分：定时检查分数，仅当分数变化时才重建数字节点
    // 用 schedule 替代 setInterval，节点销毁时自动停止，避免野定时器
    updataScore(){
        this._lastScore = -1;
        this.schedule(this._tickScore.bind(this), 0.1);
    },

    _tickScore(){
        var s = Math.floor(window.SCORE || 0);
        if(s === this._lastScore){
            return;
        }
        this._lastScore = s;
        this.setScorenumber();
    },

});
