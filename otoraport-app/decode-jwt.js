// Decode JWT token to see what's inside
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1haWNocW96c3djb21lZ2NzYXFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1OTUwMjMsImV4cCI6MjA3MzE3MTAyM30.j7gYhUUJA_-TLCmBCVSvB8lFhk_T16mAE2bvp9aFX-A';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1haWNocW96c3djb21lZ2NzYXFnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzU5NTAyMywiZXhwIjoyMDczMTcxMDIzfQ.QTCimxihQ3QAJGnwm5BwEF-UaGwUfgwhVm-9Kklr6U8';

function decodeJWT(token) {
  const parts = token.split('.');
  
  const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
  const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
  
  return { header, payload };
}

console.log('ANON KEY DECODED:');
const anonDecoded = decodeJWT(anonKey);
console.log('Header:', anonDecoded.header);
console.log('Payload:', anonDecoded.payload);
console.log('Project ref:', anonDecoded.payload.ref);
console.log('Role:', anonDecoded.payload.role);
console.log('Issued at:', new Date(anonDecoded.payload.iat * 1000).toISOString());
console.log('Expires at:', new Date(anonDecoded.payload.exp * 1000).toISOString());

console.log('\nSERVICE KEY DECODED:');
const serviceDecoded = decodeJWT(serviceKey);
console.log('Header:', serviceDecoded.header);
console.log('Payload:', serviceDecoded.payload);
console.log('Project ref:', serviceDecoded.payload.ref);
console.log('Role:', serviceDecoded.payload.role);

console.log('\n✅ Both keys are for project: maichqozswcomegcsaqg');
console.log('✅ Keys were created on:', new Date(anonDecoded.payload.iat * 1000).toISOString());
console.log('✅ Keys expire on:', new Date(anonDecoded.payload.exp * 1000).toISOString());