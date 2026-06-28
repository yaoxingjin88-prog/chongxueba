const OSS_PUBLIC_BASE = 'https://chongxueba.oss-cn-qingdao.aliyuncs.com/public'

export function ossPublic(path) {
  const clean = String(path).replace(/^\//, '')
  const encoded = clean.split('/').map((seg) => encodeURIComponent(seg)).join('/')
  return `${OSS_PUBLIC_BASE}/${encoded}`
}

/** 商城 */
export const mallCarousel1 = ossPublic('商城轮播图1.png')
export const mallCarousel2 = ossPublic('商城轮播图2.png')
export const mallCarousel3 = ossPublic('商城轮播图3.png')
export const mallCarousel4 = ossPublic('商城轮播图4.png')
export const mallSkyBg = ossPublic('images/mall-sky-bg.png')

/** 自习室 */
export const studyRoomCarousel1 = ossPublic('自习室轮播图1.png')
export const studyRoomCarousel2 = ossPublic('自习室轮播图2.png')
export const studyRoomCarousel3 = ossPublic('自习室轮播图3.png')
export const studyRoomCarousel4 = ossPublic('自习室轮播图4.png')
export const studyRoomBottomBg = ossPublic('自习室底部背景.png')
export const studyRoomCreateBg = ossPublic('创建自习室背景.png')

/** 宠物 / 首页 / 专注 */
export const petRaisePageBg = ossPublic('宠物养成页面背景.png')
export const leaderboardHomeBg = ossPublic('首页.png')
export const focusStartBg = ossPublic('开始专注.png')
export const favoritesFoxBanner = ossPublic('我的收藏狐狸.png')

/** 登录 / VIP / 邀请 */
export const brandLogo = ossPublic('1d733579115cf42e9a1e9e4121511cb1.png')
export const vipPayBg = ossPublic('支付背景.png')
export const inviteFriendsBg = ossPublic('邀请好友.png')
