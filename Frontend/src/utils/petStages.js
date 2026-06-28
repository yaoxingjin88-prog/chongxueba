import stageEgg from '../assets/pet-stage-egg.png'
import stageBaby from '../assets/pet-stage-baby.png'
import stageGrowth from '../assets/home-fox-island.png'
import stageMature from '../assets/pet-stage-mature.png'

export const PET_STAGE_IMAGES = {
  egg: stageEgg,
  baby: stageBaby,
  growth: stageGrowth,
  mature: stageMature,
}

export const PET_STAGE_META = [
  { key: 'egg', label: '宠物蛋', image: stageEgg },
  { key: 'baby', label: '幼宠', image: stageBaby },
  { key: 'growth', label: '成长中', image: stageGrowth },
  { key: 'mature', label: '完全体', image: stageMature },
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
