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

## 2026-11-07
- main 合併 item-photos（PR #1，後台品項照片）與 pwa-install（PNG 圖示、iOS 標籤、安裝提示）；sw 快取 v4。
- 正式 RTDB 規則已於 11:40 部署 photo 欄位；備份 rules-backup/database.rules.prod-before-photo-20261107-113949.json。
- 待辦：真機 iPhone/Android 測安裝與拍照上傳。

## 2026-11-08 手動列印收據（RawBT）

### 狀態
- 分支：`receipt-printing`（不要 merge、不要部署、不要改正式 Firebase 規則／資料／設定）
- 後台「訂單」每一筆有 **Print / 列印**。只手動列印，新訂單不會自動出單。
- 新訂單：短提示音 + 黃色提示條（沿用既有琥珀警示色）。進後台前先點過齒輪或登入，瀏覽器才允許出聲；沒解鎖時仍看得到提示條。
- 收據畫成寬 384px 的黑白圖（58mm 紙、可印約 48mm），送給 RawBT 的圖片通道。印表機不用內建中文字型。
- sw 快取：`jiangway-app-v5`

### 怎麼印（店內平板）
1. Android 平板的 Chrome 安裝 [RawBT](https://rawbt.ru/start.html)（套件 `ru.a402d.rawbtprinter`），用經典藍牙配對 Q-P01。RawBT 自己的測試列印要先成功。
2. 店主登入 →「訂單」→ 按 **Print / 列印**。
3. 頁面把這一筆畫成 PNG，然後開啟 RawBT 文件裡的 intent（圖片會直接印，不走印表機文字編碼）：
   `intent:data:image/png;base64,<PNG>#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;end;`
   等同 `rawbt:data:image/png;base64,<PNG>`（文件：jpeg／png 等 Android 看得懂的圖會立刻列印）。沒裝 RawBT 時，Chrome 會打開 Play 商店。
4. 不是 Android（例如本機用 `?emu=1` 開）只產生同一張圖，不離開後台頁面。

### 收據上有什麼
店名「江味齋」、訂單編號、下單時間、顧客姓名與電話（有才印）、取餐方式／付款／取餐時間、品項（名稱 × 數量與 R 金額）、加價購、折扣、備註、合計。

### 本機看畫面（Firebase 模擬器，不連正式資料庫）
- `http://127.0.0.1:8866/index.html?emu=1`
- 需先在 Auth 模擬器建立 `owner@test.local`，並用模擬器的管理員權限把 `/staff/{uid}` 設成 `true`（規則不允許從網頁寫入 `/staff`）

### 已在模擬器測過
- 既有訂單進後台不會響、不會出提示條。
- 之後新的一筆會出現黃色「新訂單」提示，並觸發提示音（兩聲）。沒有自動列印。
- 每筆都有 **Print / 列印**。按下後按鈕短暫變成「已送出」，頁面留在後台。
- 產生的 PNG 寬度是 384px。中文可讀：店名、編號、時間、姓名、電話、品項與 R 金額、備註、合計。加價購與折扣那一行也畫得出來。
- 送給 RawBT 的網址是 `intent:data:image/png;base64,…#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;end;`，base64 沒有再做百分號編碼。這次範例圖大約 18KB。
- 測試時瀏覽器只連 `127.0.0.1` 的模擬器，沒有打到正式 Firebase。

### 只能在店內平板確認
- Chrome 把 intent 交給 RawBT，以及 Q-P01 實際印出來的濃淡、中文筆畫、是否裁切。
- 平板揚聲器是否聽得見提示音（要先點過頁面）。

## 2026-11-08 收據加上英文品名

### 狀態
- 分支：`cursor/receipt-english-names-3ef2`（不 merge、不部署、不改正式 Firebase）
- 真機已確認 RawBT 列印成功，但收據只有中文品名。現在每個中文品名下面印菜單的英文名（`nameEn`）。
- 訂單裡已存的英文名優先；舊單沒有就用品項 id 或中文名回目前菜單（含下架品項）找。找不到就略過那一行，不留空白。
- 英文太長就依空白換行，落在 384px 以內。加價購沒有英文名，維持只印中文。
- sw 快取：`jiangway-app-v6`
- 模擬器 `?emu=1`：沒有 `nameEn` 的舊單會從菜單補上英文；沒有英文名的品項不留空行；故意加長的英文會換行且不超出 384px。列印按鈕仍只在按下時出圖。

## 2026-11-09 開頁就要看到最新版

### 原因
- 最早的 Service Worker（`jiangway-v1`）是 **cache-first**：有快取就先回舊的 `index.html`，不會等網路。客人開 App 先看到舊頁（那時還沒有新品輪播）。
- 那版頁面只 `register("sw.js")`，**沒有**在新 SW 接管時重新整理。新 SW 就算 `skipWaiting`，畫面上的舊 DOM 也不會自己換掉。
- 後來的 SW 已改成網路優先，但只對「導覽請求」加 `cache: 'no-store'`。css／圖片仍可能吃到瀏覽器 HTTP 快取。而且已裝在手機上的舊 SW 不會因為頁面自己沒寫 reload 就消失。
- 新品輪播是另一件事：品項在 Firebase `custom_items`，頁面裡的內建菜單是立刻畫的，輪播要等 RTDB 連上才插進來，所以會晚出現。捲動本身不會觸發更新。

### 修法
- `sw.js`（快取 `jiangway-app-v7`）：同網域 GET 一律先網路且 `cache: 'no-store'`，失敗才用 Cache Storage（離線仍可開）。不把 `sw.js` 放進快取。`skipWaiting` + `clients.claim`，activate 時對已開的分頁 `client.navigate` 同一網址，讓舊頁面也被換成最新版。
- 註冊加上 `updateViaCache: "none"`。不再用 `controllerchange` 另外 reload，避免刷兩次。
- 新品輪播的資料在 `custom_items`，內建菜單是寫在頁面裡的，所以輪播要等 RTDB 連上才出現（跟捲動無關）。Firebase 9 compat 沒有 `enablePersistence`，改把上次的菜單記在 `localStorage`（`jw_menu_cache`）：開頁先畫出來，連上線再換成最新；離線也還看得到。

## 2026-11-11 新品排第一（已合併）
- `effectiveMenu` 把「⭐ 新品 NEW ITEMS」移到第一位，分類分頁與菜單區塊一起變成第一個。
- 已作為 PR #5 合併進 `main`（`fadc534`），2026-11-11 已上線；sw 快取當時為 `jiangway-app-v7`。
- 模擬器實測 4 項通過（新品分頁第一且 active、#jw-sec-0 為新品、點分頁捲動正確、無新品時自動消失）；截圖 /workspace/jw-new-first/。
- 菜單資料 isNew:true 的品項只在輪播，不在新品區（Hans 未要求改）。

## 2026-11-11 選餐照片點擊放大（分支 feat/photo-zoom，未推）
- 客人在選餐頁點有照片的菜色小圖（上傳照片或內建靜態圖），會跳出放大檢視：深色遮罩、照片約 90vw／80vh 且 object-fit contain、底下顯示中文名、英文名、價格，以及適用的「實拍／AI 示意」標籤。
- 點 ✕、點遮罩空白處、按 Escape 或瀏覽器返回都會關閉。點照片不會加入購物車。沒有照片的霓虹佔位圖不會打開。開啟時鎖住背景捲動。
- 上方新品輪播若該張有照片，點擊同樣會打開放大檢視。
- sw 快取改為 `jiangway-app-v8`。未 push、未合併、未部署、未動正式 Firebase。
- 本機只以 `http://127.0.0.1:8866/index.html?emu=1` 在模擬器實測；截圖 /workspace/jw-photo-zoom/。
