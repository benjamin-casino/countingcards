// Constants
const SPEED_MIN = 100;
const SPEED_MAX = 5000;
const NUMBER_MIN = 5;
const NUMBER_MAX = 52;

// Card counting strategies
const STRATEGIES = {
    'Hi-Lo': {
        "2": 1,
        "3": 1,
        "4": 1,
        "5": 1,
        "6": 1,
        "7": 0,
        "8": 0,
        "9": 0,
        "0": -1,
        "J": -1,
        "Q": -1,
        "K": -1,
        "A": -1
    },
    'Zen Count': {
        "2": 1,
        "3": 1,
        "4": 2,
        "5": 2,
        "6": 2,
        "7": 1,
        "8": 0,
        "9": 0,
        "0": -2,
        "J": -2,
        "Q": -2,
        "K": -2,
        "A": -1
    }
};

// Strategy descriptions for help modal
const STRATEGY_DESCRIPTIONS = {
    'Hi-Lo': "The most popular and easy-to-learn counting system. Cards 2-6 are counted as +1, 7-9 as 0, and 10s through Aces as -1.",
    'Zen Count': "A balanced system that assigns +2 to small cards (4-6) and -2 to face cards (10-K)."
};

// Game variables
let gameTimer;
let finalCounting = 0;
let paused = false;
let deckId;
let cards = [];
let strategy;
let isPaused = false;

document.addEventListener('DOMContentLoaded', () => {
    // Set up form input constraints
    const speedInput = document.getElementById('speed');
    const speedRangeInput = document.getElementById('speedRange');
    const numberInput = document.getElementById('number');
    const strategySelect = document.getElementById('strategy');
    
    // Set initial values and min/max
    speedInput.min = SPEED_MIN;
    speedInput.max = SPEED_MAX;
    speedRangeInput.min = SPEED_MIN;
    speedRangeInput.max = SPEED_MAX;
    
    numberInput.min = NUMBER_MIN;
    numberInput.max = NUMBER_MAX;
    numberInput.value = 20; // Default sensible value
    
    // Sync range and number inputs
    speedRangeInput.addEventListener('input', () => {
        speedInput.value = speedRangeInput.value;
    });
    
    speedInput.addEventListener('input', () => {
        speedRangeInput.value = speedInput.value;
    });
    
    // Start form submission handler
    const startForm = document.getElementById('startForm');
    startForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const speed = parseInt(speedInput.value);
        const number = parseInt(numberInput.value);
        const countingMethod = strategySelect.value;
        
        if (!speed || !number || !countingMethod || 
            speed < SPEED_MIN || speed > SPEED_MAX || 
            number < NUMBER_MIN || number > NUMBER_MAX || 
            !STRATEGIES[countingMethod]) {
            showMessage("Please enter valid parameters", "error");
            return;
        }
        
        startGame(speed, number, countingMethod);
    });
    
    // Pause button handler
    const pauseBtn = document.getElementById('pauseBtn');
    pauseBtn.addEventListener('click', () => {
        if (isPaused) {
            resumeGame();
            pauseBtn.textContent = "Pause";
        } else {
            pauseGame();
            pauseBtn.textContent = "Resume";
        }
        isPaused = !isPaused;
    });
    
    // Reset button handler
    const resetBtn = document.getElementById('resetBtn');
    resetBtn.addEventListener('click', () => {
        showStartForm();
    });
    
    // Result form submission
    const resultForm = document.getElementById('result');
    resultForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const userCount = parseFloat(document.getElementById('finalCount').value);
        const resultMessage = document.getElementById('resultMessage');
        
        if (userCount === finalCounting) {
            resultMessage.textContent = "Congratulations! Your count is correct!";
            resultMessage.className = "result-message result-success";
        } else {
            resultMessage.textContent = `Incorrect. The actual count was ${finalCounting}.`;
            resultMessage.className = "result-message result-error";
        }
    });
    
    // Play again button
    document.getElementById('playAgainBtn').addEventListener('click', showStartForm);
    
    // Parse URL parameters if any
    checkUrlParams();
});

// Check for URL parameters to auto-start game
function checkUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    
    const speed = parseInt(urlParams.get('speed'));
    const number = parseInt(urlParams.get('number'));
    const strategy = urlParams.get('strategy');
    
    if (speed && number && strategy) {
        if (speed < SPEED_MIN || speed > SPEED_MAX || 
            number < NUMBER_MIN || number > NUMBER_MAX || 
            !STRATEGIES[strategy]) {
            showMessage("Invalid URL parameters", "error");
        } else {
            document.getElementById('speed').value = speed;
            document.getElementById('speedRange').value = speed;
            document.getElementById('number').value = number;
            document.getElementById('strategy').value = strategy;
            startGame(speed, number, strategy);
        }
    }
}

