const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../src/main/resources/static/app.js'), 'utf8');
const boundary = source.indexOf("\n'use strict';\nconst $");
assert.ok(boundary > 0, 'the shipped game-rule module must be present');
const scope = { module: { exports: {} } };
vm.runInNewContext(source.slice(0, boundary), scope);
const rules = scope.module.exports;
test('last game advances to first and first reverses to last', () => {
  assert.equal(rules.nextIndex(5, 1, 6), 0);
  assert.equal(rules.nextIndex(0, -1, 6), 5);
  for(let index=0;index<6;index++) for(let step=-100;step<=100;step++) {
    const next=rules.nextIndex(index,step,6);
    assert.ok(next>=0 && next<6);
    assert.equal(rules.nextIndex(next,-step,6),index);
  }
});
test('empty feed never produces NaN',()=>assert.equal(rules.nextIndex(0,1,0),0));
test('stack landing keeps precisely the supported portion',()=>{
  assert.deepEqual({...rules.stackOverlap({x:100,width:100},{x:150,width:100})},{x:150,width:50});
  assert.equal(rules.stackOverlap({x:100,width:100},{x:210,width:80}).width,0);
  assert.deepEqual({...rules.stackOverlap({x:100,width:100},{x:100,width:100})},{x:100,width:100});
});
test('collision only occurs while vehicle and obstacle overlap',()=>{
  const car={x:60,y:195,width:30,height:36};
  assert.equal(rules.rectanglesOverlap(car,{x:60,y:200,width:30,height:20}),true);
  assert.equal(rules.rectanglesOverlap(car,{x:165,y:200,width:30,height:20}),false);
  assert.equal(rules.rectanglesOverlap(car,{x:60,y:231,width:30,height:20}),false);
});
test('orbit hit zone crosses zero radians correctly',()=>{
  assert.ok(rules.angularDistance(.05,Math.PI*2-.05)<.11);
  assert.equal(rules.angularDistance(0,Math.PI),Math.PI);
});
