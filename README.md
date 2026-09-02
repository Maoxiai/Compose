# 合成大西瓜（微信小游戏）

基于 Cocos Creator 开发的「合成大西瓜」休闲小游戏，运行于微信小游戏平台。

## 功能特性

- **核心玩法**：合成水果，同类型水果碰撞合成更大水果，不断冲击更高得分
- **道具系统**：炸弹消除、换下一个水果、缩小当前水果、撤回上一步
- **金币系统**：对局结算、每日签到奖励、金币购买道具
- **广告系统**：激励视频、Banner、原生广告
- **音效开关**：主界面与游戏内均可切换，状态本地持久化
- **屏幕适配**：720×1280 设计分辨率，FIXED_WIDTH 策略，全屏无黑边

## 技术栈

- Cocos Creator（JavaScript / cc.Class）
- 微信小游戏 API（本地存储、广告、系统信息）

## 目录结构

```
assets/
├── res/          # 图片、图标等资源
├── scenes/       # 场景文件（main_scene、game_scene）
└── script/       # 游戏脚本
    ├── main.js            # 主界面（金币展示、设置面板、开始按钮）
    ├── game.js            # 游戏主逻辑（道具、金币、广告）
    ├── WetermelonPrefab.js # 水果合成核心逻辑
    ├── ItemBase.js        # 道具基类
    ├── BombItem.js        # 炸弹道具
    ├── RerollItem.js      # 换下一个水果道具
    ├── ShrinkItem.js      # 缩小当前水果道具
    ├── UndoItem.js        # 撤回上一步道具
    ├── CoinManager.js     # 金币系统
    └── AdManager.js       # 激励视频广告管理
```

## 运行

1. 使用 Cocos Creator 打开项目根目录
2. 打开 `assets/scenes/main_scene.fire` 作为入口场景
3. 在浏览器预览或构建为微信小游戏后于开发者工具中运行

## 设计说明

- 设计分辨率：720×1280
- 适配策略：FIXED_WIDTH（fitWidth: true, fitHeight: false）
- 相机背景色：rgb(255, 232, 157)