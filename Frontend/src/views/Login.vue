<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../api'
import { useUserStore } from '../stores/user'
import { loginSkyFox } from '../config/ossAssets.js'
import { brandLogo } from '../config/ossPublic.js'

const router = useRouter()
const userStore = useUserStore()

const mode = ref('phone')
const phone = ref('')
const account = ref('')
const password = ref('')
const code = ref('')
const agreed = ref(false)
const remember = ref(true)
const showPassword = ref(false)
const loading = ref(false)
const sending = ref(false)
const loginSuccess = ref(false)
const introActive = ref(true)
const countdown = ref(0)
const message = ref('')
const messageType = ref('info')
let timer
let navigateTimer
let introTimer

const codeButtonText = computed(() => countdown.value > 0 ? `${countdown.value}s 后重试` : '获取验证码')
const submitButtonText = computed(() => {
  if (loginSuccess.value) return '登录成功'
  return loading.value ? '正在登录…' : '立即登录'
})

const isDev = import.meta.env.DEV

const motionStars = [
  { x: 8, y: 13, size: 5, delay: 0.2 },
  { x: 20, y: 28, size: 3, delay: 1.4 },
  { x: 88, y: 18, size: 4, delay: 0.8 },
  { x: 76, y: 31, size: 3, delay: 2.1 },
  { x: 11, y: 48, size: 4, delay: 2.7 },
  { x: 91, y: 51, size: 5, delay: 1.8 },
  { x: 27, y: 7, size: 2, delay: 3.2 },
  { x: 67, y: 10, size: 3, delay: 2.5 },
]

function notify(text, type = 'info') {
  message.value = text
  messageType.value = type
  window.clearTimeout(notify.timeout)
  notify.timeout = window.setTimeout(() => {
    message.value = ''
  }, 3200)
}

function selectMode(value) {
  if (loading.value || loginSuccess.value || mode.value === value) return
  mode.value = value
  message.value = ''
}

function enterApp(delay = 820) {
  loginSuccess.value = true
  notify('登录成功，正在进入星光世界…', 'success')
  window.clearTimeout(navigateTimer)
  navigateTimer = window.setTimeout(() => router.replace('/home'), delay)
}

function normalizeCode(value) {
  const digits = String(value || '').replace(/\D/g, '')
  if (!digits) return ''
  return digits.padStart(6, '0')
}

function onCodeInput(event) {
  code.value = event.target.value.replace(/\D/g, '').slice(0, 6)
}

async function sendCode() {
  if (!/^1\d{10}$/.test(phone.value.trim())) {
    notify('请输入正确的 11 位手机号', 'error')
    return
  }
  if (sending.value || countdown.value > 0) return

  sending.value = true
  try {
    const data = await api.sendLoginCode(phone.value.trim())
    code.value = ''
    notify(data.devHint ? '验证码已发送，请在后端控制台查看' : '验证码已发送', 'success')
    countdown.value = 60
    timer = window.setInterval(() => {
      countdown.value -= 1
      if (countdown.value <= 0) window.clearInterval(timer)
    }, 1000)
  } catch (error) {
    notify(error.message, 'error')
  } finally {
    sending.value = false
  }
}

function validate() {
  if (!password.value) return '请输入密码'
  if (mode.value === 'phone') {
    if (!/^1\d{10}$/.test(phone.value.trim())) return '请输入正确的 11 位手机号'
    const codeDigits = code.value.replace(/\D/g, '')
    if (!codeDigits) return '请输入验证码'
    if (codeDigits.length > 6) return '请输入 6 位验证码'
  } else if (!account.value.trim()) {
    return '请输入账号'
  }
  if (!agreed.value) return '请先阅读并同意用户协议和隐私政策'
  return ''
}

async function submit() {
  const error = validate()
  if (error) {
    notify(error, 'error')
    return
  }

  loading.value = true
  try {
    await userStore.login({
      mode: mode.value,
      phone: phone.value.trim(),
      account: account.value.trim(),
      password: password.value,
      code: normalizeCode(code.value),
      remember: remember.value,
    })
    enterApp()
  } catch (error) {
    notify(error.message, 'error')
  } finally {
    if (!loginSuccess.value) loading.value = false
  }
}

