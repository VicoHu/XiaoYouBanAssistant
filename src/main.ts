import * as puppeteer from "puppeteer";
import {
  BrowserConnectOptions,
  BrowserLaunchArgumentOptions,
  LaunchOptions,
  Product,
} from "puppeteer";
import { XiaoYouBan } from "./XiaoYouBan";
import { StartUp } from "./StartUp";
import { config } from "./config";



// 创建浏览器browser实例
puppeteer.launch(config.launchOptions).then(async (browser) => {
  // 创建浏览器页面page实例
  const page = await browser.newPage();

  // 实例化
  let XiaoYouBanInstance = new XiaoYouBan(page, StartUp.TeacherSchool, StartUp.TeacherName, StartUp.TeacherPassword, StartUp.CommentList);
  await XiaoYouBanInstance.init();
  await XiaoYouBanInstance.login();
  await XiaoYouBanInstance.goToWeeklyBlogsReview();
  await XiaoYouBanInstance.passWeeklyBlogs();

  // 关闭页面
  await page.close();
  // 关闭浏览器结束
  await browser.close();
});
