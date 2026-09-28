import test from 'node:test';
import assert from 'node:assert/strict';
import {comparePixels,normalizeRect,cloudPath,csvCell,calculateLoad} from '../src/core.js';
const raster=(w=100,h=100)=>new Uint8ClampedArray(w*h*4).fill(255);
function square(data,x,y,size,width=100,shade=0){for(let yy=y;yy<y+size;yy++)for(let xx=x;xx<x+size;xx++){const i=(yy*width+xx)*4;data[i]=data[i+1]=data[i+2]=shade;}}
test('identical sheets produce no differences',()=>{const a=raster();square(a,20,20,10);const r=comparePixels(a,a,100,100);assert.equal(r.changed,0);assert.deepEqual(r.regions,[]);});
test('new drawing ink is blue and yields an added region',()=>{const a=raster(),b=raster();square(b,40,40,10);const r=comparePixels(a,b,100,100);assert.equal(r.changed,100);assert.equal(r.percent,1);assert.equal(r.regions.length,1);assert.equal(r.regions[0].kind,'added');assert.deepEqual([...r.output.slice((40*100+40)*4,(40*100+40)*4+4)],[35,111,199,255]);});
test('removed ink is red and yields a removed region',()=>{const a=raster(),b=raster();square(a,40,40,10);const r=comparePixels(a,b,100,100);assert.equal(r.regions[0].kind,'removed');assert.deepEqual([...r.output.slice(16160,16164)],[222,76,91,255]);});
test('nearby additions and deletions form a modified region',()=>{const a=raster(),b=raster();square(a,25,25,8);square(b,40,25,8);const r=comparePixels(a,b,100,100);assert.equal(r.regions.length,1);assert.equal(r.regions[0].kind,'modified');});
test('separate changes stay separate and bounds stay on sheet',()=>{const a=raster(),b=raster();square(b,0,0,5);square(b,95,95,5);const r=comparePixels(a,b,100,100);assert.equal(r.regions.length,2);for(const rgn of r.regions){assert.ok(rgn.x>=0&&rgn.y>=0&&rgn.x+rgn.w<=100&&rgn.y+rgn.h<=100);}});
test('sensitivity suppresses low-contrast scan noise',()=>{const a=raster(),b=raster();square(b,20,20,15,100,230);assert.equal(comparePixels(a,b,100,100,55).changed,0);assert.equal(comparePixels(a,b,100,100,15).changed,225);});
test('tiny isolated pixel noise does not create candidate clouds',()=>{const a=raster(),b=raster();square(b,20,20,1);assert.equal(comparePixels(a,b,100,100).regions.length,0);});
test('reverse drag normalizes cloud and produces closed scalloped geometry',()=>{const r=normalizeRect({x:80,y:90},{x:10,y:20});assert.deepEqual(r,{x:10,y:20,w:70,h:70});const path=cloudPath(r);assert.ok(path.startsWith('M 10 20 Q '));assert.ok(path.endsWith(' Z'));assert.ok(!path.includes('NaN'));});
test('CSV escapes quotes, newlines and spreadsheet formulas',()=>{assert.equal(csvCell('a"b'),'"a""b"');assert.equal(csvCell('=1+1'),'"\'=1+1"');assert.equal(csvCell('a\nb'),'"a\nb"');assert.equal(csvCell(null),'""');});
test('apparent load sums explicit device VA with phase conversion',()=>{assert.deepEqual(calculateLoad([{va:180},{va:180},{va:0}],120),{va:360,amps:3});const l=calculateLoad([{va:3600}],208,3);assert.ok(Math.abs(l.amps-3600/(208*Math.sqrt(3)))<1e-10);assert.deepEqual(calculateLoad([],120),{va:0,amps:0});});
