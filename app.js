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

let editID=null;

window.saveData = async function(){

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





/* Mandatory Check */

if(!enteredBy || !name || !designation ||
!location || !date || !time ||
!followup){

alert("Fill all fields");

return;

}


/* Photo Mandatory */

let file =
document.getElementById("photo").files[0];

if(!file && editID==null){

alert("Please take inspection photo");

return;

}



/* Time Validation */

let now = new Date();

let today =
now.toISOString().split("T")[0];

let currentMinutes =
now.getHours()*60+now.getMinutes();

let parts=time.split(":");

let enteredMinutes =
parseInt(parts[0])*60+
parseInt(parts[1]);

if(date==today && enteredMinutes>currentMinutes){

alert("Time cannot be future");

return;

}



let photoURL="";

/* Keep old photo when editing */

if(editID==null){

let file =
document.getElementById("photo").files[0];

let storageRef=
ref(storage,"photos/"+Date.now());

await uploadBytes(storageRef,file);

photoURL=
await getDownloadURL(storageRef);

}


/* SAVE OR UPDATE */

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

alert("Updated Successfully");

editID=null;

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
photoURL,
created:Date.now()

});

alert("Saved Successfully");

}



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



/* DELETE */

window.deleteData = async function(id){

if(confirm("Delete inspection?")){

await deleteDoc(
doc(db,"inspections",id)
);

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