# XiaoYouBanAssistant-
一个校友邦老师端的自动批阅审批日志网页自动化项目

# How To Use
### 安装并配置好`yarn`
```javascript
npm install -g yarn
// 安装yarn
yarn config set registry https://registry.npm.taobao.org/
// yarn更换国内淘宝的源
```

### 安装相关依赖
```javascript
yarn
// 安装相关依赖
```

### 修改StartUp配置
```javascript
export const StartUp = {
  /**
   * 老师学校全称
   */
  TeacherSchool:"XXXXX学校",
  /**
   * 老师用户名
   */
  TeacherName:"8888",
  /**
   * 老师密码
   */
  TeacherPassword:"ILoveYou",
  /**
   * 评论列表(至少要保证有1条)，多条则随机从中填充一条
   */
  CommentList: [
    "学校给你的是广度，是一个入门。真正的精通是需要你自己的不断摸索",
    "加油，有了目标就要好好的为之而努力！"
  ]
}
```

### 修改Conifg配置项（可不修改）
```javascript
type launchOptions = LaunchOptions &
  BrowserLaunchArgumentOptions &
  BrowserConnectOptions & {
    product?: Product;
    extraPrefsFirefox?: Record<string, unknown>;
  };

export const config: {
  error: { TimeoutTryCount: number };
  launchOptions: launchOptions;
} = {
  error: {
    // 超时的时候尝试的次数
    TimeoutTryCount: 3,
  },
  // 配置Puppeteer浏览器launch配置
  // 详细可以查看文档: https://zhaoqize.github.io/puppeteer-api-zh_CN/#?product=Puppeteer&version=v7.1.0&show=api-puppeteerlaunchoptions
  launchOptions: {
    headless: false,// 是否开启Headless模式，可以粗略理解为是否需要UI显示
    // 视窗大小，最好不要过小，部分响应式的网站，页面宽度过窄会省略渲染或者移除部分DOM
    defaultViewport: {
      width: 1200,
      height: 900,
    },
  },
};
```

### 运行程序
```javascript
yarn start
```