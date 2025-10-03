class WildAnimations {
    constructor() {
        this.init();
    }

    init() {
        this.createFloatingParticles();
        this.startMatrixRain();
        this.addInputEffects();
        this.addButtonEffects();
    }

    // Create floating particles in background
    createFloatingParticles() {
        const container = document.querySelector('.container');
        const particleCount = 15;

        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'floating-particle';
            particle.style.cssText = `
                position: fixed;
                width: ${Math.random() * 6 + 2}px;
                height: ${Math.random() * 6 + 2}px;
                background: var(--glow-red);
                border-radius: 50%;
                top: ${Math.random() * 100}vh;
                left: ${Math.random() * 100}vw;
                opacity: ${Math.random() * 0.3 + 0.1};
                pointer-events: none;
                z-index: 1;
                animation: float ${Math.random() * 10 + 10}s infinite ease-in-out;
                animation-delay: ${Math.random() * 5}s;
            `;
            container.appendChild(particle);
        }
    }

    // Matrix-style rain effect
    startMatrixRain() {
        const chars = '01アイウエオカキクケコサシスセソ';
        const container = document.querySelector('.container');
        
        setInterval(() => {
            if (Math.random() < 0.3) { // 30% chance to create new rain drop
                this.createRainDrop(container, chars);
            }
        }, 100);
    }

    createRainDrop(container, chars) {
        const drop = document.createElement('div');
        const left = Math.random() * 100;
        const speed = Math.random() * 20 + 10;
        
        drop.style.cssText = `
            position: fixed;
            top: -20px;
            left: ${left}vw;
            color: var(--glow-red);
            font-family: monospace;
            font-size: ${Math.random() * 14 + 10}px;
            opacity: ${Math.random() * 0.5 + 0.2};
            pointer-events: none;
            z-index: 1;
            text-shadow: 0 0 5px var(--glow-red);
            animation: matrixRain ${speed}s linear forwards;
        `;

        let content = '';
        const length = Math.floor(Math.random() * 10 + 5);
        for (let i = 0; i < length; i++) {
            content += chars[Math.floor(Math.random() * chars.length)];
        }
        drop.textContent = content;

        container.appendChild(drop);

        // Remove after animation
        setTimeout(() => {
            if (drop.parentNode) {
                drop.parentNode.removeChild(drop);
            }
        }, speed * 1000);
    }

    // Add input field effects
    addInputEffects() {
        const inputs = document.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('focus', function() {
                this.parentElement.classList.add('focused');
                this.style.background = 'rgba(255, 255, 255, 0.15)';
            });

            input.addEventListener('blur', function() {
                this.parentElement.classList.remove('focused');
                this.style.background = 'rgba(255, 255, 255, 0.1)';
            });

            input.addEventListener('input', function() {
                if (this.value.length > 0) {
                    this.style.borderColor = 'var(--glow-red)';
                    this.style.boxShadow = '0 0 15px rgba(255, 0, 51, 0.4)';
                } else {
                    this.style.borderColor = 'rgba(255, 0, 51, 0.3)';
                    this.style.boxShadow = 'none';
                }
            });
        });
    }

    // Add button hover effects
    addButtonEffects() {
        const buttons = document.querySelectorAll('.glow-button');
        buttons.forEach(button => {
            button.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-3px) scale(1.05)';
                this.style.boxShadow = '0 10px 40px rgba(255, 0, 51, 0.8)';
                
                // Create ripple effect
                const ripple = document.createElement('span');
                ripple.style.cssText = `
                    position: absolute;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.6);
                    transform: scale(0);
                    animation: ripple 0.6s linear;
                    pointer-events: none;
                `;
                
                const size = Math.max(button.offsetWidth, button.offsetHeight);
                ripple.style.width = ripple.style.height = size + 'px';
                ripple.style.left = (event.offsetX - size/2) + 'px';
                ripple.style.top = (event.offsetY - size/2) + 'px';
                
                this.appendChild(ripple);
                
                setTimeout(() => {
                    if (ripple.parentNode) {
                        ripple.parentNode.removeChild(ripple);
                    }
                }, 600);
            });

            button.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0) scale(1)';
                this.style.boxShadow = '0 0 20px rgba(255, 0, 51, 0.4)';
            });
        });
    }

    // Celebration effect when timer completes
    triggerCelebration() {
        this.createConfetti();
        this.animateSuccessText();
        this.pulseBackground();
    }

    createConfetti() {
        const colors = ['#ff0033', '#ff0066', '#ff0099', '#ff00cc', '#ff00ff'];
        const container = document.querySelector('.container');
        
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.cssText = `
                position: fixed;
                width: ${Math.random() * 10 + 5}px;
                height: ${Math.random() * 10 + 5}px;
                background: ${colors[Math.floor(Math.random() * colors.length)]};
                top: -20px;
                left: ${Math.random() * 100}vw;
                opacity: ${Math.random() * 0.8 + 0.2};
                pointer-events: none;
                z-index: 100;
                animation: confettiFall ${Math.random() * 3 + 2}s linear forwards;
                transform: rotate(${Math.random() * 360}deg);
            `;
            
            container.appendChild(confetti);
            
            setTimeout(() => {
                if (confetti.parentNode) {
                    confetti.parentNode.removeChild(confetti);
                }
            }, 5000);
        }
    }

    animateSuccessText() {
        const successText = document.querySelector('.download-container h2');
        if (successText) {
            successText.classList.add('flicker');
            setTimeout(() => {
                successText.classList.remove('flicker');
            }, 3000);
        }
    }

    pulseBackground() {
        const orbits = document.querySelectorAll('.glow-orbit');
        orbits.forEach(orbit => {
            orbit.style.animationDuration = '1s';
            setTimeout(() => {
                orbit.style.animationDuration = '';
            }, 1000);
        });
    }
}

// Add CSS for new animations
const style = document.createElement('style');
style.textContent = `
    @keyframes matrixRain {
        to {
            top: 100vh;
            opacity: 0;
        }
    }
    
    @keyframes ripple {
        to {
            transform: scale(2.5);
            opacity: 0;
        }
    }
    
    @keyframes confettiFall {
        0% {
            transform: translateY(0) rotate(0deg);
        }
        100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
        }
    }
    
    .floating-particle {
        animation-timing-function: ease-in-out;
    }
    
    @keyframes float {
        0%, 100% { transform: translateY(0) translateX(0) rotate(0deg); }
        25% { transform: translateY(-20px) translateX(10px) rotate(90deg); }
        50% { transform: translateY(-10px) translateX(-10px) rotate(180deg); }
        75% { transform: translateY(-15px) translateX(5px) rotate(270deg); }
    }
`;
document.head.appendChild(style);

// Initialize animations when DOM loads
document.addEventListener('DOMContentLoaded', () => {
    window.wildAnimations = new WildAnimations();
});
