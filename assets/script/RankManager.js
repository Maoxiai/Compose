// 好友排行榜管理（主域，单例模块）
// 职责：
//   1. 游戏结束时调用 wx.setUserCloudStorage 上传分数（历史最高 / 本周最高）。
//   2. 通过 wx.getOpenDataContext().postMessage 与开放数据域通信（切换榜单类型等）。
//
// 说明：关系链数据（好友榜单）只能在开放数据域中读取，此处只负责写入与发消息。

var RankManager = {
    keyAll: 'score',        // 历史最高分
    keyWeek: 'week_score',  // 本周最高分

    // 是否处于可用环境（微信小游戏且支持开放数据域）
    available: function () {
        return !!(window.wx && wx.getOpenDataContext);
    },

    // 上传分数；内部只保留各自维度的最高值
    upload: function (score) {
        if (!window.wx || !wx.setUserCloudStorage) {
            return;
        }
        var s = Number(score) || 0;
        if (s <= 0) {
            return;
        }

        // 历史最高：localStorage 的 'score' 已由游戏逻辑维护为最高分
        var bestAll = Number(cc.sys.localStorage.getItem('score') || 0);
        if (s > bestAll) {
            bestAll = s;
        }

        // 本周最高：以周一为一周起点，跨周自动重置
        var weekKey = this._getWeekKey();
        var lastWeek = cc.sys.localStorage.getItem('rank_week');
        var bestWeek = 0;
        if (lastWeek === weekKey) {
            bestWeek = Number(cc.sys.localStorage.getItem('rank_week_score') || 0);
        }
        if (s > bestWeek) {
            bestWeek = s;
            cc.sys.localStorage.setItem('rank_week', weekKey);
            cc.sys.localStorage.setItem('rank_week_score', bestWeek);
        }

        wx.setUserCloudStorage({
            KVDataList: [
                { key: this.keyAll, value: String(bestAll) },
                { key: this.keyWeek, value: String(bestWeek) }
            ],
            success: function () {
                console.log('排行榜分数上传成功', bestAll, bestWeek);
            },
            fail: function (err) {
                console.log('排行榜分数上传失败', err);
            }
        });
    },

    // 向开放数据域发送消息
    send: function (msg) {
        if (!this.available()) {
            return;
        }
        try {
            wx.getOpenDataContext().postMessage(msg);
        } catch (e) {
            console.log('向开放数据域发送消息失败', e);
        }
    },

    // 计算本周唯一标识（以周一为起点）
    _getWeekKey: function () {
        var d = new Date();
        var day = d.getDay(); // 0=周日
        var diff = (day === 0) ? 6 : (day - 1);
        var monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() - diff);
        return monday.getFullYear() + '-' + (monday.getMonth() + 1) + '-' + monday.getDate();
    }
};

module.exports = RankManager;