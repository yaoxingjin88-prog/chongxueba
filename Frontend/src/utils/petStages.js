import {
  homeFoxIsland,
  petStageBaby,
  petStageEgg,
  petStageMature,
} from '../config/ossAssets.js'

const stageGrowth = homeFoxIsland

export const PET_STAGE_IMAGES = {
  egg: petStageEgg,
  baby: petStageBaby,
  growth: stageGrowth,
  mature: petStageMature,
}

export const PET_STAGE_META = [
  { key: 'egg', label: '宠物蛋', image: petStageEgg },
  { key: 'baby', label: '幼宠', image: petStageBaby },
  { key: 'growth', label: '成长中', image: stageGrowth },
  { key: 'mature', label: '完全体', image: petStageMature },
]

export function enrichEvolutionStages(stages = []) {
  return stages.map((stage) => {
    const meta = PET_STAGE_META.find((item) => item.key === stage.key)
    return {
      ...stage,
      label: stage.label || meta?.label || stage.key,
      image: PET_STAGE_IMAGES[stage.key] || stageGrowth,
    }
  })
}

export function getActiveStageImage(stages = []) {
  const active = stages.find((stage) => stage.active)
  if (active?.key && PET_STAGE_IMAGES[active.key]) {
    return PET_STAGE_IMAGES[active.key]
  }
  return stageGrowth
}
