'use server'

import { auth } from '@clerk/nextjs/server'
import { eq } from 'drizzle-orm'
import { revalidatePath, revalidateTag } from 'next/cache'

import { db } from '@/db/drizzle'
import { userProgress } from '@/db/schema'
import { SHOP_ITEMS, type ShopItem } from '@/config/shop'

export async function purchaseWithCurrency(itemId: number) {
  const { userId } = await auth()

  if (!userId) {
    throw new Error('Unauthorized')
  }

  const item = SHOP_ITEMS.find((i) => i.id === itemId) as ShopItem | undefined

  if (!item) {
    throw new Error('Item not found')
  }

  const existingUserProgress = await db.query.userProgress.findFirst({
    where: eq(userProgress.userId, userId),
  })

  if (!existingUserProgress) {
    throw new Error('User progress not found')
  }

  if (item.points > 0 && existingUserProgress.points < item.points) {
    throw new Error('Not enough points')
  }

  if (item.gemsRequired && existingUserProgress.gems < item.gemsRequired) {
    throw new Error('Not enough gems')
  }

  const newHearts = existingUserProgress.hearts + item.hearts
  const rewardPoints = item.rewardPoints || 0
  const newPoints = existingUserProgress.points - item.points + rewardPoints
  const newGems = item.gemsRequired
    ? existingUserProgress.gems - item.gemsRequired
    : existingUserProgress.gems

  await db
    .update(userProgress)
    .set({
      hearts: newHearts,
      points: newPoints,
      gems: newGems,
    })
    .where(eq(userProgress.userId, userId))

  revalidatePath('/shop')
  revalidateTag(`get_user_progress::${userId}`)
  revalidateTag('get_user_progress')

  return { success: true }
}