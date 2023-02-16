import express from 'express'
import { BadRequest, Forbidden, NotFound, Unauthorized } from 'http-errors'

import logger from '@/services/logger'

const errorHandler = (
  err: Error,
  req: express.Request,
  res: express.Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: express.NextFunction
): void => {
  if (err instanceof BadRequest) {
    logger.warn('Bad Request', err)
    res.status(400).json({ error: err.message })
  } else if (err instanceof Forbidden) {
    logger.warn('Forbidden', err)
    res.status(403).json({ error: err.message })
  } else if (err instanceof Unauthorized) {
    logger.warn('Unauthorized', err)
    res.status(401).json({ error: err.message })
  } else if (err instanceof NotFound) {
    logger.warn('Not found', err)
    res.status(404).json({ error: err.message })
  } else {
    logger.error(err.message, err)
    res.status(500).json({ error: 'Server error' })
  }
}

export default errorHandler
