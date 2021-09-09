import { ElementHandle, HTTPResponse, Page, TimeoutError } from 'puppeteer'
import { MissionRuntime } from './MissionRuntime'
import { config } from './config'

export class XiaoYouBan extends MissionRuntime {
  private loginUrl: string = 'https://www.xybsyw.com/common.html#/login?paramLoginType=SCHOOL'
  private page: Page
  private userSchool: string
  private userName: string
  private userPassword: string
  private commetList: string[]
  constructor(page: Page, userSchool, userName, userPassword, commetList) {
    // 调用父级构造函数
    super()
    this.page = page
    this.userName = userName
    this.userPassword = userPassword
    this.userSchool = userSchool
    this.commetList = commetList
  }

  /**
   * 页面初始化
   */
  async init() {
    let loopFlag = true
    let tryCount = 1
    while (loopFlag) {
      // 当尝试次数大于配置里设置的最大尝试次数，就跳出循环
      if (tryCount > config.error.TimeoutTryCount) {
        break
      }
      // 打开老师登陆页面并等待
      await this.page
        .goto(this.loginUrl)
        .then(() => {
          this.logger.debug(`init - open login page success`)
          // 跳出循环
          loopFlag = false
        })
        .catch(async (error: TimeoutError) => {
          // 超时的话，给出重试
          this.logger.error(`init - open login page timeout, please check your internet`)
          this.logger.debug(`init - try to loading login page again.(${tryCount} / ${config.error.TimeoutTryCount})`)
          tryCount += 1
        })
    }
  }

  /**
   * 进行登陆操作
   */
  async login() {
    // 通过 css selector 找到对应的元素
    let inputList = await this.page.$$('.input_s')
    let schoolInput = inputList[0]
    let userNameInput = inputList[1]
    let userPasswordInput = inputList[2]
    let loginBtn = await this.page.$('.login_btn')

    if (!schoolInput) {
      this.logger.error('找不到校区输入文本框')
      await this.shotdown()
    }
    if (!userNameInput) {
      this.logger.error('找不到用户名输入文本框')
      await this.shotdown()
    }
    if (!userPasswordInput) {
      this.logger.error('找不到密码输入文本框')
      await this.shotdown()
    }
    if (!loginBtn) {
      this.logger.error('找不到登录按钮')
      await this.shotdown()
    }

    // 在对应位置输入相对应的信息，设置模拟输入时每个字符之前的输入时间间隔为50毫秒
    await schoolInput.type(this.userSchool, { delay: 50 })
    await userNameInput.type(this.userName, { delay: 50 })
    await userPasswordInput.type(this.userPassword, { delay: 50 })

    // await this.page.setRequestInterception(true);
    // 添加一个登陆的Response监听事件
    this.page.on('response', async (response) => {
      if (response.url() == 'https://www.xybsyw.com/login/login.action') {
        try {
          // 登录成功时，不会存在body，所以获取json会异常：Protocol error (Network.getResponseBody): No resource with given identifier found
          let body = await response.json()
          this.logger.error('login - login failed, reason message: ' + body.msg)
          await this.shotdown()
        } catch (error) {
          if (error.message != "Protocol error (Network.getResponseBody): No resource with given identifier found") {
            this.logger.error(error)
            await this.shotdown()
          } else {
            this.logger.warn(response.url() + ": " + error.message)
          }
          
        }
      }
      return response
    })
    // 点击登录按钮
    await loginBtn.click()

    // 等待页面跳转完成
    await this.page
      .waitForNavigation()
      .then((response: HTTPResponse) => {
        if (response != null) {
          this.logger.debug(`login - loginNavigation status is OK`)
        } else {
          console.log(JSON.stringify(response.json))
        }
      })
      .catch(async (error) => {
        this.logger.error(`login - navigation home page timeout, please check your internet, ${error.message}`)
        await this.shotdown()
      })
  }

  /**
   * 前往周报页面
   */
  async goToWeeklyBlogsReview() {
    await this.page.goto('https://www.xybsyw.com/#/weeklyBlogsReview').then(() => {
      this.logger.debug('goToWeeklyBlogsReview - go to weekly blogs review')
    })
  }

