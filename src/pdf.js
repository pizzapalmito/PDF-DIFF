import * as pdfjs from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { PDFDocument } from 'pdf-lib';
import {cloudPath,DEVICE_TYPES} from './core.js';
pdfjs.GlobalWorkerOptions.workerSrc=workerUrl;
export async function loadPdf(bytes,name) {
  const copy=new Uint8Array(bytes);
  const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',copy))].map(x=>x.toString(16).padStart(2,'0')).join('');
  const doc=await pdfjs.getDocument({data:copy.slice(),isEvalSupported:false}).promise;
  return {doc,bytes:copy,name,pages:doc.numPages,hash};
}
export async function renderPage(pdf,pageNumber,width=1400) {
  const page=await pdf.doc.getPage(pageNumber),base=page.getViewport({scale:1}),viewport=page.getViewport({scale:width/base.width});
  const canvas=document.createElement('canvas');canvas.width=Math.round(viewport.width);canvas.height=Math.round(viewport.height);
  await page.render({canvasContext:canvas.getContext('2d',{willReadFrequently:true}),viewport}).promise;
  return {canvas,width:base.width,height:base.height};
}
export function saveFile(data,name,type) {
  const url=URL.createObjectURL(new Blob([data],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);
}
export async function exportReviewed(pdf,annotations,onProgress) {
  const out=await PDFDocument.create();out.setTitle('PDF DIFF - reviewed drawing set');out.setSubject('Rasterized review copy with flattened markups');
  for(let n=1;n<=pdf.pages;n++) {
    onProgress?.(n,pdf.pages);
    const {canvas,width,height}=await renderPage(pdf,n,2200),ctx=canvas.getContext('2d');
    // Markups use a normalized 1000-unit drawing width.
    const scale=canvas.width/1000;ctx.save();ctx.scale(scale,scale);ctx.lineWidth=1.8;
    for(const a of annotations.filter(a=>a.page===n)) {
      if(a.type==='cloud'){ctx.strokeStyle=a.status==='reviewed'?'#168374':'#df5261';ctx.stroke(new Path2D(cloudPath(a)));ctx.fillStyle=ctx.strokeStyle;ctx.font='bold 11px Arial';ctx.fillText(a.label,a.x,a.y-10);}
      else if(a.type==='device'){ctx.fillStyle=DEVICE_TYPES[a.device].color;ctx.beginPath();ctx.arc(a.x,a.y,9,0,Math.PI*2);ctx.fill();ctx.fillStyle='white';ctx.font='bold 10px Arial';ctx.textAlign='center';ctx.fillText(DEVICE_TYPES[a.device].short,a.x,a.y+3.5);ctx.textAlign='left';}
      else if(a.type==='note'){ctx.fillStyle='#d99512';ctx.fillRect(a.x-7,a.y-7,14,14);ctx.font='11px Arial';ctx.fillStyle='#865706';ctx.fillText(a.label,a.x+13,a.y+4);}
    }
    ctx.restore();const img=await out.embedPng(canvas.toDataURL('image/png'));out.addPage([width,height]).drawImage(img,{x:0,y:0,width,height});
  }
  return out.save();
}
