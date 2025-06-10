1: const close=document.querySelector(".close"); 2: const
open=document.querySelector(".ham"); 3: const
menu=document.querySelector(".menu") 4: close.addEventListener("click",()=>{ 5:
menu.style.visibility="hidden"; 6: }) 7: open.addEventListener("click",()=>{ 8:
menu.style.visibility="visible"; 9: })