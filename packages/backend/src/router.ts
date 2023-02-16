import bodyParser from 'body-parser'
import cors from 'cors'
import express from 'express'
import { Router } from 'express'
import Session from 'express-session'
import { generateNonce, ErrorTypes, SiweMessage } from 'siwe'

import globalConfig from '@/config/globalConfig'
import logger from '@/services/logger'

type NonceResponse = { nonce: string }
type VoucherCodeResponse = { voucherCode: string } | { error: string }

const router = Router()

router.use(express.json())
router.use(
	cors({
    origin: true,
    credentials: true
  })
)
router.use(bodyParser.json())
router.use(
  Session({
    name: 'Ticketing',
    secret: globalConfig.siweSecret,
    resave: true,
    saveUninitialized: true,
    //cookie: { secure: true, sameSite: 'none', httpOnly: true },
    cookie: { secure: false, httpOnly: true },
  })
)

router.get('/nonce', async (req: express.Request, res: express.Response): Promise<void> => {
  const nonce = generateNonce()
  req.session.nonce = nonce
  logger.info('Nonce', nonce)
  const nonceResponse: NonceResponse = { nonce }
  res.status(200).send(nonceResponse)
})

router.post('/verify', async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    if (!req.body.message) {
      res.status(422).json({ message: 'Expected prepareMessage object as body.' })
      return
    }

    const message = new SiweMessage(req.body.message)
    const fields = await message.validate(req.body.signature)
    logger.info('Request nonce', fields.nonce)
    logger.info('Session nonce', req.session.nonce)
    if (fields.nonce !== req.session.nonce) {
      res.status(422).json({ message: 'Invalid nonce.' })
      return
    }
    req.session.siwe = fields
    req.session.cookie.expires = new Date(fields.expirationTime ?? Date.now() + 10 * 60 * 1_000)
    req.session.save(() => res.status(200).end())
  } catch (e: any) {
    req.session.siwe = null
    req.session.nonce = null
    logger.error(e)
    switch (e) {
      case ErrorTypes.EXPIRED_MESSAGE: {
        logger.error("Expired message", e)
        req.session.save(() => res.status(440).json({ message: e.message }))
        break
      }
      case ErrorTypes.INVALID_SIGNATURE: {
        logger.error("Invalid signature", e)
        req.session.save(() => res.status(422).json({ message: e.message }))
        break
      }
      default: {
        logger.error("Unexpected error", e)
        req.session.save(() => res.status(500).json({ message: e.message }))
        break
      }
    }
  }
})

// get voucher code
router.get('/voucher-codes', async (req: express.Request, res: express.Response): Promise<void> => {
  // check Siwe session
  if (!req.session.siwe) {
		res.status(401).json({ message: "You have to first sign_in" });
		return;
	}

  // query params => ?userAddress=${address}

  // TODO: ensure the one making the call is allowed to get the code!
  const resp: VoucherCodeResponse = { voucherCode: 'DEAD BEEF' }
  res.status(200).json(resp)
})

// claim voucher code
router.post('/voucher-codes', async (req: express.Request, res: express.Response): Promise<void> => {
  // check Siwe session
  if (!req.session.siwe) {
		res.status(401).json({ message: "You have to first sign_in" });
		return;
	}

  // expected body => { signature, nonce, userAddress }
  const resp: VoucherCodeResponse = { voucherCode: 'DEAD BEEF' }
  res.status(200).json(resp)
})

export default router
