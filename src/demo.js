import {PDFDocument,StandardFonts,rgb} from 'pdf-lib';
export async function createDemo(revised=false) {
  const doc=await PDFDocument.create(), font=await doc.embedFont(StandardFonts.Helvetica),bold=await doc.embedFont(StandardFonts.HelveticaBold);
  doc.setCreationDate(new Date('2026-09-26T00:00:00Z'));doc.setModificationDate(new Date('2026-09-26T00:00:00Z'));
  for(let sheet=0;sheet<2;sheet++) {
    const p=doc.addPage([1000,700]);const ink=rgb(.24,.30,.32),light=rgb(.68,.72,.72),green=rgb(.14,.31,.29);
    const line=(x,y,x2,y2,t=1,c=ink)=>p.drawLine({start:{x,y:700-y},end:{x:x2,y:700-y2},thickness:t,color:c});
    const rect=(x,y,w,h,t=1,c=ink)=>p.drawRectangle({x,y:700-y-h,width:w,height:h,borderWidth:t,borderColor:c});
    const txt=(s,x,y,size=8,heavy=false,c=ink)=>p.drawText(s,{x,y:700-y,size,font:heavy?bold:font,color:c});
    const circle=(x,y,r=7,c=ink)=>p.drawCircle({x,y:700-y,size:r,borderWidth:1,borderColor:c});
    rect(28,25,944,648,.8);rect(43,44,775,549,.6,light);
    txt('N O R T H L I N E   /   E N G I N E E R I N G',57,65,10,true,green);
    txt('DEMONSTRATION DRAWING - NOT FOR CONSTRUCTION',57,81,6,false,light);
    // Architectural shell, paired wall lines and corridor.
    rect(95,140,663,380,2);rect(100,145,653,370,.7);
    const wall=(x,y,x2,y2)=>{line(x,y,x2,y2,1.7);line(x+5,y+5,x2+5,y2+5,.7);};
    wall(95,290,758,290);wall(95,360,758,360);
    wall(280,140,280,290);wall(455,140,455,290);wall(630,140,630,290);
    wall(310,360,310,520);wall(530,360,530,520);wall(660,360,660,520);
    // Door openings and swings.
    for(const [x,y] of [[224,290],[389,290],[571,290],[702,290],[245,365],[464,365],[601,365],[706,365]]) {
      line(x,y,x+32,y,7,rgb(1,1,1));line(x,y,x,y-31,.8);line(x,y-31,x+32,y,.5,light);
    }
    for(const [name,num,x,y] of [['OPEN OFFICE','101',157,202],['MEETING ROOM','102',323,202],['PRIVATE OFFICE','103',493,202],['IT / SERVER','104',661,202],['COLLABORATION','105',153,428],['OPEN OFFICE','106',375,428],['STORAGE','107',561,428],['ELEC.','108',688,428]]) {txt(name,x,y,9,true);txt(num,x+25,y+16,7,false,light);}
    txt('CORRIDOR',358,331,9,true);txt('100',422,331,8);
    // Furniture adds a familiar drawing texture without overpowering electrical content.
    for(const [x,y] of [[117,161],[210,161],[477,161],[568,161],[118,463],[220,463],[333,463],[442,463]]) {rect(x,y,43,23,.5,light);circle(x+21,y+32,6,light);}
    rect(322,227,83,25,.6,light);for(let i=0;i<4;i++)circle(331+i*21,220,4,light);
    for(let x=668;x<737;x+=23)rect(x,158,17,31,.5,light);
    const outlet=(x,y,tag='')=>{circle(x,y,6);line(x-2,y-4,x-2,y+4,.8);line(x+2,y-4,x+2,y+4,.8);if(tag)txt(tag,x+10,y+3,6);};
    const lamp=(x,y,tag='L1')=>{rect(x-13,y-4,26,8,.8);line(x-10,y,x+10,y,.5);txt(tag,x-5,y+15,6);};
    const devices=sheet===0?[[124,150],[249,150],[303,150],[425,150],[480,150],[605,150],[737,236],[116,499],[279,499],[334,499],[493,499],[555,499]]:[];
    devices.forEach(([x,y],i)=>{if(!revised||i!==3)outlet(x,y,`P1-${2*Math.floor(i/2)+1}`);});
    if(sheet===0&&revised){outlet(358,282,'P1-15');outlet(390,282,'P1-15');outlet(649,379,'GFCI');}
    if(sheet===1) {for(let y=175;y<500;y+=70)for(let x=140;x<740;x+=110){if(!(y===315)&&(!revised||x!==360||y!==245))lamp(x,y);}if(revised){lamp(575,330,'EM');lamp(688,330,'EM');}}
    else {for(const [x,y]of [[154,249],[225,249],[493,251],[582,251],[154,391],[253,391],[356,391],[477,391]])lamp(x,y);}
    rect(710,462,24,35,1.3);txt('P1',715,484,9,true);txt('120/208V',696,510,6);
    // Dashed home run.
    for(let x=401;x<710;x+=12)line(x,344,x+6,344,.7);line(711,344,723,453,.7);txt('P1 / 1, 3, 5',540,340,6);
    if(revised&&sheet===0){for(let x=368;x<710;x+=12)line(x,309,x+6,309,.7);txt('P1 / 15',556,305,6);}
    // Dimension strings and grid bubbles.
    line(95,116,758,116,.5,light);for(const [x,n]of [[95,'1'],[280,'2'],[455,'3'],[630,'4'],[758,'5']]){circle(x,103,8,light);txt(n,x-2,106,7);line(x,115,x,134,.5,light);}txt('18 600',398,112,7);
    for(const [y,n]of [[140,'A'],[290,'B'],[360,'C'],[520,'D']]){circle(73,y,8,light);txt(n,70,y+3,7);line(82,y,93,y,.5,light);}
    line(95,550,758,550,.5,light);txt('5 200',162,545,7);txt('4 900',346,545,7);txt('4 900',520,545,7);txt('3 600',679,545,7);
    txt('1',55,577,12,true);txt(sheet===0?'LEVEL 01 - POWER & SYSTEMS':'LEVEL 01 - LIGHTING',79,577,11,true);txt('SCALE  1:100',79,588,6);
    txt('DRAWING NOTES',840,68,9,true);const notes=['1. Coordinate device locations','   with architectural drawings.','2. All dimensions are in mm.','3. Verify circuit designations','   against panel schedules.','4. Sample drawing for software','   demonstration only.'];notes.forEach((s,i)=>txt(s,838,90+i*14,6.5));
    txt('SYMBOL LEGEND',839,231,9,true);outlet(845,252);txt('Duplex receptacle',860,255,6);lamp(847,281,'');txt('Luminaire',868,284,6);txt('S',843,312,10);txt('Wall switch',861,312,6);
    line(830,344,958,344,.5,light);txt('REVISION RECORD',839,365,8,true);txt('A    Design development',839,386,6);if(revised)txt('B    Coordination update',839,405,6);
    rect(43,608,914,51,.7);line(673,608,673,659,.7);line(829,608,829,659,.7);
    txt('NORTHLINE',58,632,15,true,green);txt('WORKPLACE / DEMONSTRATION PROJECT',242,630,8,true);txt('Electrical design coordination',242,645,7);txt('DATE  2026-09-26',687,627,6);txt(`REVISION  ${revised?'B':'A'}`,687,644,8,true);txt(sheet===0?'E-101':'E-102',846,640,22,true);
  }
  return doc.save();
}
