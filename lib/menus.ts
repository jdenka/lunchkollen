export const weekdays=['Måndag','Tisdag','Onsdag','Torsdag','Fredag'];
export const restaurants=[
 {id:'matverkstan',name:'Matverkstan',mark:'M',subtitle:'Nordrest · Campus',url:'https://www.nordrest.se/restaurang/matverkstan/'},
 {id:'mickes',name:'Mickes Lunchservering',mark:'m.',subtitle:'Åsbjörnsgatan · Husmanskost',url:'https://mickeslunchservering.com/'},
 {id:'rejmes',name:'Rejmes',mark:'R',subtitle:'Vigfastgatan · Lunchrestaurang',url:'https://rejmes.se/dagens-lunch/linkoping/'},
 {id:'ganymeden',name:'Ganymeden',mark:'G',subtitle:'Roxengatan · Lunchrestaurang',url:'https://ganymeden.se/'},
 {id:'kockduon',name:'Kockduon',mark:'k.',subtitle:'Roxtorpsgatan · Lunch & catering',url:'https://www.kockduon.se/dagens-lunch/'},
 {id:'lhc',name:'LHC · Restaurang Rekomo',mark:'LHC',subtitle:'Saab Arena · Lunchrestaurang',url:'https://www.lhc.eu/lunch'},
 {id:'matkultur',name:'Matkultur',mark:'mk',subtitle:'Gudmunsgatan · Lunch & catering',url:'https://www.matkultur.eu/#lunchmeny'}];
export type Menu={id:string;week:number|null;days:string[][];weekly:string[];checkedAt:string;error?:boolean;attemptedAt?:string;fetchFailed?:boolean;weekStart?:string};
export function calendar(now=new Date()){
 const d=new Date(now.toLocaleDateString('sv-SE',{timeZone:'Europe/Stockholm'})+'T00:00:00Z'),day=(d.getUTCDay()+6)%7,mon=new Date(d);mon.setUTCDate(d.getUTCDate()-day);const thu=new Date(mon);thu.setUTCDate(mon.getUTCDate()+3);
 const week=Math.ceil((((thu.getTime()-Date.UTC(thu.getUTCFullYear(),0,1))/86400000)+1)/7),dates=weekdays.map((_,i)=>{const n=new Date(mon);n.setUTCDate(mon.getUTCDate()+i);return n.toLocaleDateString('sv-SE',{day:'numeric',month:'short',timeZone:'UTC'});});
 return{week,day,dates,range:dates[0]+' – '+dates[4],year:thu.getUTCFullYear(),weekStart:mon.toISOString().slice(0,10)};
}
