// =====================================
// CBB THESIS TRACKER
// APP.JS
// =====================================



// ===============================
// DATABASE
// ===============================


let thesisData = JSON.parse(

localStorage.getItem("cbbThesis")

) || [];



let borrowHistory = JSON.parse(

localStorage.getItem("cbbHistory")

) || [];





// ===============================
// SAVE DATABASE
// ===============================


function saveDatabase(){


localStorage.setItem(

"cbbThesis",

JSON.stringify(thesisData)

);



localStorage.setItem(

"cbbHistory",

JSON.stringify(borrowHistory)

);



}







// ===============================
// DISPLAY THESIS
// ===============================


let currentSection="ALL";




function displayThesis(){



let table =

document.getElementById(
"thesisTable"
);



table.innerHTML="";





let filtered = thesisData.filter(item=>{


if(currentSection==="ALL")

return true;


return item.program===currentSection;



});







let search =

document
.getElementById("searchBox")
.value
.toLowerCase();





filtered = filtered.filter(item=>{


return(

item.id.toLowerCase()
.includes(search)


||

item.title.toLowerCase()
.includes(search)


||

item.authors.toLowerCase()
.includes(search)



);



});








if(filtered.length===0){


table.innerHTML=`

<tr>

<td colspan="7">

No Thesis Found

</td>

</tr>

`;


return;


}





filtered.forEach((item)=>{



let index =

thesisData.indexOf(item);




let statusClass =

item.status==="Available"

?

"available"

:

"borrowed";




let action =


item.status==="Available"


?


`

<button

class="action borrow-btn"

onclick="borrowThesis(${index})">

Borrow

</button>


`


:


`

<button

class="action return-btn"

onclick="returnThesis(${index})">

Return

</button>


`;





action += `


<button

class="action edit-btn"

onclick="editThesis(${index})">

Edit

</button>



<button

class="action delete-btn"

onclick="deleteThesis(${index})">

Delete

</button>


`;






table.innerHTML +=`


<tr>


<td>

${item.id}

</td>


<td>

${item.title}

</td>



<td>

${item.authors}

</td>



<td>

${item.date}

</td>



<td>

${item.adviser}

</td>



<td>


<span class="status ${statusClass}">

${item.status}

</span>


</td>



<td>

${action}

</td>


</tr>


`;





});



}









// ===============================
// DASHBOARD
// ===============================


function updateDashboard(){



document
.getElementById("totalCount")
.innerHTML=

thesisData.length;





document
.getElementById("availableCount")
.innerHTML=

thesisData.filter(

x=>x.status==="Available"

).length;







document
.getElementById("borrowedCount")
.innerHTML=

thesisData.filter(

x=>x.status==="Borrowed"

).length;



}









// ===============================
// ADD THESIS
// ===============================



document
.getElementById("addBtn")
.onclick=function(){


document
.getElementById("addModal")
.style.display="flex";


};







document
.getElementById("closeAdd")
.onclick=function(){


document
.getElementById("addModal")
.style.display="none";


};









document
.getElementById("saveThesis")
.onclick=function(){



let title =

document
.getElementById("titleInput")
.value;



let authors =

document
.getElementById("authorInput")
.value;



let date =

document
.getElementById("dateInput")
.value;



let adviser =

document
.getElementById("adviserInput")
.value;



let program =

document
.getElementById("programInput")
.value;






if(title==="" || authors==="" || adviser===""){


alert(
"Please complete information"
);


return;


}






let id =


"CBB26-"

+

program

+

String(

thesisData.length+1

)

.padStart(2,"0");








thesisData.push({


id:id,


title:title,


authors:authors,


date:date,


adviser:adviser,


program:program,


status:"Available"


});






saveDatabase();



displayThesis();



updateDashboard();






document
.getElementById("addModal")
.style.display="none";





alert(
"Thesis Added!"
);



};









// ===============================
// SECTION MENU
// ===============================


let menu =

document.querySelectorAll(
".menu"
);




menu.forEach(item=>{


item.onclick=function(){



menu.forEach(x=>

x.classList.remove("active")

);



this.classList.add("active");




currentSection =

this.dataset.section;





document
.getElementById("sectionTitle")
.innerHTML =

currentSection==="ALL"

?

"All Thesis"

:

currentSection+" Thesis";





if(currentSection==="HISTORY"){


document
.getElementById("historyPage")
.scrollIntoView();


}

else{


displayThesis();


}



};



});










// ===============================
// SEARCH
// ===============================


document
.getElementById("searchBox")
.onkeyup=function(){


displayThesis();


};









// ===============================
// BORROW
// ===============================



let selectedIndex=null;




function borrowThesis(index){


selectedIndex=index;



document
.getElementById("borrowModal")
.style.display="flex";


}







document
.getElementById("closeBorrow")
.onclick=function(){


document
.getElementById("borrowModal")
.style.display="none";


};







document
.getElementById("confirmBorrow")
.onclick=function(){



let name =

document
.getElementById("borrowerInput")
.value;





if(name===""){


alert(
"Enter borrower name"
);


return;


}






let thesis =

thesisData[selectedIndex];




thesis.status="Borrowed";



borrowHistory.push({


id:thesis.id,


borrower:name,


borrowDate:

new Date()
.toLocaleDateString(),


returnDate:"-",


status:"Borrowed"


});





saveDatabase();



displayThesis();



updateDashboard();



displayHistory();



document
.getElementById("borrowModal")
.style.display="none";



};









// ===============================
// RETURN
// ===============================



function returnThesis(index){



let thesis =

thesisData[index];



thesis.status="Available";





borrowHistory.forEach(item=>{


if(

item.id===thesis.id

&&

item.status==="Borrowed"

){


item.status="Returned";


item.returnDate=

new Date()
.toLocaleDateString();



}



});





saveDatabase();



displayThesis();



updateDashboard();



displayHistory();



}









// ===============================
// HISTORY
// ===============================


function displayHistory(){



let table=

document
.getElementById("historyTable");



table.innerHTML="";




borrowHistory.forEach(item=>{


table.innerHTML +=`


<tr>


<td>

${item.id}

</td>



<td>

${item.borrower}

</td>



<td>

${item.borrowDate}

</td>



<td>

${item.returnDate}

</td>



<td>


<span class="status

${

item.status==="Returned"

?

"available"

:

"borrowed"

}

">

${item.status}

</span>


</td>



</tr>


`;



});


}


// ===============================
// START SYSTEM
// ===============================



displayThesis();


updateDashboard();


displayHistory();

// ===============================
// EDIT THESIS
// ===============================


function editThesis(index){


let thesis = thesisData[index];



let newTitle = prompt(

"Edit Thesis Title",

thesis.title

);



let newAuthor = prompt(

"Edit Authors",

thesis.authors

);



let newDate = prompt(

"Edit Date",

thesis.date

);



let newAdviser = prompt(

"Edit Adviser",

thesis.adviser

);





if(newTitle){

thesis.title=newTitle;

}



if(newAuthor){

thesis.authors=newAuthor;

}



if(newDate){

thesis.date=newDate;

}



if(newAdviser){

thesis.adviser=newAdviser;

}




saveDatabase();


displayThesis();



alert(
"Thesis Updated!"
);



}

// ===============================
// DELETE THESIS
// ===============================


function deleteThesis(index){



let confirmDelete = confirm(

"Are you sure you want to delete this thesis?"

);




if(confirmDelete){



thesisData.splice(

index,

1

);



saveDatabase();



displayThesis();



updateDashboard();



alert(

"Thesis Deleted"

);



}



}

