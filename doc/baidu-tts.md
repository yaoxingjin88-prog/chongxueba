# 百度智能云 · 宠物卡通语音

首页宠物台词使用 [百度语音合成](https://cloud.baidu.com/doc/SPEECH/s/mlbxh7xie) 短文本在线合成 API。

## 1. 开通服务

1. 登录 [百度智能云控制台](https://console.bce.baidu.com/)
2. 进入 **产品服务 → 人工智能 → 语音技术**
3. 创建应用，勾选 **语音合成**
4. 在应用详情复制 **API Key** 与 **Secret Key**

## 2. 配置环境变量

在 `Backend/.env` 填入：

```env
TTS_PROVIDER=baidu
BAIDU_API_KEY=你的APIKey
BAIDU_SECRET_KEY=你的SecretKey
TTS_BAIDU_VOICE=duoduo
```

重启后端：`npm run dev`

## 3. 卡通音色

| 配置值 | 显示名 | 百度发音人 | per | 特点 |
|--------|--------|------------|-----|------|
| `xiaolu` | 小鹿 | 度小鹿 | 5118 | 清甜柔和 |
| `xiaoshi` | 小狮 | 度小童 | 110 | 活泼童声 |
| `duoduo` | 朵朵 | 度米朵 | 103 | 软萌慢速（默认） |

语速 `spd` 0–15（越小越慢，默认朵朵为 3）；音调 `pit` 0–15（越大越尖，默认 7）。

## 4. API

```http
GET /api/tts/pet/config
POST /api/tts/pet
{ "text": "今天也一起加油吧", "voice": "duoduo" }
→ audio/mpeg
```

## 5. 未配置密钥

若未填写百度密钥，会自动回退到 Edge Neural 备用语音，不影响开发调试。

## 6. 常见错误

| 错误 | 原因 | 处理 |
|------|------|------|
| `16: Open api characters limit reached` | 免费字符额度用尽 | [控制台](https://console.bce.baidu.com/ai/#/ai/speech/overview/index) 查看用量并充值/升级 |
| 仍听到浏览器普通音 | 接口失败且前端回退 | 重启后端；查看首页黄色提示条 |

额度恢复前，后端会自动改用 **Edge Neural 备用音**（比浏览器朗读自然，但不是百度卡通音）。

## 7. 计费说明

短文本合成按 GBK 字节计费，单句宠物台词通常远小于 120 字节，成本极低。详见百度官方定价页。
