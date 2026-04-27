import bcrypt from 'bcryptjs';

const hash = '$2b$10$xGyJYfCHrV39gAnLHT3izeOOxLp3N.Vd2E2m2G8zdUoGau.Yp7zsq';
const passwords = ['admin123', 'admin', '12345678', 'password'];

async function test() {
    for (const pw of passwords) {
        const match = await bcrypt.compare(pw, hash);
        console.log(`Password "${pw}" matches: ${match}`);
    }
}

test();
