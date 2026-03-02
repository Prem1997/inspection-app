import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";

import {
getFirestore,
collection,
addDoc,
getDocs,
deleteDoc,
doc,
updateDoc,
getDoc
}
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
getStorage,
ref,
uploadBytes,
getDownloadURL,
deleteObject
}
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";


// FIREBASE

const firebaseConfig = {

apiKey:"AIzaSyAKi2IAVycP4Dgdf9S0cjufMw99WNf3gJQ",
authDomain:"inspectionmyd.firebaseapp.com",
projectId:"inspectionmyd",
storageBucket:"inspectionmyd.firebasestorage.app",
messagingSenderId:"869948339462",
appId:"1:869948339462:web:e45032398665e0c8d9da87"

};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

let editID=null;
let displayLimit = 8;



// AUTO DATE TIME

function setCurrentDateTime(){

let dateBox=document.getElementById("date");
let timeBox=document.getElementById("time");

if(!dateBox || !timeBox) return;

let now=new Date();

dateBox.value=now.toISOString().split("T")[0];
dateBox.max=dateBox.value;

timeBox.value=
String(now.getHours()).padStart(2,'0')+
":"+
String(now.getMinutes()).padStart(2,'0');

}

setCurrentDateTime();



// LOCATION

window.getLocation=function(){

let box=document.getElementById("location");

box.value="Fetching...";

navigator.geolocation.getCurrentPosition(

async function(position){

let lat=position.coords.latitude.toFixed(5);
let lon=position.coords.longitude.toFixed(5);

let response=await fetch(
"https://nominatim.openstreetmap.org/reverse?format=json&lat="
+lat+"&lon="+lon
);

let data=await response.json();

let place=

data.address.city||
data.address.town||
data.address.village||
data.address.state||
"Unknown";

box.value=place+" ("+lat+","+lon+")";

},

function(){

box.value="Turn ON Location";

}

);

}



// IMAGE COMPRESSION

async function compressImage(file){

return new Promise(resolve=>{

let reader=new FileReader();

reader.onload=function(e){

let img=new Image();

img.src=e.target.result;

img.onload=function(){

let canvas=document.createElement("canvas");

let maxWidth=800;

let scale=maxWidth/img.width;

canvas.width=maxWidth;
canvas.height=img.height*scale;

canvas.getContext("2d")
.drawImage(img,0,0,
canvas.width,canvas.height);

canvas.toBlob(blob=>{

resolve(blob);

},"image/jpeg",0.7);

};

};

reader.readAsDataURL(file);

});

}



// SAVE

window.saveData=async function(){

try{

let enteredBy=document.getElementById("enteredBy")?.value.trim();
let name=document.getElementById("name")?.value.trim();
let designation=document.getElementById("designation")?.value.trim();
let location=document.getElementById("location")?.value.trim();
let date=document.getElementById("date")?.value;
let time=document.getElementById("time")?.value;
let followup=document.getElementById("followup")?.value.trim();
let file=document.getElementById("photo")?.files[0];


if(!enteredBy||!name||!designation||
!location||!date||!time||!followup){

alert("Fill all fields");
return;

}


if(!file && !editID){

alert("Take photo");
return;

}


let photoURL="";


if(file){

let compressed=await compressImage(file);

let storageRef=
ref(storage,"photos/"+Date.now()+".jpg");

await uploadBytes(storageRef,compressed);

photoURL=
await getDownloadURL(storageRef);

}


/* UPDATE */

if(editID){

await updateDoc(
doc(db,"inspections",editID),
{

enteredBy,
name,
designation,
location,
date,
time,
followup,
photoURL

});

alert("Updated");

}


/* ADD */

else{

await addDoc(
collection(db,"inspections"),
{

enteredBy,
name,
designation,
location,
date,
time,
followup,
photoURL,
created:Date.now()

});

alert("Saved");

}


window.location="index.html";

}
catch(e){

console.log(e);
alert("Save Failed");

}

}



// LOAD DASHBOARD

