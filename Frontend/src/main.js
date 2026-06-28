import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { FontAwesomeIcon } from './plugins/fontawesome'
import { useUserStore } from './stores/user'
import './styles/global.css'
import './styles/task-theme.css'

const app = createApp(App)
const pinia = createPinia()

app.component('font-awesome-icon', FontAwesomeIcon)
app.use(pinia)
app.use(router)

const userStore = useUserStore(pinia)
if (userStore.isAuthenticated) {
  userStore.fetchUser().catch(() => {})
}

app.mount('#app')
