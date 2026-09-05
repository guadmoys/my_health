import { IonicVue } from '@ionic/vue'
import { createPinia } from 'pinia'
import { createApp } from 'vue'

import App from './App.vue'
import { router } from './app/router'
import { ensureDefaultProfile, seedDatabase } from './database/seed'

import '@ionic/vue/css/core.css'
import '@ionic/vue/css/normalize.css'
import '@ionic/vue/css/structure.css'
import '@ionic/vue/css/typography.css'
import '@ionic/vue/css/padding.css'
import '@ionic/vue/css/float-elements.css'
import '@ionic/vue/css/text-alignment.css'
import '@ionic/vue/css/text-transformation.css'
import '@ionic/vue/css/flex-utils.css'
import '@ionic/vue/css/display.css'
import './style.css'

async function bootstrap() {
  await Promise.all([seedDatabase(), ensureDefaultProfile()])

  const app = createApp(App)
  app.use(createPinia())
  app.use(IonicVue)
  app.use(router)

  await router.isReady()
  app.mount('#app')
}

void bootstrap()