// Start the game
async function startGame(speed, numberOfCards, strategyName) {
    // Reset game variables
    finalCounting = 0;
    isPaused = false;
    strategy = strategyName;
    
    // Hide start form, show game container
    document.getElementById('startForm').style.display = "none";
    document.getElementById('result').style.display = "none";
    
    const gameContainer = document.getElementById('game');
    gameContainer.style.display = "flex";
    
    // Update display elements
    document.getElementById('speedLabel').textContent = speed;
    document.getElementById('currentStrategy').textContent = strategyName;
    
    try {
        // Fetch deck and cards from API
        const response = await fetch(`https://www.deckofcardsapi.com/api/deck/new/shuffle/`);
        const deckData = await response.json();
        deckId = deckData.deck_id;
        
        const drawResponse = await fetch(`https://www.deckofcardsapi.com/api/deck/${deckId}/draw/?count=${numberOfCards}`);
        const drawData = await drawResponse.json();
        cards = drawData.cards;
        
        // Update cards left display
        document.getElementById('cardsLeft').textContent = cards.length;
        
        // Start countdown
        startCountdown();
    } catch (error) {
        showMessage("Error fetching cards. Please try again.", "error");
        showStartForm();
    }
}

// Start countdown before showing cards
function startCountdown() {
    const countDownContainer = document.getElementById('countDown');
    const cardContainer = document.getElementById('cardContainer');
    const pauseBtn = document.getElementById('pauseBtn');
    
    let countDown = 3;
    
    // Reset display
    countDownContainer.style.display = "block";
    cardContainer.style.display = "none";
    pauseBtn.disabled = true;
    
    // Countdown function
    const count = () => {
        countDownContainer.textContent = countDown;
        
        if (countDown > 0) {
            countDown--;
            setTimeout(count, 1000);
        } else {
            countDownContainer.textContent = "Go!";
            
            setTimeout(() => {
                countDownContainer.style.display = "none";
                cardContainer.style.display = "block";
                pauseBtn.disabled = false;
                showCards();
            }, 800);
        }
    };
    
    count();
}

// Display cards one by one
function showCards() {
    if (cards.length > 0 && !isPaused) {
        const currentCard = cards.pop();
        const cardValue = currentCard.value === "10" ? "0" : currentCard.value.charAt(0);
        const strategyValues = STRATEGIES[strategy];
        
        // Special case for Red 7 strategy
        let cardCount = strategyValues[cardValue];
        if (strategy === 'Red 7' && cardValue === "7") {
            // Check if it's a red 7 (hearts or diamonds)
            if (currentCard.suit === "HEARTS" || currentCard.suit === "DIAMONDS") {
                cardCount = 1; // Red 7s count as +1
            } else {
                cardCount = 0; // Black 7s count as 0
            }
        }
        
        // Update running count
        finalCounting += cardCount;
        
        // Display card
        const cardContainer = document.getElementById('cardContainer');
        cardContainer.src = currentCard.image;
        cardContainer.alt = `${currentCard.value} of ${currentCard.suit}`;
        
        // Update cards left
        document.getElementById('cardsLeft').textContent = cards.length;
        
        // Schedule next card or show result
        if (cards.length > 0) {
            gameTimer = setTimeout(showCards, parseInt(document.getElementById('speed').value));
        } else {
            setTimeout(showResult, 1000);
        }
    }
}

// Pause the game
function pauseGame() {
    clearTimeout(gameTimer);
    isPaused = true;
}

// Resume the game
function resumeGame() {
    isPaused = false;
    showCards();
}

// Show result form
function showResult() {
    document.getElementById('game').style.display = "none";
    
    const resultForm = document.getElementById('result');
    resultForm.style.display = "block";
    
    // Clear previous result message
    document.getElementById('resultMessage').textContent = "";
    document.getElementById('resultMessage').className = "result-message";
    
    // Clear input
    document.getElementById('finalCount').value = "";
    document.getElementById('finalCount').focus();
}

// Show start form
function showStartForm() {
    document.getElementById('game').style.display = "none";
    document.getElementById('result').style.display = "none";
    document.getElementById('startForm').style.display = "block";
    
    // Reset game variables
    clearTimeout(gameTimer);
    cards = [];
    finalCounting = 0;
    isPaused = false;
}

// Show message
function showMessage(message, type) {
    alert(message);
}

// Close the window when ESC key is pressed (for modal)
window.addEventListener('keydown', (e) => {
    if (e.key === "Escape") {
        closeModal();
    }
});