const getRoot = document.documentElement;

const moreDetails = document.getElementById("ID-btn-detail");
const displayDescription = document.getElementsByClassName("display-description");

var boolExpand = false;


moreDetails.onclick = function(){


    if(boolExpand == false){

    getRoot.style.setProperty('--image-height','70px');
    getRoot.style.setProperty('--description-height','180px');
    getRoot.style.setProperty('--display-3rd-row-height','180px');
    getRoot.style.setProperty('--display-1st-row-height','0px');
    getRoot.style.setProperty('--department-Yscale','0');

    boolExpand = true;

    } else {

    getRoot.style.setProperty('--image-height','170px');
    getRoot.style.setProperty('--description-height','0px');
    getRoot.style.setProperty('--display-3rd-row-height','0px');
    getRoot.style.setProperty('--display-1st-row-height','30px');
    getRoot.style.setProperty('--department-Yscale','1');

    boolExpand = false;

    }

    

    
    


    

}