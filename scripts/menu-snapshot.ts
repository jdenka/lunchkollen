import { createHash } from 'node:crypto';
import { restaurants, calendar, type Menu } from '../lib/menus';
import { matverkstanPriceUrl, parseMenu, parsePrice } from '../lib/parse-menu';
export type Snapshot={schemaVersion:1;checkedAt:string;menus:Menu[]};
export function menuWeekStart(week:number,now:Date){
 const current=calendar(now),delta=((week-current.week+26+53)%53)-26;
 const d=new Date(now.toLocaleDateString('sv-SE',{timeZone:'Europe/Stockholm'})+'T00:00:00Z');d.setUTCDate(d.getUTCDate()-current.day+delta*7);
 // Search actual ISO weeks, including 52/53-week year boundaries.
 for(let n=-26;n<=26;n++){const candidate=new Date(d);candidate.setUTCDate(candidate.getUTCDate()+(n-delta)*7);if(calendar(candidate).week===week)return candidate.toISOString().slice(0,10);}
 throw Error('Unresolvable menu week');
}
async function fetchHtml(url:string,fetcher:typeof fetch){
 const response=await fetcher(url,{signal:AbortSignal.timeout(20000),headers:{'User-Agent':'Lunchkollen/1.0 (scheduled public lunch menu reader)','Accept':'text/html'}});
 if(!response.ok)throw Error('HTTP '+response.status);
 const html=await response.text();if(html.length>2500000)throw Error('Oversized source');return html;
}
export async function collect(previous:Snapshot|undefined,fetcher:typeof fetch=fetch,now=new Date()):Promise<Snapshot>{
 const checkedAt=now.toISOString();
 const menus=await Promise.all(restaurants.map(async r=>{
   const old=previous?.menus.find(m=>m.id===r.id);
   let html:string|undefined,menu:Menu;
   try{
     html=await fetchHtml(r.url,fetcher);
     const parsed=parseMenu(r.id,html);
     menu={...parsed,checkedAt,attemptedAt:checkedAt,weekStart:menuWeekStart(parsed.week!,now),fetchFailed:false};
   }catch{
     menu=old&&old.days.some(d=>d.length)?{...old,attemptedAt:checkedAt,fetchFailed:true}:{id:r.id,week:null,days:[[],[],[],[],[]],weekly:[],checkedAt:'',attemptedAt:checkedAt,error:true,fetchFailed:true};
   }
   try{
     const priceHtml=r.priceUrl?await fetchHtml(r.priceUrl,fetcher):r.id==='matverkstan'?await fetchHtml(matverkstanPriceUrl(html??''),fetcher):html;
     if(!priceHtml)throw Error('Missing price source');
     return {...menu,price:parsePrice(r.id,priceHtml),priceCheckedAt:checkedAt,priceFetchFailed:false};
   }catch{
     return {...menu,price:old?.price,priceCheckedAt:old?.priceCheckedAt,priceFetchFailed:true};
   }
 }));
 return {schemaVersion:1,checkedAt,menus};
}
export function fingerprint(snapshot:Snapshot){return createHash('sha256').update(JSON.stringify(snapshot.menus.map(({checkedAt,attemptedAt,priceCheckedAt,...menu})=>menu))).digest('hex');}
