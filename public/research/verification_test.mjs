// Golden verification tests for verification.mjs
// Run with: node verification_test.mjs
// These golden values are derived from the Python sybil_pipeline_campaign.py logic.
// All parameters: epsilon=1km, minSamples=3, maxAge=6h, cell=0.25km, timeBin=0.5h, cap=0.95, threshold=0.75

import {verifyReports} from './verification.mjs';

let pass=0, fail=0;
function assert(label, condition, got){
  if(condition){console.log(`  ✓ ${label}`);pass++;}
  else{console.error(`  ✗ ${label} — got:`,got);fail++;}
}
function near(a,b,tol=1e-6){return Math.abs(a-b)<=tol;}

console.log('\n=== CuuNet verification.mjs golden tests ===\n');

// Test 1: No reports
{
  const r=verifyReports([]);
  console.log('Test 1: No reports');
  assert('disaster=0',r.disaster===0,r.disaster);
  assert('noDisaster=0',r.noDisaster===0,r.noDisaster);
  assert('uncertainty=1',r.uncertainty===1,r.uncertainty);
  assert('action=-1',r.action===-1,r.action);
  assert('selected=0',r.selected===0,r.selected);
}

// Test 2: Fewer than minSamples (all noise)
{
  const reports=[
    {id:'a',x:0,y:0,reputation:.8,claim:true,age:0.5,timestamp:0},
    {id:'b',x:0.1,y:0,reputation:.8,claim:true,age:0.5,timestamp:0},
  ];
  const r=verifyReports(reports);
  console.log('Test 2: Fewer than minSamples');
  assert('uncertainty=1 (no cluster)',r.uncertainty===1,r.uncertainty);
  assert('action=-1',r.action===-1,r.action);
  assert('selected=0',r.selected===0,r.selected);
}

// Test 3: Honest majority cluster (disaster=true), remote outliers
{
  const honest=[
    {id:'h1',x:0,  y:0,  reputation:.9,claim:true,age:0.2,timestamp:0},
    {id:'h2',x:0.3,y:0.3,reputation:.85,claim:true,age:0.3,timestamp:0},
    {id:'h3',x:0.5,y:0,  reputation:.8,claim:true,age:0.4,timestamp:0},
  ];
  const remote=[
    {id:'r1',x:50,y:50,reputation:.7,claim:false,age:0.1,timestamp:0},
  ];
  const r=verifyReports([...honest,...remote]);
  console.log('Test 3: Honest cluster + remote outlier');
  assert('selected=3 (remote excluded)',r.selected===3,r.selected);
  assert('disaster >= 0.75',r.disaster>=0.75,r.disaster);
  assert('action=1 (disaster)',r.action===1,r.action);
}

// Test 4: Pure no-disaster reports
{
  const reports=[
    {id:'n1',x:0,  y:0,  reputation:.8,claim:false,age:0.1,timestamp:0},
    {id:'n2',x:0.2,y:0.1,reputation:.8,claim:false,age:0.2,timestamp:0},
    {id:'n3',x:0.4,y:0,  reputation:.8,claim:false,age:0.3,timestamp:0},
  ];
  const r=verifyReports(reports);
  console.log('Test 4: No-disaster cluster');
  assert('noDisaster >= 0.75',r.noDisaster>=0.75,r.noDisaster);
  assert('action=0 (no disaster)',r.action===0,r.action);
}

// Test 5: Stale reports (age > maxAge=6) → all excluded
{
  const reports=[
    {id:'s1',x:0,  y:0,  reputation:.9,claim:true,age:7,timestamp:0},
    {id:'s2',x:0.2,y:0,  reputation:.9,claim:true,age:8,timestamp:0},
    {id:'s3',x:0.4,y:0.1,reputation:.9,claim:true,age:9,timestamp:0},
  ];
  const r=verifyReports(reports);
  console.log('Test 5: Stale reports excluded');
  assert('uncertainty=1 (all stale)',r.uncertainty===1,r.uncertainty);
  assert('action=-1',r.action===-1,r.action);
}

// Test 6: Positive/negative conflict — mixed cluster, decision near threshold
{
  const reports=[
    {id:'c1',x:0,  y:0,  reputation:.9,claim:true, age:0.1,timestamp:0},
    {id:'c2',x:0.2,y:0.2,reputation:.9,claim:true, age:0.2,timestamp:0},
    {id:'c3',x:0.4,y:0,  reputation:.9,claim:false,age:0.1,timestamp:0},
    {id:'c4',x:0,  y:0.4,reputation:.9,claim:false,age:0.2,timestamp:0},
    {id:'c5',x:0.3,y:0.3,reputation:.9,claim:true, age:0.3,timestamp:0},
  ];
  const r=verifyReports(reports);
  console.log('Test 6: Mixed conflict cluster');
  assert('uncertainty > 0 (conflict)',r.uncertainty>0,r.uncertainty);
  // sum of mass beliefs must be <= 1
  assert('disaster+noDisaster+uncertainty <= 1+eps',r.disaster+r.noDisaster+r.uncertainty<=1+1e-6,r.disaster+r.noDisaster+r.uncertainty);
  assert('no reputation feedback frozen',r.feedback==='frozen',r.feedback);
}

// Test 7: Duplicate IDs — reports deduplicated shouldn't explode (IndexedDB deduplicates by ID)
// verifyReports doesn't deduplicate — that is the caller's responsibility (put() in IndexedDB).
// Just verify it doesn't throw.
{
  let threw=false;
  try{
    const reports=[
      {id:'d1',x:0,  y:0,  reputation:.8,claim:true,age:0.1,timestamp:0},
      {id:'d1',x:0.1,y:0,  reputation:.8,claim:true,age:0.2,timestamp:0}, // same id
      {id:'d2',x:0.3,y:0.1,reputation:.8,claim:true,age:0.3,timestamp:0},
    ];
    verifyReports(reports);
  }catch(e){threw=true;}
  console.log('Test 7: Duplicate IDs (no throw)');
  assert('no throw on duplicate IDs',!threw,threw);
}

// Test 8: Neutral cold start — single valid report (< minSamples)
{
  const reports=[{id:'cold1',x:0,y:0,reputation:.9,claim:true,age:0.1,timestamp:0}];
  const r=verifyReports(reports);
  console.log('Test 8: Cold start (1 report)');
  assert('uncertainty=1',r.uncertainty===1,r.uncertainty);
  assert('groups=0',r.groups===0,r.groups);
}

// Test 9: Too many reports throws
{
  let threw=false;
  try{
    const reports=Array.from({length:501},(_,i)=>({id:`x${i}`,x:0,y:0,reputation:.5,claim:true,age:0,timestamp:0}));
    verifyReports(reports);
  }catch(e){threw=true;}
  console.log('Test 9: Over 500 reports rejects');
  assert('throws on >500 reports',threw,threw);
}

// Test 10: Invalid parameter throws
{
  let threw=false;
  try{ verifyReports([], {threshold: 0.4}); }catch(e){threw=true;}
  console.log('Test 10: Invalid threshold < 0.5 rejects');
  assert('throws on invalid params',threw,threw);
}

console.log(`\n=== Results: ${pass} passed, ${fail} failed ===\n`);
process.exit(fail>0?1:0);
