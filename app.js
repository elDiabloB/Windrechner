const $ = id => document.getElementById(id);

function update(){
    // Feldwerte einlesen
    const wd = parseFloat($("windDir").value) || 0; //Windrichtung
    const ws = parseFloat($("windSpd").value) || 0; //Windgeschwindigkeit
    const rwy = parseFloat($("rwyHdg").value) || 0; //Bahnausrichtung

    //Winkel zwischen Wind/Bahn berechnen
    // JS-Trig will BOGENMASS, nicht Grad --> * Math.PI / 180
    const diff = (wd - rwy) * Math.PI / 180;

    //Windkomponenten berechnen
    const hw = ws * Math.cos(diff);
    const xw = ws * Math.sin(diff);

    //Tail-/Headwind?
    const isTail = hw < 0;
    const hwLabel = isTail ? "Tailwind":"Headwind";

    // Crosswind links/rechts?
    const xwSide = xw >= 0 ? "von rechts":"von links"

        //Ergebnisse anzeigen
    // Ergebnisse aufteilen in Zahl und Beschriftung
    $("hwVal").textContent   = Math.abs(hw).toFixed(1);
    $("xwVal").textContent   = Math.abs(xw).toFixed(1);
    $("hwTag").textContent   = isTail ? "Tailwind" : "Headwind";
    $("hwLabel").textContent = isTail ? "KT · Rückenwind!" : "KT";
    $("xwLabel").textContent = "KT · " + xwSide;

    // Warning mit CSS-Klassen statt textContent direkt
    const limit = parseFloat($("xwLimit").value) || 15;
    const w = $("warning");
    if (ws === 0) {
        w.className = ""; w.textContent = "";
    } else if (Math.abs(xw) >= limit) {
        w.className = "limit";
        w.textContent = "⚠  CROSSWIND LIMIT ÜBERSCHRITTEN";
    } else if (Math.abs(xw) >= limit * 0.75) {
        w.className = "caution";
        w.textContent = "△  Annäherung an XW-Limit";
    } else {
        w.className = "ok";
        w.textContent = "✓  Crosswind innerhalb Limits";
    }

    const subEl = $("hwLabel");
    subEl.textContent = isTail ? "KT · Rückenwind!" : "KT";
    subEl.style.color = isTail ? "#e84040" : "#c8d8e8";
        
    drawCompass(rwy, wd, ws, hw, xw);
}

