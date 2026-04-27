import net from 'net';

const checkPort = (port) => {
    return new Promise((resolve) => {
        const server = net.createServer();
        server.once('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                resolve(true); // Occupied
            } else {
                resolve(false);
            }
        });
        server.once('listening', () => {
            server.close();
            resolve(false); // Free
        });
        server.listen(port);
    });
};

(async () => {
    const ports = [5002, 5173, 5174, 5175];
    for (const port of ports) {
        const occupied = await checkPort(port);
        console.log(`Port ${port}: ${occupied ? 'OCCUPIED' : 'FREE'}`);
    }
})();
