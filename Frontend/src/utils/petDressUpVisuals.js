import magicHatImage from '../assets/dressup-magic-hat.png'
import scholarGlassesImage from '../assets/dressup-scholar-glasses.png'
import starryBackpackImage from '../assets/dressup-starry-backpack.png'
import catEarHeadbandImage from '../assets/dressup-cat-ear-headband.png'

export const itemVisuals = {
  1: { slot: 'back', slotLabel: '背部', asset: starryBackpackImage },
  2: { slot: 'head', slotLabel: '头顶', asset: magicHatImage },
  3: { slot: 'face', slotLabel: '脸部', asset: scholarGlassesImage },
  4: { slot: 'head', slotLabel: '头顶', asset: catEarHeadbandImage },
}

export const nameVisuals = [
  { keyword: '书包', visual: itemVisuals[1] },
  { keyword: '帽', visual: itemVisuals[2] },
  { keyword: '眼镜', visual: itemVisuals[3] },
  { keyword: '发箍', visual: itemVisuals[4] },
]

export function resolveDressUpVisual(item) {
  const exact = itemVisuals[Number(item.id)]
  if (exact) return exact

  const matched = nameVisuals.find(({ keyword }) => item.name?.includes(keyword))
  if (matched) return matched.visual

  if (item.category === 3) {
    return { slot: 'prop', slotLabel: '道具', asset: null }
  }
  return { slot: 'body', slotLabel: '服饰', asset: null }
}

export function resolveEquippedDressUpItems(items = []) {
  return items
    .filter((item) => item.equipped)
    .map((item) => ({
      ...item,
      ...resolveDressUpVisual(item),
    }))
}