async function wechatLogin() {
  if (!agreed.value) {
    notify('请先阅读并同意用户协议和隐私政策', 'error')
    return
  }
  loading.value = true
  try {
    await userStore.wechatLogin(remember.value)
    enterApp()
  } catch (error) {
    notify(error.message, 'error')
  } finally {
    if (!loginSuccess.value) loading.value = false
  }
}

function guestLogin() {
  if (loading.value || loginSuccess.value) return
  sessionStorage.setItem('chong-xueba-guest', '1')
  loading.value = true
  enterApp(680)
}

onMounted(() => {
  introTimer = window.setTimeout(() => {
    introActive.value = false
  }, 1100)
})

onBeforeUnmount(() => {
  window.clearInterval(timer)
  window.clearTimeout(notify.timeout)
  window.clearTimeout(navigateTimer)
  window.clearTimeout(introTimer)
})
</script>

<template>
  <main
    class="login-page"
    :class="{ 'is-success': loginSuccess, 'is-intro': introActive }"
    :style="{ '--login-art': `url(${loginSkyFox})` }"
  >
    <div class="atmosphere" aria-hidden="true" />
    <div class="motion-stars" aria-hidden="true">
      <i
        v-for="(star, index) in motionStars"
        :key="index"
        :style="{
          '--star-x': `${star.x}%`,
          '--star-y': `${star.y}%`,
          '--star-size': `${star.size}px`,
          '--star-delay': `${star.delay}s`,
        }"
      />
    </div>

    <section class="brand" aria-label="宠学霸">
      <div class="brand-mark">
        <img :src="brandLogo" alt="宠学霸" class="brand-logo">
      </div>
      <div>
        <h1>宠学霸</h1>
        <p>CHONG XUE BA</p>
      </div>
    </section>

    <section class="login-card" :class="{ 'error-shake': message && messageType === 'error' }">
      <div class="tabs" role="tablist" aria-label="登录方式">
        <button
          :class="{ active: mode === 'phone' }"
          role="tab"
          :aria-selected="mode === 'phone'"
          @click="selectMode('phone')"
        >
          手机号登录
        </button>
        <button
          :class="{ active: mode === 'account' }"
          role="tab"
          :aria-selected="mode === 'account'"
          @click="selectMode('account')"
        >
          账号登录
        </button>
        <span class="tab-indicator" :class="{ account: mode === 'account' }" aria-hidden="true" />
      </div>

      <form class="login-form" @submit.prevent="submit">
        <label v-if="mode === 'phone'" key="phone" class="field">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="6.5" y="2.5" width="11" height="19" rx="2.5" />
            <path d="M10 18.2h4" />
          </svg>
          <input
            v-model="phone"
            inputmode="numeric"
            maxlength="11"
            autocomplete="tel"
            placeholder="请输入手机号"
            aria-label="手机号"
          >
        </label>

        <label v-else key="account" class="field">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="8" r="4" />
            <path d="M4.5 21c.6-4.3 3-6.5 7.5-6.5s6.9 2.2 7.5 6.5" />
          </svg>
          <input
            v-model="account"
            autocomplete="username"
            placeholder="请输入账号"
            aria-label="账号"
          >
        </label>

        <label class="field">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="4.5" y="9.5" width="15" height="11" rx="2.5" />
            <path d="M8 9.5V7a4 4 0 0 1 8 0v2.5M12 14v2.5" />
          </svg>
          <input
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="current-password"
            placeholder="请输入密码"
            aria-label="密码"
          >
          <button
            class="icon-button"
            type="button"
            :aria-label="showPassword ? '隐藏密码' : '显示密码'"
            @click="showPassword = !showPassword"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M2.5 12s3.5-5 9.5-5 9.5 5 9.5 5-3.5 5-9.5 5-9.5-5-9.5-5Z" />
              <circle cx="12" cy="12" r="2.6" />
              <path v-if="!showPassword" d="m4 4 16 16" />
            </svg>
          </button>
        </label>

        <label v-if="mode === 'phone'" class="field code-field">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m12 2 8 3.7v5.7c0 5.1-3.2 8.8-8 10.6-4.8-1.8-8-5.5-8-10.6V5.7L12 2Z" />
            <path d="m9 12 2 2 4-4" />
          </svg>
          <input
            v-model="code"
            inputmode="numeric"
            maxlength="6"
            autocomplete="one-time-code"
            placeholder="请输入验证码"
            aria-label="验证码"
            @input="onCodeInput"
          >
          <button type="button" class="code-button" :disabled="sending || countdown > 0" @click="sendCode">
            {{ codeButtonText }}
          </button>
        </label>

        <p v-if="isDev && mode === 'phone'" class="dev-code-hint">
          开发环境：获取验证码后，请在后端控制台查看；以 0 开头的验证码需完整输入 6 位
        </p>

        <label class="agreement">
          <input v-model="agreed" type="checkbox">
          <span class="checkmark">
            <svg viewBox="0 0 16 16"><path d="m3 8 3 3 7-7" /></svg>
          </span>
          <span>
            我已阅读并同意
            <a href="#/agreement" @click.prevent="notify('用户协议页面即将上线')">《用户协议》</a>
            和
            <a href="#/privacy" @click.prevent="notify('隐私政策页面即将上线')">《隐私政策》</a>
          </span>
        </label>

        <button
          class="submit-button"
          :class="{ success: loginSuccess }"
          type="submit"
          :disabled="loading || loginSuccess"
        >
          <span v-if="loginSuccess" class="success-icon" aria-hidden="true">
            <svg viewBox="0 0 20 20"><path d="m4 10 4 4 8-9" /></svg>
          </span>
          <span v-else-if="loading" class="spinner" />
          <span>{{ submitButtonText }}</span>
        </button>

        <button class="wechat-button" type="button" :disabled="loading" @click="wechatLogin">
          <span class="wechat-logo" aria-hidden="true">
            <i />
            <i />
          </span>
          微信一键登录
        </button>
      </form>

      <div class="auxiliary">
        <button type="button" @click="guestLogin">游客体验</button>
        <label>
          <input v-model="remember" type="checkbox">
          <span>记住登录</span>
        </label>
        <button type="button" @click="notify('请联系管理员重置密码')">忘记密码？</button>
      </div>
    </section>

    <Transition name="toast">
      <div v-if="message" class="toast" :class="messageType" role="status">
        {{ message }}
      </div>
    </Transition>
  </main>
