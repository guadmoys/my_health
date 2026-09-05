import naive from 'naive-ui'
import { createPinia } from 'pinia'
import { createApp } from 'vue'

import App from './App.vue'
import { router } from './app/router'
import { ensureDefaultProfile, seedDatabase } from './database/seed'
import './style.css'

async function bootstrap() {
  await Promise.all([seedDatabase(), ensureDefaultProfile()])

  const app = createApp(App)
  app.use(createPinia())
  app.use(router)
  app.use(naive)
  app.mount('#app')
}

void bootstrap()