function drawCompass(rwy, wd, ws, hw, xw){
    const canvas = $("compass");
    const ctx = canvas.getContext("2d");
    const cx = canvas.width /2;
    const cy = canvas.height /2;
    const R = 160;

    //Canvas reset (leeren)
    ctx.clearRect(0,0, canvas.width, canvas.height);

    //Kompasskreis (aussen)
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.strokeStyle = "#3a5a7a";
    ctx.lineWidth = 2;
    ctx.stroke();

    // 10° Marker-Strich
    for(let i = 0; i<360; i+=10){
        const a = (i-90) * Math.PI / 180;
        const big = i % 30 == 0;            // alle 30° langer Strich
        const r1 = big ? R - 15 : R - 7;    //innen
        const r0 = R;                       //aussen

        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a)* r0);
        ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a)* r1);
        ctx.strokeStyle = big ? "#5a8aaa" : "#2a4a6a";
        ctx.lineWidth = big ? 2 : 1;
        ctx.stroke();
    }

    // Gradangabe alle 30°
    for(let i=0; i<360; i +=30){
        const a = (i-90)* Math.PI / 180;
        const lr = R -28;                   // Abstand zum Rand
        ctx.font = "12px monospace";
        ctx.fillStyle = "#7aaabb";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(i).padStart(3, "0"), 
            cx + Math.cos(a) * lr,
            cy + Math.sin(a) * lr);
    }

    // Hauptrichtung (N,W,S,E)
    const cardinals = [['N', 0],['E', 90],['S', 180],['W', 270]];
    cardinals.forEach(([label, deg]) =>{
        const a = (deg - 90) * Math.PI / 180;
        const lr = R - 48;
        ctx.font = "bold 14px monospace";
        ctx.fillStyle = "#80b0d0";
        ctx.textAlign = "middle";
        ctx.fillText(label, cx + Math.cos(a) * lr, cy + Math.sin(a)* lr);
    });

    const rwyA = (rwy - 90) * Math.PI / 180     // Pistenwinkel im Bogenmaß
    const rwLen = 120;                          // Bahnlänge px
    const rwWid = 20;                           // Bahnbreite px

    ctx.save();
    ctx.translate(cx,cy);
    ctx.rotate(rwyA);

    // Bahn als Balken
    ctx.fillStyle = "#1c2e3e";
    ctx.fillRect(-rwLen, -rwWid / 2, rwLen * 2, rwWid);

    // Bahnränder
    ctx.strokeStyle = "#2a4a65";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-rwLen, -rwWid /2, rwLen *2, rwWid);

    // Mittellinie (gestrichelt)
    ctx.setLineDash([12,8]);
    ctx.strokeStyle = "#306050";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-rwLen * 0.85, 0);
    ctx.lineTo(rwLen * 8.85, 0);
    ctx.stroke();
    ctx.setLineDash([])     //Strichelung ausschalten

    ctx.restore();

    const rwNum = Math.round(rwy /10);
    const rwNumOpp = ((rwNum + 18 -1) % 36) + 1; //Gegenseite
    const lblOff = rwLen + 15;

    //Bahnummer zeichnen
    ctx.font = "bold 15px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    //Landekurs (Anflugseite)
    ctx.fillStyle = "#ffe040";
    ctx.fillText(
    String(rwNum).padStart(2, '0'),
    cx + Math.cos(rwyA) * lblOff,
    cy + Math.sin(rwyA) * lblOff
    );

    //Gegenüberliegendes Ende
    ctx.fillStyle = "#a0c8e0";
    ctx.fillText(
    String(rwNumOpp).padStart(2, '0'),
    cx - Math.cos(rwyA) * lblOff,
    cy - Math.sin(rwyA) * lblOff
    );

    // Kopasspfeile zeichnen
    if (ws > 0){
        const scale = 50/10 // 20KT = 100px

        //Einheitsvektoren (Entlang/Quer Runway)
        const rUx = Math.cos(rwyA); // längs Bahn
        const rUy = Math.sin(rwyA);
        const pUx = -Math.sin(rwyA); // quer Bahn
        const pUy = Math.cos(rwyA);

        //Headwind (entlang Bahn, gegen Landerichtung)
        const hwDir = hw >= 0 ? -1 : 1;
        const hwEx = cx - rUx * Math.abs(hw) * scale * hwDir;
        const hwEy = cy + rUy * Math.abs(hw) * scale * hwDir;

        //Crosswind (quer zur Bahn)
        const xwDir = xw >= 0 ? -1 : 1;
        const xwEx = cx + pUx * Math.abs(xw) * scale * xwDir;
        const xwEy = cy + pUy * Math.abs(xw) * scale * xwDir;

        //Gesamtwind
        const wA = (wd-90 +180)* Math.PI / 180;
        const fwEx = cx + Math.cos(wA) * ws * scale;
        const fwEy = cy + Math.sin(wA) * ws * scale;

        //Pfeile zeichnen
        const hwColor = hw >= 0 ? "#30c87a" : "#e84040";    // grün/rot
        drawArrow(ctx, cx, cy, hwEx, hwEy, hwColor, 3)          //Headwind
        drawArrow(ctx, cx, cy, xwEx, xwEy, "#e84040", 3);    //Crosswind
        drawArrow(ctx, cx, cy, fwEx, fwEy, "#e8a020", 3);   // Gesamtwind
    }
}

function drawArrow(ctx, x1, y1, x2, y2, color, lineWidth){
    const dx = x2 - x1;
    const dy = y2 - y1;
    if(Math.hypot(dx, dy) <4) return;      // zu kurz zum zeichnen

    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = "round";

    //Linie
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    //Pfeilspitze
    const angle = Math.atan2(dy, dx);
    const headLen = 12;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - headLen * Math.cos(angle - 0.4),
        y2 - headLen * Math.sin(angle - 0.4));
    ctx.lineTo(x2 - headLen * Math.cos(angle + 0.4),
        y2 - headLen * Math.sin(angle + 0.4));
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}


//Bei Änderung im Feld --> update() aufrufen
$("windDir").addEventListener("input", update);
$("windSpd").addEventListener("input", update);
$("rwyHdg").addEventListener("input",update);
$("xwLimit").addEventListener("input", update);

update();