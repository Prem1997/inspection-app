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



window.saveData = async function(){

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


if(file){

let storageRef=
ref(storage,"inspectionPhotos/"+Date.now());

await uploadBytes(storageRef,file);

photoURL=
await getDownloadURL(storageRef);

}


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

alert("Inspection Saved");

loadData();

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


querySnapshot.forEach(doc=>{

let d=doc.data();


records.innerHTML+=`

<div class="recordCard">

<div class="label">
Entered By:
</div>

${d.enteredBy}

<br><br>

<div class="label">
Inspector:
</div>

${d.name}

<br><br>

<div class="label">
Designation:
</div>

${d.designation}

<br><br>

<div class="label">
Location:
</div>

${d.location}

<br><br>

<div class="label">
Date:
</div>

${d.date}

<br><br>

<div class="label">
Time:
</div>

${d.time}

<br><br>

<div class="label">
Follow-up:
</div>

${d.followup}

<img src="${d.photoURL}">

</div>

`;

});

}


loadData();