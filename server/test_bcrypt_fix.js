import bcrypt from 'bcryptjs';

async function test() {
    try {
        const hash = await bcrypt.hash('12345678', 10);
        console.log('Hash:', hash);
        const match = await bcrypt.compare('12345678', hash);
        console.log('Match:', match);
    } catch (error) {
        console.error('Bcrypt Error:', error);
    }
}

test();