</template>

<style scoped>
.login-page {
  --purple: #7657ef;
  position: relative;
  height: 100dvh;
  min-height: 100dvh;
  overflow: hidden;
  overscroll-behavior: none;
  color: #4e4772;
  background: #ded8ff;
  isolation: isolate;
}

.login-page::before {
  content: '';
  position: fixed;
  z-index: -2;
  top: 0;
  left: 50%;
  width: min(100vw, 430px);
  height: 100dvh;
  background-color: #ded8ff;
  background-image:
    var(--login-art),
    linear-gradient(180deg, #7772ee 0%, #d8d5ff 58%, #eee9ff 100%);
  background-position: center top, center;
  background-size: 100% auto, cover;
  background-repeat: no-repeat;
  transform: translateX(-50%);
  pointer-events: none;
}

.atmosphere {
  position: fixed;
  top: 0;
  left: 50%;
  width: min(100vw, 430px);
  height: 100dvh;
  z-index: -1;
  background:
    radial-gradient(circle at 17% 17%, rgba(255, 223, 140, 0.7) 0 3px, transparent 4px),
    radial-gradient(circle at 83% 12%, rgba(255, 255, 255, 0.95) 0 2px, transparent 4px),
    linear-gradient(180deg, rgba(65, 46, 197, 0.05) 0%, rgba(243, 239, 255, 0.12) 56%, rgba(240, 234, 255, 0.4) 100%);
  transform: translateX(-50%);
  pointer-events: none;
}

.motion-stars {
  position: fixed;
  z-index: 0;
  top: 0;
  left: 50%;
  width: min(100vw, 430px);
  height: 54dvh;
  transform: translateX(-50%);
  overflow: hidden;
  pointer-events: none;
}

.motion-stars i {
  position: absolute;
  top: var(--star-y);
  left: var(--star-x);
  width: var(--star-size);
  height: var(--star-size);
  border-radius: 50%;
  background: white;
  box-shadow: 0 0 5px 2px rgba(255, 255, 255, .72), 0 0 12px 3px rgba(176, 146, 255, .46);
  animation: star-twinkle 3.8s var(--star-delay) ease-in-out infinite;
}

.motion-stars i::before,
.motion-stars i::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  border-radius: 50%;
  background: rgba(255,255,255,.72);
  transform: translate(-50%, -50%);
}

