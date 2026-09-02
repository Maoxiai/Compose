// 换下一个水果：重抽当前待下落的水果类型
var ItemBase = require('./ItemBase');

var RerollItem = cc.Class({
    extends: ItemBase,
    name: 'RerollItem',

    properties: {
        itemId: { default: 'reroll' },
        itemName: { default: '换果' },
        needTarget: { default: false },
        coolDown: { default: 0.5 },
    },

    use: function (game) {
        game.rerollNextFruit();
    },
});

module.exports = RerollItem;