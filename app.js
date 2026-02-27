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

let editID = null;



// AUTO DATE & TIME

function setCurrentDateTime(){

let dateBox = document.getElementById("date");
let timeBox = document.getElementById("time");

if(!dateBox || !timeBox) return;

let now = new Date();

let today =
now.toISOString().split("T")[0];

let hours =
String(now.getHours()).padStart(2,'0');

let minutes =
String(now.getMinutes()).padStart(2,'0');

dateBox.value = today;
dateBox.max = today;

timeBox.value = hours+":"+minutes;

}

setCurrentDateTime();



// LOCATION

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


box.value =
place+" ("+lat+","+lon+")";

}
catch{

box.value=lat+","+lon;

}

},

function(){

box.value="Turn ON mobile location";

},

{
enableHighAccuracy:false,
timeout:7000,
maximumAge:60000
}

);

}



// IMAGE COMPRESSION

async function compressImage(file){

return new Promise((resolve)=>{

let reader = new FileReader();

reader.onload=function(e){

let img=new Image();

img.src=e.target.result;

img.onload=function(){

let canvas=
document.createElement("canvas");

let maxWidth=800;

let scale=maxWidth/img.width;

canvas.width=maxWidth;

canvas.height=img.height*scale;

let ctx=
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



// SAVE DATA

window.saveData = async function(){

try{

let enteredBy =
document.getElementById("enteredBy")?.value.trim();

let name =
document.getElementById("name")?.value.trim();

let designation =
document.getElementById("designation")?.value.trim();

let location =
document.getElementById("location")?.value.trim();

let date =
document.getElementById("date")?.value;

let time =
document.getElementById("time")?.value;

let followup =
document.getElementById("followup")?.value.trim();

let file =
document.getElementById("photo")?.files[0];



if(!enteredBy || !name || !designation ||
!location || !date || !time ||
!followup){

alert("Fill all fields");

return;

}



if(!file && !editID){

alert("Take inspection photo");

return;

}



let photoURL="";


if(file){

let compressedFile =
await compressImage(file);

let storageRef =
ref(storage,"photos/"+Date.now()+".jpg");

await uploadBytes(
storageRef,
compressedFile
);

photoURL =
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

alert("Updated Successfully");

editID=null;

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

alert("Saved Successfully");

}


/* RETURN HOME */

window.location="index.html";


}
catch(error){

console.log(error);

alert("Save Failed");

}

}



// LOAD DATA (HOME PAGE)

async function loadData(){

let records =
document.getElementById("records");

if(!records) return;


let querySnapshot =
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


dataArray.sort((a,b)=>

b.created-a.created

);


records.innerHTML="";


dataArray.forEach(item=>{

let d=item.data;
let id=item.id;

records.innerHTML+=`

<div class="recordCard">

<div class="recordTitle">

${d.name}

</div>

<div class="recordText">
📍 ${d.location}
</div>

<div class="recordText">
📅 ${d.date} - ${d.time}
</div>

<div class="recordText">
👤 ${d.enteredBy}
</div>

${d.photoURL ?
`<img src="${d.photoURL}">` : ""}

<br>

<button class="editBtn"
onclick="window.location='inspection.html?id=${id}'">
Edit
</button>

<button class="deleteBtn"
onclick="deleteData('${id}')">
Delete
</button>

</div>

`;
});


let totalBox =
document.getElementById("totalCount");

let todayBox =
document.getElementById("todayCount");


if(totalBox)
totalBox.innerText=total;

if(todayBox)
todayBox.innerText=todayCount;

}

loadData();



// DELETE DATA + IMAGE

window.deleteData = async function(id){

if(confirm("Delete inspection?")){

let docSnap =
await getDoc(
doc(db,"inspections",id)
);

let data =
docSnap.data();

await deleteDoc(
doc(db,"inspections",id)
);


if(data.photoURL){

try{

let imageRef=
ref(storage,data.photoURL);

await deleteObject(imageRef);

}
catch(e){}

}


loadData();

}

}



// EDIT MODE

async function loadEditData(id){

let docSnap =
await getDoc(
doc(db,"inspections",id)
);

let d =
docSnap.data();

document.getElementById("enteredBy").value=d.enteredBy;
document.getElementById("name").value=d.name;
document.getElementById("designation").value=d.designation;
document.getElementById("location").value=d.location;
document.getElementById("date").value=d.date;
document.getElementById("time").value=d.time;
document.getElementById("followup").value=d.followup;

}



// CHECK EDIT PAGE

const params =
new URLSearchParams(window.location.search);

const id =
params.get("id");

if(id){

editID=id;

loadEditData(id);

}