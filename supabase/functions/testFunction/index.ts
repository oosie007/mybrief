export default async function handler(req: Request) {
  return new Response('Test function works!', { 
    status: 200,
    headers: { 'Content-Type': 'text/plain' }
  });
} 