// 設定 Google 試算表發布後的 CSV 網址
const GOOGLE_SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSavjNB5ggkfkOoBueLDWFCbgYRSqSLbHU_zNBc8OeqCLIK48YQsc32Op9GTuwlWIqKNg7GQUTyH9Xy/pub?gid=568879169&single=true&output=csv";

// 設定每次測驗抽出的題目數量
const QUIZ_LENGTH = 5;

// 儲存 Google 試算表資料表
let questionTable;

// 儲存題庫全部題目
let questionBank = [];

// 儲存本次隨機抽出的題目
let questions = [];

// 儲存 p5.js 畫布元素
let canvasElement;

// 記錄目前題目編號
let currentQuestion = 0;

// 記錄答對題數
let score = 0;

// 記錄是否已經作答
let hasAnswered = false;

// 記錄使用者選擇的選項
let selectedOption = -1;

// 儲存測驗容器
let quizContainer;

// 儲存標題元素
let titleElement;

// 儲存題號元素
let progressElement;

// 儲存題目元素
let questionElement;

// 儲存選項按鈕
let optionButtons = [];

// 儲存提示訊息元素
let messageElement;

// 儲存下一題按鈕
let nextButton;

// 儲存重新開始按鈕
let restartButton;

// 儲存結果標題元素
let resultTitleElement;

// 儲存結果分數元素
let resultScoreElement;

// 儲存結果提示元素
let resultMessageElement;

// 記錄題庫是否載入完成
let isDataLoaded = false;

// 記錄題庫載入錯誤訊息
let loadErrorMessage = "";

// 在程式開始前載入 Google 試算表 CSV
function preload() {
  // 讀取 Google 試算表發布的 CSV
  questionTable = loadTable(
    GOOGLE_SHEET_CSV_URL,
    "csv",
    "header",
    handleTableLoaded,
    handleTableError
  );
}

// Google 試算表載入成功後執行
function handleTableLoaded() {
  // 將資料表轉換成題庫陣列
  buildQuestionBank();

  // 設定題庫載入完成
  isDataLoaded = true;
}

// Google 試算表載入失敗後執行
function handleTableError(error) {
  // 設定載入錯誤訊息
  loadErrorMessage =
    "題庫載入失敗，請確認 Google 試算表網址與發布設定。";

  // 將錯誤訊息輸出到主控台
  console.error(error);
}

// 將 Google 試算表轉換成題庫
function buildQuestionBank() {
  // 清空原本的題庫
  questionBank = [];

  // 取得試算表資料列數
  const rowCount = questionTable.getRowCount();

  // 逐列讀取資料
  for (let i = 0; i < rowCount; i++) {
    // 讀取題目
    const question = questionTable.getString(i, "question");

    // 讀取第一個選項
    const optionA = questionTable.getString(i, "optionA");

    // 讀取第二個選項
    const optionB = questionTable.getString(i, "optionB");

    // 讀取第三個選項
    const optionC = questionTable.getString(i, "optionC");

    // 讀取第四個選項
    const optionD = questionTable.getString(i, "optionD");

    // 讀取正確答案索引
    const answerText = questionTable.getString(i, "answer");

    // 將答案轉換成數字
    const answer = Number(answerText);

    // 確認資料完整且答案介於 0 到 3
    if (
      question &&
      optionA &&
      optionB &&
      optionC &&
      optionD &&
      Number.isInteger(answer) &&
      answer >= 0 &&
      answer <= 3
    ) {
      // 將題目加入題庫
      questionBank.push({
        // 儲存題目文字
        question: question,

        // 儲存四個選項
        options: [
          optionA,
          optionB,
          optionC,
          optionD
        ],

        // 儲存正確答案
        answer: answer
      });
    }
  }
}

// 建立畫布與介面
function setup() {
  // 建立符合瀏覽器大小的畫布
  canvasElement = createCanvas(
    windowWidth,
    windowHeight
  );

  // 設定畫布固定定位
  canvasElement.style("position", "fixed");

  // 設定畫布左側位置
  canvasElement.style("left", "0");

  // 設定畫布上方位置
  canvasElement.style("top", "0");

  // 將畫布放到最底層
  canvasElement.style("z-index", "-1");

  // 建立測驗介面
  createQuizInterface();

  // 判斷題庫是否已載入
  if (isDataLoaded) {
    // 開始測驗
    startQuiz();
  } else {
    // 顯示載入中訊息
    showLoadingMessage();
  }
}

