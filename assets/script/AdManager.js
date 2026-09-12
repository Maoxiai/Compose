// 激励视频广告管理器（单例模块）
// 负责创建、展示激励视频广告，并在用户完整观看后发放奖励。
var AdManager = {
    // 激励视频广告位 ID
    adUnitId: 'adunit-6d88b5c28299ae4c',

    _ad: null,

    _init: function () {
        if (this._ad) {
            return;
        }
        // 非微信环境或低版本基础库不支持激励视频时跳过
        if (!window.wx || !wx.createRewardedVideoAd) {
            return;
        }
        this._ad = wx.createRewardedVideoAd({
            adUnitId: this.adUnitId
        });
        this._ad.onError(function (err) {
            logError('激励视频广告出错', err);
        });
    },

    // 展示激励视频，完整看完后回调 onReward，否则回调 onFail(原因)
    show: function (onReward, onFail) {
        this._init();
        var ad = this._ad;
        if (!ad) {
            onFail && onFail('广告暂不可用');
            return;
        }

        var handleClose = function (res) {
            if (ad.offClose) {
                ad.offClose(handleClose);
            }
            if (res && res.isEnded) {
                onReward && onReward();
            } else {
                onFail && onFail('未看完广告');
            }
        };

        ad.onClose(handleClose);

        ad.show().catch(function () {
            // 加载失败时重新加载后再展示
            ad.load()
                .then(function () {
                    return ad.show();
                })
                .catch(function (err) {
                    if (ad.offClose) {
                        ad.offClose(handleClose);
                    }
                    logError('激励视频广告展示失败', err);
                    onFail && onFail('广告暂不可用');
                });
        });
    },
};

module.exports = AdManager;