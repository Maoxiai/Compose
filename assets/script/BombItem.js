// 炸弹消除：点击道具后，再点选场上一个水果将其消除
var ItemBase = require('./ItemBase');

var BombItem = cc.Class({
    extends: ItemBase,
    name: 'BombItem',

    properties: {
        itemId: { default: 'bomb' },
        itemName: { default: '炸弹' },
        needTarget: { default: true },
        coolDown: { default: 0.5 },
    },

    canUse: function (game) {
        return game.getWatermelons().length > 0;
    },

    onPickTarget: function (game, localPos) {
        var node = game.findWatermelonAt(localPos);
        if (node) {
            game.removeWatermelon(node);
            return true;
        }
        game.showItemTip('没有点到水果');
        return false;
    },
});

module.exports = BombItem;