import {
  BrowserConnectOptions,
  BrowserLaunchArgumentOptions,
  LaunchOptions,
  Product,
} from "puppeteer";

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
  // 配置浏览器launch配置
  launchOptions: {
    headless: false,
    defaultViewport: {
      width: 1600,
      height: 900,
    },
    args:[
      "--disable-dev-shm-usage"
    ]
  },
};
