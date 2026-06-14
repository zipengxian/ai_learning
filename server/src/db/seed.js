import db from './database.js';
import { initDatabase } from './schema.js';
import { mkdirSync, existsSync } from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dataDir = dirname(dirname(dirname(__dirname))) + '/data';

// Ensure data directory exists
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

// ============================================================
// Helper: insert a course and return its id
// ============================================================
function insertCourse(language, level, title, description, sortOrder) {
  const stmt = db.prepare(
    'INSERT INTO courses (language, level, title, description, sort_order) VALUES (?, ?, ?, ?, ?)'
  );
  return stmt.run(language, level, title, description, sortOrder).lastInsertRowid;
}

function insertVocabulary(courseId, words) {
  const stmt = db.prepare(
    'INSERT INTO vocabulary_words (course_id, word, meaning, example, sort_order) VALUES (?, ?, ?, ?, ?)'
  );
  const insertMany = db.transaction((rows) => {
    for (const row of rows) {
      stmt.run(courseId, row.word, row.meaning, row.example, row.sort_order);
    }
  });
  insertMany(words);
}

function insertGrammar(courseId, questions) {
  const stmt = db.prepare(
    'INSERT INTO grammar_questions (course_id, question, option_a, option_b, option_c, option_d, correct_answer, explanation, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );
  const insertMany = db.transaction((rows) => {
    for (const row of rows) {
      stmt.run(courseId, row.question, row.option_a, row.option_b, row.option_c, row.option_d, row.correct_answer, row.explanation, row.sort_order);
    }
  });
  insertMany(questions);
}

function insertSpeaking(courseId, sentences) {
  const stmt = db.prepare(
    'INSERT INTO speaking_sentences (course_id, sentence, translation, sort_order) VALUES (?, ?, ?, ?)'
  );
  const insertMany = db.transaction((rows) => {
    for (const row of rows) {
      stmt.run(courseId, row.sentence, row.translation, row.sort_order);
    }
  });
  insertMany(sentences);
}

function insertListening(courseId, exercises) {
  const stmt = db.prepare(
    'INSERT INTO listening_exercises (course_id, audio_url, question, option_a, option_b, option_c, option_d, correct_answer, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );
  const insertMany = db.transaction((rows) => {
    for (const row of rows) {
      stmt.run(courseId, null, row.question, row.option_a, row.option_b, row.option_c, row.option_d, row.correct_answer, row.sort_order);
    }
  });
  insertMany(exercises);
}

// ============================================================
// Seed courses helper
// ============================================================
function seedCourseUnit(language, level, title, description, sortOrder, data) {
  const courseId = insertCourse(language, level, title, description, sortOrder);
  insertVocabulary(courseId, data.vocabulary);
  insertGrammar(courseId, data.grammar);
  insertSpeaking(courseId, data.speaking);
  insertListening(courseId, data.listening);
  return courseId;
}

// ============================================================
// ==================== ENGLISH COURSES =======================
// ============================================================

const enVocab = {
  greeting: [
    { word: 'Hello', meaning: '你好', example: 'Hello, how are you?', sort_order: 1 },
    { word: 'Goodbye', meaning: '再见', example: 'Goodbye, see you tomorrow!', sort_order: 2 },
    { word: 'Thank you', meaning: '谢谢', example: 'Thank you for your help.', sort_order: 3 },
    { word: 'Sorry', meaning: '对不起', example: 'I am sorry for being late.', sort_order: 4 },
    { word: 'Please', meaning: '请', example: 'Please sit down.', sort_order: 5 },
  ],
  numbers: [
    { word: 'One', meaning: '一', example: 'I have one apple.', sort_order: 1 },
    { word: 'Two', meaning: '二', example: 'She has two cats.', sort_order: 2 },
    { word: 'Three', meaning: '三', example: 'There are three books.', sort_order: 3 },
    { word: 'Clock', meaning: '时钟', example: 'Look at the clock.', sort_order: 4 },
    { word: 'Today', meaning: '今天', example: 'Today is Monday.', sort_order: 5 },
  ],
  objects: [
    { word: 'Book', meaning: '书', example: 'This is my book.', sort_order: 1 },
    { word: 'Table', meaning: '桌子', example: 'The book is on the table.', sort_order: 2 },
    { word: 'Chair', meaning: '椅子', example: 'Please take a chair.', sort_order: 3 },
    { word: 'Pen', meaning: '笔', example: 'Can I borrow your pen?', sort_order: 4 },
    { word: 'Bag', meaning: '包', example: 'My bag is heavy.', sort_order: 5 },
  ],
  restaurant: [
    { word: 'Menu', meaning: '菜单', example: 'Can I see the menu?', sort_order: 1 },
    { word: 'Order', meaning: '点菜', example: 'I would like to order now.', sort_order: 2 },
    { word: 'Bill', meaning: '账单', example: 'Could I have the bill, please?', sort_order: 3 },
    { word: 'Waiter', meaning: '服务员', example: 'The waiter is very friendly.', sort_order: 4 },
    { word: 'Delicious', meaning: '美味的', example: 'This dish is delicious!', sort_order: 5 },
  ],
  directions: [
    { word: 'Left', meaning: '左边', example: 'Turn left at the corner.', sort_order: 1 },
    { word: 'Right', meaning: '右边', example: 'The park is on your right.', sort_order: 2 },
    { word: 'Straight', meaning: '直走', example: 'Go straight for two blocks.', sort_order: 3 },
    { word: 'Near', meaning: '附近', example: 'Is there a bank near here?', sort_order: 4 },
    { word: 'Crossroad', meaning: '十字路口', example: 'Turn right at the crossroad.', sort_order: 5 },
  ],
  shopping: [
    { word: 'Price', meaning: '价格', example: 'What is the price of this?', sort_order: 1 },
    { word: 'Discount', meaning: '折扣', example: 'Is there any discount?', sort_order: 2 },
    { word: 'Size', meaning: '尺寸', example: 'Do you have a larger size?', sort_order: 3 },
    { word: 'Cash', meaning: '现金', example: 'Do you accept cash?', sort_order: 4 },
    { word: 'Receipt', meaning: '收据', example: 'Can I have a receipt?', sort_order: 5 },
  ],
  travel: [
    { word: 'Passport', meaning: '护照', example: 'Please show your passport.', sort_order: 1 },
    { word: 'Flight', meaning: '航班', example: 'My flight is at 3 PM.', sort_order: 2 },
    { word: 'Hotel', meaning: '酒店', example: 'We booked a hotel near the beach.', sort_order: 3 },
    { word: 'Luggage', meaning: '行李', example: 'I lost my luggage.', sort_order: 4 },
    { word: 'Reservation', meaning: '预订', example: 'I have a reservation.', sort_order: 5 },
  ],
  business: [
    { word: 'Meeting', meaning: '会议', example: 'The meeting starts at 10 AM.', sort_order: 1 },
    { word: 'Report', meaning: '报告', example: 'Please submit the report by Friday.', sort_order: 2 },
    { word: 'Deadline', meaning: '截止日期', example: 'The deadline is next Monday.', sort_order: 3 },
    { word: 'Colleague', meaning: '同事', example: 'My colleague will join us.', sort_order: 4 },
    { word: 'Presentation', meaning: '演示', example: 'I will give a presentation tomorrow.', sort_order: 5 },
  ],
  culture: [
    { word: 'Tradition', meaning: '传统', example: 'It is an old tradition.', sort_order: 1 },
    { word: 'Festival', meaning: '节日', example: 'The festival is in spring.', sort_order: 2 },
    { word: 'Custom', meaning: '习俗', example: 'This is a local custom.', sort_order: 3 },
    { word: 'Celebrate', meaning: '庆祝', example: 'How do you celebrate New Year?', sort_order: 4 },
    { word: 'Heritage', meaning: '文化遗产', example: 'This building is a world heritage site.', sort_order: 5 },
  ],
};

const enGrammar = {
  greeting: [
    { question: '___ is your name?', option_a: 'What', option_b: 'How', option_c: 'Who', option_d: 'Where', correct_answer: 'A', explanation: '"What is your name?" 是询问名字的固定句式。', sort_order: 1 },
    { question: 'How ___ you?', option_a: 'is', option_b: 'are', option_c: 'am', option_d: 'be', correct_answer: 'B', explanation: '"How are you?" 用 are 与 you 搭配。', sort_order: 2 },
    { question: 'I ___ a student.', option_a: 'is', option_b: 'are', option_c: 'am', option_d: 'be', correct_answer: 'C', explanation: '第一人称 I 后接 am。', sort_order: 3 },
    { question: 'Nice to ___ you.', option_a: 'meet', option_b: 'meeting', option_c: 'met', option_d: 'meets', correct_answer: 'A', explanation: '"Nice to meet you." 固定表达，to 后接动词原形。', sort_order: 4 },
    { question: '___ morning!', option_a: 'Good', option_b: 'Well', option_c: 'Nice', option_d: 'Fine', correct_answer: 'A', explanation: '"Good morning!" 是标准问候语。', sort_order: 5 },
  ],
  numbers: [
    { question: 'There ___ three apples.', option_a: 'is', option_b: 'are', option_c: 'am', option_d: 'be', correct_answer: 'B', explanation: '复数名词用 are。', sort_order: 1 },
    { question: 'What time ___ it?', option_a: 'is', option_b: 'are', option_c: 'am', option_d: 'does', correct_answer: 'A', explanation: '"What time is it?" 固定句式。', sort_order: 2 },
    { question: 'Today ___ Monday.', option_a: 'is', option_b: 'are', option_c: 'am', option_d: 'be', correct_answer: 'A', explanation: '单数主语用 is。', sort_order: 3 },
    { question: 'It is half ___ five.', option_a: 'pass', option_b: 'to', option_c: 'past', option_d: 'at', correct_answer: 'C', explanation: '"half past five" 表示五点半。', sort_order: 4 },
    { question: 'I have ___ books.', option_a: 'two', option_b: 'second', option_c: 'twice', option_d: 'twos', correct_answer: 'A', explanation: '数量词用基数词 two。', sort_order: 5 },
  ],
  objects: [
    { question: 'This ___ my book.', option_a: 'is', option_b: 'are', option_c: 'am', option_d: 'be', correct_answer: 'A', explanation: '单数名词用 is。', sort_order: 1 },
    { question: '___ is on the table.', option_a: 'It', option_b: 'They', option_c: 'He', option_d: 'She', correct_answer: 'A', explanation: '指代物品用 it。', sort_order: 2 },
    { question: 'Can I ___ your pen?', option_a: 'borrow', option_b: 'lend', option_c: 'give', option_d: 'take', correct_answer: 'A', explanation: '借用是 borrow，借出是 lend。', sort_order: 3 },
    { question: 'There ___ a pen on the desk.', option_a: 'is', option_b: 'are', option_c: 'have', option_d: 'has', correct_answer: 'A', explanation: 'There be 句型，单数用 is。', sort_order: 4 },
    { question: 'The book is ___ the table.', option_a: 'in', option_b: 'on', option_c: 'at', option_d: 'to', correct_answer: 'B', explanation: '在桌子上面用 on。', sort_order: 5 },
  ],
  restaurant: [
    { question: 'I would ___ a cup of coffee.', option_a: 'like', option_b: 'likes', option_c: 'liked', option_d: 'liking', correct_answer: 'A', explanation: 'would like + 名词表示想要。', sort_order: 1 },
    { question: 'Could I ___ the menu, please?', option_a: 'see', option_b: 'saw', option_c: 'seen', option_d: 'seeing', correct_answer: 'A', explanation: 'Could I + 动词原形。', sort_order: 2 },
    { question: 'This dish tastes ___.', option_a: 'delicious', option_b: 'deliciously', option_c: 'more delicious', option_d: 'most delicious', correct_answer: 'A', explanation: 'taste 后接形容词。', sort_order: 3 },
    { question: 'I ___ like some water.', option_a: 'would', option_b: 'will', option_c: 'want', option_d: 'can', correct_answer: 'A', explanation: 'would like 是委婉表达。', sort_order: 4 },
    { question: 'Are you ready ___ order?', option_a: 'to', option_b: 'for', option_c: 'with', option_d: 'at', correct_answer: 'A', explanation: 'ready to do something。', sort_order: 5 },
  ],
  directions: [
    { question: '___ left at the corner.', option_a: 'Turn', option_b: 'Turning', option_c: 'To turn', option_d: 'Turned', correct_answer: 'A', explanation: '祈使句用动词原形。', sort_order: 1 },
    { question: 'Is there a bank ___ here?', option_a: 'near', option_b: 'nearly', option_c: 'nearby', option_d: 'close', correct_answer: 'A', explanation: 'near here 表示附近。', sort_order: 2 },
    { question: 'Go straight ___ two blocks.', option_a: 'for', option_b: 'in', option_c: 'at', option_d: 'on', correct_answer: 'A', explanation: 'go straight for + 距离。', sort_order: 3 },
    { question: 'The park is ___ your right.', option_a: 'on', option_b: 'in', option_c: 'at', option_d: 'to', correct_answer: 'A', explanation: 'on your right/left 固定搭配。', sort_order: 4 },
    { question: '___ me, where is the station?', option_a: 'Excuse', option_b: 'Sorry', option_c: 'Pardon', option_d: 'Hello', correct_answer: 'A', explanation: 'Excuse me 是打扰别人时用的礼貌用语。', sort_order: 5 },
  ],
  shopping: [
    { question: 'How ___ is this?', option_a: 'many', option_b: 'much', option_c: 'more', option_d: 'most', correct_answer: 'B', explanation: '询问价格用 How much。', sort_order: 1 },
    { question: 'Do you ___ a larger size?', option_a: 'has', option_b: 'having', option_c: 'have', option_d: 'had', correct_answer: 'C', explanation: 'Do you + 动词原形。', sort_order: 2 },
    { question: 'I will ___ it.', option_a: 'take', option_b: 'took', option_c: 'taken', option_d: 'taking', correct_answer: 'A', explanation: 'will 后接动词原形。', sort_order: 3 },
    { question: 'Can I pay ___ credit card?', option_a: 'by', option_b: 'with', option_c: 'in', option_d: 'on', correct_answer: 'A', explanation: 'pay by credit card 用信用卡支付。', sort_order: 4 },
    { question: 'It is ___ expensive for me.', option_a: 'too', option_b: 'to', option_c: 'very much', option_d: 'much', correct_answer: 'A', explanation: 'too + 形容词表示太……', sort_order: 5 },
  ],
  travel: [
    { question: 'I ___ to Paris last summer.', option_a: 'go', option_b: 'went', option_c: 'gone', option_d: 'going', correct_answer: 'B', explanation: 'last summer 是过去时间，用过去式 went。', sort_order: 1 },
    { question: 'Have you ___ been to Japan?', option_a: 'ever', option_b: 'never', option_c: 'yet', option_d: 'already', correct_answer: 'A', explanation: 'Have you ever been to... 询问是否曾经去过。', sort_order: 2 },
    { question: 'I will ___ at the hotel at 3 PM.', option_a: 'arrive', option_b: 'arrived', option_c: 'arriving', option_d: 'arrives', correct_answer: 'A', explanation: 'will + 动词原形。', sort_order: 3 },
    { question: 'The flight ___ delayed.', option_a: 'was', option_b: 'were', option_c: 'are', option_d: 'be', correct_answer: 'A', explanation: '单数主语用 was。', sort_order: 4 },
    { question: 'Could you ___ me with my luggage?', option_a: 'help', option_b: 'helps', option_c: 'helped', option_d: 'helping', correct_answer: 'A', explanation: 'Could you + 动词原形。', sort_order: 5 },
  ],
  business: [
    { question: 'The meeting ___ at 10 AM.', option_a: 'start', option_b: 'starts', option_c: 'starting', option_d: 'started', correct_answer: 'B', explanation: '第三人称单数用 starts。', sort_order: 1 },
    { question: 'Please ___ the report by Friday.', option_a: 'submit', option_b: 'submits', option_c: 'submitted', option_d: 'submitting', correct_answer: 'A', explanation: '祈使句用动词原形。', sort_order: 2 },
    { question: 'I look forward ___ hearing from you.', option_a: 'to', option_b: 'for', option_c: 'at', option_d: 'with', correct_answer: 'A', explanation: 'look forward to + 动名词。', sort_order: 3 },
    { question: 'She has ___ in this company for 5 years.', option_a: 'work', option_b: 'works', option_c: 'worked', option_d: 'working', correct_answer: 'C', explanation: '现在完成时 has + 过去分词。', sort_order: 4 },
    { question: 'We need to ___ a decision.', option_a: 'make', option_b: 'do', option_c: 'take', option_d: 'give', correct_answer: 'A', explanation: 'make a decision 做决定。', sort_order: 5 },
  ],
  culture: [
    { question: 'This festival ___ celebrated every spring.', option_a: 'is', option_b: 'are', option_c: 'was', option_d: 'were', correct_answer: 'A', explanation: '被动语态，单数主语用 is。', sort_order: 1 },
    { question: 'People ___ different customs around the world.', option_a: 'have', option_b: 'has', option_c: 'having', option_d: 'had', correct_answer: 'A', explanation: '复数主语用 have。', sort_order: 2 },
    { question: 'Culture ___ an important role in society.', option_a: 'play', option_b: 'plays', option_c: 'playing', option_d: 'played', correct_answer: 'B', explanation: '第三人称单数用 plays。', sort_order: 3 },
    { question: 'It is important to ___ traditions.', option_a: 'preserve', option_b: 'preserves', option_c: 'preserving', option_d: 'preserved', correct_answer: 'A', explanation: 'to + 动词原形。', sort_order: 4 },
    { question: 'Many tourists visit ___ the Great Wall every year.', option_a: 'to', option_b: 'for', option_c: 'at', option_d: '—', correct_answer: 'D', explanation: 'visit 直接加宾语，不需要介词。', sort_order: 5 },
  ],
};

const enSpeaking = {
  greeting: [
    { sentence: 'Hello, my name is John.', translation: '你好，我叫约翰。', sort_order: 1 },
    { sentence: 'Nice to meet you.', translation: '很高兴认识你。', sort_order: 2 },
    { sentence: 'How are you today?', translation: '你今天怎么样？', sort_order: 3 },
  ],
  numbers: [
    { sentence: 'It is three o\'clock.', translation: '现在是三点钟。', sort_order: 1 },
    { sentence: 'Today is Wednesday.', translation: '今天是星期三。', sort_order: 2 },
    { sentence: 'I have two brothers and one sister.', translation: '我有两个兄弟和一个姐妹。', sort_order: 3 },
  ],
  objects: [
    { sentence: 'This is my pencil case.', translation: '这是我的铅笔盒。', sort_order: 1 },
    { sentence: 'The keys are on the desk.', translation: '钥匙在桌子上。', sort_order: 2 },
    { sentence: 'Where is my phone?', translation: '我的手机在哪里？', sort_order: 3 },
  ],
  restaurant: [
    { sentence: 'I would like a steak, please.', translation: '我想要一份牛排。', sort_order: 1 },
    { sentence: 'Could I have the bill, please?', translation: '请给我账单。', sort_order: 2 },
    { sentence: 'What do you recommend?', translation: '你有什么推荐的吗？', sort_order: 3 },
  ],
  directions: [
    { sentence: 'Excuse me, where is the nearest subway station?', translation: '打扰一下，最近的地铁站在哪里？', sort_order: 1 },
    { sentence: 'Go straight and turn right at the second intersection.', translation: '直走，在第二个路口右转。', sort_order: 2 },
    { sentence: 'It is about a five-minute walk.', translation: '走路大约五分钟。', sort_order: 3 },
  ],
  shopping: [
    { sentence: 'How much does this cost?', translation: '这个多少钱？', sort_order: 1 },
    { sentence: 'Do you have this in a different color?', translation: '这个有其他颜色吗？', sort_order: 2 },
    { sentence: 'I am just looking, thank you.', translation: '我只是看看，谢谢。', sort_order: 3 },
  ],
  travel: [
    { sentence: 'I would like to book a room for two nights.', translation: '我想预订一个房间，住两晚。', sort_order: 1 },
    { sentence: 'What time does the flight depart?', translation: '航班几点起飞？', sort_order: 2 },
    { sentence: 'Is breakfast included?', translation: '包含早餐吗？', sort_order: 3 },
  ],
  business: [
    { sentence: 'I would like to schedule a meeting for next week.', translation: '我想安排下周的会议。', sort_order: 1 },
    { sentence: 'Please find the report attached.', translation: '请查收附件中的报告。', sort_order: 2 },
    { sentence: 'Let me introduce you to our team.', translation: '让我把你介绍给我们的团队。', sort_order: 3 },
  ],
  culture: [
    { sentence: 'Different cultures have different customs.', translation: '不同的文化有不同的习俗。', sort_order: 1 },
    { sentence: 'I am interested in learning about local traditions.', translation: '我对了解当地传统很感兴趣。', sort_order: 2 },
    { sentence: 'Could you tell me more about this festival?', translation: '你能告诉我更多关于这个节日的信息吗？', sort_order: 3 },
  ],
};

const enListening = {
  greeting: [
    { question: 'What did the speaker say? "Good ___, how are you?"', option_a: 'morning', option_b: 'evening', option_c: 'afternoon', option_d: 'night', correct_answer: 'A', sort_order: 1 },
    { question: 'The speaker says: "___ to meet you."', option_a: 'Nice', option_b: 'Glad', option_c: 'Happy', option_d: 'Pleased', correct_answer: 'A', sort_order: 2 },
    { question: '"My name ___ Tom."', option_a: 'is', option_b: 'are', option_c: 'am', option_d: 'be', correct_answer: 'A', sort_order: 3 },
  ],
  numbers: [
    { question: '"The meeting is at ___ o\'clock."', option_a: 'two', option_b: 'three', option_c: 'four', option_d: 'five', correct_answer: 'B', sort_order: 1 },
    { question: '"Today is ___."', option_a: 'Monday', option_b: 'Tuesday', option_c: 'Wednesday', option_d: 'Thursday', correct_answer: 'C', sort_order: 2 },
    { question: '"I have ___ cats at home."', option_a: 'one', option_b: 'two', option_c: 'three', option_d: 'four', correct_answer: 'B', sort_order: 3 },
  ],
  objects: [
    { question: '"Can you pass me the ___?"', option_a: 'book', option_b: 'pen', option_c: 'bag', option_d: 'phone', correct_answer: 'B', sort_order: 1 },
    { question: '"The keys are on the ___."', option_a: 'table', option_b: 'chair', option_c: 'desk', option_d: 'floor', correct_answer: 'C', sort_order: 2 },
    { question: '"Where is my ___?"', option_a: 'wallet', option_b: 'phone', option_c: 'bag', option_d: 'book', correct_answer: 'A', sort_order: 3 },
  ],
  restaurant: [
    { question: '"I would like a ___ steak."', option_a: 'medium', option_b: 'rare', option_c: 'well-done', option_d: 'medium-rare', correct_answer: 'C', sort_order: 1 },
    { question: '"Can I have a glass of ___?"', option_a: 'water', option_b: 'wine', option_c: 'juice', option_d: 'soda', correct_answer: 'A', sort_order: 2 },
    { question: '"The special today is ___."', option_a: 'pasta', option_b: 'salad', option_c: 'fish', option_d: 'chicken', correct_answer: 'C', sort_order: 3 },
  ],
  directions: [
    { question: '"___ at the traffic light."', option_a: 'Turn left', option_b: 'Turn right', option_c: 'Go straight', option_d: 'Stop', correct_answer: 'A', sort_order: 1 },
    { question: '"It is on your ___ side."', option_a: 'left', option_b: 'right', option_c: 'other', option_d: 'both', correct_answer: 'B', sort_order: 2 },
    { question: '"The museum is ___ the park."', option_a: 'next to', option_b: 'far from', option_c: 'inside', option_d: 'behind', correct_answer: 'A', sort_order: 3 },
  ],
  shopping: [
    { question: '"That will be ___ dollars."', option_a: 'twenty', option_b: 'thirty', option_c: 'forty', option_d: 'fifty', correct_answer: 'A', sort_order: 1 },
    { question: '"Do you accept ___ cards?"', option_a: 'credit', option_b: 'gift', option_c: 'membership', option_d: 'debit', correct_answer: 'A', sort_order: 2 },
    { question: '"We have a ___ percent discount today."', option_a: 'ten', option_b: 'twenty', option_c: 'thirty', option_d: 'fifteen', correct_answer: 'B', sort_order: 3 },
  ],
  travel: [
    { question: '"Your flight departs from gate ___."', option_a: 'B12', option_b: 'C8', option_c: 'A5', option_d: 'D3', correct_answer: 'A', sort_order: 1 },
    { question: '"Breakfast is served from ___ AM."', option_a: 'six', option_b: 'seven', option_c: 'eight', option_d: 'nine', correct_answer: 'B', sort_order: 2 },
    { question: '"Checkout time is ___ PM."', option_a: 'ten', option_b: 'eleven', option_c: 'twelve', option_d: 'one', correct_answer: 'C', sort_order: 3 },
  ],
  business: [
    { question: '"The meeting has been rescheduled to ___."', option_a: 'Monday', option_b: 'Tuesday', option_c: 'Wednesday', option_d: 'Thursday', correct_answer: 'B', sort_order: 1 },
    { question: '"Please email the report to ___."', option_a: 'HR', option_b: 'Finance', option_c: 'the manager', option_d: 'the client', correct_answer: 'C', sort_order: 2 },
    { question: '"The deadline is ___ Friday."', option_a: 'this', option_b: 'next', option_c: 'last', option_d: 'every', correct_answer: 'A', sort_order: 3 },
  ],
  culture: [
    { question: '"The festival takes place in ___."', option_a: 'spring', option_b: 'summer', option_c: 'autumn', option_d: 'winter', correct_answer: 'A', sort_order: 1 },
    { question: '"This tradition is over ___ years old."', option_a: '100', option_b: '200', option_c: '500', option_d: '1000', correct_answer: 'C', sort_order: 2 },
    { question: '"People celebrate by ___."', option_a: 'dancing', option_b: 'singing', option_c: 'eating', option_d: 'lighting fireworks', correct_answer: 'D', sort_order: 3 },
  ],
};

// ============================================================
// ==================== JAPANESE COURSES =======================
// ============================================================

const jaVocab = {
  kana: [
    { word: 'あお（青）', meaning: '蓝色', example: '空があおいです。(天空是蓝色的。)', sort_order: 1 },
    { word: 'いえ（家）', meaning: '家', example: 'いえに帰ります。(回家。)', sort_order: 2 },
    { word: 'うみ（海）', meaning: '海', example: 'うみがきれいです。(海很美。)', sort_order: 3 },
    { word: 'えき（駅）', meaning: '车站', example: 'えきはどこですか？(车站在哪里？)', sort_order: 4 },
    { word: 'おかし（お菓子）', meaning: '点心/零食', example: 'おかしを食べます。(吃点心。)', sort_order: 5 },
  ],
  greetingJa: [
    { word: 'おはようございます', meaning: '早上好（礼貌）', example: '先生、おはようございます。(老师，早上好。)', sort_order: 1 },
    { word: 'こんにちは', meaning: '你好（白天）', example: 'こんにちは、元気ですか？(你好，你还好吗？)', sort_order: 2 },
    { word: 'ありがとうございます', meaning: '谢谢（礼貌）', example: 'ありがとうございます、助かりました。(谢谢，帮了大忙。)', sort_order: 3 },
    { word: 'すみません', meaning: '对不起/打扰了', example: 'すみません、駅はどこですか？(不好意思，车站在哪里？)', sort_order: 4 },
    { word: 'さようなら', meaning: '再见', example: 'さようなら、また明日。(再见，明天见。)', sort_order: 5 },
  ],
  selfIntroJa: [
    { word: 'わたし（私）', meaning: '我', example: 'わたしは学生です。(我是学生。)', sort_order: 1 },
    { word: 'なまえ（名前）', meaning: '名字', example: 'お名前は何ですか？(你叫什么名字？)', sort_order: 2 },
    { word: 'しゅっしん（出身）', meaning: '出身', example: '出身は東京です。(我来自东京。)', sort_order: 3 },
    { word: 'しゅみ（趣味）', meaning: '爱好', example: '趣味は読書です。(我的爱好是读书。)', sort_order: 4 },
    { word: 'しごと（仕事）', meaning: '工作', example: '仕事は会社員です。(我的工作是公司职员。)', sort_order: 5 },
  ],
  dailyJa: [
    { word: 'たべる（食べる）', meaning: '吃', example: '朝ごはんを食べます。(吃早饭。)', sort_order: 1 },
    { word: 'のむ（飲む）', meaning: '喝', example: 'お茶を飲みます。(喝茶。)', sort_order: 2 },
    { word: 'いく（行く）', meaning: '去', example: '学校に行きます。(去学校。)', sort_order: 3 },
    { word: 'みる（見る）', meaning: '看', example: 'テレビを見ます。(看电视。)', sort_order: 4 },
    { word: 'かう（買う）', meaning: '买', example: 'コンビニで買います。(在便利店买。)', sort_order: 5 },
  ],
  transportJa: [
    { word: 'でんしゃ（電車）', meaning: '电车/火车', example: '電車で行きます。(坐电车去。)', sort_order: 1 },
    { word: 'バス', meaning: '公交车', example: 'バスに乗ります。(坐公交车。)', sort_order: 2 },
    { word: 'タクシー', meaning: '出租车', example: 'タクシーを呼びます。(叫出租车。)', sort_order: 3 },
    { word: 'きっぷ（切符）', meaning: '票', example: '切符を買ってください。(请买票。)', sort_order: 4 },
    { word: 'のりば（乗り場）', meaning: '乘车点', example: 'バス乗り場はどこですか？(公交车站在哪里？)', sort_order: 5 },
  ],
  restaurantJa: [
    { word: 'メニュー', meaning: '菜单', example: 'メニューを見せてください。(请给我看菜单。)', sort_order: 1 },
    { word: 'ちゅうもん（注文）', meaning: '点菜', example: '注文をお願いします。(我要点菜。)', sort_order: 2 },
    { word: 'おいしい', meaning: '好吃', example: 'このラーメンはおいしいです。(这个拉面很好吃。)', sort_order: 3 },
    { word: 'おかんじょう（お勘定）', meaning: '结账', example: 'お勘定をお願いします。(请结账。)', sort_order: 4 },
    { word: 'おすすめ', meaning: '推荐', example: 'おすすめは何ですか？(有什么推荐？)', sort_order: 5 },
  ],
  keigo: [
    { word: 'いらっしゃいます', meaning: '在（尊敬语）', example: '先生はいらっしゃいますか？(老师在吗？)', sort_order: 1 },
    { word: 'おっしゃいます', meaning: '说（尊敬语）', example: '社長がおっしゃいました。(社长说了。)', sort_order: 2 },
    { word: 'めしあがります（召し上がります）', meaning: '吃/喝（尊敬语）', example: 'どうぞ召し上がってください。(请享用。)', sort_order: 3 },
    { word: 'もうします（申します）', meaning: '说/叫做（谦让语）', example: '田中と申します。(我叫田中。)', sort_order: 4 },
    { word: 'いただきます', meaning: '吃/喝（谦让语）', example: 'ごちそうをいただきました。(享用了美食。)', sort_order: 5 },
  ],
  businessJa: [
    { word: 'かいぎ（会議）', meaning: '会议', example: '会議は10時からです。(会议从10点开始。)', sort_order: 1 },
    { word: 'ほうこく（報告）', meaning: '报告', example: '報告書を提出します。(提交报告。)', sort_order: 2 },
    { word: 'しめきり（締め切り）', meaning: '截止日期', example: '締め切りは金曜日です。(截止日期是星期五。)', sort_order: 3 },
    { word: 'でんわ（電話）', meaning: '电话', example: '電話で連絡します。(用电话联系。)', sort_order: 4 },
    { word: 'めいし（名刺）', meaning: '名片', example: '名刺を交換しましょう。(交换名片吧。)', sort_order: 5 },
  ],
  newsJa: [
    { word: 'しんぶん（新聞）', meaning: '报纸', example: '朝日新聞を読んでいます。(在读朝日新闻。)', sort_order: 1 },
    { word: 'きじ（記事）', meaning: '报道', example: 'この記事は面白いです。(这篇报道很有趣。)', sort_order: 2 },
    { word: 'せいじ（政治）', meaning: '政治', example: '政治のニュースが多いです。(政治新闻很多。)', sort_order: 3 },
    { word: 'けいざい（経済）', meaning: '经济', example: '経済が成長しています。(经济正在增长。)', sort_order: 4 },
    { word: 'こくさい（国際）', meaning: '国际', example: '国際問題について話します。(讨论国际问题。)', sort_order: 5 },
  ],
};

const jaGrammar = {
  kana: [
    { question: '「あ」は何段の音ですか？', option_a: 'あ段', option_b: 'い段', option_c: 'う段', option_d: 'え段', correct_answer: 'A', explanation: 'あ行あ段の音です。', sort_order: 1 },
    { question: 'ひらがなの「か」に対応するカタカナは？', option_a: 'カ', option_b: 'キ', option_c: 'ク', option_d: 'ケ', correct_answer: 'A', explanation: 'か行あ段は「カ」。', sort_order: 2 },
    { question: '濁音「が」はどの行の音ですか？', option_a: 'か行', option_b: 'さ行', option_c: 'た行', option_d: 'は行', correct_answer: 'A', explanation: 'か行に濁点をつけるとが行になる。', sort_order: 3 },
    { question: '促音を表すのは？', option_a: 'っ', option_b: 'ゃ', option_c: 'ょ', option_d: 'ゅ', correct_answer: 'A', explanation: '小さい「っ」は促音。', sort_order: 4 },
    { question: '長音「おとうさん」の正しい表記は？', option_a: 'おとうさん', option_b: 'おとおさん', option_c: 'おとーさん', option_d: 'おとさん', correct_answer: 'A', explanation: 'お段の長音は「う」で表す。', sort_order: 5 },
  ],
  greetingJa: [
    { question: '午前中のあいさつは？', option_a: 'こんばんは', option_b: 'おはようございます', option_c: 'こんにちは', option_d: 'おやすみなさい', correct_answer: 'B', explanation: '朝の挨拶は「おはようございます」。', sort_order: 1 },
    { question: '「ありがとう」の丁寧な言い方は？', option_a: 'ありがとうね', option_b: 'ありがとうよ', option_c: 'ありがとうございます', option_d: 'ありがと', correct_answer: 'C', explanation: '丁寧語は「ございます」をつける。', sort_order: 2 },
    { question: '別れるときのあいさつは？', option_a: 'おはよう', option_b: 'こんにちは', option_c: 'さようなら', option_d: 'いただきます', correct_answer: 'C', explanation: '別れの挨拶は「さようなら」。', sort_order: 3 },
    { question: '謝るときに使うのは？', option_a: 'ありがとう', option_b: 'すみません', option_c: 'こんにちは', option_d: 'いただきます', correct_answer: 'B', explanation: '「すみません」は謝罪や依頼に使う。', sort_order: 4 },
    { question: '食事の前に言うのは？', option_a: 'ごちそうさま', option_b: 'いただきます', option_c: 'おやすみ', option_d: 'さようなら', correct_answer: 'B', explanation: '食事の前は「いただきます」。', sort_order: 5 },
  ],
  selfIntroJa: [
    { question: '「わたしは学生です。」の「です」の役割は？', option_a: '動詞', option_b: '助詞', option_c: '助動詞（丁寧）', option_d: '副詞', correct_answer: 'C', explanation: '「です」は丁寧を表す助動詞。', sort_order: 1 },
    { question: '「___は田中です。」に入る適切な語は？', option_a: 'なまえ', option_b: 'わたし', option_c: 'お', option_d: 'が', correct_answer: 'A', explanation: '「名前は田中です」が自然。', sort_order: 2 },
    { question: '趣味をきくときの正しい表現は？', option_a: '趣味は何ですか？', option_b: '趣味が何ですか？', option_c: '趣味を何ですか？', option_d: '趣味に何ですか？', correct_answer: 'A', explanation: '主題は「は」で示す。', sort_order: 3 },
    { question: '「日本___来ました。」助詞は？', option_a: 'に', option_b: 'から', option_c: 'へ', option_d: 'で', correct_answer: 'B', explanation: '起点を表す「から」。', sort_order: 4 },
    { question: '自己紹介で「よろしくお願いします」の意味は？', option_a: '再见', option_b: '对不起', option_c: '请多关照', option_d: '谢谢', correct_answer: 'C', explanation: '「よろしくお願いします」は请多关照。', sort_order: 5 },
  ],
  dailyJa: [
    { question: '「ご飯を___ます。」入るのは？', option_a: '食べ', option_b: '飲み', option_c: '買い', option_d: '行き', correct_answer: 'A', explanation: 'ご飯は「食べる」。', sort_order: 1 },
    { question: '「学校___行きます。」助詞は？', option_a: 'を', option_b: 'に', option_c: 'で', option_d: 'が', correct_answer: 'B', explanation: '目的地は「に」。', sort_order: 2 },
    { question: '「テレビ___見ます。」助詞は？', option_a: 'に', option_b: 'で', option_c: 'を', option_d: 'が', correct_answer: 'C', explanation: '目的語は「を」。', sort_order: 3 },
    { question: '過去形「食べました」の普通形は？', option_a: '食べる', option_b: '食べた', option_c: '食べている', option_d: '食べよう', correct_answer: 'B', explanation: 'た形は「食べた」。', sort_order: 4 },
    { question: '「コンビニ___買います。」助詞は？', option_a: 'に', option_b: 'を', option_c: 'で', option_d: 'へ', correct_answer: 'C', explanation: '動作の場所は「で」。', sort_order: 5 },
  ],
  transportJa: [
    { question: '「電車___乗ります。」助詞は？', option_a: 'を', option_b: 'に', option_c: 'で', option_d: 'へ', correct_answer: 'B', explanation: '乗り物に乗るは「に」。', sort_order: 1 },
    { question: '「タクシー___行きます。」助詞は？', option_a: 'に', option_b: 'を', option_c: 'で', option_d: 'が', correct_answer: 'C', explanation: '手段は「で」。', sort_order: 2 },
    { question: '「駅はどこですか？」の丁寧度は？', option_a: 'カジュアル', option_b: '丁寧', option_c: '尊敬語', option_d: '謙譲語', correct_answer: 'B', explanation: '「です・ます」で丁寧語。', sort_order: 3 },
    { question: '「次の___で降ります。」入る語は？', option_a: 'えき', option_b: 'でんしゃ', option_c: 'バス', option_d: 'くるま', correct_answer: 'A', explanation: '電車を降りる場所は「駅」。', sort_order: 4 },
    { question: '「切符を___ください。」入る語は？', option_a: '買って', option_b: '売って', option_c: '見て', option_d: '取って', correct_answer: 'A', explanation: '切符は「買う」。', sort_order: 5 },
  ],
  restaurantJa: [
    { question: '「メニューを___ください。」入る語は？', option_a: '見せて', option_b: '食べて', option_c: '買って', option_d: '書いて', correct_answer: 'A', explanation: '「見せてください」で请给我看。', sort_order: 1 },
    { question: '「これは___ですか？」味をきくときは？', option_a: 'おいしい', option_b: 'からい', option_c: 'あまい', option_d: 'どんな味', correct_answer: 'D', explanation: '味を尋ねるとき「どんな味」。', sort_order: 2 },
    { question: '「お勘定」の意味は？', option_a: '点菜', option_b: '结账', option_c: '推荐', option_d: '好吃', correct_answer: 'B', explanation: 'お勘定は会計・結帳。', sort_order: 3 },
    { question: '「注文___お願いします。」助詞は？', option_a: 'が', option_b: 'を', option_c: 'に', option_d: 'で', correct_answer: 'B', explanation: '「注文をお願いします」が自然。', sort_order: 4 },
    { question: '「おすすめ」の意味は？', option_a: '账单', option_b: '推荐', option_c: '好吃', option_d: '菜单', correct_answer: 'B', explanation: 'おすすめ=推荐。', sort_order: 5 },
  ],
  keigo: [
    { question: '「いらっしゃいます」の元の動詞は？', option_a: 'いる', option_b: 'いく', option_c: 'くる', option_d: 'する', correct_answer: 'A', explanation: '「いる」の尊敬語が「いらっしゃる」。', sort_order: 1 },
    { question: '「申します」は何語？', option_a: '尊敬語', option_b: '謙譲語', option_c: '丁寧語', option_d: 'タメ語', correct_answer: 'B', explanation: '「申す」は謙譲語。', sort_order: 2 },
    { question: '「食べる」の尊敬語は？', option_a: 'いただく', option_b: '召し上がる', option_c: '食べられる', option_d: '食べます', correct_answer: 'B', explanation: '食べる→召し上がる。', sort_order: 3 },
    { question: '「社長は会議室に___。」尊敬語で入れるのは？', option_a: 'いる', option_b: 'いらっしゃる', option_c: 'おる', option_d: 'ござる', correct_answer: 'B', explanation: '目上の人の存在は尊敬語。', sort_order: 4 },
    { question: '謙譲語を使うのはどんな時？', option_a: '相手の行動', option_b: '自分の行動', option_c: '第三者の行動', option_d: '天気の話', correct_answer: 'B', explanation: '謙譲語は自分の行動を低めて言う。', sort_order: 5 },
  ],
  businessJa: [
    { question: '「会議は10時___始まります。」助詞は？', option_a: 'に', option_b: 'から', option_c: 'で', option_d: 'を', correct_answer: 'B', explanation: '起点は「から」。', sort_order: 1 },
    { question: 'ビジネスメールの宛名「___様」入る語は？', option_a: '各位', option_b: '田中', option_c: '御中', option_d: '担当者', correct_answer: 'B', explanation: '個人宛は名前+様。', sort_order: 2 },
    { question: '「___します。」報告する時の謙譲語は？', option_a: 'ご報告', option_b: 'お報告', option_c: '報告', option_d: 'め報告', correct_answer: 'A', explanation: 'サ変動詞は「ご〜します」。', sort_order: 3 },
    { question: '名刺交換で最初に言うことは？', option_a: 'さようなら', option_b: 'いただきます', option_c: '初めまして', option_d: 'ごちそうさま', correct_answer: 'C', explanation: '初対面は「初めまして」。', sort_order: 4 },
    { question: '「締め切りは金曜日です。」カジュアル表現は？', option_a: '締め切りは金曜日だ', option_b: '締め切りが金曜日', option_c: '締め切り金曜日', option_d: '金曜日締め切り', correct_answer: 'A', explanation: '「です」→「だ」でカジュアル。', sort_order: 5 },
  ],
  newsJa: [
    { question: '「新聞を___。」読むの敬語は？', option_a: 'お読みになる', option_b: '読まれる', option_c: '拝読する', option_d: '読みます', correct_answer: 'A', explanation: '読むの尊敬語は「お読みになる」。', sort_order: 1 },
    { question: 'ニュース記事の見出しに多い文体は？', option_a: 'です・ます体', option_b: 'だ・である体', option_c: '敬語体', option_d: '話し言葉', correct_answer: 'B', explanation: '新聞は「だ・である」体。', sort_order: 2 },
    { question: '「経済___成長する。」助詞は？', option_a: 'を', option_b: 'に', option_c: 'が', option_d: 'で', correct_answer: 'C', explanation: '主語の「が」。', sort_order: 3 },
    { question: '「国際問題___話し合う。」助詞は？', option_a: 'を', option_b: 'に', option_c: 'が', option_d: 'について', correct_answer: 'D', explanation: '話題は「について」。', sort_order: 4 },
    { question: '「記事___よると〜」伝聞の助詞は？', option_a: 'に', option_b: 'を', option_c: 'で', option_d: 'が', correct_answer: 'A', explanation: '「〜によると」で根据。', sort_order: 5 },
  ],
};

const jaSpeaking = {
  kana: [
    { sentence: 'あいうえお', translation: 'a i u e o（五十音第一行）', sort_order: 1 },
    { sentence: 'かきくけこ', translation: 'ka ki ku ke ko（五十音第二行）', sort_order: 2 },
    { sentence: 'さしすせそ', translation: 'sa shi su se so（五十音第三行）', sort_order: 3 },
  ],
  greetingJa: [
    { sentence: 'おはようございます。今日はいい天気ですね。', translation: '早上好。今天天气真好啊。', sort_order: 1 },
    { sentence: 'こんにちは、お元気ですか？', translation: '你好，你还好吗？', sort_order: 2 },
    { sentence: 'ありがとうございます。とても助かりました。', translation: '非常感谢，帮了大忙。', sort_order: 3 },
  ],
  selfIntroJa: [
    { sentence: '初めまして、田中と申します。', translation: '初次见面，我叫田中。', sort_order: 1 },
    { sentence: '私は東京から来ました。', translation: '我来自东京。', sort_order: 2 },
    { sentence: '趣味は映画を見ることです。よろしくお願いします。', translation: '我的爱好是看电影。请多关照。', sort_order: 3 },
  ],
  dailyJa: [
    { sentence: '毎朝7時に起きます。', translation: '每天早上7点起床。', sort_order: 1 },
    { sentence: 'コーヒーを飲みながら新聞を読みます。', translation: '一边喝咖啡一边看报纸。', sort_order: 2 },
    { sentence: '週末は友達と買い物に行きます。', translation: '周末和朋友去购物。', sort_order: 3 },
  ],
  transportJa: [
    { sentence: 'すみません、東京駅はどう行けばいいですか？', translation: '不好意思，东京站怎么走？', sort_order: 1 },
    { sentence: '次の駅で降ります。', translation: '在下一站下车。', sort_order: 2 },
    { sentence: 'バス乗り場はあちらです。', translation: '公交车站台在那边。', sort_order: 3 },
  ],
  restaurantJa: [
    { sentence: 'すみません、メニューを見せてください。', translation: '不好意思，请给我看一下菜单。', sort_order: 1 },
    { sentence: 'おすすめは何ですか？', translation: '有什么推荐的吗？', sort_order: 2 },
    { sentence: 'お勘定をお願いします。', translation: '请结账。', sort_order: 3 },
  ],
  keigo: [
    { sentence: '部長は会議室にいらっしゃいます。', translation: '部长在会议室。', sort_order: 1 },
    { sentence: '私が担当させていただきます。', translation: '请让我来负责。', sort_order: 2 },
    { sentence: '少々お待ちいただけますでしょうか。', translation: '能请您稍等一下吗？', sort_order: 3 },
  ],
  businessJa: [
    { sentence: '企画書を拝見させていただきました。', translation: '我拜读了您的策划案。', sort_order: 1 },
    { sentence: '来週の会議の資料をお送りします。', translation: '我会发送下周会议的资料。', sort_order: 2 },
    { sentence: 'ご検討のほど、よろしくお願いいたします。', translation: '请多多考虑，拜托了。', sort_order: 3 },
  ],
  newsJa: [
    { sentence: '今朝の新聞によると、景気が回復しているそうです。', translation: '据今早的报纸报道，经济正在复苏。', sort_order: 1 },
    { sentence: 'この記事は環境問題について書かれています。', translation: '这篇报道写的是关于环境问题的。', sort_order: 2 },
    { sentence: '国際社会は協力してこの問題に取り組むべきです。', translation: '国际社会应该合作应对这个问题。', sort_order: 3 },
  ],
};

const jaListening = {
  kana: [
    { question: '「あ」の音を聞いて、正しいものを選んでください。', option_a: 'a', option_b: 'i', option_c: 'u', option_d: 'e', correct_answer: 'A', sort_order: 1 },
    { question: '「し」の音を聞いて、正しいものを選んでください。', option_a: 'sa', option_b: 'shi', option_c: 'su', option_d: 'se', correct_answer: 'B', sort_order: 2 },
    { question: '「ん」の音は何ですか？', option_a: 'na', option_b: 'ni', option_c: 'nu', option_d: 'n', correct_answer: 'D', sort_order: 3 },
  ],
  greetingJa: [
    { question: '朝の挨拶はどれですか？「___ございます」', option_a: 'おはよう', option_b: 'こんにちは', option_c: 'こんばんは', option_d: 'おやすみ', correct_answer: 'A', sort_order: 1 },
    { question: 'お礼を言う時は？「___ございます」', option_a: 'すみません', option_b: 'ありがとう', option_c: 'さようなら', option_d: 'おはよう', correct_answer: 'B', sort_order: 2 },
    { question: '謝るときは？「___」', option_a: 'ありがとう', option_b: 'こんにちは', option_c: 'すみません', option_d: 'いただきます', correct_answer: 'C', sort_order: 3 },
  ],
  selfIntroJa: [
    { question: '「___と申します。」自己紹介で使うのは？', option_a: '田中', option_b: 'ありがとう', option_c: 'すみません', option_d: 'おはよう', correct_answer: 'A', sort_order: 1 },
    { question: '「___から来ました。」入る語は？', option_a: '東京', option_b: 'ありがとう', option_c: 'すみません', option_d: 'さようなら', correct_answer: 'A', sort_order: 2 },
    { question: '「よろしく___。」入る語は？', option_a: 'お願いします', option_b: 'ありがとう', option_c: 'すみません', option_d: 'さようなら', correct_answer: 'A', sort_order: 3 },
  ],
  dailyJa: [
    { question: '「毎朝___時に起きます。」', option_a: '6', option_b: '7', option_c: '8', option_d: '9', correct_answer: 'B', sort_order: 1 },
    { question: '「___を飲みます。」', option_a: 'お茶', option_b: '水', option_c: 'コーヒー', option_d: 'ジュース', correct_answer: 'C', sort_order: 2 },
    { question: '「___に行きます。」', option_a: '学校', option_b: '会社', option_c: '買い物', option_d: '公園', correct_answer: 'C', sort_order: 3 },
  ],
  transportJa: [
    { question: '「___で行きます。」', option_a: '電車', option_b: '車', option_c: '自転車', option_d: 'バス', correct_answer: 'A', sort_order: 1 },
    { question: '「___乗り場はどこですか？」', option_a: 'タクシー', option_b: 'バス', option_c: '電車', option_d: '飛行機', correct_answer: 'B', sort_order: 2 },
    { question: '「次の___で降ります。」', option_a: '駅', option_b: 'バス停', option_c: '交差点', option_d: '信号', correct_answer: 'A', sort_order: 3 },
  ],
  restaurantJa: [
    { question: '「___を見せてください。」', option_a: 'メニュー', option_b: 'お箸', option_c: 'お皿', option_d: 'お茶', correct_answer: 'A', sort_order: 1 },
    { question: '「___は何ですか？」', option_a: 'おすすめ', option_b: 'お勘定', option_c: '注文', option_d: 'メニュー', correct_answer: 'A', sort_order: 2 },
    { question: '「___をお願いします。」', option_a: 'お勘定', option_b: 'おすすめ', option_c: 'メニュー', option_d: 'ご飯', correct_answer: 'A', sort_order: 3 },
  ],
  keigo: [
    { question: '「部長は会議室に___。」', option_a: 'いらっしゃいます', option_b: 'います', option_c: 'おります', option_d: 'ございます', correct_answer: 'A', sort_order: 1 },
    { question: '「私が___ます。」謙譲語で。', option_a: '申し', option_b: '言い', option_c: 'おっしゃい', option_d: '話し', correct_answer: 'A', sort_order: 2 },
    { question: '「少々___ください。」', option_a: 'お待ち', option_b: '待って', option_c: '待ち', option_d: '待たれて', correct_answer: 'A', sort_order: 3 },
  ],
  businessJa: [
    { question: '「___を拝見しました。」', option_a: '企画書', option_b: 'メニュー', option_c: '新聞', option_d: '雑誌', correct_answer: 'A', sort_order: 1 },
    { question: '「来週の___の資料を送ります。」', option_a: '会議', option_b: 'パーティー', option_c: '旅行', option_d: '食事', correct_answer: 'A', sort_order: 2 },
    { question: '「___ほど、よろしくお願いいたします。」', option_a: 'ご検討', option_b: 'ご確認', option_c: 'ご連絡', option_d: 'ご報告', correct_answer: 'A', sort_order: 3 },
  ],
  newsJa: [
    { question: '「___が回復しているそうです。」', option_a: '景気', option_b: '天気', option_c: '人気', option_d: '病気', correct_answer: 'A', sort_order: 1 },
    { question: '「___問題について書かれています。」', option_a: '環境', option_b: '経済', option_c: '政治', option_d: '教育', correct_answer: 'A', sort_order: 2 },
    { question: '「国際___は協力すべきです。」', option_a: '社会', option_b: '問題', option_c: '経済', option_d: '会議', correct_answer: 'A', sort_order: 3 },
  ],
};

// ============================================================
// ==================== KOREAN COURSES =======================
// ============================================================

const koVocab = {
  hangul: [
    { word: 'ㄱ (기역)', meaning: 'g/k', example: '가방 (包包)', sort_order: 1 },
    { word: 'ㄴ (니은)', meaning: 'n', example: '나무 (树)', sort_order: 2 },
    { word: 'ㅁ (미음)', meaning: 'm', example: '마음 (心)', sort_order: 3 },
    { word: 'ㅅ (시옷)', meaning: 's', example: '사람 (人)', sort_order: 4 },
    { word: 'ㅇ (이응)', meaning: 'ng/无声', example: '아이 (孩子)', sort_order: 5 },
  ],
  greetingKo: [
    { word: '안녕하세요', meaning: '您好', example: '안녕하세요, 처음 뵙겠습니다.(您好，初次见面。)', sort_order: 1 },
    { word: '감사합니다', meaning: '谢谢', example: '도와주셔서 감사합니다.(感谢您的帮助。)', sort_order: 2 },
    { word: '죄송합니다', meaning: '对不起', example: '늦어서 죄송합니다.(对不起，我迟到了。)', sort_order: 3 },
    { word: '반갑습니다', meaning: '很高兴见到你', example: '만나서 반갑습니다.(很高兴见到你。)', sort_order: 4 },
    { word: '안녕히 가세요', meaning: '再见（请慢走）', example: '안녕히 가세요, 다음에 또 봐요.(再见，下次再见。)', sort_order: 5 },
  ],
  numbersKo: [
    { word: '하나', meaning: '一（固有词）', example: '사과 하나 주세요.(请给我一个苹果。)', sort_order: 1 },
    { word: '둘', meaning: '二（固有词）', example: '둘이서 같이 갑니다.(两个人一起去。)', sort_order: 2 },
    { word: '일', meaning: '一（汉字词）', example: '일월 일일 (1月1日)', sort_order: 3 },
    { word: '오늘', meaning: '今天', example: '오늘은 금요일입니다.(今天是星期五。)', sort_order: 4 },
    { word: '날짜', meaning: '日期', example: '날짜를 확인해 주세요.(请确认日期。)', sort_order: 5 },
  ],
  shoppingKo: [
    { word: '얼마예요?', meaning: '多少钱？', example: '이거 얼마예요?(这个多少钱？)', sort_order: 1 },
    { word: '싸다', meaning: '便宜', example: '이 가게는 아주 싸요.(这家店很便宜。)', sort_order: 2 },
    { word: '비싸다', meaning: '贵', example: '너무 비싸요.(太贵了。)', sort_order: 3 },
    { word: '사이즈', meaning: '尺寸', example: '더 큰 사이즈 있어요?(有更大的尺寸吗？)', sort_order: 4 },
    { word: '할인', meaning: '折扣', example: '할인 되나요?(有折扣吗？)', sort_order: 5 },
  ],
  restaurantKo: [
    { word: '메뉴', meaning: '菜单', example: '메뉴 좀 주세요.(请给我菜单。)', sort_order: 1 },
    { word: '주문하다', meaning: '点菜', example: '주문할게요.(我要点菜了。)', sort_order: 2 },
    { word: '맛있다', meaning: '好吃', example: '정말 맛있어요!(真的很好吃！)', sort_order: 3 },
    { word: '계산서', meaning: '账单', example: '계산서 주세요.(请给我账单。)', sort_order: 4 },
    { word: '추천', meaning: '推荐', example: '추천 메뉴가 뭐예요?(推荐菜是什么？)', sort_order: 5 },
  ],
  transportKo: [
    { word: '지하철', meaning: '地铁', example: '지하철로 갈게요.(坐地铁去。)', sort_order: 1 },
    { word: '버스', meaning: '公交车', example: '버스 정류장이 어디예요?(公交车站在哪里？)', sort_order: 2 },
    { word: '택시', meaning: '出租车', example: '택시를 불러 주세요.(请帮我叫出租车。)', sort_order: 3 },
    { word: '표', meaning: '票', example: '표를 샀어요.(买了票。)', sort_order: 4 },
    { word: '길', meaning: '路', example: '길을 잃었어요.(迷路了。)', sort_order: 5 },
  ],
  cultureKo: [
    { word: '전통', meaning: '传统', example: '한국의 전통 문화예요.(是韩国的传统文化。)', sort_order: 1 },
    { word: '축제', meaning: '节日/庆典', example: '축제에 가고 싶어요.(想去庆典。)', sort_order: 2 },
    { word: '예절', meaning: '礼仪', example: '한국 예절을 배우고 있어요.(在学习韩国礼仪。)', sort_order: 3 },
    { word: '한복', meaning: '韩服', example: '한복이 정말 예뻐요.(韩服真的很漂亮。)', sort_order: 4 },
    { word: '김치', meaning: '泡菜', example: '김치는 한국의 대표 음식이에요.(泡菜是韩国的代表性食物。)', sort_order: 5 },
  ],
  workplaceKo: [
    { word: '회의', meaning: '会议', example: '오후에 회의가 있어요.(下午有会议。)', sort_order: 1 },
    { word: '보고서', meaning: '报告', example: '보고서를 제출했어요.(提交了报告。)', sort_order: 2 },
    { word: '마감', meaning: '截止', example: '마감이 내일이에요.(截止日期是明天。)', sort_order: 3 },
    { word: '연락', meaning: '联系', example: '이메일로 연락할게요.(会用邮件联系。)', sort_order: 4 },
    { word: '명함', meaning: '名片', example: '명함을 드릴게요.(给您名片。)', sort_order: 5 },
  ],
  currentKo: [
    { word: '뉴스', meaning: '新闻', example: '오늘 뉴스를 봤어요?(看了今天的新闻吗？)', sort_order: 1 },
    { word: '기사', meaning: '报道', example: '이 기사가 흥미로워요.(这篇报道很有意思。)', sort_order: 2 },
    { word: '정치', meaning: '政治', example: '정치 뉴스가 많아요.(政治新闻很多。)', sort_order: 3 },
    { word: '경제', meaning: '经济', example: '경제가 성장하고 있어요.(经济正在增长。)', sort_order: 4 },
    { word: '사회', meaning: '社会', example: '사회 문제에 관심이 있어요.(对社会问题感兴趣。)', sort_order: 5 },
  ],
};

const koGrammar = {
  hangul: [
    { question: '한글은 누가 만들었나요?', option_a: '세종대왕', option_b: '이순신', option_c: '김구', option_d: '정약용', correct_answer: 'A', explanation: '세종대왕이 1443년에 창제했다.', sort_order: 1 },
    { question: '기본 자음의 개수는?', option_a: '10개', option_b: '14개', option_c: '16개', option_d: '19개', correct_answer: 'B', explanation: '한글 기본 자음은 ㄱ부터 ㅎ까지 14개。', sort_order: 2 },
    { question: '「ㄱ」の発音は？（語頭で）', option_a: 'g', option_b: 'k', option_c: 'n', option_d: 'ng', correct_answer: 'B', explanation: '語頭ではㄱはkに近い音。', sort_order: 3 },
    { question: 'パッチム「ㄴ」の発音は？', option_a: 'n', option_b: 'm', option_c: 'ng', option_d: 't', correct_answer: 'A', explanation: 'ㄴパッチムはn音。', sort_order: 4 },
    { question: '二重母音「ㅘ」の発音は？', option_a: 'wa', option_b: 'wo', option_c: 'wi', option_d: 'we', correct_answer: 'A', explanation: 'ㅗ+ㅏ=ㅘ (wa)。', sort_order: 5 },
  ],
  greetingKo: [
    { question: '「안녕하세요」の丁寧度は？', option_a: '반말', option_b: '해요체', option_c: '합쇼체', option_d: '해체', correct_answer: 'B', explanation: '「하세요」は해요체で丁寧な表現。', sort_order: 1 },
    { question: '「감사합니다」の語尾は？', option_a: '-요', option_b: '-ㅂ니다', option_c: '-다', option_d: '-어', correct_answer: 'B', explanation: '합니다体。', sort_order: 2 },
    { question: '「죄송합니다」の意味は？', option_a: '谢谢', option_b: '对不起', option_c: '再见', option_d: '你好', correct_answer: 'B', explanation: '죄송합니다 = 对不起。', sort_order: 3 },
    { question: '初対面の挨拶「처음 ___」', option_a: '뵙겠습니다', option_b: '만났어요', option_c: '왔어요', option_d: '갔어요', correct_answer: 'A', explanation: '처음 뵙겠습니다 初次见面。', sort_order: 4 },
    { question: '帰る人に「___ 가세요」', option_a: '안녕히', option_b: '잘', option_c: '빨리', option_d: '천천히', correct_answer: 'A', explanation: '안녕히 가세요 = 请慢走。', sort_order: 5 },
  ],
  numbersKo: [
    { question: '固有数詞で「一つ」は？', option_a: '일', option_b: '하나', option_c: '한', option_d: '첫', correct_answer: 'B', explanation: '하나=一(固有詞)。', sort_order: 1 },
    { question: '「두 개 주세요」の두の意味は？', option_a: '一', option_b: '二', option_c: '三', option_d: '四', correct_answer: 'B', explanation: '두=二(固有詞)。', sort_order: 2 },
    { question: '日付に使うのはどっち？', option_a: '하나, 둘, 셋', option_b: '일, 이, 삼', option_c: '한, 두, 세', option_d: '첫, 둘째, 셋째', correct_answer: 'B', explanation: '日付には漢字語数詞を使う。', sort_order: 3 },
    { question: '「오늘___ 금요일입니다。」', option_a: '은', option_b: '는', option_c: '이', option_d: '가', correct_answer: 'A', explanation: 'パッチム有→은。', sort_order: 4 },
    { question: '「날짜___ 확인해 주세요。」', option_a: '를', option_b: '를', option_c: '가', option_d: '는', correct_answer: 'A', explanation: 'パッチム無→를。', sort_order: 5 },
  ],
  shoppingKo: [
    { question: '「이거 ___?」いくらですか？', option_a: '얼마예요', option_b: '뭐예요', option_c: '어때요', option_d: '왜예요', correct_answer: 'A', explanation: '얼마예요=多少钱。', sort_order: 1 },
    { question: '「너무 ___」高すぎる', option_a: '싸요', option_b: '비싸요', option_c: '커요', option_d: '작아요', correct_answer: 'B', explanation: '비싸다=高い/貴。', sort_order: 2 },
    { question: '「___ 주세요」安くしてください', option_a: '깎아', option_b: '올려', option_c: '줘', option_d: '사', correct_answer: 'A', explanation: '깎다=値切る。', sort_order: 3 },
    { question: '「더 큰 ___ 있어요?」サイズ', option_a: '사이즈', option_b: '색깔', option_c: '가격', option_d: '무게', correct_answer: 'A', explanation: '사이즈=サイズ。', sort_order: 4 },
    { question: '「___ 되나요?」割引', option_a: '할인', option_b: '계산', option_c: '포장', option_d: '교환', correct_answer: 'A', explanation: '할인=割引。', sort_order: 5 },
  ],
  restaurantKo: [
    { question: '「메뉴 ___ 주세요」を/をください', option_a: '좀', option_b: '을', option_c: '가', option_d: '는', correct_answer: 'A', explanation: '좀=ちょっと/を。', sort_order: 1 },
    { question: '「주문___」します', option_a: '할게요', option_b: '했어요', option_c: '해요', option_d: '했다', correct_answer: 'A', explanation: '할게요=しますね(意志)。', sort_order: 2 },
    { question: '「정말 ___!」おいしい！', option_a: '맛있어요', option_b: '맛없어요', option_c: '예뻐요', option_d: '좋아요', correct_answer: 'A', explanation: '맛있다=美味しい。', sort_order: 3 },
    { question: '「___ 주세요」お勘定', option_a: '계산서', option_b: '메뉴', option_c: '물', option_d: '김치', correct_answer: 'A', explanation: '계산서=計算書/お勘定。', sort_order: 4 },
    { question: '「___ 메뉴가 뭐예요?」おすすめ', option_a: '추천', option_b: '인기', option_c: '새로운', option_d: '오늘의', correct_answer: 'A', explanation: '추천=推薦。', sort_order: 5 },
  ],
  transportKo: [
    { question: '「___ 갈게요」地下鉄で', option_a: '지하철로', option_b: '버스로', option_c: '택시로', option_d: '걸어서', correct_answer: 'A', explanation: '지하철=地下鉄。', sort_order: 1 },
    { question: '「버스 ___이 어디예요?」停留所', option_a: '정류장', option_b: '터미널', option_c: '역', option_d: '정거장', correct_answer: 'A', explanation: '정류장=停留所。', sort_order: 2 },
    { question: '「택시를 ___ 주세요」呼んで', option_a: '불러', option_b: '잡아', option_c: '타', option_d: '내려', correct_answer: 'A', explanation: '부르다=呼ぶ。', sort_order: 3 },
    { question: '「___ 잃었어요」道に迷った', option_a: '길을', option_b: '돈을', option_c: '시간을', option_d: '친구를', correct_answer: 'A', explanation: '길을 잃다=道に迷う。', sort_order: 4 },
    { question: '「___ 샀어요」切符を買った', option_a: '표를', option_b: '책을', option_c: '음식을', option_d: '옷을', correct_answer: 'A', explanation: '표=切符。', sort_order: 5 },
  ],
  cultureKo: [
    { question: '「한국의 ___ 문화예요」伝統', option_a: '전통', option_b: '현대', option_c: '대중', option_d: '음식', correct_answer: 'A', explanation: '전통=伝統。', sort_order: 1 },
    { question: '「___에 가고 싶어요」お祭り', option_a: '축제', option_b: '학교', option_c: '회사', option_d: '병원', correct_answer: 'A', explanation: '축제=祝祭/祭り。', sort_order: 2 },
    { question: '「한국 ___을 배우고 있어요」礼儀', option_a: '예절', option_b: '요리', option_c: '노래', option_d: '춤', correct_answer: 'A', explanation: '예절=礼節。', sort_order: 3 },
    { question: '「___이 정말 예뻐요」韓服', option_a: '한복', option_b: '치마', option_c: '바지', option_d: '양복', correct_answer: 'A', explanation: '한복=韓服。', sort_order: 4 },
    { question: '「___ 한국의 대표 음식이에요」キムチ', option_a: '김치', option_b: '불고기', option_c: '비빔밥', option_d: '떡볶이', correct_answer: 'A', explanation: '김치=キムチ。', sort_order: 5 },
  ],
  workplaceKo: [
    { question: '「오후에 ___ 있어요」会議', option_a: '회의가', option_b: '약속이', option_c: '수업이', option_d: '모임이', correct_answer: 'A', explanation: '회의=会議。', sort_order: 1 },
    { question: '「___ 제출했어요」報告書', option_a: '보고서를', option_b: '숙제를', option_c: '편지를', option_d: '신청서를', correct_answer: 'A', explanation: '보고서=報告書。', sort_order: 2 },
    { question: '「___이 내일이에요」締切', option_a: '마감', option_b: '시작', option_c: '끝', option_d: '휴일', correct_answer: 'A', explanation: '마감=締切。', sort_order: 3 },
    { question: '「이메일로 ___」連絡します', option_a: '연락할게요', option_b: '보낼게요', option_c: '쓸게요', option_d: '읽을게요', correct_answer: 'A', explanation: '연락=連絡。', sort_order: 4 },
    { question: '「___ 드릴게요」名刺', option_a: '명함을', option_b: '선물을', option_c: '돈을', option_d: '책을', correct_answer: 'A', explanation: '명함=名刺。', sort_order: 5 },
  ],
  currentKo: [
    { question: '「오늘 ___ 봤어요?」ニュース', option_a: '뉴스를', option_b: '드라마를', option_c: '영화를', option_d: '책을', correct_answer: 'A', explanation: '뉴스=ニュース。', sort_order: 1 },
    { question: '「이 ___ 흥미로워요」記事', option_a: '기사가', option_b: '책이', option_c: '영화가', option_d: '노래가', correct_answer: 'A', explanation: '기사=記事。', sort_order: 2 },
    { question: '「___ 뉴스가 많아요」政治', option_a: '정치', option_b: '스포츠', option_c: '연예', option_d: '날씨', correct_answer: 'A', explanation: '정치=政治。', sort_order: 3 },
    { question: '「___ 성장하고 있어요」経済', option_a: '경제가', option_b: '인구가', option_c: '기술이', option_d: '교육이', correct_answer: 'A', explanation: '경제=経済。', sort_order: 4 },
    { question: '「___ 문제에 관심이 있어요」社会', option_a: '사회', option_b: '개인', option_c: '가정', option_d: '학교', correct_answer: 'A', explanation: '사회=社会。', sort_order: 5 },
  ],
};

const koSpeaking = {
  hangul: [
    { sentence: '가나다라마바사', translation: 'ga na da ra ma ba sa（韩文子音练习）', sort_order: 1 },
    { sentence: '아야어여오요우유으이', translation: 'a ya eo yeo o yo u yu eu i（韩文母音练习）', sort_order: 2 },
    { sentence: '안녕하세요', translation: '您好（最基本的韩语问候）', sort_order: 3 },
  ],
  greetingKo: [
    { sentence: '안녕하세요, 처음 뵙겠습니다.', translation: '您好，初次见面。', sort_order: 1 },
    { sentence: '도와주셔서 정말 감사합니다.', translation: '非常感谢您的帮助。', sort_order: 2 },
    { sentence: '안녕히 가세요, 다음에 또 만나요.', translation: '再见，下次再见面吧。', sort_order: 3 },
  ],
  numbersKo: [
    { sentence: '사과 하나 주세요.', translation: '请给我一个苹果。', sort_order: 1 },
    { sentence: '오늘은 금요일입니다.', translation: '今天是星期五。', sort_order: 2 },
    { sentence: '날짜를 확인해 주세요.', translation: '请确认日期。', sort_order: 3 },
  ],
  shoppingKo: [
    { sentence: '이거 얼마예요?', translation: '这个多少钱？', sort_order: 1 },
    { sentence: '좀 깎아 주세요.', translation: '请便宜一点。', sort_order: 2 },
    { sentence: '다른 색깔 있어요?', translation: '有其他颜色吗？', sort_order: 3 },
  ],
  restaurantKo: [
    { sentence: '메뉴 좀 보여 주세요.', translation: '请给我看一下菜单。', sort_order: 1 },
    { sentence: '여기서 제일 맛있는 게 뭐예요?', translation: '这里最好吃的是什么？', sort_order: 2 },
    { sentence: '계산서 주세요.', translation: '请给我账单。', sort_order: 3 },
  ],
  transportKo: [
    { sentence: '서울역에 어떻게 가요?', translation: '首尔站怎么走？', sort_order: 1 },
    { sentence: '다음 정류장에서 내릴게요.', translation: '在下一站下车。', sort_order: 2 },
    { sentence: '택시 좀 불러 주세요.', translation: '请帮我叫一下出租车。', sort_order: 3 },
  ],
  cultureKo: [
    { sentence: '한국의 전통 문화에 대해 알고 싶어요.', translation: '我想了解韩国的传统文化。', sort_order: 1 },
    { sentence: '한복이 정말 아름답습니다.', translation: '韩服真的很美。', sort_order: 2 },
    { sentence: '한국에서는 설날에 떡국을 먹어요.', translation: '在韩国，春节吃年糕汤。', sort_order: 3 },
  ],
  workplaceKo: [
    { sentence: '오늘 오후 2시에 회의가 있습니다.', translation: '今天下午2点有会议。', sort_order: 1 },
    { sentence: '보고서를 검토해 주시겠어요?', translation: '能请您审阅一下报告吗？', sort_order: 2 },
    { sentence: '명함을 드리겠습니다.', translation: '给您名片。', sort_order: 3 },
  ],
  currentKo: [
    { sentence: '오늘 뉴스에서 봤는데, 경제가 좋아지고 있대요.', translation: '今天在新闻上看到，经济在变好。', sort_order: 1 },
    { sentence: '환경 문제가 점점 심각해지고 있어요.', translation: '环境问题越来越严重了。', sort_order: 2 },
    { sentence: '이 기사에 대해 어떻게 생각하세요?', translation: '您对这篇报道怎么看？', sort_order: 3 },
  ],
};

const koListening = {
  hangul: [
    { question: '「가」の音を聞いて正しいものを選んでください。', option_a: 'ga', option_b: 'na', option_c: 'da', option_d: 'ma', correct_answer: 'A', sort_order: 1 },
    { question: '「사」の音は？', option_a: 'sa', option_b: 'sha', option_c: 'ja', option_d: 'cha', correct_answer: 'A', sort_order: 2 },
    { question: '「아」の音は？', option_a: 'a', option_b: 'ya', option_c: 'eo', option_d: 'yeo', correct_answer: 'A', sort_order: 3 },
  ],
  greetingKo: [
    { question: '「___ 처음 뵙겠습니다。」', option_a: '안녕하세요', option_b: '감사합니다', option_c: '죄송합니다', option_d: '반갑습니다', correct_answer: 'A', sort_order: 1 },
    { question: '「___ 정말 감사합니다。」', option_a: '도와주셔서', option_b: '늦어서', option_c: '만나서', option_d: '가르쳐 주셔서', correct_answer: 'A', sort_order: 2 },
    { question: '「___ 가세요。」', option_a: '안녕히', option_b: '빨리', option_c: '천천히', option_d: '잘', correct_answer: 'A', sort_order: 3 },
  ],
  numbersKo: [
    { question: '「사과 ___ 주세요。」', option_a: '하나', option_b: '둘', option_c: '셋', option_d: '넷', correct_answer: 'A', sort_order: 1 },
    { question: '「오늘은 ___ 입니다。」', option_a: '금요일', option_b: '월요일', option_c: '수요일', option_d: '일요일', correct_answer: 'A', sort_order: 2 },
    { question: '「___ 확인해 주세요。」', option_a: '날짜를', option_b: '시간을', option_c: '가격을', option_d: '주소를', correct_answer: 'A', sort_order: 3 },
  ],
  shoppingKo: [
    { question: '「이거 ___?」', option_a: '얼마예요', option_b: '뭐예요', option_c: '어때요', option_d: '왜예요', correct_answer: 'A', sort_order: 1 },
    { question: '「좀 ___ 주세요。」', option_a: '깎아', option_b: '올려', option_c: '줘', option_d: '사', correct_answer: 'A', sort_order: 2 },
    { question: '「다른 ___ 있어요?」', option_a: '색깔', option_b: '사이즈', option_c: '가게', option_d: '가격', correct_answer: 'A', sort_order: 3 },
  ],
  restaurantKo: [
    { question: '「___ 좀 보여 주세요。」', option_a: '메뉴', option_b: '계산서', option_c: '물', option_d: '반찬', correct_answer: 'A', sort_order: 1 },
    { question: '「___ 제일 맛있는 게 뭐예요?」', option_a: '여기서', option_b: '저기서', option_c: '어디서', option_d: '집에서', correct_answer: 'A', sort_order: 2 },
    { question: '「___ 주세요。」', option_a: '계산서', option_b: '메뉴', option_c: '물', option_d: '밥', correct_answer: 'A', sort_order: 3 },
  ],
  transportKo: [
    { question: '「___ 어떻게 가요?」', option_a: '서울역에', option_b: '학교에', option_c: '병원에', option_d: '공항에', correct_answer: 'A', sort_order: 1 },
    { question: '「다음 ___에서 내릴게요。」', option_a: '정류장', option_b: '역', option_c: '신호등', option_d: '횡단보도', correct_answer: 'A', sort_order: 2 },
    { question: '「___ 좀 불러 주세요。」', option_a: '택시', option_b: '버스', option_c: '친구', option_d: '경찰', correct_answer: 'A', sort_order: 3 },
  ],
  cultureKo: [
    { question: '「한국의 ___ 문화에 대해 알고 싶어요。」', option_a: '전통', option_b: '현대', option_c: '대중', option_d: '음식', correct_answer: 'A', sort_order: 1 },
    { question: '「___ 정말 아름답습니다。」', option_a: '한복이', option_b: '음식이', option_c: '노래가', option_d: '춤이', correct_answer: 'A', sort_order: 2 },
    { question: '「설날에 ___ 먹어요。」', option_a: '떡국을', option_b: '김치를', option_c: '불고기를', option_d: '비빔밥을', correct_answer: 'A', sort_order: 3 },
  ],
  workplaceKo: [
    { question: '「오늘 오후 ___ 회의가 있습니다。」', option_a: '2시에', option_b: '3시에', option_c: '4시에', option_d: '5시에', correct_answer: 'A', sort_order: 1 },
    { question: '「___ 검토해 주시겠어요?」', option_a: '보고서를', option_b: '이메일을', option_c: '편지를', option_d: '계약서를', correct_answer: 'A', sort_order: 2 },
    { question: '「___ 드리겠습니다。」', option_a: '명함을', option_b: '선물을', option_c: '돈을', option_d: '책을', correct_answer: 'A', sort_order: 3 },
  ],
  currentKo: [
    { question: '「오늘 ___ 봤는데요。」', option_a: '뉴스에서', option_b: '드라마에서', option_c: '영화에서', option_d: '책에서', correct_answer: 'A', sort_order: 1 },
    { question: '「___ 문제가 심각해지고 있어요。」', option_a: '환경', option_b: '경제', option_c: '교육', option_d: '의료', correct_answer: 'A', sort_order: 2 },
    { question: '「이 ___ 대해 어떻게 생각하세요?」', option_a: '기사에', option_b: '책에', option_c: '영화에', option_d: '노래에', correct_answer: 'A', sort_order: 3 },
  ],
};

// ============================================================
// ==================== ACHIEVEMENTS ==========================
// ============================================================

const achievements = [
  { name: '初次学习', description: '完成第1门课程', icon: '🎓', condition_type: 'completed_courses', condition_value: 1 },
  { name: '学习达人', description: '完成5门课程', icon: '⭐', condition_type: 'completed_courses', condition_value: 5 },
  { name: '学霸', description: '完成10门课程', icon: '🏆', condition_type: 'completed_courses', condition_value: 10 },
  { name: '坚持不懈', description: '连续学习3天', icon: '🔥', condition_type: 'streak_days', condition_value: 3 },
  { name: '学习之星', description: '连续学习7天', icon: '🌟', condition_type: 'streak_days', condition_value: 7 },
  { name: '学习马拉松', description: '连续学习30天', icon: '👑', condition_type: 'streak_days', condition_value: 30 },
  { name: '初露锋芒', description: '累计获得50积分', icon: '📈', condition_type: 'total_score', condition_value: 50 },
  { name: '积分达人', description: '累计获得100积分', icon: '💯', condition_type: 'total_score', condition_value: 100 },
  { name: '积分大师', description: '累计获得200积分', icon: '🎯', condition_type: 'total_score', condition_value: 200 },
];

// ============================================================
// ==================== MAIN SEED FUNCTION ====================
// ============================================================

function seed() {
  console.log('Initializing database schema...');
  initDatabase();

  console.log('Clearing existing data...');
  const tables = [
    'user_achievements', 'achievements', 'replies', 'posts',
    'learning_records', 'listening_exercises', 'speaking_sentences',
    'grammar_questions', 'vocabulary_words', 'courses', 'users'
  ];
  for (const table of tables) {
    db.prepare(`DELETE FROM ${table}`).run();
  }

  // ---- English Courses ----
  console.log('Seeding English courses...');
  let sortOrder = 1;
  seedCourseUnit('英语', '入门', '英语入门1-基础问候', '学习英语基本问候语，包括你好、再见、谢谢等日常用语。', sortOrder++, { vocabulary: enVocab.greeting, grammar: enGrammar.greeting, speaking: enSpeaking.greeting, listening: enListening.greeting });
  seedCourseUnit('英语', '入门', '英语入门2-数字与时间', '学习英语数字、时间和日期的表达方式。', sortOrder++, { vocabulary: enVocab.numbers, grammar: enGrammar.numbers, speaking: enSpeaking.numbers, listening: enListening.numbers });
  seedCourseUnit('英语', '入门', '英语入门3-日常物品', '学习常见日常物品的英文名称和用法。', sortOrder++, { vocabulary: enVocab.objects, grammar: enGrammar.objects, speaking: enSpeaking.objects, listening: enListening.objects });
  sortOrder = 1;
  seedCourseUnit('英语', '初级', '英语初级1-餐厅点餐', '学习在餐厅用英语点餐、询问推荐等实用对话。', sortOrder++, { vocabulary: enVocab.restaurant, grammar: enGrammar.restaurant, speaking: enSpeaking.restaurant, listening: enListening.restaurant });
  seedCourseUnit('英语', '初级', '英语初级2-问路指路', '学习用英语问路和指路的表达方式。', sortOrder++, { vocabulary: enVocab.directions, grammar: enGrammar.directions, speaking: enSpeaking.directions, listening: enListening.directions });
  seedCourseUnit('英语', '初级', '英语初级3-购物对话', '学习购物时的英文对话，包括询价、砍价、支付等。', sortOrder++, { vocabulary: enVocab.shopping, grammar: enGrammar.shopping, speaking: enSpeaking.shopping, listening: enListening.shopping });
  sortOrder = 1;
  seedCourseUnit('英语', '中级', '英语中级1-旅行对话', '学习旅行中常用的英语表达，包括酒店、航班、问路等。', sortOrder++, { vocabulary: enVocab.travel, grammar: enGrammar.travel, speaking: enSpeaking.travel, listening: enListening.travel });
  seedCourseUnit('英语', '中级', '英语中级2-商务英语', '学习商务场景下的英语表达，包括会议、报告、邮件等。', sortOrder++, { vocabulary: enVocab.business, grammar: enGrammar.business, speaking: enSpeaking.business, listening: enListening.business });
  seedCourseUnit('英语', '中级', '英语中级3-文化讨论', '学习用英语讨论文化话题，了解不同国家的文化差异。', sortOrder++, { vocabulary: enVocab.culture, grammar: enGrammar.culture, speaking: enSpeaking.culture, listening: enListening.culture });

  // ---- Japanese Courses ----
  console.log('Seeding Japanese courses...');
  sortOrder = 1;
  seedCourseUnit('日语', '入门', '日语入门1-五十音图', '学习日语五十音图的基础发音和书写。', sortOrder++, { vocabulary: jaVocab.kana, grammar: jaGrammar.kana, speaking: jaSpeaking.kana, listening: jaListening.kana });
  seedCourseUnit('日语', '入门', '日语入门2-寒暄语', '学习日语基本寒暄用语，包括问候、感谢、道歉等。', sortOrder++, { vocabulary: jaVocab.greetingJa, grammar: jaGrammar.greetingJa, speaking: jaSpeaking.greetingJa, listening: jaListening.greetingJa });
  seedCourseUnit('日语', '入门', '日语入门3-自我介绍', '学习用日语进行自我介绍，包括名字、出身、爱好等。', sortOrder++, { vocabulary: jaVocab.selfIntroJa, grammar: jaGrammar.selfIntroJa, speaking: jaSpeaking.selfIntroJa, listening: jaListening.selfIntroJa });
  sortOrder = 1;
  seedCourseUnit('日语', '初级', '日语初级1-日常会话', '学习日语日常生活对话，包括饮食、购物、时间等。', sortOrder++, { vocabulary: jaVocab.dailyJa, grammar: jaGrammar.dailyJa, speaking: jaSpeaking.dailyJa, listening: jaListening.dailyJa });
  seedCourseUnit('日语', '初级', '日语初级2-交通出行', '学习在日本乘坐交通工具时的日语表达。', sortOrder++, { vocabulary: jaVocab.transportJa, grammar: jaGrammar.transportJa, speaking: jaSpeaking.transportJa, listening: jaListening.transportJa });
  seedCourseUnit('日语', '初级', '日语初级3-餐厅点餐', '学习在日本餐厅点餐时的日语对话。', sortOrder++, { vocabulary: jaVocab.restaurantJa, grammar: jaGrammar.restaurantJa, speaking: jaSpeaking.restaurantJa, listening: jaListening.restaurantJa });
  sortOrder = 1;
  seedCourseUnit('日语', '中级', '日语中级1-敬语入门', '学习日语敬语体系，包括尊敬语、谦让语和丁寧语。', sortOrder++, { vocabulary: jaVocab.keigo, grammar: jaGrammar.keigo, speaking: jaSpeaking.keigo, listening: jaListening.keigo });
  seedCourseUnit('日语', '中级', '日语中级2-商务用语', '学习日本商务场景下的日语表达和礼仪。', sortOrder++, { vocabulary: jaVocab.businessJa, grammar: jaGrammar.businessJa, speaking: jaSpeaking.businessJa, listening: jaListening.businessJa });
  seedCourseUnit('日语', '中级', '日语中级3-新闻阅读', '学习阅读日语新闻，了解时事话题的表达方式。', sortOrder++, { vocabulary: jaVocab.newsJa, grammar: jaGrammar.newsJa, speaking: jaSpeaking.newsJa, listening: jaListening.newsJa });

  // ---- Korean Courses ----
  console.log('Seeding Korean courses...');
  sortOrder = 1;
  seedCourseUnit('韩语', '入门', '韩语入门1-韩文基础', '学习韩文（한글）的基础字母和发音规则。', sortOrder++, { vocabulary: koVocab.hangul, grammar: koGrammar.hangul, speaking: koSpeaking.hangul, listening: koListening.hangul });
  seedCourseUnit('韩语', '入门', '韩语入门2-日常问候', '学习韩语日常问候用语，包括你好、谢谢、对不起等。', sortOrder++, { vocabulary: koVocab.greetingKo, grammar: koGrammar.greetingKo, speaking: koSpeaking.greetingKo, listening: koListening.greetingKo });
  seedCourseUnit('韩语', '入门', '韩语入门3-数字与日期', '学习韩语数字（固有词/汉字词）和日期表达。', sortOrder++, { vocabulary: koVocab.numbersKo, grammar: koGrammar.numbersKo, speaking: koSpeaking.numbersKo, listening: koListening.numbersKo });
  sortOrder = 1;
  seedCourseUnit('韩语', '初级', '韩语初级1-购物会话', '学习在韩国购物时的韩语对话表达。', sortOrder++, { vocabulary: koVocab.shoppingKo, grammar: koGrammar.shoppingKo, speaking: koSpeaking.shoppingKo, listening: koListening.shoppingKo });
  seedCourseUnit('韩语', '初级', '韩语初级2-餐厅对话', '学习在韩国餐厅点餐时的韩语对话。', sortOrder++, { vocabulary: koVocab.restaurantKo, grammar: koGrammar.restaurantKo, speaking: koSpeaking.restaurantKo, listening: koListening.restaurantKo });
  seedCourseUnit('韩语', '初级', '韩语初级3-交通出行', '学习在韩国乘坐交通工具时的韩语表达。', sortOrder++, { vocabulary: koVocab.transportKo, grammar: koGrammar.transportKo, speaking: koSpeaking.transportKo, listening: koListening.transportKo });
  sortOrder = 1;
  seedCourseUnit('韩语', '中级', '韩语中级1-文化讨论', '学习用韩语讨论韩国文化、传统和习俗。', sortOrder++, { vocabulary: koVocab.cultureKo, grammar: koGrammar.cultureKo, speaking: koSpeaking.cultureKo, listening: koListening.cultureKo });
  seedCourseUnit('韩语', '中级', '韩语中级2-职场用语', '学习韩国职场中常用的韩语表达。', sortOrder++, { vocabulary: koVocab.workplaceKo, grammar: koGrammar.workplaceKo, speaking: koSpeaking.workplaceKo, listening: koListening.workplaceKo });
  seedCourseUnit('韩语', '中级', '韩语中级3-时事阅读', '学习阅读韩语新闻，了解韩国时事话题。', sortOrder++, { vocabulary: koVocab.currentKo, grammar: koGrammar.currentKo, speaking: koSpeaking.currentKo, listening: koListening.currentKo });

  // ---- Achievements ----
  console.log('Seeding achievements...');
  const achievementStmt = db.prepare(
    'INSERT INTO achievements (name, description, icon, condition_type, condition_value) VALUES (?, ?, ?, ?, ?)'
  );
  const insertAchievements = db.transaction((rows) => {
    for (const row of rows) {
      achievementStmt.run(row.name, row.description, row.icon, row.condition_type, row.condition_value);
    }
  });
  insertAchievements(achievements);

  console.log('Seed data completed successfully!');
}

seed();