// 持續繪製背景
function draw() {
  // 設定畫布背景顏色
  background("#ffffff");

  // 判斷是否有載入錯誤
  if (loadErrorMessage !== "") {
    // 顯示錯誤訊息
    showErrorMessage();
  }

  // 確認題庫載入完成但尚未開始測驗
  if (
    isDataLoaded &&
    questions.length === 0 &&
    questionBank.length > 0
  ) {
    // 開始測驗
    startQuiz();
  }
}

// 建立測驗介面
function createQuizInterface() {
  // 建立測驗容器
  quizContainer = createDiv();

  // 設定測驗容器類別
  quizContainer.class("quiz-container");

  // 建立測驗標題
  titleElement = createElement("h1");

  // 將標題加入容器
  titleElement.parent(quizContainer);

  // 建立題號文字
  progressElement = createDiv();

  // 將題號加入容器
  progressElement.parent(quizContainer);

  // 建立題目文字
  questionElement = createDiv();

  // 將題目加入容器
  questionElement.parent(quizContainer);

  // 建立選項容器
  const optionsContainer = createDiv();

  // 設定選項容器類別
  optionsContainer.class("options-container");

  // 將選項容器加入測驗容器
  optionsContainer.parent(quizContainer);

  // 建立四個選項按鈕
  for (let i = 0; i < 4; i++) {
    // 建立選項按鈕
    const optionButton = createButton("");

    // 設定選項按鈕類別
    optionButton.class("option-button");

    // 將選項按鈕加入選項容器
    optionButton.parent(optionsContainer);

    // 設定選項點擊事件
    optionButton.mousePressed(() => {
      selectOption(i);
    });

    // 儲存選項按鈕
    optionButtons.push(optionButton);
  }

  // 建立提示訊息
  messageElement = createDiv();

  // 將提示訊息加入測驗容器
  messageElement.parent(quizContainer);

  // 建立下一題按鈕
  nextButton = createButton("下一題");

  // 設定下一題按鈕類別
  nextButton.class("control-button");

  // 將下一題按鈕加入測驗容器
  nextButton.parent(quizContainer);

  // 設定下一題按鈕事件
  nextButton.mousePressed(nextQuestion);

  // 建立結果標題
  resultTitleElement = createElement("h1");

  // 將結果標題加入容器
  resultTitleElement.parent(quizContainer);

  // 建立結果分數
  resultScoreElement = createDiv();

  // 將結果分數加入容器
  resultScoreElement.parent(quizContainer);

  // 建立結果提示
  resultMessageElement = createDiv();

  // 將結果提示加入容器
  resultMessageElement.parent(quizContainer);

  // 建立重新開始按鈕
  restartButton = createButton("重新開始");

  // 設定重新開始按鈕類別
  restartButton.class("control-button");

  // 將重新開始按鈕加入容器
  restartButton.parent(quizContainer);

  // 設定重新開始按鈕事件
  restartButton.mousePressed(restartQuiz);

  // 更新響應式版面
  updateResponsiveLayout();
}

// 開始測驗並隨機抽出五題
function startQuiz() {
  // 確認題庫至少有五題
  if (questionBank.length < QUIZ_LENGTH) {
    // 設定錯誤訊息
    loadErrorMessage =
      "題庫至少需要 " + QUIZ_LENGTH + " 題。";

    // 結束函式
    return;
  }

  // 複製題庫並隨機排序
  const shuffledQuestions = shuffle(
    questionBank.slice()
  );

  // 抽出五題不重複題目
  questions = shuffledQuestions.slice(
    0,
    QUIZ_LENGTH
  );

  // 重設目前題目
  currentQuestion = 0;

  // 重設分數
  score = 0;

  // 重設作答狀態
  hasAnswered = false;

  // 重設選項
  selectedOption = -1;

  // 更新測驗畫面
  updateQuizView();
}

// 顯示載入中訊息
function showLoadingMessage() {
  // 顯示測驗容器
  quizContainer.show();

  // 隱藏一般內容
  titleElement.hide();
  progressElement.hide();
  questionElement.hide();
  messageElement.hide();
  nextButton.hide();
  restartButton.hide();

  // 顯示載入文字
  resultTitleElement.show();

  // 設定載入文字
  setMixedText(
    resultTitleElement,
    "正在載入題庫，請稍候……"
  );

  // 隱藏其他結果元素
  resultScoreElement.hide();
  resultMessageElement.hide();
}

