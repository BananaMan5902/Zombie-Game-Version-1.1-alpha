const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const minimap = document.getElementById("minimap");
const miniCtx = minimap.getContext("2d");

const healthText = document.getElementById("health");
const waveText = document.getElementById("wave");
const zombiesText = document.getElementById("zombies");
const weaponText = document.getElementById("weapon");
const message = document.getElementById("message");

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();


// ============================================================
// WORLD
// ============================================================

const world = {
    width: 3000,
    height: 2200
};

const player = {
    x: 1500,
    y: 1100,
    radius: 15,
    speed: 4,
    health: 100,
    maxHealth: 100
};


// ============================================================
// CAMERA
// ============================================================

const camera = {
    x: 0,
    y: 0
};


// ============================================================
// INPUT
// ============================================================

const keys = {};

let mouse = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    down: false
};

window.addEventListener("keydown", (e) => {

    keys[e.key.toLowerCase()] = true;

    if (["1", "2", "3", "4"].includes(e.key)) {
        const index = Number(e.key) - 1;

        if (guns[index]) {
            currentGun = index;
        }
    }

    if (e.key.toLowerCase() === "e") {
        interactWithHouse();
    }

    if (
        e.key.toLowerCase() === "r" &&
        (gameOver || victory)
    ) {
        location.reload();
    }
});

window.addEventListener("keyup", (e) => {
    keys[e.key.toLowerCase()] = false;
});

