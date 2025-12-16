import React, { useEffect, useRef, useState } from 'react';
import './SpaceInvaders.css';

interface GameProps {
    onClose: () => void;
}

const SpaceInvadersGame: React.FC<GameProps> = ({ onClose }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [score, setScore] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [victory, setVictory] = useState(false);
    const [cvDownloaded, setCvDownloaded] = useState(false);

    // CV Download Reward Logic
    useEffect(() => {
        if (score >= 10000 && !cvDownloaded) {
            setCvDownloaded(true);
            // Trigger Download
            const link = document.createElement('a');
            link.href = '/CV.pdf'; // Assumes file is in public/CV.pdf
            link.download = 'Antonio_Walter_De_Fusco_CV.pdf';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Optional: Show victory generic logic if needed, or just let them play
            // alert("Complimenti! Hai sbloccato il mio CV!"); // verify if user wants alert or just download
        }
    }, [score, cvDownloaded]);

    // Responsive State
    const [gameSize, setGameSize] = useState({ width: 800, height: 600 });
    const [isMobile, setIsMobile] = useState(false);

    // Resize Handler
    useEffect(() => {
        const handleResize = () => {
            // Mobile: full width minus padding, max 800
            const width = Math.min(window.innerWidth - 32, 800);
            // Height: max 600, fit screen
            const height = Math.min(window.innerHeight - 100, 600);
            setGameSize({ width, height });
            setIsMobile(window.innerWidth < 768);
        };

        handleResize(); // Init
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Dynamic Scale based on width
        // Desktop: 4, Mobile: 2.5
        const GLOBAL_SCALE = gameSize.width < 500 ? 2.5 : 4;

        // --- CONSTANTS ---
        const PLAYER_W = 12 * GLOBAL_SCALE; // 12 is sprite width approx
        const PLAYER_H = 8 * GLOBAL_SCALE;
        const BULLET_W = 1 * GLOBAL_SCALE;
        const BULLET_H = 3 * GLOBAL_SCALE;

        // --- STATE ---
        let player = {
            x: gameSize.width / 2 - PLAYER_W / 2,
            y: gameSize.height - (60 * (gameSize.height / 600)), // Adjust Y based on height ratio
            hp: 3,
            maxHp: 3,
            width: PLAYER_W,
            height: PLAYER_H
        };

        // Entities
        let bullets: { x: number; y: number; vy: number; isEnemy: boolean }[] = [];
        let enemies: any[] = [];
        let particles: any[] = [];
        let powerups: any[] = [];

        // Stars background
        const stars = Array.from({ length: 50 }, () => ({
            x: Math.random() * gameSize.width,
            y: Math.random() * gameSize.height,
            size: Math.random() * 2,
            speed: Math.random() * 0.5 + 0.1
        }));

        // Inputs (Ref to access inside loop without dep)
        const keysRef = { current: { ArrowLeft: false, ArrowRight: false, Space: false } };

        // --- SPRITES (Pixel Art) ---
        const SPRITES = {
            PLAYER: [
                "000010000",
                "000111000",
                "001111100",
                "011010110",
                "111111111",
                "101111101",
                "001010100"
            ],
            ENEMY_FAST: ["1000001", "0111110", "1101011", "1111111", "0101010", "1000001"],
            ENEMY_TANK: ["00111100", "01111110", "11100111", "11111111", "01100110", "00111100"],
            ENEMY_SCOUT: ["01010", "11111", "11011", "01110", "01010"],
            ENEMY_MOTHERSHIP: ["0001111000", "0011111100", "0110110110", "1111111111", "1011001101", "0100000010"],
            ENEMY_HEALER: ["00100", "01110", "11111", "01110", "00100"],
            POWERUP_HEART: ["0110110", "1111111", "1111111", "0111110", "0011100", "0001000"]
        };

        const drawSprite = (ctx: CanvasRenderingContext2D, sprite: string[], x: number, y: number, scale: number, color: string) => {
            ctx.fillStyle = color;
            for (let r = 0; r < sprite.length; r++) {
                const row = sprite[r];
                for (let c = 0; c < row.length; c++) {
                    if (row[c] === '1') {
                        ctx.fillRect(x + c * scale, y + r * scale, scale, scale);
                    }
                }
            }
        };

        // --- SPAWN LOGIC ---
        const spawnEnemy = () => {
            const type = Math.random();
            let hp = 1;
            let color = '#a855f7';
            let speed = 1.0;
            let spriteObj = SPRITES.ENEMY_FAST;
            let scale = GLOBAL_SCALE;
            let isHealer = false;

            if (type > 0.95) { // Mothership 
                spriteObj = SPRITES.ENEMY_MOTHERSHIP;
                scale = GLOBAL_SCALE + 1;
                hp = 6;
                color = '#06b6d4';
                speed = 0.4;
            } else if (type > 0.85) { // Healer
                spriteObj = SPRITES.ENEMY_HEALER;
                scale = GLOBAL_SCALE;
                hp = 1;
                color = '#ec4899';
                speed = 1.0;
                isHealer = true;
            } else if (type > 0.65) { // Tank
                spriteObj = SPRITES.ENEMY_TANK;
                scale = GLOBAL_SCALE + 1;
                hp = 4;
                color = '#ef4444';
                speed = 0.6;
            } else if (type > 0.35) { // Scout
                spriteObj = SPRITES.ENEMY_SCOUT;
                scale = GLOBAL_SCALE;
                hp = 2;
                color = '#f97316';
                speed = 1.2;
            } else { // Fast
                spriteObj = SPRITES.ENEMY_FAST;
                scale = GLOBAL_SCALE;
                hp = 1;
                color = '#22c55e';
                speed = 1.8;
            }

            const width = spriteObj[0].length * scale;
            const startX = Math.random() * (gameSize.width - width);

            enemies.push({
                x: startX,
                y: -60,
                vx: (startX < gameSize.width / 2) ? Math.random() * 0.5 : Math.random() * -0.5,
                vy: Math.random() * speed * 0.5 + 0.5,
                hp, maxHp: hp, width, height: spriteObj.length * scale,
                color, sprite: spriteObj, scale, isHealer
            });
        };

        // --- CONTROLS ---
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'ArrowLeft') keysRef.current.ArrowLeft = true;
            if (e.code === 'ArrowRight') keysRef.current.ArrowRight = true;
            if (e.code === 'Space') {
                if (!keysRef.current.Space) fireBullet(); // Prevent hold-fire spam
                keysRef.current.Space = true;
            }
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.code === 'ArrowLeft') keysRef.current.ArrowLeft = false;
            if (e.code === 'ArrowRight') keysRef.current.ArrowRight = false;
            if (e.code === 'Space') keysRef.current.Space = false;
        };

        const fireBullet = () => {
            bullets.push({
                x: player.x + player.width / 2 - BULLET_W / 2,
                y: player.y,
                vy: -10,
                isEnemy: false
            });
        };

        // Expose touch handlers to window or refs if needed, 
        // but simpler to check a global or shared ref for touch states.
        // We will attach touch listeners to buttons in JSX which update keysRef.
        (window as any).gameControls = {
            setLeft: (v: boolean) => keysRef.current.ArrowLeft = v,
            setRight: (v: boolean) => keysRef.current.ArrowRight = v,
            fire: () => fireBullet()
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        // --- LOOP ---
        let animationId: number;
        let frameCount = 0;

        const createExplosion = (x: number, y: number, color: string, count: number) => {
            for (let i = 0; i < count; i++) {
                particles.push({
                    x, y,
                    vx: (Math.random() - 0.5) * 4,
                    vy: (Math.random() - 0.5) * 4,
                    life: 1.0,
                    color
                });
            }
        };

        const update = () => {
            if (!ctx) return;
            frameCount++;

            // 1. CLEAR & BG
            ctx.fillStyle = '#0f0f1a';
            ctx.fillRect(0, 0, gameSize.width, gameSize.height);

            // Draw Stars
            ctx.fillStyle = '#ffffff';
            stars.forEach(s => {
                s.y += s.speed;
                if (s.y > gameSize.height) s.y = 0;
                ctx.globalAlpha = Math.random() * 0.5 + 0.3;
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
                ctx.fill();
            });
            ctx.globalAlpha = 1.0;

            // 2. PLAYER MOVEMENT
            if (keysRef.current.ArrowLeft && player.x > 0) player.x -= 6;
            if (keysRef.current.ArrowRight && player.x < gameSize.width - player.width) player.x += 6;

            // 3. SPAWN ENEMIES
            if (frameCount % 100 === 0) spawnEnemy();

            // 4. UPDATE ENTITIES... (Simplified collision for brevity in replacement, logic remains same)
            // Powerups
            for (let i = powerups.length - 1; i >= 0; i--) {
                const p = powerups[i];
                p.y += 2;
                drawSprite(ctx, SPRITES.POWERUP_HEART, p.x, p.y, GLOBAL_SCALE * 0.8, '#ec4899');
                if (
                    p.x < player.x + player.width && p.x + (7 * GLOBAL_SCALE) > player.x &&
                    p.y < player.y + player.height && p.y + (7 * GLOBAL_SCALE) > player.y
                ) {
                    if (player.hp < player.maxHp) player.hp++;
                    powerups.splice(i, 1);
                    createExplosion(p.x, p.y, '#ec4899', 10);
                    continue;
                }
                if (p.y > gameSize.height) powerups.splice(i, 1);
            }

            // Bullets
            for (let i = bullets.length - 1; i >= 0; i--) {
                const b = bullets[i];
                b.y += b.vy;
                ctx.fillStyle = b.isEnemy ? '#ef4444' : '#fbbf24';
                ctx.shadowBlur = 10; ctx.shadowColor = ctx.fillStyle;
                ctx.fillRect(b.x, b.y, BULLET_W, BULLET_H);
                ctx.shadowBlur = 0;

                if (b.y < -20 || b.y > gameSize.height + 20) {
                    bullets.splice(i, 1); continue;
                }

                // Collisions...
                if (!b.isEnemy) {
                    let hit = false;
                    for (let j = enemies.length - 1; j >= 0; j--) {
                        const e = enemies[j];
                        if (b.x < e.x + e.width && b.x + BULLET_W > e.x && b.y < e.y + e.height && b.y + BULLET_H > e.y) {
                            e.hp--;
                            createExplosion(b.x, b.y, '#fbbf24', 5);
                            hit = true;
                            if (e.hp <= 0) {
                                createExplosion(e.x + e.width / 2, e.y + e.height / 2, e.color, 15);
                                if ((e as any).isHealer) powerups.push({ x: e.x, y: e.y, type: 'HEART' });
                                enemies.splice(j, 1);
                                setScore(s => s + 100);
                            }
                            break;
                        }
                    }
                    if (hit) bullets.splice(i, 1);
                } else {
                    if (b.x < player.x + player.width && b.x + BULLET_W > player.x && b.y < player.y + player.height && b.y + BULLET_H > player.y) {
                        player.hp--;
                        createExplosion(player.x, player.y, '#22d3ee', 20);
                        bullets.splice(i, 1);
                        if (player.hp <= 0) setGameOver(true);
                    }
                }
            }

            // Enemies
            for (let i = enemies.length - 1; i >= 0; i--) {
                const e = enemies[i];
                e.x += e.vx; e.y += e.vy;
                if (e.x <= 0 || e.x >= gameSize.width - e.width) e.vx *= -1;
                if (!e.isHealer && Math.random() < 0.003) {
                    bullets.push({ x: e.x + e.width / 2 - BULLET_W / 2, y: e.y + e.height, vy: 5, isEnemy: true });
                }
                drawSprite(ctx, e.sprite, e.x, e.y, e.scale, e.color);

                // HP Bar
                if (e.hp < e.maxHp) {
                    ctx.fillStyle = 'red'; ctx.fillRect(e.x, e.y - 8, e.width, 4);
                    ctx.fillStyle = '#22c55e'; ctx.fillRect(e.x, e.y - 8, e.width * (e.hp / e.maxHp), 4);
                }

                if (e.y > gameSize.height - 50 || (e.x < player.x + player.width && e.x + e.width > player.x && e.y < player.y + player.height && e.y + e.height > player.y)) {
                    setGameOver(true);
                }
            }

            // Particles
            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];
                p.x += p.vx; p.y += p.vy; p.life -= 0.05;
                ctx.globalAlpha = p.life; ctx.fillStyle = p.color;
                ctx.beginPath(); ctx.arc(p.x, p.y, 2, 0, Math.PI * 2); ctx.fill();
                if (p.life <= 0) particles.splice(i, 1);
            }
            ctx.globalAlpha = 1.0;

            // DRAW PLAYER
            ctx.shadowBlur = 15; ctx.shadowColor = '#22d3ee';
            drawSprite(ctx, SPRITES.PLAYER, player.x, player.y, GLOBAL_SCALE, '#22d3ee');
            ctx.shadowBlur = 0;

            // Draw HP
            ctx.fillStyle = 'white'; ctx.font = '16px monospace';
            ctx.fillText(`HP: ${'❤️'.repeat(player.hp)}`, 20, 30);

            if (!gameOver && !victory) animationId = requestAnimationFrame(update);
        };

        animationId = requestAnimationFrame(update);

        return () => {
            cancelAnimationFrame(animationId);
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            delete (window as any).gameControls;
        };
    }, [gameOver, victory, gameSize]); // Re-run if size changes

    const restartGame = () => {
        setScore(0);
        setGameOver(false);
        setVictory(false);
    };

    return (
        <div className="game-overlay">

            {/* Game HUD */}
            <div className="game-hud">
                <h1 style={{ textShadow: '0 0 20px #22d3ee', fontSize: isMobile ? '1.5rem' : '2.5rem' }}>SPACE DEFENDER</h1>
                <p>SCORE: {score}</p>
                {!isMobile && <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>Arrow Keys to Move • Space to Shoot</p>}
            </div>

            <div className="game-container">
                <canvas
                    ref={canvasRef}
                    width={gameSize.width}
                    height={gameSize.height}
                    className="game-canvas"
                />

                {/* MOBILE CONTROLS */}
                {isMobile && (
                    <div className="mobile-controls">
                        <div className="controls-left">
                            <button
                                className="control-btn"
                                onTouchStart={(e) => { e.preventDefault(); (window as any).gameControls?.setLeft(true); }}
                                onTouchEnd={(e) => { e.preventDefault(); (window as any).gameControls?.setLeft(false); }}
                            >←</button>
                            <button
                                className="control-btn"
                                onTouchStart={(e) => { e.preventDefault(); (window as any).gameControls?.setRight(true); }}
                                onTouchEnd={(e) => { e.preventDefault(); (window as any).gameControls?.setRight(false); }}
                            >→</button>
                        </div>
                        <button
                            className="control-btn fire-btn"
                            onTouchStart={(e) => { e.preventDefault(); (window as any).gameControls?.fire(); }}
                        >🔥</button>
                    </div>
                )}

                {/* Game Over Screen */}
                {gameOver && (
                    <div className="game-screen">
                        <h2 className="text-red">GAME OVER</h2>
                        <p style={{ color: 'white', fontSize: '1.5rem', marginBottom: '2rem', fontFamily: 'Courier New' }}>Score: {score}</p>
                        <div style={{ display: 'flex', gap: '1rem', flexDirection: isMobile ? 'column' : 'row' }}>
                            <button onClick={restartGame} className="retro-btn success">TRY AGAIN</button>
                            <button onClick={onClose} className="retro-btn danger">EXIT</button>
                        </div>
                    </div>
                )}

                {/* Victory can be handled same as Game Over */}
                {victory && (
                    <div className="game-screen">
                        <h2 className="text-green">VICTORY!</h2>
                        <p style={{ color: 'white', fontSize: '1.5rem', marginBottom: '2rem', fontFamily: 'Courier New' }}>Score: {score}</p>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button onClick={restartGame} className="retro-btn success">PLAY AGAIN</button>
                            <button onClick={onClose} className="retro-btn">RETURN TO EARTH</button>
                        </div>
                    </div>
                )}
            </div>

            {/* Exit Button */}
            <button
                onClick={onClose}
                className="retro-btn danger"
                title="Close Game"
                style={{
                    position: 'absolute',
                    top: '2rem',
                    right: '2rem',
                    padding: '8px 16px',
                    fontSize: '1rem',
                    boxShadow: '4px 4px 0 #ef4444',
                    zIndex: 100
                }}
            >
                X
            </button>
            {/* Reward Hint - Moved to bottom */}
            <div style={{
                position: 'absolute',
                bottom: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                padding: '8px 16px',
                background: 'rgba(99, 102, 241, 0.15)',
                borderRadius: '50px',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                backdropFilter: 'blur(5px)',
                zIndex: 90,
                width: 'max-content',
                maxWidth: '90%'
            }}>
                <p style={{ fontSize: '0.9rem', color: '#22d3ee', fontWeight: 'bold', margin: 0, textAlign: 'center' }}>
                    🛸 MISSION: Reach 10,000 points to unlock my CV!
                </p>
            </div>
        </div>
    );
};

export default SpaceInvadersGame;