// 顯示錯誤訊息
function showErrorMessage() {
  // 顯示錯誤標題
  resultTitleElement.show();

  // 設定錯誤文字
  setMixedText(
    resultTitleElement,
    loadErrorMessage
  );

  // 隱藏其他結果元素
  resultScoreElement.hide();
  resultMessageElement.hide();
}

// 更新測驗畫面
function updateQuizView() {
  // 如果尚未抽出題目，不更新畫面
  if (questions.length === 0) {
    return;
  }

  // 如果完成所有題目，顯示結果
  if (currentQuestion >= questions.length) {
    // 顯示結果畫面
    showResult();

    // 結束函式
    return;
  }

  // 取得目前題目
  const questionData = questions[currentQuestion];

  // 顯示測驗元件
  titleElement.show();
  progressElement.show();
  questionElement.show();
  messageElement.show();

  // 顯示選項按鈕
  optionButtons.forEach((button) => {
    button.show();
  });

  // 隱藏結果元件
  resultTitleElement.hide();
  resultScoreElement.hide();
  resultMessageElement.hide();

  // 設定測驗標題
  setMixedText(
    titleElement,
    "p5.js 簡易指令測驗"
  );

  // 設定題號
  setMixedText(
    progressElement,
    "第 " +
      (currentQuestion + 1) +
      " 題／共 " +
      questions.length +
      " 題"
  );

  // 設定題目
  setMixedText(
    questionElement,
    questionData.question
  );

  // 更新四個選項
  for (let i = 0; i < optionButtons.length; i++) {
    // 設定選項文字
    setMixedText(
      optionButtons[i],
      String.fromCharCode(65 + i) +
        ". " +
        questionData.options[i]
    );

    // 設定選項背景顏色
    optionButtons[i].style(
      "background-color",
      "#e9ecef"
    );

    // 設定選項文字顏色
    optionButtons[i].style(
      "color",
      "#212529"
    );

    // 啟用選項按鈕
    optionButtons[i].removeAttribute("disabled");
  }

  // 清除訊息
  messageElement.html("");

  // 隱藏下一題按鈕
  nextButton.hide();

  // 隱藏重新開始按鈕
  restartButton.hide();

  // 更新響應式版面
  updateResponsiveLayout();
}

// 選擇選項
function selectOption(index) {
  // 如果已經作答，不允許重複選擇
  if (hasAnswered) {
    return;
  }

  // 取得目前題目
  const questionData = questions[currentQuestion];

  // 記錄選項
  selectedOption = index;

  // 設定已作答
  hasAnswered = true;

  // 判斷是否答對
  const isCorrect =
    index === questionData.answer;

  // 答對時增加分數
  if (isCorrect) {
    score++;
  }

  // 停用所有選項
  optionButtons.forEach((button) => {
    button.attribute("disabled", "");
  });

  // 判斷作答結果
  if (isCorrect) {
    // 設定答對選項背景
    optionButtons[index].style(
      "background-color",
      "#caffbf"
    );

    // 顯示答對訊息
    setMixedText(
      messageElement,
      "答對了！"
    );
  } else {
    // 設定答錯選項背景
    optionButtons[index].style(
      "background-color",
      "#ffadad"
    );

    // 設定正確答案背景
    optionButtons[questionData.answer].style(
      "background-color",
      "#fefae0"
    );

    // 顯示答錯訊息
    setMixedText(
      messageElement,
      "答錯了！正確答案已標示為 #fefae0。"
    );
  }

  // 顯示下一題按鈕
  nextButton.show();
}

// 前往下一題
function nextQuestion() {
  // 如果尚未作答，不進入下一題
  if (!hasAnswered) {
    return;
  }

  // 題目編號加一
  currentQuestion++;

  // 重設作答狀態
  hasAnswered = false;

  // 重設選項
  selectedOption = -1;

  // 更新畫面
  updateQuizView();
}

// 重新開始並重新抽題
function restartQuiz() {
  // 從完整題庫重新抽出五題
  startQuiz();
}

