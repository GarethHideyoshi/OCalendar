const rotas = document.querySelector(".rota");

const rootStyles = window.getComputedStyle(document.documentElement);

rotas.addEventListener("click", function(){

    rotato();

});

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    

async function rotato (){
    document.documentElement.style.setProperty('--duration',  '1s' );
    await delay(1);
    document.documentElement.style.setProperty('--rotate-logo',  '360deg' );
    await delay(1010);
    document.documentElement.style.setProperty('--duration',  '0.3s' );
    await delay(1);
    document.documentElement.style.setProperty('--rotate-logo',  '0deg' );
}