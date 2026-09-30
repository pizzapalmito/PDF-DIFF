import * as pdfjs from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { PDFDocument } from 'pdf-lib';
import {cloudPath,DEVICE_TYPES,comparePixels} from './core.js';
pdfjs.GlobalWorkerOptions.workerSrc=workerUrl;
export async function loadPdf(bytes,name) {
  const copy=new Uint8Array(bytes);
  const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',copy))].map(x=>x.toString(16).padStart(2,'0')).join('');
  const doc=await pdfjs.getDocument({data:copy.slice(),isEvalSupported:false}).promise;
  return {doc,bytes:copy,name,pages:doc.numPages,hash};
}
export async function renderPage(pdf,pageNumber,width=3200) {
  const page=await pdf.doc.getPage(pageNumber),base=page.getViewport({scale:1}),viewport=page.getViewport({scale:Math.min(width/base.width,Math.sqrt(24000000/(base.width*base.height)))});
  const canvas=document.createElement('canvas');canvas.width=Math.round(viewport.width);canvas.height=Math.round(viewport.height);
  await page.render({canvasContext:canvas.getContext('2d',{willReadFrequently:true}),viewport}).promise;
  return {canvas,width:base.width,height:base.height};
}
export function saveFile(data,name,type) {
  const url=URL.createObjectURL(new Blob([data],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);
}
export function paintComparison(canvas,revised,original,diff,opacity=50) {
  canvas.width=revised.width;canvas.height=revised.height;
  const ctx=canvas.getContext('2d');ctx.drawImage(revised,0,0);
  if(!diff)return;
  ctx.globalAlpha=opacity/100;ctx.fillStyle='white';ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.globalAlpha=.95;ctx.drawImage(diff,0,0);ctx.globalAlpha=1;
  if(opacity!==50){ctx.globalAlpha=Math.abs(opacity-50)/50;ctx.drawImage(opacity<50?revised:original,0,0,canvas.width,canvas.height);ctx.globalAlpha=1;}
}
export async function exportReviewed(pdf,annotations,onProgress,options={}) {
  const out=await PDFDocument.create();out.setTitle('PDF DIFF - reviewed drawing set');out.setSubject('Rasterized review copy with flattened markups');
  for(let n=1;n<=pdf.pages;n++) {
    onProgress?.(n,pdf.pages);
    const {canvas,width,height}=await renderPage(pdf,n,6000),ctx=canvas.getContext('2d');
    if(options.mode==='overlay'&&options.original&&n<=options.original.pages){
      const original=await renderPage(options.original,n,6000);
      if(Math.abs(original.width/original.height-width/height)>.005)throw new Error('Sheet '+n+' has different page proportions. Use Revised export or matching drawings.');
      const aligned=document.createElement('canvas');aligned.width=canvas.width;aligned.height=canvas.height;
      const oldCtx=aligned.getContext('2d');oldCtx.drawImage(original.canvas,0,0,canvas.width,canvas.height);
      const result=comparePixels(oldCtx.getImageData(0,0,canvas.width,canvas.height).data,ctx.getImageData(0,0,canvas.width,canvas.height).data,canvas.width,canvas.height,options.threshold??55);
      const diff=document.createElement('canvas');diff.width=canvas.width;diff.height=canvas.height;diff.getContext('2d').putImageData(new ImageData(result.output,canvas.width,canvas.height),0,0);
      const revised=document.createElement('canvas');revised.width=canvas.width;revised.height=canvas.height;revised.getContext('2d').drawImage(canvas,0,0);
      paintComparison(canvas,revised,aligned,diff,options.opacity??50);
    }
    // Markups use a normalized 1000-unit drawing width.
    const scale=canvas.width/1000;ctx.save();ctx.scale(scale,scale);ctx.lineWidth=1.8;
    for(const a of annotations.filter(a=>a.page===n&&(a.type!=='cloud'||options.showClouds!==false))) {
      if(a.type==='cloud'){ctx.strokeStyle=a.status==='reviewed'?'#168374':'#df5261';ctx.stroke(new Path2D(cloudPath(a)));ctx.fillStyle=ctx.strokeStyle;ctx.font='bold 11px Arial';ctx.fillText(a.label,a.x,a.y-10);}
      else if(a.type==='device'){ctx.fillStyle=DEVICE_TYPES[a.device].color;ctx.beginPath();ctx.arc(a.x,a.y,9,0,Math.PI*2);ctx.fill();ctx.fillStyle='white';ctx.font='bold 10px Arial';ctx.textAlign='center';ctx.fillText(DEVICE_TYPES[a.device].short,a.x,a.y+3.5);ctx.textAlign='left';}
      else if(a.type==='note'){ctx.fillStyle='#d99512';ctx.fillRect(a.x-7,a.y-7,14,14);ctx.font='11px Arial';ctx.fillStyle='#865706';ctx.fillText(a.label,a.x+13,a.y+4);}
    }
    ctx.restore();const img=await out.embedPng(canvas.toDataURL('image/png'));out.addPage([width,height]).drawImage(img,{x:0,y:0,width,height});
  }
  return out.save();
}
