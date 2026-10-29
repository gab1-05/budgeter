const http = require('http');
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhZTAwMjAxYmUyZWRjMmFhYjdmZWYwNyIsImlhdCI6MTc5MzA2NTQ4MiwiZXhwIjoxNzkzNjcwMjgyfQ.EkZVXrXO_dinLBZNTYOU-Zi8h5S8TAzrdky5YbROA-4';
const data = JSON.stringify({type:'expense',category:'Food',amount:25.5,description:'Lunch'});
const options = {
  hostname:'localhost',
  port:5000,
  path:'/api/transactions',
  method:'POST',
  headers:{'Content-Type':'application/json','Content-Length': Buffer.byteLength(data),'Authorization':'Bearer '+token}
};
const req = http.request(options, res => {
  let body='';
  res.on('data', chunk=>body+=chunk);
  res.on('end', ()=> console.log(res.statusCode, body));
});
req.on('error', e=> console.error(e));
req.write(data);
req.end();