import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";

import {
getFirestore,
collection,
addDoc,
getDocs
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

let enteredBy =
document.getElementById("enteredBy").value;

let name =
document.getElementById("name").value;

let designation =
document.getElementById("designation").value;

let location =
document.getElementById("location").value;

let date =
document.getElementById("date").value;

let time =
document.getElementById("time").value;

let followup =
document.getElementById("followup").value;

let file =
document.getElementById("photo").files[0];


let photoURL="";


/* Upload Photo Faster */

if(file){

let storageRef =
ref(storage,"inspectionPhotos/"+file.name+Date.now());

await uploadBytes(storageRef,file);

photoURL =
await getDownloadURL(storageRef);

}



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

alert("Inspection Saved Successfully");


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

// AUTO LOCATION

function autoLocation(){

if(navigator.geolocation){

navigator.geolocation.getCurrentPosition(

function(position){

let lat = position.coords.latitude;
let lon = position.coords.longitude;

document.getElementById("location").value =
lat + ", " + lon;

},

function(){

document.getElementById("location").value =
"Location not available";

}

);

}

}

autoLocation();


// LOAD DATA

async function loadData(){

let records =
document.getElementById("records");

records.innerHTML="Loading inspections...";


let querySnapshot =
await getDocs(
collection(db,"inspections")
);


records.innerHTML="";


querySnapshot.forEach(doc=>{

let d=doc.data();


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

</div>

`;

});

}



loadData();