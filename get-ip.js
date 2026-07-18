const os = require('os');

console.log('\n🌐 Network Information\n');
console.log('='.repeat(60));

const interfaces = os.networkInterfaces();
let found = false;

for (const name of Object.keys(interfaces)) {
  for (const iface of interfaces[name]) {
    // Skip internal and non-IPv4 addresses
    if (iface.internal || iface.family !== 'IPv4') {
      continue;
    }
    
    found = true;
    console.log(`\n📡 ${name}`);
    console.log(`   IP Address: ${iface.address}`);
    console.log(`   Netmask: ${iface.netmask}`);
  }
}

if (!found) {
  console.log('\n⚠️  No external network interfaces found');
} else {
  const port = process.env.PORT || 3000;
  console.log('\n' + '='.repeat(60));
  console.log('\n💡 To access the overlay from another device:');
  console.log(`   http://<IP_ADDRESS_ABOVE>:${port}/overlay.html`);
  console.log('\nMake sure:');
  console.log('   1. The server is running (npm start)');
  console.log('   2. Firewall allows connections on port ' + port);
  console.log('   3. Both devices are on the same network\n');
}
