import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";

import {
getFirestore,
collection,
addDoc,
getDocs,
deleteDoc,
doc,
updateDoc
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


// FIREBASE CONFIG

const firebaseConfig = {
  apiKey: "AIzaSyAKi2IAVycP4Dgdf9S0cjufMw99WNf3gJQ",
  authDomain: "inspectionmyd.firebaseapp.com",
  projectId: "inspectionmyd",
  storageBucket: "inspectionmyd.firebasestorage.app",
  messagingSenderId: "869948339462",
  appId: "1:869948339462:web:e45032398665e0c8d9da87"
};


const app = initializeApp(firebaseConfig);

const db = getFirestore(app);
const storage = getStorage(app);



/* AUTO DATE & TIME */

function setCurrentDateTime(){

let now = new Date();

let today =
now.toISOString().split("T")[0];

let hours =
String(now.getHours()).padStart(2,'0');

let minutes =
String(now.getMinutes()).padStart(2,'0');

let currentTime =
hours+":"+minutes;

document.getElementById("date").value=today;
document.getElementById("time").value=currentTime;

document.getElementById("date").max=today;

}

setCurrentDateTime();



/* LOCATION WITH PLACE NAME */

window.getLocation = function(){

let box =
document.getElementById("location");

box.value="Fetching location...";

navigator.geolocation.getCurrentPosition(

async function(position){

let lat =
position.coords.latitude.toFixed(5);

let lon =
position.coords.longitude.toFixed(5);


try{

let response =
await fetch(
"https://nominatim.openstreetmap.org/reverse?format=json&lat="
+lat+"&lon="+lon
);

let data =
await response.json();

let place =

data.address.city ||
data.address.town ||
data.address.village ||
data.address.state ||
"Unknown";


box.value=
place+" ("+lat+","+lon+")";

}
catch{

box.value=lat+","+lon;

}

},

function(error){

box.value="Turn ON mobile location";

},

{
enableHighAccuracy:false,
timeout:7000,
maximumAge:60000
}

);

}



/* SAVE DATA */

window.saveData = async function(){

let btn =
document.querySelector("button");

btn.innerText="Saving...";
btn.disabled=true;


/* Get Values */

let enteredBy =
document.getElementById("enteredBy").value.trim();

let name =
document.getElementById("name").value.trim();

let designation =
document.getElementById("designation").value.trim();

let location =
document.getElementById("location").value.trim();

let date =
document.getElementById("date").value;

let time =
document.getElementById("time").value;

let followup =
document.getElementById("followup").value.trim();

let file =
document.getElementById("photo").files[0];



/* Mandatory */

if(!enteredBy || !name || !designation ||
!location || !date || !time ||
!followup || !file){

alert("Fill all fields and take photo");

btn.innerText="Submit Inspection";
btn.disabled=false;

return;

}



/* Compress Image */

let compressedFile =
await compressImage(file);



/* Upload Image */

let storageRef =
ref(storage,"photos/"+Date.now()+".jpg");

await uploadBytes(
storageRef,
compressedFile
);

let photoURL =
await getDownloadURL(storageRef);



/* Save Firestore */

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


alert("Saved Successfully");



/* CLEAR FORM */

document.getElementById("enteredBy").value="";
document.getElementById("name").value="";
document.getElementById("designation").value="";
document.getElementById("location").value="";
document.getElementById("date").value="";
document.getElementById("time").value="";
document.getElementById("followup").value="";
document.getElementById("photo").value="";



btn.innerText="Submit Inspection";
btn.disabled=false;


/* Reload Data */

loadData();

}



/* LOAD DATA */

async function loadData(){

let records=
document.getElementById("records");

records.innerHTML="Loading...";


let querySnapshot=
await getDocs(
collection(db,"inspections")
);


let dataArray=[];

let total=0;
let todayCount=0;

let todayDate=
new Date().toISOString().split("T")[0];


querySnapshot.forEach(docSnap=>{

let d=docSnap.data();

let id=docSnap.id;

let createdTime=
d.created || 0;


total++;

if(d.date==todayDate){

todayCount++;

}


dataArray.push({

id:id,
data:d,
created:createdTime

});

});


/* SORT NEWEST FIRST */

dataArray.sort((a,b)=>

b.created-a.created

);


records.innerHTML="";


dataArray.forEach(item=>{

let d=item.data;
let id=item.id;


records.innerHTML+=`

<div class="recordCard">

<b>Entered By:</b> ${d.enteredBy}<br>

<b>Name:</b> ${d.name}<br>

<b>Designation:</b> ${d.designation}<br>

<b>Location:</b> ${d.location}<br>

<b>Date:</b> ${d.date}<br>

<b>Time:</b> ${d.time}<br>

<b>Follow-up:</b> ${d.followup}<br>

${d.photoURL ?
`<img src="${d.photoURL}">` : ""}

<br>

<button class="editBtn"
onclick="editData('${id}')">

Edit
</button>

<button class="deleteBtn"
onclick="deleteData('${id}')">

Delete
</button>

</div>

`;

});


document.getElementById("totalCount").innerText=
total;

document.getElementById("todayCount").innerText=
todayCount;

}




// delete Data


window.deleteData = async function(id){

if(confirm("Delete inspection?")){

/* Get Record First */

let querySnapshot =
await getDocs(
collection(db,"inspections")
);

let photoURL="";

querySnapshot.forEach(docSnap=>{

if(docSnap.id==id){

photoURL=
docSnap.data().photoURL;

}

});


/* Delete Firestore Record */

await deleteDoc(
doc(db,"inspections",id)
);


/* Delete Image from Storage */

if(photoURL){

try{

let imageRef =
ref(storage,photoURL);

await deleteObject(imageRef);

}
catch(e){

console.log("Image delete error");

}

}


loadData();

}

}



/* EDIT */

window.editData = async function(id){

editID=id;

let querySnapshot=
await getDocs(
collection(db,"inspections")
);


querySnapshot.forEach(docSnap=>{

if(docSnap.id==id){

let d=docSnap.data();

document.getElementById("enteredBy").value=d.enteredBy;
document.getElementById("name").value=d.name;
document.getElementById("designation").value=d.designation;
document.getElementById("location").value=d.location;
document.getElementById("date").value=d.date;
document.getElementById("time").value=d.time;
document.getElementById("followup").value=d.followup;

}

});

}



loadData();


async function compressImage(file){

return new Promise((resolve)=>{

let reader = new FileReader();

reader.onload = function(e){

let img = new Image();

img.src = e.target.result;

img.onload = function(){

let canvas =
document.createElement("canvas");

let maxWidth = 800;

let scale =
maxWidth / img.width;

canvas.width = maxWidth;

canvas.height =
img.height * scale;

let ctx =
canvas.getContext("2d");

ctx.drawImage(
img,
0,
0,
canvas.width,
canvas.height
);


canvas.toBlob(function(blob){

resolve(blob);

},
"image/jpeg",
0.7);

};

};

reader.readAsDataURL(file);

});

}