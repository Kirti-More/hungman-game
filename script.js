let gameWords = {}; // Will be loaded from words.json

// Game state
let currentGame = {
    word: '',
    hint: '',
    category: '',
    guessedLetters: [],
    incorrectGuesses: 0,
    lives: 6,
    score: 0,
    timeLeft: 60,
    gameActive: false,
    difficulty: 'easy',
    hintsUsed: 0
};

let gameTimer;
const hangmanParts = ['head', 'body', 'leftArm', 'rightArm', 'leftLeg', 'rightLeg'];

// DOM elements
const difficultySelect = document.getElementById('difficulty');
const themeToggle = document.getElementById('themeToggle');
const livesCount = document.getElementById('livesCount');
const timer = document.getElementById('timer');
const timerProgress = document.getElementById('timerProgress');
const scoreCount = document.getElementById('scoreCount');
const hintText = document.getElementById('hintText');
const categoryText = document.getElementById('categoryText');
const wordDisplay = document.getElementById('wordDisplay');
const alphabet = document.getElementById('alphabet');
const newGameBtn = document.getElementById('newGameBtn');
const hintBtn = document.getElementById('hintBtn');
const gameOverModal = document.getElementById('gameOverModal');
const gameOverTitle = document.getElementById('gameOverTitle');
const gameOverMessage = document.getElementById('gameOverMessage');
const correctWord = document.getElementById('correctWord');
const playAgainBtn = document.getElementById('playAgainBtn');

// Load words from external JSON file
function loadWords() {
    return fetch('words.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load words.json');
            }
            return response.json();
        })
        .then(data => {
            gameWords = data;
        })
        .catch(error => {
            console.error('Error loading word list:', error);
            alert("Could not load words. Please try again later.");
        });
}

// Initialize game
function initGame() {
    createAlphabet();
    setupEventListeners();
    startNewGame();
}

// Create alphabet buttons
function createAlphabet() {
    alphabet.innerHTML = '';
    for (let i = 65; i <= 90; i++) {
        const letter = String.fromCharCode(i);
        const btn = document.createElement('button');
        btn.className = 'letter-btn';
        btn.textContent = letter;
        btn.onclick = () => guessLetter(letter);
        alphabet.appendChild(btn);
    }
}

// Setup event listeners
function setupEventListeners() {
    newGameBtn.onclick = startNewGame;
    hintBtn.onclick = useExtraHint;
    playAgainBtn.onclick = () => {
        gameOverModal.style.display = 'none';
        startNewGame();
    };

    difficultySelect.onchange = (e) => {
        currentGame.difficulty = e.target.value;
        startNewGame();
    };

    themeToggle.onclick = toggleTheme;

    document.addEventListener('keydown', (e) => {
        if (currentGame.gameActive && e.key.match(/[a-z]/i)) {
            guessLetter(e.key.toUpperCase());
        }
    });
}

// Start new game
function startNewGame() {
    currentGame.guessedLetters = [];
    currentGame.incorrectGuesses = 0;
    currentGame.lives = 6;
    currentGame.timeLeft = getDifficultyTime();
    currentGame.gameActive = true;
    currentGame.hintsUsed = 0;

    const words = gameWords[currentGame.difficulty];
    const randomWord = words[Math.floor(Math.random() * words.length)];
    currentGame.word = randomWord.word;
    currentGame.hint = randomWord.hint;
    currentGame.category = randomWord.category;

    updateDisplay();
    resetAlphabet();
    resetHangman();
    startTimer();

    document.querySelector('.game-container').classList.add('fade-in');
    setTimeout(() => {
        document.querySelector('.game-container').classList.remove('fade-in');
    }, 500);
}

function getDifficultyTime() {
    switch (currentGame.difficulty) {
        case 'easy': return 60;
        case 'medium': return 60;
        case 'hard': return 60;
        default: return 60;
    }
}

