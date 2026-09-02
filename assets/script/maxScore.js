// Learn cc.Class:
//  - https://docs.cocos.com/creator/manual/en/scripting/class.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

cc.Class({
    extends: cc.Component,

    properties: {
        //数字预制体
        NumberPrefab: cc.Prefab,
        //数字图片
        Numberframe:[cc.SpriteFrame]
    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},

    start () {
        let score = cc.sys.localStorage.getItem("score");
        this.setScorenumber(score);
    },

    // 生成数字
    setScorenumber(score){
        this.node.removeAllChildren();
        this.numberArray=[];
        var x = Math.floor(score);
        console.log(x)

        do{
            let number = cc.instantiate(this.NumberPrefab);
            let sprite = number.getComponent(cc.Sprite);
            sprite.spriteFrame = this.Numberframe[Math.floor(x%10)];
            this.numberArray.push(number);
            x = Math.floor(x / 10);
        }while(x > 0);
        this.numberArray.reverse();
        for(let i = 0; i < this.numberArray.length;i++)
        {
            this.numberArray[i].setPosition(cc.v2(i * 42, 0));
            this.node.addChild(this.numberArray[i]);
        }
    },

});
