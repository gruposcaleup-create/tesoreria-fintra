import readline from 'readline';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('\n🔐 Database Password URL Encoder 🔐');
console.log('-----------------------------------');
console.log('Enter your database password to get the URL-encoded version safe for connection strings.');
console.log('Note: This script runs locally and does not send your password anywhere.\n');

rl.question('Password: ', (password) => {
    const encoded = encodeURIComponent(password);

    console.log('\n✅ Encoded Password:');
    console.log(encoded);
    console.log('\n📝 Usage in Connection String:');
    console.log(`postgres://[user]:${encoded}@[host]:...`);

    rl.close();
});
