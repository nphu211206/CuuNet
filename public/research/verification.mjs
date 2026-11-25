// Local batch verification. No identity authentication or global consensus.
export function verifyReports(reports, options={}) {
  const p={epsilon:1,minSamples:3,maxAge:6,cell:.25,timeBin:.5,cap:.95,threshold:.75,terrain:false,...options};
  if (!(p.epsilon>0 && p.minSamples>=1 && p.maxAge>0 && p.cell>0 && p.timeBin>0 && p.cap>0 && p.cap<1 && p.threshold>.5 && p.threshold<1)) throw Error('Invalid verification parameters');
  if (!Array.isArray(reports) || reports.length>500) throw Error('Use at most 500 reports per local batch');
  reports.forEach(r=>{if (![r.x,r.y,r.age,r.reputation].every(Number.isFinite) || r.age<0 || r.reputation<0 || r.reputation>1 || typeof r.claim!=='boolean') throw Error('Invalid report');});
  const eligible=reports.map((r,i)=>r.age<=p.maxAge?i:-1).filter(i=>i>=0);
  const neighbours=i=>eligible.filter(j=>(reports[i].x-reports[j].x)**2+(reports[i].y-reports[j].y)**2<=p.epsilon**2);
  const labels=new Map(), visited=new Set(); let count=0;
  for(const i of eligible){
    if(visited.has(i)) continue; visited.add(i); const near=neighbours(i);
    if(near.length<p.minSamples){labels.set(i,-1);continue;}
    labels.set(i,count); const queue=[...near], queued=new Set(near);
    for(let k=0;k<queue.length;k++){
      const j=queue[k];
      if(!visited.has(j)){visited.add(j);const more=neighbours(j);if(more.length>=p.minSamples) for(const n of more) if(!queued.has(n)){queued.add(n);queue.push(n);}}
      if(!labels.has(j)||labels.get(j)===-1) labels.set(j,count);
    }
    count++;
  }
  const sizes=Array(count).fill(0); for(const label of labels.values()) if(label>=0) sizes[label]++;
  const largest=sizes.length?sizes.indexOf(Math.max(...sizes)):-1;
  const chosen=eligible.filter(i=>labels.get(i)===largest && largest>=0);
  if(!chosen.length) return {disaster:0,noDisaster:0,uncertainty:1,action:-1,selected:0,groups:0,feedback:'frozen'};
  const cx=chosen.reduce((s,i)=>s+reports[i].x,0)/chosen.length, cy=chosen.reduce((s,i)=>s+reports[i].y,0)/chosen.length;
  const groups=new Map();
  for(const i of chosen){
    const r=reports[i], terrain=p.terrain?1-.35*Math.min(Math.abs(r.y)/.75,1):1;
    const mass=Math.min(p.cap,r.reputation*Math.exp(-((r.x-cx)**2+(r.y-cy)**2)/p.epsilon**2)*Math.exp(-r.age/p.maxAge)*terrain);
    const key=[Math.floor(r.x/p.cell),Math.floor(r.y/p.cell),Math.floor(r.age/p.timeBin)].join(',');
    const g=groups.get(key)??[0,0]; const side=r.claim?0:1; g[side]=Math.max(g[side],mass); groups.set(key,g);
  }
  let la=0,lb=0; for(const [yes,no] of groups.values()){la+=Math.log1p(-yes);lb+=Math.log1p(-no);}
  const top=Math.max(la,lb), a=Math.exp(la-top), b=Math.exp(lb-top), u=Math.exp(la+lb-top), denominator=a+b-u;
  const disaster=-Math.expm1(la)*b/denominator, noDisaster=-Math.expm1(lb)*a/denominator, uncertainty=u/denominator;
  const action=disaster>=p.threshold?1:noDisaster>=p.threshold?0:-1;
  return {disaster,noDisaster,uncertainty,action,selected:chosen.length,groups:groups.size,feedback:'frozen'};
}
