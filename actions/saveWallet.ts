'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidateTag } from 'next/cache'
import { db } from '@/db/drizzle'
import { userProgress } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { ethers } from 'ethers'

export const saveWalletAddress = async (walletAddress: string) => {
  const { userId } = await auth()

  if (!userId) {
    return { error: 'Unauthorized' }
  }

  if (!ethers.isAddress(walletAddress)) {
    return { error: 'Invalid wallet address' }
  }

  try {
    await db
      .update(userProgress)
      .set({
        walletAddress: walletAddress,
      })
      .where(eq(userProgress.userId, userId))

    revalidateTag(`get_user_progress::${userId}`)
    revalidateTag('get_user_progress')

    return { success: true, walletAddress: walletAddress }
  } catch (error) {
    console.error('Error saving wallet address:', error)
    if (error instanceof Error && error.message.includes('duplicate key')) {
        return { error: 'This wallet address is already in use.' }
    }
    return { error: 'Failed to save wallet address' }
  }
}