const http = require('http');
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhZTAwMjAxYmUyZWRjMmFhYjdmZWYwNyIsImlhdCI6MTc5MzA2NTQ4MiwiZXhwIjoxNzkzNjcwMjgyfQ.EkZVXrXO_dinLBZNTYOU-Zi8h5S8TAzrdky5YbROA-4';
const categories = [
 {name:'Salary',type:'income'},
 {name:'Freelance',type:'income'},
 {name:'Food',type:'expense'},
 {name:'Transport',type:'expense'},
 {name:'Rent',type:'expense'},
 {name:'Entertainment',type:'expense'}
];
function post(cat){
 return new Promise((res,rej)=>{
  const data = JSON.stringify(cat);
  const opts = {
   hostname:'localhost',port:5000,path:'/api/categories',method:'POST',
   headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(data),'Authorization':'Bearer '+token}
  };
  const req=http.request(opts, r=>{ let b=''; r.on('data',c=>b+=c); r.on('end',()=>res(b));});
  req.on('error',rej); req.write(data); req.end();
 });
}
(async()=>{ for(const c of categories){ await post(c); console.log('seeded',c.name)} })();