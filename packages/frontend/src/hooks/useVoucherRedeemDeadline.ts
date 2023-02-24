import { useMemo } from 'react'
import { CONFIG } from 'src/config/config'

import { useDevconParam } from './useDevconParam'

export function useVoucherRedeemDeadline() {
  const { devconValue } = useDevconParam('claimingEndTime')
  const { voucherRedeemDeadline } = CONFIG
  return useMemo(() => voucherRedeemDeadline ?? devconValue, [voucherRedeemDeadline, devconValue])
}
