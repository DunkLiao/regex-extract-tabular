(function exposeRegexPresetCatalog(root, createCatalog) {
  const catalog = createCatalog();
  if (typeof module !== 'undefined' && module.exports) module.exports = catalog;
  root.RegexPresetCatalog = catalog;
})(globalThis, function createCatalog() {
  const presets = [
    { category: '日期與時間', name: 'ISO 日期', description: '擷取 YYYY-MM-DD 日期。', pattern: '(?<date>\\d{4}-\\d{2}-\\d{2})' },
    { category: '日期與時間', name: 'ISO 日期時間', description: '擷取日期、時間與可選時區。', pattern: '(?<date>\\d{4}-\\d{2}-\\d{2})[T ](?<time>\\d{2}:\\d{2}(?::\\d{2}(?:\\.\\d{1,9})?)?)(?<timezone>Z|[+-]\\d{2}:?\\d{2})?' },
    { category: '日期與時間', name: '斜線日期', description: '擷取 YYYY/MM/DD 日期。', pattern: '(?<date>\\d{4}/\\d{1,2}/\\d{1,2})' },
    { category: '日期與時間', name: '月日年日期', description: '擷取 MM/DD/YYYY 日期。', pattern: '(?<date>\\d{1,2}/\\d{1,2}/\\d{4})' },
    { category: '日期與時間', name: '24 小時時間', description: '擷取 HH:MM 或 HH:MM:SS 時間。', pattern: '(?<time>(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d)?)' },
    { category: '日期與時間', name: 'Unix 時間戳', description: '擷取 10 位秒或 13 位毫秒時間戳。', pattern: '\\b(?<timestamp>\\d{10}(?:\\d{3})?)\\b' },
    { category: '日期與時間', name: 'Apache 日誌時間', description: '擷取常見伺服器日誌日期與時區。', pattern: '\\[(?<datetime>\\d{2}/[A-Za-z]{3}/\\d{4}:\\d{2}:\\d{2}:\\d{2} [+-]\\d{4})\\]' },
    { category: '日期與時間', name: '時間長度', description: '擷取時、分、秒格式的時間長度。', pattern: '(?<duration>(?:\\d+\\s*h\\s*)?(?:\\d+\\s*m\\s*)?\\d+\\s*s)' },

    { category: '聯絡資訊', name: '電子郵件', description: '擷取常見電子郵件地址。', pattern: '(?<email>[\\w.+-]+@[\\w.-]+\\.[A-Za-z]{2,})' },
    { category: '聯絡資訊', name: '台灣手機', description: '擷取台灣手機，可含 +886 與分隔符號。', pattern: '(?<phone>(?:\\+?886[- ]?)?09\\d{2}[- ]?\\d{3}[- ]?\\d{3})' },
    { category: '聯絡資訊', name: '台灣市話', description: '擷取含區碼的市話與可選分機。', pattern: '(?<phone>(?:\\+?886[- ]?)?0\\d{1,2}[- ]?\\d{6,8})(?:\\s*(?:#|分機)\\s*(?<extension>\\d+))?' },
    { category: '聯絡資訊', name: '電子郵件寄件者欄', description: '擷取 Name <email@example.com> 格式。', pattern: '(?<name>[^<>,]+)\\s*<(?<email>[\\w.+-]+@[\\w.-]+\\.[A-Za-z]{2,})>' },
    { category: '聯絡資訊', name: '姓名與電子郵件 CSV', description: '擷取姓名、電子郵件及可選電話欄。', pattern: '(?<name>[^,\\r\\n]+),(?<email>[\\w.+-]+@[\\w.-]+\\.[A-Za-z]{2,})(?:,(?<phone>[^,\\r\\n]+))?' },
    { category: '聯絡資訊', name: '中文姓名', description: '擷取常見二至四字中文姓名候選值。', pattern: '(?<name>[\\u4e00-\\u9fff]{2,4})' },
    { category: '聯絡資訊', name: '郵遞區號', description: '擷取台灣 3 碼或 5 碼郵遞區號。', pattern: '(?<postalCode>\\b\\d{3}(?:\\d{2})?\\b)' },

    { category: '網路與識別碼', name: 'URL', description: '擷取 HTTP 或 HTTPS 網址。', pattern: '(?<url>https?:\\/\\/[^\\s<>]+)' },
    { category: '網路與識別碼', name: '網域名稱', description: '擷取常見網域名稱與子網域。', pattern: '(?<domain>(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\\.)+[A-Za-z]{2,})' },
    { category: '網路與識別碼', name: 'IPv4', description: '擷取範圍有效的 IPv4 位址。', pattern: '(?<ipv4>(?:25[0-5]|2[0-4]\\d|1?\\d?\\d)(?:\\.(?:25[0-5]|2[0-4]\\d|1?\\d?\\d)){3})' },
    { category: '網路與識別碼', name: 'IPv6', description: '擷取完整或壓縮形式的 IPv6 候選值。', pattern: '(?<ipv6>(?:(?:[\\da-fA-F]{1,4}:){1,7}[\\da-fA-F]{1,4}|(?:[\\da-fA-F]{1,4}:){1,7}:|:(?::[\\da-fA-F]{1,4}){1,7}|::))' },
    { category: '網路與識別碼', name: 'MAC 位址', description: '擷取冒號或連字號分隔的 MAC 位址。', pattern: '(?<mac>(?:[\\da-fA-F]{2}[:-]){5}[\\da-fA-F]{2})' },
    { category: '網路與識別碼', name: 'UUID', description: '擷取標準 8-4-4-4-12 UUID。', pattern: '(?<uuid>[\\da-fA-F]{8}(?:-[\\da-fA-F]{4}){3}-[\\da-fA-F]{12})' },
    { category: '網路與識別碼', name: 'HTTP 狀態碼', description: '擷取常見 HTTP 狀態碼及可選說明。', pattern: '(?<status>[1-5]\\d{2})(?:\\s+(?<statusText>[A-Za-z][A-Za-z ]+))?' },
    { category: '網路與識別碼', name: 'HTTP 請求列', description: '擷取方法、路徑與 HTTP 版本。', pattern: '(?<method>GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\\s+(?<path>\\S+)\\s+HTTP\\/(?<version>\\d(?:\\.\\d)?)' },
    { category: '網路與識別碼', name: 'URL 查詢參數', description: '擷取網址查詢字串中的 key=value。', pattern: '[?&](?<key>[^=&#]+)=(?<value>[^&#]*)' },

    { category: '數字與財務', name: '金額', description: '擷取常見貨幣符號與含千分位的小數金額。', pattern: '(?<currency>[$€£¥NT＄])?\\s*(?<amount>-?\\d[\\d,]*(?:\\.\\d{1,2})?)' },
    { category: '數字與財務', name: '千分位整數', description: '擷取含逗號分隔或一般格式的整數。', pattern: '(?<number>-?(?:\\d{1,3}(?:,\\d{3})+|\\d+))' },
    { category: '數字與財務', name: '小數', description: '擷取正負整數或小數。', pattern: '(?<number>[+-]?\\d+(?:\\.\\d+)?)' },
    { category: '數字與財務', name: '百分比', description: '擷取整數或小數百分比。', pattern: '(?<percent>[+-]?\\d+(?:\\.\\d+)?)\\s*%' },
    { category: '數字與財務', name: '括號負數', description: '擷取以括號表示的負數金額。', pattern: '\\(\\s*(?<amount>\\d[\\d,]*(?:\\.\\d{1,2})?)\\s*\\)' },
    { category: '數字與財務', name: 'CSV 數值欄', description: '擷取逗號分隔資料列的數值欄位。', pattern: '(?:^|,)(?<value>-?\\d[\\d,]*(?:\\.\\d+)?)(?=,|$)' },
    { category: '數字與財務', name: '折扣標示', description: '擷取折扣或優惠百分比。', pattern: '(?<discount>\\d{1,3})\\s*(?:%|折)' },

    { category: '文字與識別碼', name: '台灣身分證字號', description: '擷取英文字母、性別碼與 9 位數字格式。', pattern: '(?<id>[A-Z][12]\\d{8})' },
    { category: '文字與識別碼', name: '統一編號', description: '擷取 8 位數統一編號候選值。', pattern: '(?<taxId>\\b\\d{8}\\b)' },
    { category: '文字與識別碼', name: '發票號碼', description: '擷取兩位英文字母加八位數字的發票號碼。', pattern: '(?<invoice>[A-Z]{2}-?\\d{8})' },
    { category: '文字與識別碼', name: '訂單編號', description: '擷取 ORD、ORDER 或 INV 開頭的識別碼。', pattern: '(?<orderId>(?:ORD|ORDER|INV)[-_]?[A-Z0-9]{3,})' },
    { category: '文字與識別碼', name: '信用卡遮罩號碼', description: '擷取末四碼或星號遮罩的卡號文字。', pattern: '(?<card>(?:\\*{2,}|X{2,}|\\d{4})[ -]?\\d{4})' },
    { category: '文字與識別碼', name: '十六進位色碼', description: '擷取 3、4、6 或 8 碼 CSS 色碼。', pattern: '(?<color>#[\\da-fA-F]{3}(?:[\\da-fA-F](?:[\\da-fA-F]{2}(?:[\\da-fA-F]{2})?)?)?)\\b' },
    { category: '文字與識別碼', name: '版本號', description: '擷取語意化版本號與可選預發佈標籤。', pattern: '(?<version>\\bv?\\d+\\.\\d+\\.\\d+(?:-[0-9A-Za-z.-]+)?(?:\\+[0-9A-Za-z.-]+)?\\b)' },
    { category: '文字與識別碼', name: 'Git Commit', description: '擷取短或完整 Git 雜湊與後續訊息。', pattern: '^(?<hash>[0-9a-fA-F]{7,40})\\s+(?<subject>.+)$' },
    { category: '文字與識別碼', name: 'Markdown 標題', description: '擷取 Markdown 標題層級與標題文字。', pattern: '^(?<level>#{1,6})\\s+(?<title>.+?)\\s*#*\\s*$' },
    { category: '文字與識別碼', name: '網址片段 slug', description: '擷取常見小寫連字號 slug。', pattern: '(?<slug>[a-z0-9]+(?:-[a-z0-9]+)*)' },

    { category: '日誌與程式資料', name: 'Nginx 訪問日誌', description: '擷取 IP、時間、方法、路徑、狀態碼與傳輸量。', pattern: '^(?<ip>\\S+) \\S+ \\S+ \\[(?<time>[^\\]]+)\\] "(?<method>\\S+) (?<path>\\S+) [^\\"]+" (?<status>\\d{3}) (?<bytes>\\d+)' },
    { category: '日誌與程式資料', name: '鍵值日誌', description: '擷取 key=value 格式的日誌欄位。', pattern: '(?<key>[A-Za-z_][\\w.-]*)=(?<value>"[^"\\r\\n]*"|[^\\s,]+)' },
    { category: '日誌與程式資料', name: 'JSON 字串欄位', description: '擷取 JSON 中指定格式的字串欄位和值。', pattern: '"(?<key>[^"]+)"\\s*:\\s*"(?<value>(?:\\\\.|[^"\\\\])*)"' },
    { category: '日誌與程式資料', name: '堆疊追蹤位置', description: '擷取常見錯誤堆疊中的檔案路徑與行號。', pattern: '(?<file>(?:[A-Za-z]:)?[^\\s()]+\\.[A-Za-z0-9]+):(?<line>\\d+)(?::(?<column>\\d+))?' },
    { category: '日誌與程式資料', name: '日期開頭日誌列', description: '擷取每行的日期、等級與訊息。', pattern: '^(?<date>\\d{4}-\\d{2}-\\d{2}[ T]\\d{2}:\\d{2}:\\d{2})\\s+(?<level>TRACE|DEBUG|INFO|WARN|ERROR|FATAL)\\s+(?<message>.*)$' },
    { category: '日誌與程式資料', name: 'Git 提交摘要列', description: '擷取雜湊、日期、作者與提交主旨。', pattern: '^(?<hash>[0-9a-f]{7,40})\\s+(?<date>\\d{4}-\\d{2}-\\d{2})\\s+(?<author>[^|]+)\\|(?<subject>.+)$' },
    { category: '日誌與程式資料', name: 'HTML 標籤文字', description: '擷取簡單 HTML 標籤名稱與純文字內容。', pattern: '<(?<tag>[A-Za-z][\\w-]*)\\b[^>]*>(?<text>[^<>]*)</\\k<tag>>' },
    { category: '日誌與程式資料', name: '自訂捕獲欄位', description: '以欄位名稱擷取下一段文字；可改寫 field_name。', pattern: '(?<field_name>.*?)' }
  ];

  function filterPresets(query) {
    const term = String(query || '').trim().toLocaleLowerCase();
    if (!term) return presets;
    return presets.filter(({ name, description, pattern, category }) =>
      `${category} ${name} ${description} ${pattern}`.toLocaleLowerCase().includes(term));
  }

  return { presets, filterPresets };
});
