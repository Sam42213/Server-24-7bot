const mineflayer = require('mineflayer');

// Configuration
const config = {
    host: 'hexpvp6.aternos.me', // Replace with your server IP
    port: 47899,                               // Replace with your server port if different
    username: 'Bob_thebuilder',                    // Bot's Minecraft username
    password: 'bot12345',         // Password used for /register or /login
    authType: 'offline'                        // Use 'offline' for Aternos cracked servers
};

let bot;
let spawnPoint = null;

function createBot() {
    bot = mineflayer.createBot({
        host: config.host,
        port: config.port,
        username: config.username,
        auth: config.authType
    });

    // Auto-Authentication (Handles chat requests to login/register)
    bot.on('chat', (username, message) => {
        // Ignore messages from the bot itself
        if (username === bot.username) return;

        const msg = message.toLowerCase();
        if (msg.includes('/register')) {
            bot.chat(`/register ${config.password} ${config.password}`);
            console.log('Registered automatically.');
        } else if (msg.includes('/login')) {
            bot.chat(`/login ${config.password}`);
            console.log('Logged in automatically.');
        }
    });

    // Capture the initial spawn point to restrict movement to a 100x100 area
    bot.on('spawn', () => {
        console.log(`${bot.username} has spawned in the server.`);
        if (!spawnPoint) {
            spawnPoint = bot.entity.position.clone();
            console.log(`Spawn point set at: ${spawnPoint}`);
        }
        // Start the random walking loop
        startWalkingLoop();
    });

    // Anti-AFK / Random Movement Logic
    let moveInterval;
    function startWalkingLoop() {
        if (moveInterval) clearInterval(moveInterval);

        moveInterval = setInterval(() => {
            if (!bot.entity) return;

            // Generate a random direction
            const rx = (Math.random() - 0.5) * 2; // Value between -1 and 1
            const rz = (Math.random() - 0.5) * 2;

            // Calculate target position
            let targetX = bot.entity.position.x + rx * 5;
            let targetZ = bot.entity.position.z + rz * 5;

            // Restrict movement within a 100x100 area relative to the initial spawn point
            if (spawnPoint) {
                const maxDistance = 50; // 50 blocks in any direction from center = 100x100 area
                if (Math.abs(targetX - spawnPoint.x) > maxDistance) targetX = bot.entity.position.x - rx * 5;
                if (Math.abs(targetZ - spawnPoint.z) > maxDistance) targetZ = bot.entity.position.z - rz * 5;
            }

            // Look towards the destination and walk forward
            bot.lookAt(bot.entity.position.offset(rx, 0, rz));
            bot.setControlState('forward', true);

            // Walk for 1 second, then stop
            setTimeout(() => {
                if (bot) bot.setControlState('forward', false);
            }, 1000);

        }, 4000); // Repeat every 4 seconds
    }

    // Auto-Reconnect Logic if the bot kicks or server restarts
    bot.on('end', (reason) => {
        console.log(`Bot disconnected: ${reason}. Reconnecting in 15 seconds...`);
        if (moveInterval) clearInterval(moveInterval);
        setTimeout(createBot, 15000);
    });

    bot.on('error', (err) => {
        console.error('Bot encountered an error:', err);
    });
}

createBot();