// 顯示測驗結果
function showResult() {
  // 隱藏一般測驗內容
  titleElement.hide();
  progressElement.hide();
  questionElement.hide();
  messageElement.hide();

  // 隱藏全部選項
  optionButtons.forEach((button) => {
    button.hide();
  });

  // 隱藏下一題按鈕
  nextButton.hide();

  // 顯示結果內容
  resultTitleElement.show();
  resultScoreElement.show();
  resultMessageElement.show();

  // 設定結果標題
  setMixedText(
    resultTitleElement,
    "測驗完成！"
  );

  // 設定結果分數
  setMixedText(
    resultScoreElement,
    "你答對了 " +
      score +
      "／" +
      questions.length +
      " 題"
  );

  // 設定結果提示
  setMixedText(
    resultMessageElement,
    "點選下方按鈕重新抽題！"
  );

  // 顯示重新開始按鈕
  restartButton.show();

  // 更新響應式版面
  updateResponsiveLayout();
}

// 將混合文字分成不同字型
function setMixedText(element, content) {
  // 清空原本文字
  element.html("");

  // 建立文字暫存
  let buffer = "";

  // 記錄目前是否為英文數字模式
  let latinMode = false;

  // 逐字處理內容
  for (let i = 0; i < content.length; i++) {
    // 取得目前字元
    const character = content[i];

    // 判斷是否為英文或數字
    const currentLatinMode =
      /[A-Za-z0-9]/.test(character);

    // 判斷字型模式是否改變
    if (
      i > 0 &&
      currentLatinMode !== latinMode
    ) {
      // 建立目前文字片段
      appendTextSpan(
        element,
        buffer,
        latinMode
      );

      // 清空文字暫存
      buffer = "";
    }

    // 將字元加入文字暫存
    buffer += character;

    // 更新字型模式
    latinMode = currentLatinMode;
  }

  // 建立最後文字片段
  if (buffer.length > 0) {
    appendTextSpan(
      element,
      buffer,
      latinMode
    );
  }
}

// 建立指定字型文字片段
function appendTextSpan(
  parentElement,
  content,
  useLatinFont
) {
  // 建立 span 元素
  const span = document.createElement("span");

  // 設定文字內容
  span.textContent = content;

  // 設定字型類別
  span.className = useLatinFont
    ? "latin-text"
    : "chinese-text";

  // 將文字片段加入父元素
  parentElement.elt.appendChild(span);
}

// 更新響應式版面
function updateResponsiveLayout() {
  // 確認測驗容器已建立
  if (!quizContainer) {
    return;
  }

  // 設定測驗容器寬度
  quizContainer.style(
    "width",
    "min(90vw, 760px)"
  );

  // 設定測驗容器最大高度
  quizContainer.style(
    "max-height",
    "92vh"
  );

  // 設定測驗容器內距
  quizContainer.style(
    "padding",
    "clamp(16px, 4vw, 40px)"
  );

  // 設定標題文字大小
  titleElement.style(
    "font-size",
    "clamp(24px, 5vw, 42px)"
  );

  // 設定題號文字大小
  progressElement.style(
    "font-size",
    "clamp(16px, 3vw, 22px)"
  );

  // 設定題目文字大小
  questionElement.style(
    "font-size",
    "clamp(18px, 3.8vw, 30px)"
  );

  // 設定題目行高
  questionElement.style(
    "line-height",
    "1.5"
  );

  // 設定選項文字大小
  optionButtons.forEach((button) => {
    // 設定選項文字大小
    button.style(
      "font-size",
      "clamp(16px, 3vw, 23px)"
    );

    // 設定選項最小高度
    button.style(
      "min-height",
      "clamp(48px, 7vh, 68px)"
    );
  });

  // 設定提示文字大小
  messageElement.style(
    "font-size",
    "clamp(15px, 2.8vw, 20px)"
  );

  // 設定結果標題大小
  resultTitleElement.style(
    "font-size",
    "clamp(28px, 7vw, 48px)"
  );

  // 設定結果分數大小
  resultScoreElement.style(
    "font-size",
    "clamp(22px, 5vw, 36px)"
  );

  // 設定結果提示大小
  resultMessageElement.style(
    "font-size",
    "clamp(16px, 3vw, 24px)"
  );
}

// 當視窗大小改變時執行
function windowResized() {
  // 重新調整畫布大小
  resizeCanvas(windowWidth, windowHeight);

  // 更新響應式版面
  updateResponsiveLayout();
}