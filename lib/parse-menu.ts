import { weekdays, type LunchPrice, type Menu } from './menus';
export function decode(s:string){return s.replace(/&(#x[\da-f]+|#\d+|amp|nbsp|lt|gt|quot|apos|ndash|mdash|eacute|auml|aring|ouml);/gi,(_,e:string)=>{if(e[0]==='#'){const n=e[1].toLowerCase()==='x'?parseInt(e.slice(2),16):parseInt(e.slice(1),10);return n>0&&n<=0x10ffff?String.fromCodePoint(n):'';}return ({amp:'&',nbsp:' ',lt:'<',gt:'>',quot:'"',apos:"'",ndash:'–',mdash:'—',eacute:'é',auml:'ä',aring:'å',ouml:'ö'} as Record<string,string>)[e.toLowerCase()]??'';});}
export function lines(html:string){return decode(html.replace(/<(script|style|noscript|svg)\b[^>]*>[\s\S]*?<\/\1>/gi,'').replace(/<!--[\s\S]*?-->/g,'').replace(/\s+/g,' ').replace(/<br\b[^>]*>|<\/(?:p|h[1-6]|li|div|section)>/gi,'\n').replace(/<[^>]+>/g,'')).split('\n').map(s=>s.replace(/\s+/g,' ').trim()).filter(s=>s&& !/^[*|\s]+$/.test(s));}
function priceAmount(text:string,pattern:RegExp){const value=Number(text.match(pattern)?.[1]);if(!Number.isInteger(value)||value<50||value>500)throw Error('Missing or invalid price');return value;}
function optionalAmount(text:string,pattern:RegExp){const value=Number(text.match(pattern)?.[1]);return Number.isInteger(value)&&value>=50&&value<=500?value:undefined;}
export function parsePrice(id:string,html:string):LunchPrice{
 const text=lines(html).join(' ');let amount:number,note:string|undefined;
 if(id==='matverkstan'){
   amount=priceAmount(text,/Dagens lunch\s*(\d{2,3})\s*(?:SEK|kr|:-)/i);
   const senior=optionalAmount(text,/Pensionär\s*(\d{2,3})\s*(?:SEK|kr|:-)/i);if(senior)note=`Pensionär ${senior} kr`;
 }else if(id==='mickes'){
   amount=priceAmount(text,/Dagens lunch\s*:\s*(\d{2,3})\s*(?::?-|kr)/i);
 }else if(id==='rejmes'){
   amount=priceAmount(text,/Dagens lunch serveras[\s\S]{0,220}?\s(\d{2,3})\s*kr/i);
   const takeaway=optionalAmount(text,/Avhämtning\s*(\d{2,3})\s*kr/i),senior=optionalAmount(text,/Seniorpris\s*(\d{2,3})\s*kr/i);
   note=[takeaway&&`Avhämtning ${takeaway} kr`,senior&&`senior ${senior} kr`].filter(Boolean).join(' · ')||undefined;
 }else if(id==='ganymeden'){
   amount=priceAmount(text,/DAGENS\s*(\d{2,3})\s*(?::?-|kr)/i);
   const takeaway=optionalAmount(text,/Endast dagensrätt\s*(\d{2,3})\s*(?::?-|kr)/i);if(takeaway)note=`Avhämtning från ${takeaway} kr`;
 }else if(id==='kockduon'){
   amount=priceAmount(text,/Dagens(?: lunch| rätt)?\s*:\s*(\d{2,3})\s*(?::?-|kr)/i);
   const takeaway=optionalAmount(text,/Avhämtning\s*:\s*(\d{2,3})\s*(?::?-|kr)/i);if(takeaway)note=`Avhämtning ${takeaway} kr`;
 }else if(id==='lhc'){
   amount=priceAmount(text,/Pris dagens lunch\s*(\d{2,3})\s*(?::?-|kr)/i);
   const discount=text.match(/medlemmar[\s\S]{0,100}?(\d{1,2})\s*%\s*rabatt/i)?.[1];if(discount)note=`LHC-medlemmar −${discount} %`;
 }else if(id==='matkultur'){
   amount=priceAmount(text,/PRIS\s*(\d{2,3})\s*(?::?-|kr)/i);
   const special=optionalAmount(text,/Veckans[^.]{0,150}?\s(\d{2,3})\s*(?::?-|kr)/i);if(special&&special!==amount)note=`Vissa veckorätter ${special} kr`;
 }else throw Error('Unsupported price source');
 return {amount,...(note?{note}:{})};
}
export function matverkstanPriceUrl(html:string){
 const restaurantId=html.match(/data-castit-restaurant-id="(\d+)"/i)?.[1],proxy=decode(html.match(/data-castit-pdf-proxy-url="([^"]+)"/i)?.[1]??'');
 const panel=[...html.matchAll(/<div class="[^"]*castit-weekpanel[^>]*>/gi)].find(match=>/\bis-active\b/i.test(match[0]))?.[0]??[...html.matchAll(/<div class="[^"]*castit-weekpanel[^>]*>/gi)][0]?.[0];
 const menuId=panel?.match(/data-menu-id="(\d+)"/i)?.[1],printType=html.match(/data-castit-print-type="([^"]+)"/i)?.[1]??'weekly';
 if(!restaurantId||!menuId||!proxy)throw Error('Missing Matverkstan price link');
 const url=new URL(proxy);if(url.protocol!=='https:'||!/(^|\.)nordrest\.se$/i.test(url.hostname))throw Error('Unexpected Matverkstan price host');
 url.search=new URLSearchParams({action:'castit_menu_pdf_proxy',restaurant_id:restaurantId,menu_id:menuId,print_type:printType,orientation:'portrait',show_allergens:'1',show_secondary_language:'0',switch_primary_secondary:'0',show_allergen_checkboxes:'0'}).toString();
 return url.toString();
}
export function parseMenu(id:string,html:string):Menu{
 const result:Menu={id,week:null,days:[[],[],[],[],[]],weekly:[],checkedAt:new Date().toISOString()};
 if(id==='matverkstan'){
   const panels=[...html.matchAll(/<div class="castit-weekpanel[^>]*data-week="(\d+)"[^>]*>/g)];
   if(!panels.length)throw Error('Missing week panel');
   const p=panels[0];result.week=Number(p[1]);const panel=html.slice(p.index,(panels[1]?.index)??html.indexOf('Klimato',p.index));
   for(const sec of panel.matchAll(/<section class="castit-day[^>]*>([\s\S]*?)<\/section>/g)){
     const title=lines(sec[1].split('</h3>')[0]).join(' ');const day=weekdays.findIndex(d=>title.startsWith(d));if(day<0)continue;
     for(const dish of sec[1].split('<div class="castit-dish-wrap">').slice(1)){
       const title=dish.match(/class="castit-dish__title"\s+data-sv="([^"]*)"/),desc=dish.match(/class="castit-dish__desc"\s+data-sv="([^"]*)"/);
       if(title)result.days[day].push(decode(title[1]+(desc?' '+desc[1]:'')));
     }
   }
 }else if(id==='matkultur'){
   const all=lines(html),start=all.findIndex(s=>/^Lunchmeny\s+(?:v\.|vecka)\s*\d{1,2}\b/i.test(s));
   if(start<0)throw Error('Missing Matkultur week');
   result.week=Number(all[start].match(/(?:v\.|vecka)\s*(\d{1,2})\b/i)?.[1]);
   let inMenu=false,day=-1;
   for(const text of all.slice(start+1)){
     if(/^Catering$/i.test(text))break;
     if(/^Dagens$/i.test(text)){inMenu=true;continue;}
     if(!inMenu)continue;
     const match=text.match(/^(Mån(?:dag)?|Tis(?:dag)?|Ons(?:dag)?|Tor(?:sdag)?|Fre(?:dag)?)\s*:\s*(.*)$/i);
     if(match){day=['mån','tis','ons','tor','fre'].indexOf(match[1].slice(0,3).toLowerCase());if(match[2])result.days[day].push(match[2]);}
     else if(/^Veckans\b/i.test(text)){result.weekly.push(text);day=-1;}
     else if(day>=0){result.days[day].push(text);}
   }
 }else{
   const all=lines(html);const start=all.findIndex(s=>/(?:vecka|v\.)\s*\d{1,2}\b/i.test(s)&&s.length<100);
   if(start<0)throw Error('Missing week');result.week=Number(all[start].match(/(?:vecka|v\.)\s*(\d{1,2})\b/i)?.[1]);
   let day=-1,weekly=false,heading='';
   const stops:Record<string,RegExp>={mickes:/^Frukost\s*:/i,rejmes:/^Kaffe, mackor/i,ganymeden:/^Öppet\b/i,kockduon:/^(Dagens:|Öppettider|Avhämtning)/i,lhc:/^(Alla medlemmar|Officiella leverantörer)/i};
   for(const text of all.slice(start+1)){
     if(stops[id]?.test(text))break;
     const index=weekdays.findIndex(d=>new RegExp('^'+d+'(?:\\s+Idag)?$','i').test(text));
     if(index>=0){day=index;weekly=false;continue;}
     if(/^(Hela veckan|Veckans\b)/i.test(text)){weekly=true;heading=text.replace(/:$/,'');continue;}
     if(day<0||/^(Idag|Lunch|Pris dagens|\d+:-)$/.test(text))continue;
     if(weekly){result.weekly.push((heading?heading+': ':'')+text);heading='';}
     else if(!result.days[day].includes(text))result.days[day].push(text);
   }
 }
 if(!result.week||result.week>53||result.days.filter(d=>d.length>0).length<3||result.days.some(d=>d.length>15||d.some(s=>s.length>700)))throw Error('Menu validation failed');
 return result;
}
