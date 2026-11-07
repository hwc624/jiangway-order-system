# 江味齋點餐 App — NOTES

## 2026-11-05（Africa/Johannesburg）PWA 安裝補齊

### 狀態
- 分支：`pwa-install`（離 main `e963b31`）
- 目標：讓 Android／iPhone 可正確「加到主畫面／安裝」
- **尚未 push、未動正式 Firebase**

### 決策
- 主題色統一為現行程式霓虹深色 `#16171B`（meta／manifest `theme_color`／`background_color`）
- 圖示：紅底 `#C0392B` + 白粗「江」（Noto Sans CJK Bold）；maskable 字較小以留 80% 安全區
- 安裝提示僅客人畫面；Android 用 `beforeinstallprompt`「安裝 App」；iOS 顯示「點分享 → 加入主畫面」；關閉寫入 `localStorage` key `jw_install_hint_dismissed`
- 拿掉 manifest 裡的 data-URI SVG screenshot／icon；改 PNG 相對路徑；加 `id`／`scope`：`/jiangway-order-system/`
- SW cache bumped：`jiangway-app-v3`

### 實測
- manifest JSON 合法；icons 像素 192／512／512 maskable／180 apple／48 favicon
- 本機 `http://127.0.0.1:8866/index.html?emu=1`：iOS UA 顯示分享提示；合成 BIP 顯示「安裝 App」；關閉後不顯示
- 既有測試：`t_d_parseTs` 17/17、`t_m4_catrules` PASS、`t_l_cathide` PASS（emu 需先 seed owner@test.local + /staff）
- 截圖：`/workspace/pwa-install/guest-install-hint-390.png`（及 android／closeup）

### 未驗證
- 真機 iPhone Safari「加到主畫面」圖示／狀態列
- 真機 Android Chrome 安裝流程與 maskable 裁切
- 正式 GitHub Pages 路徑下的 installability（本機 start_url `/jiangway-order-system/` 與 `:8866/` 路徑不一致屬預期）

### 下一步
- Hans 確認後再決定是否 merge／push
- 正式 Logo 若有（小美），可替換 `icons/*.png`
