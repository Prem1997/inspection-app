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
getDownloadURL
}
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";


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



const btn = document.querySelector("button");


// SAVE DATA

window.saveData = async function(){

btn.innerText="Saving...";
btn.disabled=true;


try{

let enteredBy = document.getElementById("enteredBy").value;
let name = document.getElementById("name").value;
let designation = document.getElementById("designation").value;
let location = document.getElementById("location").value;
let date = document.getElementById("date").value;
let time = document.getElementById("time").value;
let followup = document.getElementById("followup").value;
let file = document.getElementById("photo").files[0];

if(!enteredBy || !name || !designation ||
!location || !date || !time ||
!followup || !file){

alert("Fill all fields");

return;

}

let compressedFile = file;

if(file){

compressedFile = await compressImage(file);

}


let photoURL="";


/* Upload Photo Faster */

if(file){

let storageRef =
ref(storage,"inspectionPhotos/"+file.name+Date.now());

await uploadBytes(storageRef,compressedFile);

photoURL =
await getDownloadURL(storageRef);

}



/* Save Firestore */
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

editID=null;

alert("Updated Successfully");

}
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
photoURL

});

alert("Saved Successfully");

}

/* Clear Form */

document.getElementById("enteredBy").value="";
document.getElementById("name").value="";
document.getElementById("designation").value="";
document.getElementById("location").value="";
document.getElementById("date").value="";
document.getElementById("time").value="";
document.getElementById("followup").value="";
document.getElementById("photo").value="";


loadData();

}
catch(error){

alert("Error Saving Data");

console.log(error);

}


btn.innerText="Submit Inspection";
btn.disabled=false;

}

// AUTO GPS LOCATION

// GET LOCATION WITH PLACE NAME

window.getLocation = function(){

let locationBox =
document.getElementById("location");

locationBox.value = "Checking location...";


if(!navigator.geolocation){

locationBox.value =
"Location not supported";

return;

}


navigator.geolocation.getCurrentPosition(

async function(position){

let lat =
position.coords.latitude.toFixed(5);

let lon =
position.coords.longitude.toFixed(5);


/* Fetch Place Name */

try{

let response = await fetch(

"https://nominatim.openstreetmap.org/reverse?format=json&lat="
+ lat + "&lon=" + lon

);

let data = await response.json();

let place =

data.address.city ||
data.address.town ||
data.address.village ||
data.address.state ||
"Unknown";


locationBox.value =

place + " (" + lat + "," + lon + ")";

}
catch{

locationBox.value =

lat + "," + lon;

}

},


function(error){

if(error.code === 1){

locationBox.value =
"Allow location permission";

}

else if(error.code === 2){

locationBox.value =
"Turn ON mobile location";

}

else if(error.code === 3){

locationBox.value =
"Location timeout - Try again";

}

},

{
enableHighAccuracy:false,
timeout:7000,
maximumAge:60000
}

);

}


async function loadData(){

let records=
document.getElementById("records");

records.innerHTML="Loading...";

let querySnapshot=
await getDocs(
collection(db,"inspections")
);


records.innerHTML="";

let total=0;
let today=0;

let todayDate =
new Date().toISOString().split('T')[0];


querySnapshot.forEach(docSnap=>{

let d=docSnap.data();

let id=docSnap.id;

total++;

if(d.date==todayDate){

today++;

}


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


document.getElementById("totalCount").innerText=total;

document.getElementById("todayCount").innerText=today;

}

async function compressImage(file){

return new Promise((resolve)=>{

let img = new Image();

let reader = new FileReader();

reader.onload = function(e){

img.src = e.target.result;

};

img.onload = function(){

let canvas = document.createElement("canvas");

let maxWidth = 800;

let scale = maxWidth / img.width;

canvas.width = maxWidth;
canvas.height = img.height * scale;

let ctx = canvas.getContext("2d");

ctx.drawImage(img,0,0,
canvas.width,
canvas.height);

canvas.toBlob(function(blob){

resolve(blob);

},"image/jpeg",0.7);

};

reader.readAsDataURL(file);

});

}

loadData();


window.deleteData = async function(id){

if(confirm("Delete this inspection?")){

await deleteDoc(
doc(db,"inspections",id)
);

loadData();

}

}

let editID=null;


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