.motion-stars i::before {
  width: calc(var(--star-size) * 3.2);
  height: 1px;
}

.motion-stars i::after {
  width: 1px;
  height: calc(var(--star-size) * 3.2);
}

.brand {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding-top: max(7.2vh, 44px);
  color: white;
  text-shadow: 0 2px 12px rgba(54, 36, 173, 0.38);
  animation: brand-arrive .72s .08s cubic-bezier(.2, .8, .2, 1) both;
}

.brand-mark {
  display: grid;
  place-items: center;
  width: 64px;
  height: 64px;
  flex-shrink: 0;
  border-radius: 18px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 8px 22px rgba(66, 42, 180, 0.28), inset 0 1px 2px rgba(255, 255, 255, 0.8);
  animation: brand-mark-float 4.8s 1s ease-in-out infinite;
}

.brand-logo {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.brand h1 {
  font-size: 34px;
  line-height: 1;
  font-weight: 800;
  letter-spacing: 4px;
}

.brand p {
  margin-top: 7px;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 4px;
  text-align: center;
}

.login-card {
  position: relative;
  z-index: 2;
  width: calc(100% - 52px);
  max-width: 378px;
  margin: clamp(230px, 32vh, 330px) auto 8px;
  padding: 16px 18px 14px;
  border: 1px solid rgba(255, 255, 255, 0.88);
  border-radius: 34px;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.86), rgba(247, 242, 255, 0.72));
  box-shadow: 0 22px 50px rgba(83, 58, 172, 0.17), inset 0 1px 8px rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(18px) saturate(1.1);
  -webkit-backdrop-filter: blur(18px) saturate(1.1);
  animation: card-arrive .76s .16s cubic-bezier(.16, 1, .3, 1) both;
  transform-origin: 50% 65%;
}

.login-card::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  overflow: hidden;
  border-radius: inherit;
  background: linear-gradient(115deg, transparent 28%, rgba(255,255,255,.38) 45%, transparent 62%);
  background-size: 230% 100%;
  background-position: 160% 0;
  animation: card-glimmer 1.1s .65s ease-out both;
  pointer-events: none;
}

.login-card.error-shake {
  animation: card-shake .34s ease both;
}

.login-page.is-success .login-card {
  animation: card-success .78s cubic-bezier(.2, .8, .2, 1) both;
}

.login-page.is-success .motion-stars i {
  animation: star-celebrate .76s cubic-bezier(.2, .8, .2, 1) both;
}

.tabs {
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 14px;
}

.tabs button {
  position: relative;
  padding: 6px 0 12px;
  color: #78709e;
  font-size: 16px;
  font-weight: 600;
  transition: color .2s ease;
}

.tabs button.active {
  color: var(--purple);
  font-weight: 800;
}

