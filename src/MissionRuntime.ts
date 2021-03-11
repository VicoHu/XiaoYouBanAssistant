import { Logger, getLogger, configure } from "log4js";
export abstract class MissionRuntime {
  logger: Logger;
  className: string;
  constructor() {
    // 获取当前实例化子类的类名
    this.className = this.constructor.name;
    // 用当前实例化子类的类名, 标识和创建Logger
    this.logger = getLogger(this.className);
    // Log4js配置
    configure({
      appenders: {
        log_file: {
          type: "dateFile",
          filename: "log/logfile", // TODO: 按照config.json的配置放置日志文件
          pattern: "yyyy-MM-dd.log",
          alwaysIncludePattern: true,
        },
        console: {
          type: "console",
        },
      },
      categories: {
        default: { appenders: ["log_file", "console"], level: "debug" },
      },
    });
  }
}