async function loadData(){

let records=document.getElementById("records");

if(!records) return;


let search=
document.getElementById("searchBox")?.value.toLowerCase()||"";

let fromDate=
document.getElementById("fromDate")?.value;

let toDate=
document.getElementById("toDate")?.value;


let querySnapshot=
await getDocs(collection(db,"inspections"));

let docs = [];

docs.forEach(item=>{

let d=item.data;
let id=item.id;

docs.push({
id:docSnap.id,
data:docSnap.data()
});

});

/* SORT NEWEST FIRST */

docs.sort((a,b)=>

(b.data.created || 0) -

(a.data.created || 0)

);


let total=0;
let todayCount=0;

let today=
new Date().toISOString().split("T")[0];


records.innerHTML="";
let count = 0;


querySnapshot.forEach(docSnap=>{

let d=docSnap.data();
let id=docSnap.id;


total++;

if(d.date==today)
todayCount++;


/* SEARCH FILTER */

let matchSearch=

d.name.toLowerCase().includes(search)||
d.location.toLowerCase().includes(search);


/* DATE FILTER */

let matchDate=true;

if(fromDate)
matchDate=d.date>=fromDate;

if(toDate)
matchDate=d.date<=toDate;


if(matchSearch && matchDate && count < displayLimit){

count++;

records.innerHTML+=`

<div class="recordCard"
onclick="window.location='view.html?id=${id}'">

<div class="recordName">
${d.name}
</div>

<div class="recordSmall">
📅 ${d.date} ${d.time}
</div>

<div class="recordSmall">
📍 ${d.location}
</div>

</div>

`;

}

});


document.getElementById("totalCount").innerText=total;
document.getElementById("todayCount").innerText=todayCount;

}



// DELETE

window.deleteData=async function(id){

if(confirm("Delete?")){

let docSnap=
await getDoc(doc(db,"inspections",id));

let data=docSnap.data();

await deleteDoc(doc(db,"inspections",id));


if(data.photoURL){

let imageRef=
ref(storage,data.photoURL);

await deleteObject(imageRef);

}


loadData();

}

}



// EDIT

async function loadEditData(id){

let docSnap=
await getDoc(doc(db,"inspections",id));

let d=docSnap.data();

document.getElementById("enteredBy").value=d.enteredBy;
document.getElementById("name").value=d.name;
document.getElementById("designation").value=d.designation;
document.getElementById("location").value=d.location;
document.getElementById("date").value=d.date;
document.getElementById("time").value=d.time;
document.getElementById("followup").value=d.followup;

}



// VIEW PAGE

async function loadViewData(id){

let box=document.getElementById("viewData");

if(!box) return;

let docSnap=
await getDoc(doc(db,"inspections",id));

let d=docSnap.data();

box.innerHTML=`

<h3>${d.name}</h3>

<p><b>Entered By:</b> ${d.enteredBy}</p>

<p><b>Designation:</b> ${d.designation}</p>

<p><b>Location:</b> ${d.location}</p>

<p><b>Date:</b> ${d.date}</p>

<p><b>Time:</b> ${d.time}</p>

<p><b>Follow-up:</b><br>${d.followup}</p>

${d.photoURL?
`<img src="${d.photoURL}"
style="width:100%;border-radius:8px">`
:""}

<br><br>

<button class="editBtn"
onclick="window.location='inspection.html?id=${id}'">
Edit
</button>

`;

}



// PAGE DETECTION

const params=
new URLSearchParams(window.location.search);

const id=params.get("id");


if(document.getElementById("records"))
loadData();


if(id && document.getElementById("enteredBy")){

editID=id;
loadEditData(id);

}


if(id && document.getElementById("viewData"))
loadViewData(id);



// AUTO REFRESH

setInterval(()=>{

if(document.getElementById("records"))
loadData();

},10000);



// FILTER FUNCTIONS

window.filterData=function(){

loadData();

}


window.clearFilter=function(){

document.getElementById("searchBox").value="";
document.getElementById("fromDate").value="";
document.getElementById("toDate").value="";

loadData();

}

window.loadMoreData=function(){

displayLimit += 8;

loadData();

}