.tab-indicator {
  position: absolute;
  left: calc(25% - 27px);
  bottom: 0;
  width: 54px;
  height: 3px;
  border-radius: 9px;
  background: linear-gradient(90deg, #815aff, #6246df);
  box-shadow: 0 2px 7px rgba(112, 76, 229, 0.35);
  transition: left .34s cubic-bezier(.2, .8, .2, 1), width .2s ease;
  pointer-events: none;
}

.tab-indicator.account {
  left: calc(75% - 27px);
}

.login-form {
  display: grid;
  gap: 9px;
}

.login-page.is-intro .login-form > * {
  animation: field-arrive .5s cubic-bezier(.2, .8, .2, 1) both;
}

.login-page.is-intro .login-form > :nth-child(1) { animation-delay: .32s; }
.login-page.is-intro .login-form > :nth-child(2) { animation-delay: .39s; }
.login-page.is-intro .login-form > :nth-child(3) { animation-delay: .46s; }
.login-page.is-intro .login-form > :nth-child(4) { animation-delay: .53s; }
.login-page.is-intro .login-form > :nth-child(5) { animation-delay: .6s; }
.login-page.is-intro .login-form > :nth-child(6) { animation-delay: .67s; }

.field {
  display: flex;
  align-items: center;
  min-height: 50px;
  padding: 0 15px;
  border: 1px solid rgba(116, 93, 197, 0.07);
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.76);
  box-shadow: 0 7px 18px rgba(86, 65, 156, 0.07), inset 0 1px 2px rgba(255,255,255,.9);
  transition: border-color .2s, box-shadow .2s, transform .2s;
}

.field:focus-within {
  border-color: rgba(118, 87, 239, 0.38);
  box-shadow: 0 7px 20px rgba(86, 65, 156, 0.1), 0 0 0 3px rgba(118, 87, 239, 0.08);
  transform: translateY(-1px);
}

.field > svg {
  flex: 0 0 auto;
  width: 22px;
  height: 22px;
  margin-right: 12px;
  fill: none;
  stroke: #9991d6;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.field input {
  min-width: 0;
  flex: 1;
  border: 0;
  outline: 0;
  color: #40385f;
  background: transparent;
  font: inherit;
  font-size: 15px;
}

.field input::placeholder {
  color: #aaa4c5;
}

.icon-button {
  flex: 0 0 auto;
  padding: 7px 3px 7px 8px;
  color: #8f86bd;
}

