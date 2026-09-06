class SolHUD {
    constructor() {
        this.element = null;
        this.currentState = null;
        this.payoutFlashTimeout = null;
        
        this.create();
    }
    
    create() {
        this.element = document.createElement('div');
        this.element.id = 'sol-hud';
        this.element.style.cssText = `
            position: absolute;
            top: 60px;
            left: 20px;
            background: linear-gradient(135deg, rgba(15, 20, 30, 0.92), rgba(20, 25, 35, 0.88));
            border: 1px solid rgba(100, 120, 140, 0.4);
            border-radius: 16px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1);
            padding: 10px 15px;
            font-size: 14px;
            color: white;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.3s ease-in-out;
        `;
        
        document.getElementById('ui-overlay').appendChild(this.element);
    }
    
    show(text, state) {
        this.currentState = state;
        this.element.textContent = text;
        this.element.style.opacity = '1';
    }
    
    hide() {
        this.element.style.opacity = '0';
        this.currentState = null;
    }
    
    showJobOffer(jobName, payoutAmount) {
        this.show(`E — Accept: ${jobName} (+$${payoutAmount})`, 'offered');
    }
    
    showInProgress() {
        this.show('Fixing…', 'inProgress');
    }
    
    showPayout(amount) {
        this.show(`+$${amount}`, 'payout');
        
        if (this.payoutFlashTimeout) {
            clearTimeout(this.payoutFlashTimeout);
        }
        
        this.payoutFlashTimeout = setTimeout(() => {
            this.hide();
            this.payoutFlashTimeout = null;
        }, 1500);
    }
    
    getCurrentState() {
        return this.currentState;
    }
}