canvas.addEventListener("mousemove", (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

canvas.addEventListener("mousedown", (e) => {
    if (e.button === 0) {
        mouse.down = true;
    }
});

window.addEventListener("mouseup", (e) => {
    if (e.button === 0) {
        mouse.down = false;
    }
});


// ============================================================
// WEAPONS
// ============================================================

const guns = [

    {
        name: "Pistol",
        damage: 34,
        fireRate: 230,
        spread: 0.025,
        pellets: 1,
        bulletSpeed: 15
    },

    {
        name: "Shotgun",
        damage: 20,
        fireRate: 650,
        spread: 0.34,
        pellets: 7,
        bulletSpeed: 13
    },

    {
        name: "Machine Gun",
        damage: 11,
        fireRate: 75,
        spread: 0.13,
        pellets: 1,
        bulletSpeed: 18
    },

    {
        name: "Rifle",
        damage: 125,
        fireRate: 900,
        spread: 0.008,
        pellets: 1,
        bulletSpeed: 25
    }

];

let currentGun = 0;
let lastShot = 0;


// ============================================================
// BULLETS
// ============================================================

const bullets = [];

function shoot() {

    const now = performance.now();
    const gun = guns[currentGun];

    if (now - lastShot < gun.fireRate) {
        return;
    }

    lastShot = now;

    const worldMouseX = mouse.x + camera.x;
    const worldMouseY = mouse.y + camera.y;

    const baseAngle = Math.atan2(
        worldMouseY - player.y,
        worldMouseX - player.x
    );

    for (let i = 0; i < gun.pellets; i++) {

        const angle =
            baseAngle +
            (Math.random() - 0.5) * gun.spread;

        bullets.push({
            x: player.x,
            y: player.y,
            vx: Math.cos(angle) * gun.bulletSpeed,
            vy: Math.sin(angle) * gun.bulletSpeed,
            damage: gun.damage,
            life: 100
        });
    }
}


// ============================================================
// HOUSES
// ============================================================

const houses = [];

function createHouses() {

    const positions = [
        [350, 350],
        [800, 500],
        [1250, 300],
        [1900, 400],
        [2400, 350],

        [400, 900],
        [900, 850],
        [2050, 850],
        [2550, 900],

        [350, 1500],
        [850, 1450],
        [1800, 1500],
        [2400, 1550],

        [700, 1950],
        [1400, 1850],
        [2100, 1950]
    ];

    for (const [x, y] of positions) {

        houses.push({
            x,
            y,
            width: 170,
            height: 130,
            open: false
        });
    }
}

createHouses();


// ============================================================
// LAKES
// ============================================================

const lakes = [

    {
        x: 600,
        y: 1200,
        rx: 270,
        ry: 170
    },

    {
        x: 1450,
        y: 450,
        rx: 300,
        ry: 190
    },

    {
        x: 2250,
        y: 1250,
        rx: 350,
        ry: 210
    },

    {
        x: 1500,
        y: 1750,
        rx: 250,
        ry: 150
    }
];


// ============================================================
// ZOMBIES
// ============================================================

const zombies = [];

const zombieTypes = {

    weakSlow: {
        health: 35,
        speed: 0.75,
        damage: 5,
        radius: 14,
        color: "#5d8b4a"
    },

    tankSlow: {
        health: 150,
        speed: 0.5,
        damage: 13,
        radius: 21,
        color: "#59684e",
        tank: true
    },

    fastWeak: {
        health: 28,
        speed: 1.65,
        damage: 5,
        radius: 12,
        color: "#3f7847"
    },

    tankFast: {
        health: 115,
        speed: 1.15,
        damage: 12,
        radius: 19,
        color: "#4c5c43",
        tank: true
    }
};


// ============================================================
// WAVE SYSTEM
// ============================================================

let wave = 1;
let waveStarted = false;
let waveDelay = 0;

const totalWaves = 100;

function zombiesForWave(w) {

    return Math.min(
        8 + Math.floor(w * 2.2),
        180
    );
}

function chooseZombieType(w) {

    const roll = Math.random();

    if (w < 5) {
        return zombieTypes.weakSlow;
    }

    if (roll < 0.35) {
        return zombieTypes.weakSlow;
    }

    if (roll < 0.60) {
        return zombieTypes.fastWeak;
    }

    if (roll < 0.82) {
        return zombieTypes.tankSlow;
    }

    return zombieTypes.tankFast;
}


function spawnZombie(type) {

    let side = Math.floor(Math.random() * 4);

    let x;
    let y;

    if (side === 0) {
        x = Math.random() * world.width;
        y = -40;
    }

    else if (side === 1) {
        x = world.width + 40;
        y = Math.random() * world.height;
    }

    else if (side === 2) {
        x = Math.random() * world.width;
        y = world.height + 40;
    }

    else {
        x = -40;
        y = Math.random() * world.height;
    }

    zombies.push({

        x,
        y,

        radius: type.radius,

        health: type.health,
        maxHealth: type.health,

        speed: type.speed,
        damage: type.damage,

        color: type.color,

        tank: type.tank || false,

        attackCooldown: 0
    });
}


function spawnBoss() {

    const boss = {

        x: world.width / 2,
        y: 100,

        radius: 65,

        health: 6000,
        maxHealth: 6000,

        speed: 0.75,
        damage: 35,

        color: "#632020",

        tank: true,

        boss: true,

        attackCooldown: 0
    };

    zombies.push(boss);
}


function startWave() {

    waveStarted = true;

    message.textContent =
        wave === 100
            ? "WAVE 100 — BOSS!"
            : "WAVE " + wave;

    setTimeout(() => {

        message.textContent = "";

    }, 2000);

    if (wave === 100) {

        spawnBoss();

        return;
    }

    const amount = zombiesForWave(wave);

    for (let i = 0; i < amount; i++) {

        const type = chooseZombieType(wave);

        spawnZombie(type);
    }
}


// ============================================================
// HOUSE INTERACTION
// ============================================================

function interactWithHouse() {

    for (const house of houses) {

        const dx = player.x - (house.x + house.width / 2);
        const dy = player.y - (house.y + house.height / 2);

        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 130) {

            house.open = !house.open;

            return;
        }
    }
}


// ============================================================
// COLLISION HELPERS
// ============================================================

function circleRectCollision(circle, rect) {

    const closestX = Math.max(
        rect.x,
        Math.min(circle.x, rect.x + rect.width)
    );

    const closestY = Math.max(
        rect.y,
        Math.min(circle.y, rect.y + rect.height)
    );

    const dx = circle.x - closestX;
    const dy = circle.y - closestY;

    return dx * dx + dy * dy <
        circle.radius * circle.radius;
}


function blocked(x, y, radius) {

    for (const house of houses) {

        if (!house.open) {

            if (
                circleRectCollision(
                    {
                        x,
                        y,
                        radius
                    },
                    house
                )
            ) {
                return true;
            }
        }
    }

    return false;
}


// ============================================================
// PLAYER MOVEMENT
// ============================================================

function movePlayer() {

    let dx = 0;
    let dy = 0;

    if (keys["w"] || keys["arrowup"]) {
        dy -= 1;
    }

    if (keys["s"] || keys["arrowdown"]) {
        dy += 1;
    }

    if (keys["a"] || keys["arrowleft"]) {
        dx -= 1;
    }

    if (keys["d"] || keys["arrowright"]) {
        dx += 1;
    }

    if (dx !== 0 || dy !== 0) {

        const length = Math.sqrt(dx * dx + dy * dy);

        dx /= length;
        dy /= length;

        const newX =
            player.x + dx * player.speed;

        const newY =
            player.y + dy * player.speed;

        if (
            !blocked(
                newX,
                player.y,
                player.radius
            )
        ) {
            player.x = newX;
        }

        if (
            !blocked(
                player.x,
                newY,
                player.radius
            )
        ) {
            player.y = newY;
        }
    }

    player.x = Math.max(
        player.radius,
        Math.min(
            world.width - player.radius,
            player.x
        )
    );

    player.y = Math.max(
        player.radius,
        Math.min(
            world.height - player.radius,
            player.y
        )
    );
}


// ============================================================
// ZOMBIE MOVEMENT
// ============================================================

function updateZombies() {

    for (const zombie of zombies) {

        const dx = player.x - zombie.x;
        const dy = player.y - zombie.y;

        const distance =
            Math.sqrt(dx * dx + dy * dy);

        if (distance > 1) {

            const vx = dx / distance;
            const vy = dy / distance;

            /*
             * Zombies intentionally do NOT check lakes
             * or houses. They can walk through them.
             */

            zombie.x += vx * zombie.speed;
            zombie.y += vy * zombie.speed;
        }

        if (zombie.attackCooldown > 0) {
            zombie.attackCooldown--;
        }

        if (
            distance <
            player.radius + zombie.radius + 5
        ) {

            if (zombie.attackCooldown <= 0) {

                player.health -= zombie.damage;

                zombie.attackCooldown = 45;

                if (player.health <= 0) {

                    player.health = 0;

                    gameOver = true;

                    message.textContent =
                        "YOU DIED — PRESS R TO RESTART";
                }
            }
        }
    }
}


// ============================================================
// BULLET UPDATE
// ============================================================

function updateBullets() {

    for (let i = bullets.length - 1; i >= 0; i--) {

        const bullet = bullets[i];

        bullet.x += bullet.vx;
        bullet.y += bullet.vy;

        bullet.life--;

        let removeBullet = false;

        for (let j = zombies.length - 1; j >= 0; j--) {

            const zombie = zombies[j];

            const dx = bullet.x - zombie.x;
            const dy = bullet.y - zombie.y;

            const distance =
                Math.sqrt(dx * dx + dy * dy);

            if (
                distance <
                zombie.radius + 4
            ) {

                zombie.health -= bullet.damage;

                removeBullet = true;

                if (zombie.health <= 0) {

                    zombies.splice(j, 1);
                }

                break;
            }
        }

        if (
            bullet.life <= 0 ||
            bullet.x < 0 ||
            bullet.x > world.width ||
            bullet.y < 0 ||
            bullet.y > world.height ||
            removeBullet
        ) {

            bullets.splice(i, 1);
        }
    }
}


// ============================================================
// WAVE PROGRESSION
// ============================================================

function updateWave() {

    if (!waveStarted) {

        startWave();

        return;
    }

    if (zombies.length === 0) {

        if (wave >= totalWaves) {

            victory = true;

            message.textContent =
                "YOU SURVIVED ALL 100 WAVES!";

            return;
        }

        waveDelay++;

        if (waveDelay > 120) {

            wave++;

            waveDelay = 0;

            waveStarted = false;
        }
    }
}


// ============================================================
// CAMERA
// ============================================================

function updateCamera() {

    camera.x =
        player.x - canvas.width / 2;

    camera.y =
        player.y - canvas.height / 2;

    camera.x = Math.max(
        0,
        Math.min(
            world.width - canvas.width,
            camera.x
        )
    );

    camera.y = Math.max(
        0,
        Math.min(
            world.height - canvas.height,
            camera.y
        )
    );
}


// ============================================================
// DRAW WORLD
// ============================================================

function drawWorld() {

    ctx.fillStyle = "#3e4a36";

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    ctx.save();

    ctx.translate(
        -camera.x,
        -camera.y
    );

    // Ground

    ctx.fillStyle = "#536047";

    ctx.fillRect(
        0,
        0,
        world.width,
        world.height
    );


    // Grass variation

    ctx.fillStyle = "rgba(20,30,20,0.18)";

    for (let x = 0; x < world.width; x += 60) {

        for (let y = 0; y < world.height; y += 60) {

            if (
                ((x * 7 + y * 3) % 11) < 4
            ) {

                ctx.fillRect(
                    x,
                    y,
                    2,
                    2
                );
            }
        }
    }


    // Lakes

    for (const lake of lakes) {

        ctx.beginPath();

        ctx.ellipse(
            lake.x,
            lake.y,
            lake.rx + 12,
            lake.ry + 12,
            0,
            0,
            Math.PI * 2
        );

        ctx.fillStyle = "#26382e";

        ctx.fill();


        ctx.beginPath();

        ctx.ellipse(
            lake.x,
            lake.y,
            lake.rx,
            lake.ry,
            0,
            0,
            Math.PI * 2
        );

        ctx.fillStyle = "#416f78";

        ctx.fill();


        // Water ripples

        ctx.strokeStyle =
            "rgba(180,220,220,0.18)";

        ctx.lineWidth = 2;

        for (
            let i = -2;
            i <= 2;
            i++
        ) {

            ctx.beginPath();

            ctx.ellipse(
                lake.x + i * 20,
                lake.y + i * 8,
                lake.rx * 0.65,
                lake.ry * 0.08,
                0,
                0,
                Math.PI * 2
            );

            ctx.stroke();
        }
    }


    // Houses

    for (const house of houses) {

        drawHouse(house);
    }


    // Bullets

    for (const bullet of bullets) {

        ctx.beginPath();

        ctx.arc(
            bullet.x,
            bullet.y,
            3,
            0,
            Math.PI * 2
        );

        ctx.fillStyle = "#ffe18a";

        ctx.fill();
    }


    // Zombies

    for (const zombie of zombies) {

        drawZombie(zombie);
    }


    // Player

    drawPlayer();

    ctx.restore();
}


// ============================================================
// DRAW HOUSE
// ============================================================

function drawHouse(house) {

    // Shadow

    ctx.fillStyle =
        "rgba(0,0,0,0.3)";

    ctx.fillRect(
        house.x + 8,
        house.y + 8,
        house.width,
        house.height
    );


    // Walls

    ctx.fillStyle = "#a9987b";

    ctx.fillRect(
        house.x,
        house.y,
        house.width,
        house.height
    );


    // Roof

    ctx.beginPath();

    ctx.moveTo(
        house.x - 15,
        house.y
    );

    ctx.lineTo(
        house.x + house.width / 2,
        house.y - 55
    );

    ctx.lineTo(
        house.x + house.width + 15,
        house.y
    );

    ctx.closePath();

    ctx.fillStyle = "#4a3b35";

    ctx.fill();


    // Windows

    ctx.fillStyle = "#6b9ba3";

    ctx.fillRect(
        house.x + 20,
        house.y + 30,
        35,
        30
    );

    ctx.fillRect(
        house.x + house.width - 55,
        house.y + 30,
        35,
        30
    );


    // Door

    if (house.open) {

        ctx.fillStyle = "#161616";

    } else {

        ctx.fillStyle = "#49372c";
    }

    ctx.fillRect(
        house.x + house.width / 2 - 20,
        house.y + house.height - 55,
        40,
        55
    );
}


// ============================================================
// DRAW ZOMBIE
// ============================================================

function drawZombie(zombie) {

    ctx.save();

    ctx.translate(
        zombie.x,
        zombie.y
    );


    // Boss

    if (zombie.boss) {

        ctx.beginPath();

        ctx.arc(
            0,
            0,
            zombie.radius,
            0,
            Math.PI * 2
        );

        ctx.fillStyle = "#571b1b";

        ctx.fill();

        ctx.strokeStyle = "#1c0808";

        ctx.lineWidth = 5;

        ctx.stroke();


        // Eyes

        ctx.fillStyle = "#ffbd45";

        ctx.beginPath();
        ctx.arc(-20, -12, 7, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(20, -12, 7, 0, Math.PI * 2);
        ctx.fill();


        // Boss health bar

        const barWidth = 130;

        ctx.fillStyle = "#111";

        ctx.fillRect(
            -barWidth / 2,
            -zombie.radius - 25,
            barWidth,
            10
        );

        ctx.fillStyle = "#c83c3c";

        ctx.fillRect(
            -barWidth / 2,
            -zombie.radius - 25,
            barWidth *
                (zombie.health / zombie.maxHealth),
            10
        );

        ctx.restore();

        return;
    }


    // Body

    ctx.beginPath();

    ctx.arc(
        0,
        0,
        zombie.radius,
        0,
        Math.PI * 2
    );

    ctx.fillStyle = zombie.color;

    ctx.fill();


    ctx.strokeStyle = "#20251c";

    ctx.lineWidth = 2;

    ctx.stroke();


    // Eyes

    ctx.fillStyle = "#d9e0c2";

    ctx.beginPath();

    ctx.arc(
        -zombie.radius * 0.35,
        -zombie.radius * 0.25,
        zombie.radius * 0.18,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.beginPath();

    ctx.arc(
        zombie.radius * 0.35,
        -zombie.radius * 0.25,
        zombie.radius * 0.18,
        0,
        Math.PI * 2
    );

    ctx.fill();


    // Bucket

    if (zombie.tank) {

        ctx.fillStyle = "#777";

        ctx.beginPath();

        ctx.arc(
            0,
            -zombie.radius * 0.5,
            zombie.radius * 0.8,
            Math.PI,
            Math.PI * 2
        );

        ctx.fill();

        ctx.strokeStyle = "#333";

        ctx.stroke();

        ctx.fillStyle = "#444";

        ctx.fillRect(
            -zombie.radius * 0.65,
            -zombie.radius * 0.55,
            zombie.radius * 1.3,
            5
        );
    }


    // Health bar

    if (!zombie.boss) {

        const width =
            zombie.radius * 2.2;

        ctx.fillStyle = "#222";

        ctx.fillRect(
            -width / 2,
            -zombie.radius - 12,
            width,
            4
        );

        ctx.fillStyle = "#75c15d";

        ctx.fillRect(
            -width / 2,
            -zombie.radius - 12,
            width *
                Math.max(
                    0,
                    zombie.health /
                    zombie.maxHealth
                ),
            4
        );
    }

    ctx.restore();
}


// ============================================================
// DRAW PLAYER
// ============================================================

function drawPlayer() {

    ctx.save();

    ctx.translate(
        player.x,
        player.y
    );


    // Shadow

    ctx.beginPath();

    ctx.ellipse(
        0,
        8,
        18,
        8,
        0,
        0,
        Math.PI * 2
    );

    ctx.fillStyle =
        "rgba(0,0,0,0.35)";

    ctx.fill();


    // Body

    ctx.beginPath();

    ctx.arc(
        0,
        0,
        player.radius,
        0,
        Math.PI * 2
    );

    ctx.fillStyle = "#2c5b86";

    ctx.fill();

    ctx.strokeStyle = "#101820";

    ctx.lineWidth = 3;

    ctx.stroke();


    // Aim direction

    const worldMouseX =
        mouse.x + camera.x;

    const worldMouseY =
        mouse.y + camera.y;

    const angle = Math.atan2(
        worldMouseY - player.y,
        worldMouseX - player.x
    );


    // Gun

    ctx.rotate(angle);

    ctx.fillStyle = "#222";

    ctx.fillRect(
        8,
        -4,
        23,
        8
    );


    ctx.restore();
}


// ============================================================
// MINIMAP
// ============================================================

function drawMinimap() {

    const w = minimap.width;
    const h = minimap.height;

    miniCtx.clearRect(
        0,
        0,
        w,
        h
    );


    // Background

    miniCtx.fillStyle = "#263026";

    miniCtx.fillRect(
        0,
        0,
        w,
        h
    );


    const sx = w / world.width;
    const sy = h / world.height;


    // Lakes

    for (const lake of lakes) {

        miniCtx.beginPath();

        miniCtx.ellipse(
            lake.x * sx,
            lake.y * sy,
            lake.rx * sx,
            lake.ry * sy,
            0,
            0,
            Math.PI * 2
        );

        miniCtx.fillStyle = "#355c66";

        miniCtx.fill();
    }


    // Houses

    for (const house of houses) {

        miniCtx.fillStyle = "#b6a485";

        miniCtx.fillRect(
            house.x * sx,
            house.y * sy,
            house.width * sx,
            house.height * sy
        );
    }


    // Zombies

    for (const zombie of zombies) {

        miniCtx.beginPath();

        miniCtx.arc(
            zombie.x * sx,
            zombie.y * sy,
            zombie.boss ? 5 : 2.5,
            0,
            Math.PI * 2
        );

        miniCtx.fillStyle =
            zombie.boss
                ? "#ff8a00"
                : "#e23939";

        miniCtx.fill();
    }


    // Player

    miniCtx.beginPath();

    miniCtx.arc(
        player.x * sx,
        player.y * sy,
        4,
        0,
        Math.PI * 2
    );

    miniCtx.fillStyle = "#4aa7ff";

    miniCtx.fill();
}


// ============================================================
// HUD
// ============================================================

function updateHUD() {

    healthText.textContent =
        Math.ceil(player.health);

    waveText.textContent =
        wave;

    zombiesText.textContent =
        zombies.length;

    weaponText.textContent =
        guns[currentGun].name;
}


// ============================================================
// GAME STATE
// ============================================================

let gameOver = false;
let victory = false;


// ============================================================
// MAIN UPDATE
// ============================================================

function update() {

    if (gameOver || victory) {
        return;
    }

    movePlayer();

    if (mouse.down) {
        shoot();
    }

    updateBullets();

    updateZombies();

    updateWave();

    updateCamera();

    updateHUD();
}


// ============================================================
// MAIN DRAW
// ============================================================

function draw() {

    drawWorld();

    drawMinimap();
}


// ============================================================
// GAME LOOP
// ============================================================

function gameLoop() {

    update();

    draw();

    requestAnimationFrame(gameLoop);
}


// ============================================================
// START
// ============================================================

gameLoop();
