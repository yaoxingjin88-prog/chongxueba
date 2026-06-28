import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../api'
import { useToast } from './useToast'

export function useStudyRoomJoin() {
  const router = useRouter()
  const toast = useToast()
  const joining = ref(false)
  const passwordRoom = ref(null)

  function routeForJoinMode(mode) {
    if (mode === 'video') return '/study-room/video'
    if (mode === 'voice') return '/study-room/voice'
    return '/study-room'
  }

  async function joinPlazaRoom(room, password = '') {
    if (!room?.id || joining.value) return
    joining.value = true
    try {
      const payload = password ? { password } : {}
      const data = await api.joinStudyRoom(room.id, payload)
      toast.show(data.message || `已加入「${room.name}」`)
      router.push(data.route || routeForJoinMode(data.joinMode))
      return data
    } catch (err) {
      if (err.message === '请输入房间密码') {
        passwordRoom.value = room
      } else {
        toast.show(err.message || '加入失败', 'info')
      }
      throw err
    } finally {
      joining.value = false
    }
  }

  function requestJoin(room) {
    if (room?.isPrivate) {
      passwordRoom.value = room
      return
    }
    return joinPlazaRoom(room)
  }

  async function submitPassword(password) {
    const room = passwordRoom.value
    if (!room) return
    passwordRoom.value = null
    await joinPlazaRoom(room, password)
  }

  function cancelPassword() {
    passwordRoom.value = null
  }

  return {
    joining,
    passwordRoom,
    joinPlazaRoom,
    requestJoin,
    submitPassword,
    cancelPassword,
  }
}
