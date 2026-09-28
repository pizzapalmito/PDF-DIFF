import test from 'node:test';
import assert from 'node:assert/strict';
import {PDFDocument} from 'pdf-lib';
import {createDemo} from '../src/demo.js';
test('demo has two landscape sheets and distinct revisions',async()=>{const a=await createDemo(false),b=await createDemo(true);assert.notDeepEqual(a,b);for(const bytes of [a,b]){const doc=await PDFDocument.load(bytes);assert.equal(doc.getPageCount(),2);assert.deepEqual(doc.getPage(0).getSize(),{width:1000,height:700});}});
test('demo bytes are stable so saved reviews can be reopened',async()=>{assert.deepEqual(await createDemo(true),await createDemo(true));});
