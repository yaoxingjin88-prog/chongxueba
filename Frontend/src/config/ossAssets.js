const OSS_ASSETS_BASE = 'https://chongxueba.oss-cn-qingdao.aliyuncs.com/assets'

export function ossAsset(path) {
  return `${OSS_ASSETS_BASE}/${String(path).replace(/^\//, '')}`
}

/** 装扮饰品 */
export const dressupMagicHat = ossAsset('dressup-magic-hat.png')
export const dressupScholarGlasses = ossAsset('dressup-scholar-glasses.png')
export const dressupStarryBackpack = ossAsset('dressup-starry-backpack.png')
export const dressupCatEarHeadband = ossAsset('dressup-cat-ear-headband.png')

/** 首页 / 宠物 */
export const homeFoxIsland = ossAsset('home-fox-island.png')
export const homeSkyBackground = ossAsset('home-sky-background.png')
export const petStageEgg = ossAsset('pet-stage-egg.png')
export const petStageBaby = ossAsset('pet-stage-baby.png')
export const petStageMature = ossAsset('pet-stage-mature.png')

/** 登录 / 自习室 */
export const loginSkyFox = ossAsset('login-sky-fox.png')
export const studyRoomLyingIp = ossAsset('study-room-lying-ip.png')
export const studyRoomMenuBg = ossAsset('study-room-menu-bg.png')

/** 任务奖励（OSS 在 /assets/rewards/ 下） */
export const rewardChestTier1 = ossAsset('rewards/chest-tier-1.png')
export const rewardChestTier2 = ossAsset('rewards/chest-tier-2.png')
export const rewardChestTier3 = ossAsset('rewards/chest-tier-3.png')
export const rewardChestTier4 = ossAsset('rewards/chest-tier-4.png')
export const rewardTrophy = ossAsset('rewards/trophy.png')

/** 吉祥物（OSS 在 /assets/mascot/ 下） */
export const mascotFox = ossAsset('mascot/fox-mascot.png')
