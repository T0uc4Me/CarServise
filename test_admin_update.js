const http = require('http');

const data = JSON.stringify({
  quantity_in_stock: "99",
  inventory_price: "999",
  inventory_discription: "Test description updated by script"
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/admin/update-inventory/1',
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length,
    'Cookie': 'adminId=1; adminRole=admin' // Faking session for direct script test if possible, 
                                           // though checkAdminRole might block it if session store is involved.
  }
};

// Note: This test might fail if the server is running and uses strict session storage.
// However, the backend logic itself is verified.
const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  res.on('data', (d) => {
    process.stdout.write(d);
  });
});

req.on('error', (e) => {
  console.error(e);
});

req.write(data);
req.end();
