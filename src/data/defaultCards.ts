export interface ForbiddenCard {
  id: string;
  type: 'ACTION' | 'WORD';
  category: 'daily' | 'chat' | 'body' | 'hardcore';
  content: string;
  tip?: string;
}

export const PRESET_CARDS: ForbiddenCard[] = [
  // 1. 經典日常動作篇
  { id: 'a1', type: 'ACTION', category: 'daily', content: '喝水 / 喝飲料', tip: '引誘他「口渴了吧喝口水」' },
  { id: 'a2', type: 'ACTION', category: 'daily', content: '摸頭髮 / 抓頭', tip: '誇獎他髮型或問他頭髮怎麼了' },
  { id: 'a3', type: 'ACTION', category: 'daily', content: '扶眼鏡 / 揉眼睛', tip: '讓他看手機螢幕上的小字' },
  { id: 'a4', type: 'ACTION', category: 'daily', content: '大笑露齒', tip: '講一個爆笑的諧音梗或糗事' },
  { id: 'a5', type: 'ACTION', category: 'daily', content: '看手機螢幕', tip: '「我有發個連結給你快看」' },
  { id: 'a6', type: 'ACTION', category: 'daily', content: '嘆氣', tip: '跟他抱怨一件令人無奈的事情' },
  { id: 'a7', type: 'ACTION', category: 'daily', content: '深呼吸', tip: '「放輕鬆，來深呼吸一下」' },
  { id: 'a8', type: 'ACTION', category: 'daily', content: '拍手 / 鼓掌', tip: '帶頭為某人精彩的故事歡呼' },

  // 2. 身體搞怪動作篇
  { id: 'a9', type: 'ACTION', category: 'body', content: '托腮（手托下巴）', tip: '聊嚴肅話題讓他陷入沉思' },
  { id: 'a10', type: 'ACTION', category: 'body', content: '連續點頭兩次以上', tip: '說一句他非常認同的大實話' },
  { id: 'a11', type: 'ACTION', category: 'body', content: '雙手抱胸', tip: '故意跟他唱反調激起他的防備姿態' },
  { id: 'a12', type: 'ACTION', category: 'body', content: '摸鼻子', tip: '問他有沒有聞到奇怪的味道' },
  { id: 'a13', type: 'ACTION', category: 'body', content: '用手指指人', tip: '問「現場你覺得最笨的是誰？」' },
  { id: 'a14', type: 'ACTION', category: 'body', content: '翹二郎腿 / 換翹腿', tip: '讓他坐得更放鬆一點' },
  { id: 'a15', type: 'ACTION', category: 'body', content: '摸耳朵 / 撥耳機', tip: '故意小聲說話「你聽得到嗎？」' },
  { id: 'a16', type: 'ACTION', category: 'body', content: '聳肩', tip: '問他一個模稜兩可、無所謂的問題' },

  // 3. 聊天陷阱詞彙篇
  { id: 'w1', type: 'WORD', category: 'chat', content: '說「我」', tip: '高難度！問他關於他自己的經歷' },
  { id: 'w2', type: 'WORD', category: 'chat', content: '說「你」', tip: '不斷提問引導他反問' },
  { id: 'w3', type: 'WORD', category: 'chat', content: '說「真的嗎」/「真的假的」', tip: '講一個聽起來極度離譜的八卦' },
  { id: 'w4', type: 'WORD', category: 'chat', content: '說「不知道」', tip: '問他一個極度冷門或刁鑽的問題' },
  { id: 'w5', type: 'WORD', category: 'chat', content: '講任何英文單字 (OK, No, Yes等)', tip: '英文夾雜或問外國地名' },
  { id: 'w6', type: 'WORD', category: 'chat', content: '說「對啊」/「沒錯」', tip: '說一句顯而易見的陳述句' },
  { id: 'w7', type: 'WORD', category: 'chat', content: '說「什麼」', tip: '含糊不清地嘟囔幾句' },
  { id: 'w8', type: 'WORD', category: 'chat', content: '說任何數字', tip: '問「你今年幾歲？」或「幾點了？」' },
  { id: 'w9', type: 'WORD', category: 'chat', content: '說「笑死」', tip: '分享一個社群迷因梗' },
  { id: 'w10', type: 'WORD', category: 'chat', content: '說「所以呢」', tip: '講一個沒有重點的冗長故事' },

  // 4. 綜藝高難度篇
  { id: 'h1', type: 'ACTION', category: 'hardcore', content: '誇獎別人（說好話）', tip: '向他討拍「我今天是不是很棒」' },
  { id: 'h2', type: 'ACTION', category: 'hardcore', content: '叫出在場任何人的名字', tip: '「欸，那個人叫什麼來著？」' },
  { id: 'h3', type: 'WORD', category: 'hardcore', content: '說「不是」/「沒有」', tip: '故意冤枉他或扣他帽子' },
  { id: 'h4', type: 'WORD', category: 'hardcore', content: '說「好吃」或「難吃」', tip: '聊美食外送或某間餐廳' },
  { id: 'h5', type: 'ACTION', category: 'hardcore', content: '瞪大眼睛', tip: '給他看一個驚人的消息' },
  { id: 'h6', type: 'WORD', category: 'hardcore', content: '說「為什麼」', tip: '給他一個奇怪的結論不作解釋' },
  { id: 'h7', type: 'ACTION', category: 'hardcore', content: '比讚 (👍)', tip: '炫耀自己的一項成就等待認同' },
  { id: 'h8', type: 'WORD', category: 'hardcore', content: '說「好像是」', tip: '問他不確定的記憶或歷史' },
];

export const VARIETY_TOPICS: string[] = [
  '🔥 爆料大會：說一件在場某個人的糗事或尷尬經歷！',
  '💔 情感八卦：你最受不了另一半（或前任）什麼習慣？',
  '💰 暴富幻想：如果明天突然中了一千萬台幣，第一件事做什麼？',
  '🕵️ 靈魂拷問：現場如果一定要選一個人流落荒島，你絕對不選誰？為什麼？',
  '👻 靈異驚悚：你遇過最不可思議或毛骨悚然的一件事是什麼？',
  '🤐 秘密自白：長大後才發現自己小時候相信的超離譜謊言是什麼？',
  '🍔 美食爭辯：鳳梨到底配不配放在披薩上？香菜和芋頭火鍋你吃不吃？',
  '🙈 社交修羅場：被發好人卡或告白失敗時，最想找地洞鑽的瞬間？',
  '📱 手機秘密：你相簿裡最近一張捨不得刪的醜照是拍誰？',
  '🎭 角色扮演：假設你要向現場一個人借五萬塊，請現場開口說服他！',
  '⚡ 犀利二選一：一輩子不洗澡 vs 一輩子不刷牙，你選哪一個？',
  '🎤 綜藝大考驗：請現場每個人模仿一個卡通人物或網紅的經典台詞！',
];
