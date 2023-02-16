import express from 'express'

import errorHandler from '@/middleware/errorHandler'
import router from '@/router'

const getApi = (): express.Express => {
  const api = express()
  api.use(router)
  api.use(errorHandler)
  return api
}

export default {
  getApi,
}
