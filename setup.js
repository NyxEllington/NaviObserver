const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n🎵 Navidrome Overlay - Quick Setup\n');
console.log('This will help you create your .env configuration file.\n');

const questions = [
  { key: 'NAVIDROME_URL', prompt: 'Enter your Navidrome URL (e.g., http://localhost:4533): ', default: 'http://localhost:4533' },
  { key: 'NAVIDROME_USERNAME', prompt: 'Enter your Navidrome username: ', default: '' },
  { key: 'NAVIDROME_PASSWORD', prompt: 'Enter your Navidrome password: ', default: '' },
  { key: 'PORT', prompt: 'Enter server port (default: 3000): ', default: '3000' },
  { key: 'UPDATE_INTERVAL', prompt: 'Enter update interval in ms (default: 5000): ', default: '5000' }
];

let config = {};
let index = 0;

function askQuestion() {
  if (index >= questions.length) {
    createEnvFile();
    return;
  }

  const q = questions[index];
  rl.question(q.prompt, (answer) => {
    config[q.key] = answer || q.default;
    index++;
    askQuestion();
  });
}

function createEnvFile() {
  const envContent = Object.entries(config)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  fs.writeFileSync('.env', envContent);
  console.log('\n✅ .env file created successfully!\n');
  console.log('You can now run: npm start\n');
  rl.close();
}

askQuestion();
