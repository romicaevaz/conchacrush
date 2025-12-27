// Concha Crush Game
const GRID_SIZE = 8;
const CONCHA_TYPES = ['green', 'orange', 'pink', 'purple', 'yellow'];
const MATCH_MIN = 3;

class ConchaCrush {
    constructor() {
        this.grid = [];
        this.score = 0;
        this.moves = 30;
        this.selectedConcha = null;
        this.isSwapping = false;
        this.gameOver = false;

        this.boardElement = document.getElementById('game-board');
        this.scoreElement = document.getElementById('score');
        this.movesElement = document.getElementById('moves');
        this.modalElement = document.getElementById('game-over-modal');
        this.finalScoreElement = document.getElementById('final-score');

        document.getElementById('new-game-btn').addEventListener('click', () => this.newGame());
        document.getElementById('play-again-btn').addEventListener('click', () => this.newGame());

        this.initGame();
    }

    initGame() {
        this.grid = [];
        this.score = 0;
        this.moves = 30;
        this.gameOver = false;
        this.selectedConcha = null;
        this.updateUI();
        this.createBoard();
        this.hideModal();
    }

    createBoard() {
        this.boardElement.innerHTML = '';
        this.boardElement.style.gridTemplateColumns = `repeat(${GRID_SIZE}, 1fr)`;

        // Create initial grid without matches
        for (let row = 0; row < GRID_SIZE; row++) {
            this.grid[row] = [];
            for (let col = 0; col < GRID_SIZE; col++) {
                const type = this.getRandomConchaType(row, col);
                this.grid[row][col] = { type, element: null };
            }
        }

        // Create DOM elements
        for (let row = 0; row < GRID_SIZE; row++) {
            for (let col = 0; col < GRID_SIZE; col++) {
                const concha = this.createConchaElement(row, col);
                this.grid[row][col].element = concha;
                this.boardElement.appendChild(concha);
            }
        }
    }

    getRandomConchaType(row, col) {
        let attempts = 0;
        let type;

        do {
            type = CONCHA_TYPES[Math.floor(Math.random() * CONCHA_TYPES.length)];
            attempts++;
        } while (this.wouldCreateMatch(row, col, type) && attempts < 10);

        return type;
    }

    wouldCreateMatch(row, col, type) {
        // Check horizontal
        let horizontalCount = 1;
        if (col > 0 && this.grid[row][col - 1]?.type === type) horizontalCount++;
        if (col > 1 && this.grid[row][col - 2]?.type === type) horizontalCount++;
        if (horizontalCount >= MATCH_MIN) return true;

        // Check vertical
        let verticalCount = 1;
        if (row > 0 && this.grid[row - 1]?.[col]?.type === type) verticalCount++;
        if (row > 1 && this.grid[row - 2]?.[col]?.type === type) verticalCount++;
        if (verticalCount >= MATCH_MIN) return true;

        return false;
    }

    createConchaElement(row, col) {
        const concha = document.createElement('div');
        concha.className = 'concha';
        concha.dataset.row = row;
        concha.dataset.col = col;

        const img = document.createElement('img');
        img.src = `${this.grid[row][col].type}Concha.png`;
        img.alt = `${this.grid[row][col].type} concha`;
        img.draggable = false;

        concha.appendChild(img);
        concha.addEventListener('click', () => this.handleConchaClick(row, col));

        return concha;
    }

    handleConchaClick(row, col) {
        if (this.isSwapping || this.gameOver) return;

        const clickedConcha = { row, col };

        if (!this.selectedConcha) {
            // First selection
            this.selectedConcha = clickedConcha;
            this.grid[row][col].element.classList.add('selected');
        } else {
            // Second selection
            const isAdjacent = this.areAdjacent(this.selectedConcha, clickedConcha);

            this.grid[this.selectedConcha.row][this.selectedConcha.col].element.classList.remove('selected');

            if (isAdjacent) {
                this.swapConchas(this.selectedConcha, clickedConcha);
            }

            this.selectedConcha = null;
        }
    }

    areAdjacent(concha1, concha2) {
        const rowDiff = Math.abs(concha1.row - concha2.row);
        const colDiff = Math.abs(concha1.col - concha2.col);
        return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
    }

