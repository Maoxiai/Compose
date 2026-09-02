// 缩小当前水果：将场上最大的水果缩小一级
var ItemBase = require('./ItemBase');

var ShrinkItem = cc.Class({
    extends: ItemBase,
    name: 'ShrinkItem',

    properties: {
        itemId: { default: 'shrink' },
        itemName: { default: '缩小' },
        needTarget: { default: false },
        coolDown: { default: 0.5 },
    },

    canUse: function (game) {
        return game.getWatermelons().length > 0;
    },

    use: function (game) {
        if (!game.shrinkLargestFruit()) {
            game.showItemTip('场上没有可缩小的水果');
        }
    },
});

module.exports = ShrinkItem;