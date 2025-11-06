'use client'

import { useEffect, useTransition } from 'react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { saveWalletAddress } from '@/actions/saveWallet'

export const ConnectWalletButton = () => {
  const { address, isConnected, isConnecting } = useAccount()
  const { connect } = useConnect()
  const { disconnect } = useDisconnect()
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (isConnected && address) {
      startTransition(async () => {
        const result = await saveWalletAddress(address)
        if (result.error) {
          toast.error(result.error)
        } else {
          toast.success('Wallet linked successfully!')
        }
      })
    }
  }, [address, isConnected])

  const truncateAddress = (addr: string) => {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`
  }

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        <span className="font-mono text-sm text-muted-foreground">
          {truncateAddress(address)}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => disconnect()}
          disabled={isPending}
        >
          Disconnect
        </Button>
      </div>
    )
  }

  return (
    <Button
      variant="primary"
      onClick={() => connect({ connector: injected() })}
      disabled={isConnecting || isPending}
    >
      {isConnecting ? 'Connecting...' : 'Connect Wallet'}
    </Button>
  )
}

export const WalletManager = ({
  savedWalletAddress,
}: {
  savedWalletAddress: string | null
}) => {
  const { address, isConnected } = useAccount()

  const truncateAddress = (addr: string) => {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`
  }

  if (isConnected && address) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg border-2 bg-card p-4">
        <p className="text-sm font-bold">Wallet Connected</p>
        <span className="font-mono text-sm text-primary">
          {truncateAddress(address)}
        </span>
        {savedWalletAddress &&
          savedWalletAddress.toLowerCase() !== address.toLowerCase() && (
            <p className="text-center text-xs text-destructive">
              Warning: This is not the wallet you have saved for rewards.
            </p>
          )}
      </div>
    )
  }

  if (savedWalletAddress) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg border-2 bg-card p-4">
        <p className="text-sm text-muted-foreground">Linked Wallet</p>
        <span className="font-mono text-sm font-semibold">
          {truncateAddress(savedWalletAddress)}
        </span>
        <ConnectWalletButton />
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border-2 bg-card p-4">
      <p className="text-center text-sm text-muted-foreground">
        Connect your wallet to earn and redeem BYTE tokens.
      </p>
      <ConnectWalletButton />
    </div>
  )
}