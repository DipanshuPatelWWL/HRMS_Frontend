import { useEffect, useRef } from "react";

const StopwatchLoader = () => {
    const ticksRef = useRef(null);

    useEffect(() => {
        const g = ticksRef.current;
        if (!g) return;
        // Clear previous ticks
        while (g.firstChild) g.removeChild(g.firstChild);

        for (let i = 0; i < 60; i++) {
            const ang = (i / 60) * 360 - 90;
            const rad = (ang * Math.PI) / 180;
            const isMaj = i % 5 === 0;
            const r1 = isMaj ? 76 : 82;
            const r2 = 89;
            const x1 = (95 + r1 * Math.cos(rad)).toFixed(1);
            const y1 = (95 + r1 * Math.sin(rad)).toFixed(1);
            const x2 = (95 + r2 * Math.cos(rad)).toFixed(1);
            const y2 = (95 + r2 * Math.sin(rad)).toFixed(1);

            const ln = document.createElementNS("http://www.w3.org/2000/svg", "line");
            ln.setAttribute("x1", x1);
            ln.setAttribute("y1", y1);
            ln.setAttribute("x2", x2);
            ln.setAttribute("y2", y2);
            ln.setAttribute("stroke", "#cbd5e1");
            ln.setAttribute("stroke-width", isMaj ? 2 : 1);
            ln.setAttribute("stroke-linecap", "round");
            g.appendChild(ln);
        }
    }, []);

    return (
        <>
            <style>{`
                @keyframes sw-rotate-sec {
                    from { transform: rotate(0deg); }
                    to   { transform: rotate(360deg); }
                }
                @keyframes sw-rotate-min {
                    from { transform: rotate(0deg); }
                    to   { transform: rotate(360deg); }
                }
                @keyframes sw-pulse-ring {
                    0%, 100% { transform: scale(1);    opacity: .15; }
                    50%      { transform: scale(1.06); opacity: .32; }
                }
                @keyframes sw-pulse-dot {
                    0%, 100% { transform: scale(1);   }
                    50%      { transform: scale(1.45); }
                }
                @keyframes sw-crown-bob {
                    0%, 100% { transform: translateX(-50%) translateY(0);   }
                    50%      { transform: translateX(-50%) translateY(-3px); }
                }
                @keyframes sw-btn-tick {
                    0%, 100% { transform: translateY(0);   }
                    6%       { transform: translateY(-2px); }
                    12%      { transform: translateY(0);   }
                }
                @keyframes sw-sweep-arc {
                    from { stroke-dashoffset: 503; }
                    to   { stroke-dashoffset: 0;   }
                }
                @keyframes sw-dot-pulse {
                    0%, 100% { opacity: .2;  transform: scale(1);    }
                    50%      { opacity: 1;   transform: scale(1.25); }
                }
 
                .sw-wrap {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 48px 0;
                    font-family: -apple-system, 'Plus Jakarta Sans', sans-serif;
                    background: transparent;
                }
 
                .sw-scene {
                    position: relative;
                    width: 220px;
                    height: 268px;
                }
 
                .sw-crown {
                    position: absolute;
                    left: 50%;
                    top: 0;
                    transform: translateX(-50%);
                    animation: sw-crown-bob 2.4s ease-in-out infinite;
                }
 
                .sw-lug {
                    position: absolute;
                    left: 50%;
                    top: 28px;
                    transform: translateX(-50%);
                    width: 14px;
                    height: 10px;
                    border-radius: 3px;
                    background: #f1f5f9;
                    border: 1.5px solid #cbd5e1;
                }
 
                .sw-body {
                    position: absolute;
                    left: 50%;
                    top: 32px;
                    transform: translateX(-50%);
                    width: 190px;
                    height: 190px;
                    border-radius: 50%;
                    background: #ffffff;
                    border: 2px solid #cbd5e1;
                    box-shadow: inset 0 2px 10px rgba(0,0,0,0.07), 0 4px 20px rgba(90,127,240,0.1);
                    overflow: visible;
                }
 
                .sw-pulse-ring {
                    position: absolute;
                    inset: -10px;
                    border-radius: 50%;
                    border: 1.5px solid #c7d2fe;
                    pointer-events: none;
                    animation: sw-pulse-ring 2.4s ease-in-out infinite;
                }
 
                .sw-face {
                    position: absolute;
                    inset: 0;
                    border-radius: 50%;
                    overflow: hidden;
                }
 
                .sw-hand-min {
                    transform-origin: 95px 95px;
                    animation: sw-rotate-min 60s linear infinite;
                }
                .sw-hand-sec {
                    transform-origin: 95px 95px;
                    animation: sw-rotate-sec 2s linear infinite;
                }
                .sw-center-dot {
                    transform-origin: 95px 95px;
                    animation: sw-pulse-dot 1s ease-in-out infinite;
                }
                .sw-sweep {
                    animation: sw-sweep-arc 2s linear infinite;
                    opacity: 0.5;
                }
 
                .sw-btns {
                    position: absolute;
                    top: 228px;
                    left: 50%;
                    transform: translateX(-50%);
                    display: flex;
                    gap: 20px;
                }
                .sw-btn {
                    width: 36px;
                    height: 20px;
                    border-radius: 10px;
                    background: #f1f5f9;
                    border: 1.5px solid #cbd5e1;
                }
                .sw-btn-start {
                    background: #5a7ff0;
                    border-color: #4a6de0;
                    animation: sw-btn-tick 1s ease-in-out infinite;
                }
 
                .sw-dots {
                    display: flex;
                    gap: 7px;
                    margin-top: 28px;
                }
                .sw-dot {
                    width: 7px;
                    height: 7px;
                    border-radius: 50%;
                    background: #5a7ff0;
                    animation: sw-dot-pulse .9s ease-in-out infinite;
                }
                .sw-dot:nth-child(1) { animation-delay: 0s;   }
                .sw-dot:nth-child(2) { animation-delay: .2s;  }
                .sw-dot:nth-child(3) { animation-delay: .4s;  }
            `}</style>

            <div className="sw-wrap">
                <div className="sw-scene">

                    {/* Crown */}
                    <svg className="sw-crown" width="54" height="28" viewBox="0 0 54 28" fill="none">
                        <rect x="20" y="0" width="14" height="16" rx="4" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1.5" />
                        <rect x="13" y="13" width="28" height="9" rx="4" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1.5" />
                        <rect x="0" y="6" width="11" height="8" rx="3" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1.5" />
                        <rect x="43" y="6" width="11" height="8" rx="3" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1.5" />
                    </svg>

                    {/* Lug */}
                    <div className="sw-lug" />

                    {/* Watch body */}
                    <div className="sw-body">
                        <div className="sw-pulse-ring" />
                        <div className="sw-face">
                            <svg width="190" height="190" viewBox="0 0 190 190">

                                {/* Tick marks — drawn by JS via ref */}
                                <g ref={ticksRef} />

                                {/* Sweep arc */}
                                <circle
                                    className="sw-sweep"
                                    cx="95" cy="95" r="80"
                                    fill="none"
                                    stroke="#5a7ff0"
                                    strokeWidth="2.5"
                                    strokeDasharray="503"
                                    strokeDashoffset="503"
                                    strokeLinecap="round"
                                    transform="rotate(-90 95 95)"
                                />

                                {/* Minute hand */}
                                <g className="sw-hand-min">
                                    <rect x="93.8" y="32" width="2.4" height="50" rx="1.2" fill="#5a7ff0" opacity="0.45" />
                                </g>

                                {/* Second hand */}
                                <g className="sw-hand-sec">
                                    <rect x="94.4" y="20" width="1.2" height="64" rx="0.6" fill="#5a7ff0" />
                                    <rect x="93.5" y="87" width="3" height="20" rx="1.5" fill="#5a7ff0" opacity="0.4" />
                                </g>

                                {/* Center pivot */}
                                <circle className="sw-center-dot" cx="95" cy="95" r="5" fill="#5a7ff0" />
                                <circle cx="95" cy="95" r="2.2" fill="#ffffff" />

                                {/* Cardinal labels */}
                                <text x="95" y="18" textAnchor="middle" fontSize="10" fontFamily="monospace" fill="#94a3b8">60</text>
                                <text x="95" y="180" textAnchor="middle" fontSize="10" fontFamily="monospace" fill="#94a3b8">30</text>
                                <text x="178" y="99" textAnchor="middle" fontSize="10" fontFamily="monospace" fill="#94a3b8">15</text>
                                <text x="12" y="99" textAnchor="middle" fontSize="10" fontFamily="monospace" fill="#94a3b8">45</text>
                            </svg>
                        </div>
                    </div>

                    {/* Lap & Start buttons */}
                    <div className="sw-btns">
                        <div className="sw-btn" />
                        <div className={`sw-btn sw-btn-start`} />
                    </div>
                </div>

                {/* Loading dots */}
                <div className="sw-dots">
                    <div className="sw-dot" />
                    <div className="sw-dot" />
                    <div className="sw-dot" />
                </div>
            </div>
        </>
    );
};

export default StopwatchLoader;