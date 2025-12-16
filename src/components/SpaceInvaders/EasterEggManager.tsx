import React, { useState, useEffect } from 'react';
import SpaceInvadersGame from './Game';
import './SpaceInvaders.css';

const EasterEggManager: React.FC = () => {
    const [isActive, setIsActive] = useState(false);

    useEffect(() => {
        // When active, add 'gravity-fall' class to main content
        const mainContent = document.querySelector('.main-content');
        const sidebar = document.querySelector('.profile-card');

        if (isActive) {
            mainContent?.classList.add('gravity-fall');
            sidebar?.classList.add('gravity-fall');
            document.body.style.overflow = 'hidden'; // Prevent scrolling
        } else {
            mainContent?.classList.remove('gravity-fall');
            sidebar?.classList.remove('gravity-fall');
            document.body.style.overflow = '';
        }
    }, [isActive]);

    return (
        <>
            {/* 🚀 Trigger Icon - Fixed in background/corner */}
            {!isActive && (
                <button
                    onClick={() => setIsActive(true)}
                    className="trigger-btn"
                    title="Avvia Procedura di Emergenza"
                >
                    🛸
                </button>
            )}

            {/* Game Overlay */}
            {isActive && (
                <React.Fragment>
                    <SpaceInvadersGame onClose={() => setIsActive(false)} />
                </React.Fragment>
            )}
        </>
    );
};

export default EasterEggManager;
