import * as dotenv from 'dotenv'
dotenv.config()

import api from '@/api'
//import { connectToDatabase } from '@/services/mongoService'
import logger from '@/services/logger'

const startApiListening = async (): Promise<void> => {
  //await connectToDatabase(globalConfig.mongoUrl)
  const expressApp = api.getApi()

  const apiPort = process.env.API_PORT || 3000
  const httpServer = expressApp.listen(apiPort, () => {
    logger.info(`API started on port ${apiPort}`)
  })
  httpServer.on('error', (error: Error) => {
    logger.error('Http server error', error)
    throw error
  })
}

startApiListening()
