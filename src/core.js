export const DEVICE_TYPES = {
  receptacle: { label: 'Duplex receptacle', short: 'R', color: '#2975cd', va: 180 },
  light: { label: 'Luminaire', short: 'L', color: '#bc830d', va: 35 },
  switch: { label: 'Switch', short: 'S', color: '#8255bc', va: 0 },
  emergency: { label: 'Emergency light', short: 'E', color: '#d56b30', va: 10 },
  data: { label: 'Data outlet', short: 'D', color: '#138778', va: 0 },
};
export function normalizeRect(a, b) {
  return { x: Math.min(a.x,b.x), y: Math.min(a.y,b.y), w: Math.abs(a.x-b.x), h: Math.abs(a.y-b.y) };
}
export function cloudPath({x,y,w,h}, step = 18) {
  const nx=Math.max(2,Math.ceil(w/step)), ny=Math.max(2,Math.ceil(h/step));
  let p=`M ${x} ${y}`;
  for(let i=0;i<nx;i++) p+=` Q ${x+(i+.5)*w/nx} ${y-6} ${x+(i+1)*w/nx} ${y}`;
  for(let i=0;i<ny;i++) p+=` Q ${x+w+6} ${y+(i+.5)*h/ny} ${x+w} ${y+(i+1)*h/ny}`;
  for(let i=0;i<nx;i++) p+=` Q ${x+w-(i+.5)*w/nx} ${y+h+6} ${x+w-(i+1)*w/nx} ${y+h}`;
  for(let i=0;i<ny;i++) p+=` Q ${x-6} ${y+h-(i+.5)*h/ny} ${x} ${y+h-(i+1)*h/ny}`;
  return p+' Z';
}
// Pixel comparison, deliberately independent of symbol recognition or code rules.
export function comparePixels(oldData,newData,width,height,threshold=55) {
  const size=20, cols=Math.ceil(width/size), rows=Math.ceil(height/size);
  const hits=new Uint16Array(cols*rows), adds=new Uint16Array(cols*rows), dels=new Uint16Array(cols*rows);
  const output=new Uint8ClampedArray(width*height*4);
  let changed=0;
  for(let i=0;i<width*height;i++) {
    const k=i*4;
    const a=(oldData[k]+oldData[k+1]+oldData[k+2])/3;
    const b=(newData[k]+newData[k+1]+newData[k+2])/3;
    const delta=a-b;
    if(Math.abs(delta)>threshold) {
      const c=Math.floor((i%width)/size)+Math.floor(Math.floor(i/width)/size)*cols;
      hits[c]++; changed++;
      const color=delta>0 ? [35,111,199] : [222,76,91];
      (delta>0 ? adds : dels)[c]++;
      output[k]=color[0];output[k+1]=color[1];output[k+2]=color[2];
    } else { const shade=Math.min(255,65+Math.min(a,b)*.745);output[k]=shade;output[k+1]=shade;output[k+2]=shade; }
    output[k+3]=255;
  }
  const visited=new Set(), regions=[];
  for(let start=0;start<hits.length;start++) {
    if(hits[start]<4||visited.has(start)) continue;
    const queue=[start];visited.add(start);let minX=cols,minY=rows,maxX=0,maxY=0,added=0,removed=0,count=0;
    for(let q=0;q<queue.length;q++) {
      const idx=queue[q],x=idx%cols,y=Math.floor(idx/cols);
      minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);
      added+=adds[idx];removed+=dels[idx];count+=hits[idx];
      for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++) {
        const xx=x+dx,yy=y+dy,n=xx+yy*cols;
        if(xx>=0&&yy>=0&&xx<cols&&yy<rows&&hits[n]>=4&&!visited.has(n)) {visited.add(n);queue.push(n);}
      }
    }
    if(count<12) continue;
    const x=Math.max(0,minX*size-8),y=Math.max(0,minY*size-8);
    regions.push({x,y,w:Math.min(width,maxX*size+size+8)-x,h:Math.min(height,maxY*size+size+8)-y,kind:added>removed*3?'added':removed>added*3?'removed':'modified',pixels:count});
  }
  return {output,regions:regions.sort((a,b)=>a.y-b.y||a.x-b.x),changed,percent:100*changed/(width*height)};
}
export function csvCell(value) { let s=String(value??'');if(/^[=+\-@\t\r]/.test(s)) s="'"+s;return '"'+s.replaceAll('"','""')+'"'; }
export function calculateLoad(devices,voltage=120,phase=1) {
  const va=devices.reduce((sum,d)=>sum+Number(d.va||0),0);
  return {va,amps:va/(Number(voltage)*(Number(phase)===3?Math.sqrt(3):1))};
}