function updateDisplay() {
    const displayWord = currentGame.word
        .split('')
        .map(letter => currentGame.guessedLetters.includes(letter) ? letter : '_')
        .join(' ');
    wordDisplay.textContent = displayWord;

    livesCount.textContent = currentGame.lives;
    scoreCount.textContent = currentGame.score;
    hintText.textContent = currentGame.hint;
    categoryText.textContent = currentGame.category;

    if (!displayWord.includes('_')) {
        winGame();
    }
}

function guessLetter(letter) {
    if (!currentGame.gameActive || currentGame.guessedLetters.includes(letter)) {
        return;
    }

    currentGame.guessedLetters.push(letter);
    const btn = [...alphabet.children].find(b => b.textContent === letter);

    if (currentGame.word.includes(letter)) {
        btn.classList.add('correct', 'bounce');
        currentGame.score += 10;
    } else {
        btn.classList.add('incorrect');
        currentGame.incorrectGuesses++;
        currentGame.lives--;
        showHangmanPart();
        if (currentGame.lives <= 0) {
            loseGame();
            return;
        }
    }

    btn.disabled = true;
    updateDisplay();
}

function showHangmanPart() {
    if (currentGame.incorrectGuesses <= hangmanParts.length) {
        const part = document.getElementById(hangmanParts[currentGame.incorrectGuesses - 1]);
        if (part) {
            part.style.opacity = '1';
            part.style.transition = 'opacity 0.5s ease';
        }
    }
}

function resetHangman() {
    hangmanParts.forEach(partId => {
        const part = document.getElementById(partId);
        if (part) {
            part.style.opacity = '0';
        }
    });
}

function resetAlphabet() {
    [...alphabet.children].forEach(btn => {
        btn.disabled = false;
        btn.classList.remove('correct', 'incorrect', 'bounce');
    });
}

function startTimer() {
    clearInterval(gameTimer);
    const totalTime = getDifficultyTime();

    gameTimer = setInterval(() => {
        currentGame.timeLeft--;
        timer.textContent = currentGame.timeLeft;

        const percentage = (currentGame.timeLeft / totalTime) * 100;
        timerProgress.style.width = `${percentage}%`;

        if (currentGame.timeLeft <= 0) {
            clearInterval(gameTimer);
            loseGame();
        }
    }, 1000);
}

function useExtraHint() {
    if (!currentGame.gameActive || currentGame.hintsUsed >= 2) {
        return;
    }

    currentGame.hintsUsed++;
    currentGame.score = Math.max(0, currentGame.score - 20);

    const unguessedLetters = currentGame.word
        .split('')
        .filter(letter => !currentGame.guessedLetters.includes(letter));

    if (unguessedLetters.length > 0) {
        const randomLetter = unguessedLetters[Math.floor(Math.random() * unguessedLetters.length)];
        guessLetter(randomLetter);
    }

    if (currentGame.hintsUsed >= 5) {
        hintBtn.disabled = true;
        hintBtn.textContent = '💡 No more hints';
    }
}

function winGame() {
    currentGame.gameActive = false;
    clearInterval(gameTimer);
    currentGame.score += currentGame.timeLeft * 2;
    currentGame.score += currentGame.lives * 50;
    scoreCount.textContent = currentGame.score;

    gameOverTitle.textContent = '🎉 You Won!';
    gameOverMessage.textContent = `Congratulations! You guessed the word!`;
    correctWord.textContent = `The word was: ${currentGame.word}`;
    gameOverModal.style.display = 'flex';
}

function loseGame() {
    currentGame.gameActive = false;
    clearInterval(gameTimer);
    gameOverTitle.textContent = '💀 Game Over!';
    gameOverMessage.textContent = 'Better luck next time!';
    correctWord.textContent = `The word was: ${currentGame.word}`;
    gameOverModal.style.display = 'flex';
}

function toggleTheme() {
    document.body.classList.toggle('dark');
    const isDark = document.body.classList.contains('dark');
    themeToggle.textContent = isDark ? '☀️ Light Mode' : '🌙 Dark Mode';
}

// Load words and initialize the game
window.onload = () => {
    loadWords().then(() => {
        initGame();
    });
};
