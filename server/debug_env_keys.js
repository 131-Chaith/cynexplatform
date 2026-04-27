console.log(Object.keys(process.env).filter(k => k.includes('TURSO') || k.includes('DATABASE') || k.includes('AUTH')));