  /**
   * 审批周报
   */
  async passWeeklyBlogs() {
    // 监听Response，等待页面请求待批阅等数据
    await this.page
      .waitForResponse('https://www.xybsyw.com/practice/school/blogs/CountBlogGroupByStatus.action')
      .then((response: HTTPResponse) => {
        if (response != null) {
          this.logger.debug(`passWeeklyBlogs - WeeklyBlogs Navigation status is OK`)
        }
      })
      .catch(async (error) => {
        this.logger.error(`passWeeklyBlogs - navigation home page timeout, please check your internet, ${error.message}`)
        await this.shotdown()
      })
    // 等待页面出现.tab_box元素
    await this.page.waitForSelector('.tab_box')
    // 找到tab标签栏的各项
    let tabItems = await this.page.$$('.tab_box ul li')
    let targetTab: ElementHandle<Element> | null = null
    // 遍历获取待批阅的tab ElementHandle
    for (let index = 0; index < tabItems.length; index++) {
      const element = tabItems[index]
      let text = await element.evaluate((item) => item.innerText)
      if (text.indexOf('待批阅') != -1) {
        targetTab = element
        break
      }
    }
    // 解析出 待批阅 的数量
    let willPassCount = (await targetTab.evaluate((item) => item.innerText)).split('(')[1].replace(')', '').replace(' ', '')
    this.logger.info('待审批：', willPassCount)
    if (willPassCount || willPassCount <= 0) {
      this.logger.info('没有待审批的任务, 结束程序')
      await this.shotdown()
    }

    let loopFlag = true
    // 默认遍历完所有
    while (loopFlag) {
      // 等待待审批学生的列表加载完成
      await this.page.waitForSelector('.left_list dl')
      // 获取第一个待审批学生列表节点
      let studentList = await this.page.$$('.left_list dl')
      // 获取当前页面还有几个未完成的
      let willDoStudentCount = studentList.length
      if (willDoStudentCount == 1) {
        // 如果 willDoStudentCount 为1说明已经只剩下一个学生未审批了,下回合结束循环
        loopFlag = false
      }
      // 点击学生列表，进去详情页面
      // await studentList[0].click();

      // 监听Response，等待该学生博文加载完成
      await this.page
        .waitForResponse('https://www.xybsyw.com/practice/school/blogs/loadBlogReviewRecord.action')
        .then((response: HTTPResponse) => {
          if (response == null) {
            this.logger.debug(`passWeeklyBlogs - WeeklyBlogs Navigation status is OK`)
          }
        })
        .catch(async (error) => {
          this.logger.error(`passWeeklyBlogs - loadBlogReviewRecord.action timeout, please check your internet, ${error.message}`)
          await this.shotdown()
        })
      // 获取学生姓名
      let studentName = await this.page.$eval('.name_1', (node) => node.innerHTML)
      // 寻找有审核通过按钮的控制栏
      await this.page.waitForSelector('.status_ctrl span')
      let statusCtrlItemList = await this.page.$$('.status_ctrl span')
      let targetBtn: ElementHandle<Element> | null = null
      // 循环找到审核通过的按钮
      for (let index = 0; index < statusCtrlItemList.length; index++) {
        const element = statusCtrlItemList[index]
        let text = (await element.evaluate((item) => item.innerText)).replace(' ', '')
        if (text == '审批通过') {
          targetBtn = element
          break
        }
      }

      // 点击审核通过按钮
      // await targetBtn.hover();
      // 等待页面异步加载DOM节点完成
      await this.page.waitForTimeout(750)
      await targetBtn.click()
      // await this.page.waitForTimeout(500);

      // 等待页面中text_area出现
      await this.page.waitForSelector('.text_area textarea').catch(async (error) => {
        this.logger.error(`passWeeklyBlogs - waitForSelector [.text_area textarea] timeout, will try again, ${error.message}`)
        await this.shotdown()
      })
      // 找到评语填写的textarea
      let commentTextArea = await this.page.$('.text_area textarea')

      await this.page.waitForSelector('.text_area textarea').catch(async (error) => {
        this.logger.error(`passWeeklyBlogs - waitForSelector [.comfirm_btn Button] timeout, will try again, ${error.message}`)
        await this.shotdown()
      })
      let comfirmBtn = await this.page.$('.comfirm_btn Button')
      // 随机输入commetList中的一条评论
      await commentTextArea.hover()
      await commentTextArea.click()
      let commet = this.commetList[Math.floor(Math.random() * this.commetList.length)]
      await commentTextArea.type(commet)
      // 点击提交按钮
      await this.page.waitForTimeout(500)
      await comfirmBtn.hover()
      await comfirmBtn.click()
      this.logger.info(`passWeeklyBlogs - Submit Commet - ${studentName}: ${commet}`)
    }
  }

  /**
   * 强行结束程序
   */
  async shotdown() {
    this.logger.info("shotdown - will close program in 3 seconds")
    await this.page.waitForTimeout(3000).then(() => {
      process.exit(0)
    })
  }
}
