export function generateStrongPassword(){
  const upper="ABCDEFGHJKLMNPQRSTUVWXYZ", lower="abcdefghijkmnopqrstuvwxyz", nums="23456789", symbols="!@#$%^&*_-+=";
  const pool=upper+lower+nums+symbols; const bytes=new Uint32Array(20); crypto.getRandomValues(bytes);
  const chars=[upper[bytes[0]%upper.length],lower[bytes[1]%lower.length],nums[bytes[2]%nums.length],symbols[bytes[3]%symbols.length]];
  for(let i=4;i<20;i++)chars.push(pool[bytes[i]%pool.length]);
  for(let i=chars.length-1;i>0;i--){const j=bytes[(i+3)%bytes.length]%(i+1);[chars[i],chars[j]]=[chars[j],chars[i]];}
  return chars.join("");
}
