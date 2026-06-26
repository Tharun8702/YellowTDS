let initUIfunc = function () {
    if (this.initialized) return;
    const countdown = document.getElementById('countdown');
    const statusBar = document.getElementById('statusBar');
    const timeoutDisplay = document.getElementById('timeoutDisplay');
    const progressFill = document.getElementById('progressFill');
    const interactivePrompt = document.getElementById('interactive-prompt');

    let countdownInterval;

    function hasInteractiveTests() {
        const interactive = ['pointerdown', 'keydown'];
        return window.botDetector && window.botDetector.selectedTests &&
            window.botDetector.selectedTests.some(t => interactive.includes(t));
    }

    function isWaitingForInteraction() {
        return window.botDetector && hasInteractiveTests();
    }

    function initializeUI() {
        if (!window.botDetector || !window.botDetector.selectedTests) {
            setTimeout(initializeUI, 100);
            return;
        }

        const waitsForInteraction = isWaitingForInteraction();
        const timeoutSecs = Math.floor((window.botDetector.timeout || 5000) / 1000);
        if (timeoutDisplay) {
            timeoutDisplay.textContent = timeoutSecs;
            if (waitsForInteraction) {
                timeoutDisplay.parentElement.textContent = 'Click anywhere or press any key to continue';
            }
        }

        if (statusBar) {
            statusBar.style.display = waitsForInteraction ? 'none' : 'block';
        }

        if (progressFill && !waitsForInteraction) {
            progressFill.style.animationDuration = (timeoutSecs + 1) + 's';
            progressFill.style.animation = 'progress ' + (timeoutSecs + 1) + 's ease-in-out forwards';
        }

        if (interactivePrompt && hasInteractiveTests()) {
            interactivePrompt.style.display = 'flex';
        }

        startCountdown();
    }

    function startCountdown() {
        if (!window.botDetector || !window.botDetector.timeout) return;
        if (isWaitingForInteraction()) return;

        let timeLeft = Math.floor(window.botDetector.timeout / 1000);
        if (!countdown) return;

        function updateCountdown() {
            if (timeLeft <= 0) {
                countdown.textContent = 'Time up!';
                countdown.className = 'info-text';
                clearInterval(countdownInterval);
                return;
            }

            if (timeLeft <= 5) {
                countdown.style.display = 'block';
                countdown.textContent = 'Verification completed. Redirecting in ' + timeLeft + 's...';
            }

            timeLeft--;
        }

        updateCountdown();
        countdownInterval = setInterval(updateCountdown, 1000);
    }

    initializeUI();
    this.initialized = true;
};

document.addEventListener('DOMContentLoaded', initUIfunc);
