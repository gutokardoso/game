
import { useEffect, useState } from 'react'
const products=[
{name:'Amaciante',image:'/products/amaciante.png'},
{name:'Essência',image:'/products/essencia.png'},
{name:'Lava-Roupas',image:'/products/lava_roupas.png'},
{name:'Limpa Pisos',image:'/products/limpa_pisos.png'}
]
function randomProduct(){return products[Math.floor(Math.random()*products.length)]}
export default function App(){
const [score,setScore]=useState(0)
const [time,setTime]=useState(45)
const [target,setTarget]=useState(randomProduct())
const [started,setStarted]=useState(false)
useEffect(()=>{
if(!started)return
const timer=setInterval(()=>{
setTime(prev=>{
if(prev<=1){clearInterval(timer);setStarted(false);return 0}
return prev-1
})
},1000)
return()=>clearInterval(timer)
},[started])
function startGame(){setScore(0);setTime(45);setStarted(true);setTarget(randomProduct())}
function handleClick(product){
if(product.name===target.name){setScore(s=>s+10);setTarget(randomProduct())}
else{setScore(s=>Math.max(0,s-5))}
}
return(
<div style={{padding:'30px'}}>
<h1 style={{color:'#d4af37',fontSize:'48px'}}>UAU Market Challenge</h1>
<button onClick={startGame} style={{padding:'16px 32px',fontSize:'22px',background:'#d4af37',border:'none',borderRadius:'20px'}}>START GAME</button>
<h2>Tempo: {time}s | Score: {score}</h2>
<h2>Encontre: {target.name}</h2>
<div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'20px'}}>
{Array.from({length:20}).map((_,index)=>{
const product=products[index%products.length]
return(
<button key={index} onClick={()=>handleClick(product)} style={{background:'#111',border:'1px solid #333',borderRadius:'24px',padding:'20px'}}>
<img src={product.image} style={{height:'220px',objectFit:'contain'}} />
<p style={{color:'white'}}>{product.name}</p>
</button>
)
})}
</div>
</div>
)
}
