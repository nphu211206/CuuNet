// Execute the actual browser verification module against Python-generated fixtures.
// This is a Node numerical check, not a browser automation or latency benchmark.
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const args=process.argv.slice(2);
const value=(name,fallback)=>{const i=args.indexOf(name);return i<0?fallback:args[i+1];};
const casePath=path.resolve(value('--cases',path.join(root,'analysis/final_revision_20261123/task3/verification_golden_cases.json')));
const modulePath=path.resolve(value('--module',path.join(root,'public/research/verification.mjs')));
const output=path.resolve(value('--output',path.join(root,'analysis/final_revision_20261123/task3/numerical_parity_audit.json')));
const bytes=await fs.readFile(casePath);const fixtures=JSON.parse(bytes.toString('utf8'));
if(fixtures.format!=='cuunet-python-js-numerical-fixtures-v1'||fixtures.publication_eligible!==false)throw Error('Unexpected fixture contract');
const moduleBytes=await fs.readFile(modulePath);
const {verifyReports}=await import(pathToFileURL(modulePath));
const failures=[],rows=[];let maxDifference=0;
for(const fixture of fixtures.cases){
  const reports=structuredClone(fixture.reports);const before=JSON.stringify(reports);
  try{
    const actual=verifyReports(reports,fixture.options);const differences={};
    for(const key of ['disaster','noDisaster','uncertainty']){
      const difference=Math.abs(actual[key]-fixture.expected[key]);differences[key]=difference;
      maxDifference=Math.max(maxDifference,difference);
      if(!Number.isFinite(actual[key])||difference>fixtures.absolute_tolerance+fixtures.relative_tolerance*Math.abs(fixture.expected[key]))
        failures.push({id:fixture.id,key,expected:fixture.expected[key],actual:actual[key]});
    }
    for(const key of ['action','selected','groups','feedback'])if(actual[key]!==fixture.expected[key])
      failures.push({id:fixture.id,key,expected:fixture.expected[key],actual:actual[key]});
    if(JSON.stringify(reports)!==before)failures.push({id:fixture.id,key:'input_mutation'});
    rows.push({id:fixture.id,actual,absolute_differences:differences});
  }catch(error){failures.push({id:fixture.id,error:String(error)});}
}
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
if(sha(moduleBytes)!==sha(await fs.readFile(modulePath)))failures.push({key:'javascript_source_changed_during_execution'});
const result={passed:failures.length===0,cases:fixtures.cases.length,failures,max_absolute_mass_difference:maxDifference,
  fixture_sha256:sha(bytes),javascript_source_sha256:sha(moduleBytes),python_source_sha256:fixtures.python_source_sha256,
  checker_sha256:sha(await fs.readFile(fileURLToPath(import.meta.url))),fixture_generator_sha256:fixtures.fixture_generator_sha256,
  node_version:process.version,absolute_tolerance:fixtures.absolute_tolerance,relative_tolerance:fixtures.relative_tolerance,
  scope:fixtures.scope,publication_eligible:false,results:rows};
await fs.mkdir(path.dirname(output),{recursive:true});await fs.writeFile(output,JSON.stringify(result,null,2));
console.log(JSON.stringify({passed:result.passed,cases:result.cases,max_absolute_mass_difference:maxDifference,failures},null,2));
if(!result.passed)process.exitCode=1;