.icon-button svg {
  width: 20px;
  height: 20px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.7;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.code-button {
  flex: 0 0 auto;
  padding: 8px 12px;
  border: 1px solid rgba(116, 82, 231, .14);
  border-radius: 18px;
  color: var(--purple);
  background: linear-gradient(180deg, #fff, #f5f0ff);
  font-size: 13px;
  font-weight: 700;
  box-shadow: 0 4px 10px rgba(91, 68, 170, 0.08);
}

.code-button:disabled {
  color: #aaa3c6;
}

.dev-code-hint {
  margin: -4px 2px 0;
  font-size: 11px;
  line-height: 1.5;
  color: #8b7bb8;
}

.submit-button,
.wechat-button {
  min-height: 50px;
  border-radius: 28px;
  font-size: 17px;
  font-weight: 700;
}

.submit-button {
  position: relative;
  overflow: hidden;
  margin-top: 7px;
  color: white;
  background: linear-gradient(135deg, #9a77ff 0%, #7856ee 55%, #6748df 100%);
  box-shadow: 0 9px 22px rgba(111, 76, 226, 0.35), inset 0 1px 2px rgba(255,255,255,.35);
  transition: transform .2s ease, box-shadow .25s ease, background .3s ease;
}

.submit-button::after {
  content: '';
  position: absolute;
  top: -40%;
  left: -35%;
  width: 26%;
  height: 180%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,.48), transparent);
  transform: rotate(18deg);
  animation: button-shine 3.6s 1.4s ease-in-out infinite;
  pointer-events: none;
}

.submit-button.success {
  background: linear-gradient(135deg, #8a6df3, #54c8a2);
  box-shadow: 0 10px 28px rgba(84, 200, 162, .35);
}

.success-icon {
  display: inline-grid;
  place-items: center;
  width: 23px;
  height: 23px;
  margin-right: 7px;
  vertical-align: -6px;
  border-radius: 50%;
  color: #51ba96;
  background: white;
  animation: success-pop .45s cubic-bezier(.16, 1.3, .3, 1) both;
}

.success-icon svg {
  width: 15px;
  height: 15px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.4;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.submit-button:active,
.wechat-button:active {
  transform: scale(.985);
}

.submit-button:disabled,
.wechat-button:disabled {
  cursor: wait;
  opacity: .72;
}

.submit-button.success:disabled {
  opacity: 1;
}

.spinner {
  display: inline-block;
  width: 15px;
  height: 15px;
  margin-right: 7px;
  vertical-align: -2px;
  border: 2px solid rgba(255,255,255,.45);
  border-top-color: white;
  border-radius: 50%;
  animation: spin .7s linear infinite;
}

.wechat-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #4b465e;
  background: rgba(255,255,255,.82);
  border: 1px solid rgba(255,255,255,.95);
  box-shadow: 0 7px 18px rgba(76, 58, 137, .1);
}

.wechat-logo {
  position: relative;
  width: 28px;
  height: 23px;
}

.wechat-logo i {
  position: absolute;
  display: block;
  border-radius: 50%;
  background: #43c95c;
}

.wechat-logo i:first-child {
  width: 21px;
  height: 17px;
  left: 0;
  top: 0;
}

.wechat-logo i:last-child {
  width: 19px;
  height: 15px;
  right: 0;
  bottom: 0;
  border: 2px solid white;
}

.wechat-logo i::before,
.wechat-logo i::after {
  content: '';
  position: absolute;
  top: 6px;
  width: 2px;
  height: 2px;
  border-radius: 50%;
  background: white;
}

.wechat-logo i::before { left: 6px; }
.wechat-logo i::after { right: 6px; }

.auxiliary {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 10px;
  margin: 8px 2px 0;
  color: #8278bc;
  font-size: 13px;
}

.auxiliary > button:first-child { text-align: left; }
.auxiliary > button:last-child { text-align: right; }

.auxiliary label {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #9a93b8;
}

.auxiliary input {
  accent-color: var(--purple);
}

.agreement {
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  gap: 8px;
  margin: 0 4px -2px;
  padding: 1px 0;
  color: #a19ab9;
  font-size: 11px;
  line-height: 1.6;
}

.agreement > input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.checkmark {
  display: grid;
  place-items: center;
  flex: 0 0 17px;
  width: 17px;
  height: 17px;
  margin-top: 1px;
  border: 1.5px solid #c1b9e5;
  border-radius: 5px;
  background: rgba(255,255,255,.5);
  transition: .2s ease;
}

.checkmark svg {
  width: 12px;
  height: 12px;
  fill: none;
  stroke: white;
  stroke-width: 2;
  opacity: 0;
}

.agreement > input:checked + .checkmark {
  border-color: var(--purple);
  background: var(--purple);
}

.agreement > input:checked + .checkmark svg {
  opacity: 1;
}

.agreement a {
  color: #7a61e2;
  font-weight: 600;
}

.toast {
  position: fixed;
  z-index: 10;
  left: 50%;
  top: max(24px, env(safe-area-inset-top));
  width: max-content;
  max-width: calc(100% - 48px);
  padding: 11px 18px;
  border: 1px solid rgba(255,255,255,.6);
  border-radius: 22px;
  color: white;
  background: rgba(66, 52, 112, .88);
  box-shadow: 0 9px 25px rgba(44, 31, 89, .22);
  backdrop-filter: blur(10px);
  transform: translateX(-50%);
  font-size: 13px;
  text-align: center;
}

.toast.success { background: rgba(47, 154, 96, .9); }
.toast.error { background: rgba(202, 76, 101, .92); }
.toast-enter-active, .toast-leave-active { transition: .22s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translate(-50%, -10px); }

@keyframes spin { to { transform: rotate(360deg); } }

@keyframes brand-arrive {
  from { opacity: 0; transform: translateY(-14px) scale(.96); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes brand-mark-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

@keyframes card-arrive {
  from { opacity: 0; transform: translateY(28px) scale(.975); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes card-glimmer {
  from { opacity: 0; background-position: 160% 0; }
  35% { opacity: 1; }
  to { opacity: 0; background-position: -75% 0; }
}

@keyframes field-arrive {
  from { opacity: 0; transform: translateY(9px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes star-twinkle {
  0%, 100% { opacity: .16; transform: scale(.55) rotate(0); }
  45% { opacity: .92; transform: scale(1) rotate(45deg); }
  65% { opacity: .46; transform: scale(.72) rotate(70deg); }
}

@keyframes button-shine {
  0%, 68% { left: -35%; opacity: 0; }
  76% { opacity: 1; }
  100% { left: 118%; opacity: 0; }
}

@keyframes card-shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  55% { transform: translateX(4px); }
  78% { transform: translateX(-2px); }
}

@keyframes card-success {
  0% { transform: scale(1); filter: brightness(1); }
  38% { transform: scale(1.012); filter: brightness(1.04); }
  100% { transform: scale(.985); filter: brightness(1.02); }
}

@keyframes success-pop {
  from { opacity: 0; transform: scale(.35) rotate(-18deg); }
  to { opacity: 1; transform: scale(1) rotate(0); }
}

@keyframes star-celebrate {
  0% { opacity: .35; transform: scale(.8); }
  45% { opacity: 1; transform: scale(2.3) rotate(70deg); }
  100% { opacity: 0; transform: scale(.4) rotate(120deg); }
}

@media (prefers-reduced-motion: reduce) {
  .brand,
  .brand-mark,
  .login-card,
  .login-card::before,
  .login-form > *,
  .motion-stars i,
  .submit-button::after,
  .spinner,
  .success-icon {
    animation: none !important;
  }

  .tab-indicator,
  .field,
  .submit-button,
  .wechat-button {
    transition-duration: .01ms !important;
  }
}

@media (max-height: 820px) {
  .brand {
    gap: 9px;
    padding-top: 20px;
  }

  .brand-mark {
    width: 52px;
    height: 52px;
    border-radius: 14px;
  }

  .brand h1 {
    font-size: 28px;
  }

  .brand p {
    margin-top: 4px;
    font-size: 8px;
  }

  .login-card {
    margin-top: clamp(210px, 29vh, 245px);
    padding: 12px 16px 10px;
    border-radius: 28px;
  }

  .tabs {
    margin-bottom: 10px;
  }

  .tabs button {
    padding: 3px 0 8px;
    font-size: 15px;
  }

  .login-form {
    gap: 7px;
  }

  .field {
    min-height: 44px;
    padding-inline: 13px;
  }

  .field > svg {
    width: 20px;
    height: 20px;
    margin-right: 10px;
  }

  .field input {
    font-size: 14px;
  }

  .code-button {
    padding: 6px 10px;
    font-size: 12px;
  }

  .submit-button,
  .wechat-button {
    min-height: 46px;
    font-size: 15px;
  }

  .submit-button {
    margin-top: 3px;
  }

  .agreement {
    gap: 6px;
    margin-inline: 3px;
    font-size: 10px;
    line-height: 1.4;
  }

  .checkmark {
    flex-basis: 15px;
    width: 15px;
    height: 15px;
  }

  .auxiliary {
    margin-top: 7px;
    font-size: 11px;
  }
}

@media (max-height: 650px) {
  .brand {
    padding-top: 10px;
  }

  .brand-mark {
    width: 44px;
    height: 44px;
    border-radius: 12px;
  }

  .brand h1 {
    font-size: 24px;
  }

  .brand p {
    display: none;
  }

  .login-card {
    margin-top: 185px;
    padding-block: 10px 8px;
  }

  .tabs {
    margin-bottom: 7px;
  }

  .login-form {
    gap: 5px;
  }

  .field {
    min-height: 40px;
  }

  .submit-button,
  .wechat-button {
    min-height: 42px;
  }

  .agreement {
    font-size: 9px;
  }

  .auxiliary {
    margin-top: 4px;
    font-size: 10px;
  }
}

@media (max-width: 360px) {
  .login-card {
    width: calc(100% - 24px);
    padding-inline: 16px;
  }
  .auxiliary { font-size: 12px; }
  .code-button { padding-inline: 8px; font-size: 12px; }
}
</style>
