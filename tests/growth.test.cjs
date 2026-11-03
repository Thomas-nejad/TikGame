const test = require('node:test');
const assert = require('node:assert/strict');
const {spawnSync} = require('node:child_process');
const rules = require('../src/main/resources/static/growth.js');

test('opening the site has no effect; recording a completed round is idempotent per day', () => {
  assert.equal(rules.state(null,'2026-11-03').count,0);
  const first = rules.advance(null,'2026-11-03');
  assert.deepEqual(first,{last:'2026-11-03',count:1,best:1});
  assert.deepEqual(rules.advance(first,'2026-11-03'),first);
  assert.equal(rules.advance(first,'2026-11-04').count,2);
});
test('skipped days reset the current count but preserve the personal best', () => {
  const old={last:'2026-11-01',count:7,best:9};
  assert.equal(rules.state(old,'2026-11-03').count,0);
  assert.deepEqual(rules.advance(old,'2026-11-03'),{last:'2026-11-03',count:1,best:9});
  assert.equal(rules.state(old,'2026-11-02').alive,true);
});
test('invalid stored dates, malformed numbers and a clock moving backward do not create fake streaks',()=>{
  for(const value of ['oops',{}, {last:'2026-02-30',count:99}, {last:'2026-11-03',count:'9'}, {last:'2026-11-03',count:-1}]) assert.equal(rules.state(value,'2026-11-03').count,0);
  assert.equal(rules.state({last:'2026-11-05',count:5},'2026-11-03').alive,false);
  assert.equal(rules.advance({last:'2026-11-05',count:5,best:5},'2026-11-03').count,1);
  assert.equal(rules.ordinal('2026-02-29'),null);
  assert.notEqual(rules.ordinal('2028-02-29'),null);
});
test('streaks follow calendar dates through Berlin daylight saving changes',()=>{
  const script=`const r=require(${JSON.stringify(require.resolve('../src/main/resources/static/growth.js'))});
    const a=r.dayKey(new Date('2026-03-28T12:00:00+01:00'));
    const b=r.dayKey(new Date('2026-03-29T12:00:00+02:00'));
    const c=r.dayKey(new Date('2026-10-24T12:00:00+02:00'));
    const d=r.dayKey(new Date('2026-10-25T12:00:00+01:00'));
    if(r.advance(r.advance(null,a),b).count!==2||r.advance(r.advance(null,c),d).count!==2)process.exit(1);`;
  const result=spawnSync(process.execPath,['-e',script],{env:{...process.env,TZ:'Europe/Berlin'},encoding:'utf8'});
  assert.equal(result.status,0,result.stderr);
});
test('daily pick uses a single UTC day for friends in different time zones',()=>{
  assert.equal(rules.dailyIndex(new Date('2026-11-03T01:30:00+01:00'),6),rules.dailyIndex(new Date('2026-11-02T16:30:00-08:00'),6));
  assert.notEqual(rules.dailyIndex(new Date('2026-11-03T23:59:59Z'),6),rules.dailyIndex(new Date('2026-11-04T00:00:00Z'),6));
});
test('share copy distinguishes fewer moves from higher points without claiming a fake duration',()=>{
  assert.match(rules.shareText({title:'Match Club',lower:true},6),/fewer moves/);
  assert.match(rules.shareText({title:'Tap Rush'},8),/8 points/);
  assert.doesNotMatch(rules.shareText({title:'Tap Rush'},null),/60-second|I got/);
});