    async swapConchas(concha1, concha2) {
        this.isSwapping = true;

        // Swap in grid
        const temp = this.grid[concha1.row][concha1.col].type;
        this.grid[concha1.row][concha1.col].type = this.grid[concha2.row][concha2.col].type;
        this.grid[concha2.row][concha2.col].type = temp;

        // Update images
        this.updateConchaImage(concha1.row, concha1.col);
        this.updateConchaImage(concha2.row, concha2.col);

        // Add swap animation
        this.grid[concha1.row][concha1.col].element.classList.add('swapping');
        this.grid[concha2.row][concha2.col].element.classList.add('swapping');

        await this.wait(300);

        this.grid[concha1.row][concha1.col].element.classList.remove('swapping');
        this.grid[concha2.row][concha2.col].element.classList.remove('swapping');

        // Check for matches
        const matches = this.findAllMatches();

        if (matches.length === 0) {
            // No matches, swap back
            const temp = this.grid[concha1.row][concha1.col].type;
            this.grid[concha1.row][concha1.col].type = this.grid[concha2.row][concha2.col].type;
            this.grid[concha2.row][concha2.col].type = temp;

            this.updateConchaImage(concha1.row, concha1.col);
            this.updateConchaImage(concha2.row, concha2.col);
        } else {
            // Valid move
            this.moves--;
            this.updateUI();
            await this.processMatches();

            if (this.moves <= 0) {
                this.endGame();
            }
        }

        this.isSwapping = false;
    }

    updateConchaImage(row, col) {
        const img = this.grid[row][col].element.querySelector('img');
        img.src = `${this.grid[row][col].type}Concha.png`;
        img.alt = `${this.grid[row][col].type} concha`;
    }

    findAllMatches() {
        const matches = new Set();

        // Find horizontal matches
        for (let row = 0; row < GRID_SIZE; row++) {
            for (let col = 0; col < GRID_SIZE - 2; col++) {
                const type = this.grid[row][col].type;
                if (type === this.grid[row][col + 1].type &&
                    type === this.grid[row][col + 2].type) {
                    matches.add(`${row},${col}`);
                    matches.add(`${row},${col + 1}`);
                    matches.add(`${row},${col + 2}`);
                }
            }
        }

        // Find vertical matches
        for (let col = 0; col < GRID_SIZE; col++) {
            for (let row = 0; row < GRID_SIZE - 2; row++) {
                const type = this.grid[row][col].type;
                if (type === this.grid[row + 1][col].type &&
                    type === this.grid[row + 2][col].type) {
                    matches.add(`${row},${col}`);
                    matches.add(`${row + 1},${col}`);
                    matches.add(`${row + 2},${col}`);
                }
            }
        }

        return Array.from(matches).map(coord => {
            const [row, col] = coord.split(',').map(Number);
            return { row, col };
        });
    }

    async processMatches() {
        let matches = this.findAllMatches();

        while (matches.length > 0) {
            // Mark matched conchas
            matches.forEach(({ row, col }) => {
                this.grid[row][col].element.classList.add('matched');
            });

            await this.wait(400);

            // Update score
            this.score += matches.length * 10;
            this.updateUI();

            // Remove matched conchas
            matches.forEach(({ row, col }) => {
                this.grid[row][col].type = null;
                this.grid[row][col].element.classList.remove('matched');
                this.grid[row][col].element.style.opacity = '0';
            });

            await this.wait(200);

            // Drop conchas
            await this.dropConchas();

            // Fill empty spaces
            await this.fillBoard();

            // Check for new matches
            matches = this.findAllMatches();
        }
    }

    async dropConchas() {
        for (let col = 0; col < GRID_SIZE; col++) {
            let emptyRow = GRID_SIZE - 1;

            for (let row = GRID_SIZE - 1; row >= 0; row--) {
                if (this.grid[row][col].type !== null) {
                    if (row !== emptyRow) {
                        // Move concha down
                        this.grid[emptyRow][col].type = this.grid[row][col].type;
                        this.updateConchaImage(emptyRow, col);
                        this.grid[emptyRow][col].element.style.opacity = '1';

                        this.grid[row][col].type = null;
                        this.grid[row][col].element.style.opacity = '0';
                    } else {
                        this.grid[row][col].element.style.opacity = '1';
                    }
                    emptyRow--;
                }
            }
        }

        await this.wait(300);
    }

    async fillBoard() {
        for (let row = 0; row < GRID_SIZE; row++) {
            for (let col = 0; col < GRID_SIZE; col++) {
                if (this.grid[row][col].type === null) {
                    this.grid[row][col].type = CONCHA_TYPES[Math.floor(Math.random() * CONCHA_TYPES.length)];
                    this.updateConchaImage(row, col);
                    this.grid[row][col].element.style.opacity = '1';
                }
            }
        }

        await this.wait(300);
    }

    updateUI() {
        this.scoreElement.textContent = this.score;
        this.movesElement.textContent = this.moves;
    }

    endGame() {
        this.gameOver = true;
        this.finalScoreElement.textContent = this.score;
        this.showModal();
    }

    showModal() {
        this.modalElement.classList.remove('hidden');
    }

    hideModal() {
        this.modalElement.classList.add('hidden');
    }

    newGame() {
        this.initGame();
    }

    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Start the game when the page loads
window.addEventListener('DOMContentLoaded', () => {
    new ConchaCrush();
});
