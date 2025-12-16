import { useEffect, useRef } from 'react';

interface Star {
    x: number;
    y: number;
    size: number;
    speed: number;
    opacity: number;
}

export default function AnimatedBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let stars: Star[] = [];
        let mouseX = 0;
        let mouseY = 0;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            initStars();
        };

        const initStars = () => {
            stars = [];
            const numStars = Math.floor((canvas.width * canvas.height) / 15000);
            for (let i = 0; i < numStars; i++) {
                stars.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    size: Math.random() * 2 + 0.5,
                    speed: Math.random() * 0.5 + 0.1,
                    opacity: Math.random() * 0.5 + 0.3,
                });
            }
        };

        resize();
        window.addEventListener('resize', resize);

        const handleMouseMove = (e: MouseEvent) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        };
        window.addEventListener('mousemove', handleMouseMove);

        let animationId: number;
        const animate = () => {
            // Create gradient background
            const gradient = ctx.createRadialGradient(
                mouseX || canvas.width / 2,
                mouseY || canvas.height / 2,
                0,
                canvas.width / 2,
                canvas.height / 2,
                canvas.width
            );
            gradient.addColorStop(0, 'rgba(99, 102, 241, 0.1)');
            gradient.addColorStop(0.5, 'rgba(15, 15, 26, 1)');
            gradient.addColorStop(1, 'rgba(15, 15, 26, 1)');

            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw and update stars
            stars.forEach((star) => {
                // Parallax effect based on mouse
                const parallaxX = (mouseX - canvas.width / 2) * star.speed * 0.02;
                const parallaxY = (mouseY - canvas.height / 2) * star.speed * 0.02;

                const drawX = star.x + parallaxX;
                const drawY = star.y + parallaxY;

                // Pulsing effect
                const pulse = Math.sin(Date.now() * 0.002 * star.speed) * 0.3 + 0.7;

                ctx.beginPath();
                ctx.arc(drawX, drawY, star.size * pulse, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(147, 163, 235, ${star.opacity * pulse})`;
                ctx.fill();

                // Star glow
                const glowGradient = ctx.createRadialGradient(
                    drawX, drawY, 0,
                    drawX, drawY, star.size * 4
                );
                glowGradient.addColorStop(0, `rgba(99, 102, 241, ${star.opacity * 0.3 * pulse})`);
                glowGradient.addColorStop(1, 'rgba(99, 102, 241, 0)');
                ctx.beginPath();
                ctx.arc(drawX, drawY, star.size * 4, 0, Math.PI * 2);
                ctx.fillStyle = glowGradient;
                ctx.fill();

                // Slowly move stars
                star.y += star.speed * 0.2;
                if (star.y > canvas.height + 10) {
                    star.y = -10;
                    star.x = Math.random() * canvas.width;
                }
            });

            // Draw connecting lines between close stars
            ctx.strokeStyle = 'rgba(99, 102, 241, 0.05)';
            ctx.lineWidth = 0.5;
            for (let i = 0; i < stars.length; i++) {
                for (let j = i + 1; j < stars.length; j++) {
                    const dx = stars[i].x - stars[j].x;
                    const dy = stars[i].y - stars[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 100) {
                        ctx.beginPath();
                        ctx.moveTo(stars[i].x, stars[i].y);
                        ctx.lineTo(stars[j].x, stars[j].y);
                        ctx.stroke();
                    }
                }
            }

            animationId = requestAnimationFrame(animate);
        };
        animate();

        return () => {
            window.removeEventListener('resize', resize);
            window.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(animationId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: -1,
            }}
        />
    );
}
