document.addEventListener("DOMContentLoaded", () => {
    console.log("JavaScript Loaded");

    const startButton = document.getElementById("start-btn");
    const replayButton = document.getElementById("replay-btn");
    const highScoreDisplay = document.getElementById("high-score");
    const levelIndicator = document.getElementById("level-indicator");

    const pads = {
        Q: "pad-red",
        W: "pad-yellow",
        A: "pad-green",
        S: "pad-blue"
    };

    const padElements = Object.values(pads).map(id => document.getElementById(id));

    let sequence = [];
    let userSequence = [];
    let level = 1;
    let highScore = 0;

    const apiUrl = "http://localhost:3000/api/v1/game-state";

    const resetGame = async () => {
        console.log("Resetting game...");
        await fetch(apiUrl, { method: "PUT" });
        level = 1;
        sequence = [];
        userSequence = [];
        updateLevelDisplay();
        updateButtons(true, false);
        fetchHighScore();
    };

    const fetchHighScore = async () => {
        try {
            const response = await fetch(apiUrl);
            const data = await response.json();
            highScore = data.highScore || 0;
            updateHighScoreDisplay();
        } catch (error) {
            console.error("Error fetching high score:", error);
        }
    };

    const updateLevelDisplay = () => {
        levelIndicator.innerText = level;
    };

    const updateHighScoreDisplay = () => {
        highScoreDisplay.innerText = `High Score: ${highScore}`;
    };

    const playSequence = async () => {
        updateButtons(false, false);
        console.log("Playing sequence:", sequence);

        for (const pad of sequence) {
            await new Promise(resolve => setTimeout(() => {
                flashPad(pad);
                resolve();
            }, 600));
        }

        updateButtons(false, true);
    };

    const flashPad = pad => {
        const element = document.getElementById(pad);
        if (element) {
            element.classList.add("active");
            setTimeout(() => element.classList.remove("active"), 300);
        }
    };

    const handleUserInput = input => {
        console.log("User pressed:", input);
        userSequence.push(input);
        flashPad(input);

        if (userSequence.length === sequence.length) {
            validateSequence();
        }
    };

    const validateSequence = async () => {
        console.log("Validating sequence:", userSequence);
        if (JSON.stringify(userSequence) === JSON.stringify(sequence)) {
            console.log("Correct sequence!");
            level++;
            updateLevelDisplay();
            if (level > highScore) {
                highScore = level;
                updateHighScoreDisplay();
                await saveHighScore();
            }
            userSequence = [];
            addNewPadToSequence();
            playSequence();
        } else {
            alert("Incorrect sequence. Try again!");
            resetGame();
        }
    };

    const saveHighScore = async () => {
        try {
            await fetch(apiUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ highScore })
            });
        } catch (error) {
            console.error("Error saving high score:", error);
        }
    };

    const addNewPadToSequence = () => {
        const newPad = Object.values(pads)[Math.floor(Math.random() * 4)];
        sequence.push(newPad);
        console.log("New pad added:", newPad);
    };

    const updateButtons = (startEnabled, replayEnabled) => {
        startButton.disabled = !startEnabled;
        replayButton.disabled = !replayEnabled;
    };

    startButton.addEventListener("click", async () => {
        console.log("Game started");
        updateButtons(false, false);
        sequence = [];
        level = 1;
        updateLevelDisplay();
        addNewPadToSequence();
        await playSequence();
    });

    replayButton.addEventListener("click", playSequence);

    document.addEventListener("keydown", event => {
        const key = event.key.toUpperCase();
        if (pads[key]) {
            handleUserInput(pads[key]);
        }
    });

    padElements.forEach(pad => {
        if (pad) {
            pad.addEventListener("click", () => handleUserInput(pad.id));
        }
    });

    resetGame();
});
