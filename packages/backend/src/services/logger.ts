import { ILogObject, ISettings, ISettingsParam, Logger, TLogLevelName } from 'tslog'

import globalConfig from '@/config/globalConfig'

let type: 'json' | 'pretty' | 'hidden'
let minLevel: TLogLevelName
let dateTimePattern: string
let prefix: string[]
let printLogMessageInNewLine: boolean
let overwriteConsole: boolean
let shouldStringifyError = true

switch (process.env.NODE_ENV) {
  case 'local':
    type = 'pretty'
    minLevel = globalConfig.logLevel
    dateTimePattern = 'hour:minute:second'
    prefix = ['        '] // prettier
    printLogMessageInNewLine = true
    overwriteConsole = false
    shouldStringifyError = false
    break
  case 'test':
    type = 'pretty'
    minLevel = globalConfig.logLevel
    dateTimePattern = 'hour:minute:second'
    prefix = []
    printLogMessageInNewLine = true
    overwriteConsole = false // keep logger.info for developer in test environment
    break
  default: // production environment
    type = 'json'
    minLevel = globalConfig.logLevel
    dateTimePattern = 'day-month-year hour:minute:second.millisecond'
    prefix = []
    printLogMessageInNewLine = false
    overwriteConsole = true
    break
}

class CustomLogger extends Logger {
  constructor(settings?: ISettingsParam, parentSettings?: ISettings) {
    super(settings, parentSettings)
  }

  override error(errorTitle: string, err?: Error, ...payload: unknown[]): ILogObject {
    let errorToLog: string | Error = ''
    if (err && err.stack) {
      errorToLog = shouldStringifyError ? err.stack : err
    }
    return super.error(errorTitle, errorToLog, ...payload)
  }

  override warn(title: string, err?: Error, ...payload: unknown[]): ILogObject {
    if (!err) {
      return super.warn(title, ...payload)
    }
    return super.warn(title, err, ...payload)
  }

  override info(title: string, ...payload: unknown[]): ILogObject {
    return super.info(title, ...payload)
  }

  override getChildLogger(settings?: ISettingsParam): CustomLogger {
    return super.getChildLogger(settings)
  }
}

const logger: CustomLogger = new CustomLogger({
  instanceName: 'EngineTargetLogger',
  type,
  minLevel,
  dateTimePattern,
  overwriteConsole,
  setCallerAsLoggerName: true,
  dateTimeTimezone: 'Europe/Paris',
  displayInstanceName: false,
  displayLoggerName: false,
  displayFunctionName: false,
  printLogMessageInNewLine,
  prefix,
  prettyInspectHighlightStyles: {
    special: 'cyan',
    number: 'white',
    bigint: 'yellow',
    boolean: 'yellow',
    undefined: 'grey',
    null: 'bold',
    string: 'green',
    symbol: 'green',
    date: 'magenta',
    regexp: 'red',
    module: 'underline',
  },
  logLevelsColors: {
    0: 'grey',
    1: 'magenta',
    2: 'cyan',
    3: 'green',
    4: 'yellow',
    5: 'redBright',
    6: 'bgRedBright',
  },
})

export default logger
