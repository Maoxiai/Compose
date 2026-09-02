// 金币系统（单例模块）
// 提供金币的读取、增减、对局结算与每日签到等能力。
// 金币存储在本地 localStorage，key 为 'coin'。
var CoinManager = {
    key: 'coin',

    // 每日签到奖励金币数
    dailyReward: 50,

    // 获取当前金币
    get: function () {
        var val = cc.sys.localStorage.getItem(this.key);
        if (val === null || val === undefined || val === '') {
            return 0;
        }
        var n = Number(val);
        return isNaN(n) ? 0 : n;
    },

    // 设置金币余额
    set: function (count) {
        cc.sys.localStorage.setItem(this.key, count);
    },

    // 增加金币，返回最新余额
    add: function (delta) {
        var cur = this.get() + delta;
        this.set(cur);
        return cur;
    },

    // 花费金币，余额充足返回 true，否则返回 false
    spend: function (cost) {
        var cur = this.get();
        if (cur < cost) {
            return false;
        }
        this.set(cur - cost);
        return true;
    },

    // 对局结算：max(5, floor(score / 50))，每局只结算一次
    // 得分必须大于 0 才结算，防止“开始后立即退出”刷金币
    settleScore: function (score) {
        if (window.COIN_SETTLED) {
            return 0;
        }
        if (!score || score <= 0) {
            return 0;
        }
        window.COIN_SETTLED = true;
        var reward = Math.floor(score / 50);
        if (reward < 5) {
            reward = 5;
        }
        this.add(reward);
        return reward;
    },

    // 每日签到：当天首次成功签到返回 {ok:true,coin}，否则 {ok:false}
    dailySign: function () {
        var today = new Date();
        var dateStr = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
        var last = cc.sys.localStorage.getItem('sign_date');
        if (last === dateStr) {
            return { ok: false, coin: 0 };
        }
        cc.sys.localStorage.setItem('sign_date', dateStr);
        var coin = this.dailyReward;
        this.add(coin);
        return { ok: true, coin: coin };
    },
};

module.exports = CoinManager;