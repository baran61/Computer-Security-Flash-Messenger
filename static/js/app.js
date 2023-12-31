// const prefix = 'http://127.0.0.1:8080'
const prefix = ''

let listOfMessages = []
let UserDetails = {
    emailId: '',
    pubKey: ''
}

let loggedInUSer = {
    email: '',
    name: ''
}

// get msg for user, decrypting it nad then showing it to user
async function getMsgsForUser() {

    privateKeyData = window.name
    console.log(' console.log( window.name) privateKeyData')
    console.log( privateKeyData)
    // decryptWithPrivateKey
    const privateKey = await window.crypto.subtle.importKey(
        "jwk",
        JSON.parse(privateKeyData),
        {
            name: "RSA-OAEP",
            hash: { name: "SHA-256" },
        },
        true,
        ["decrypt"]
    );
   
    var msgEle = document.getElementById("messages");
    ele ='' 
    console.log('loggedInUSer', sessionStorage.getItem('loggedInUSeremail'))
    fetch(prefix+'/getMsg/'+sessionStorage.getItem('loggedInUSeremail'), {
        method: 'GET',

    }).then(response => response.json())
    .then(async (data) => {
    
        if(data.rows.length == 0) {
            
            ele+=" <div class='cursor-pointer'>No New Messages</div>"
        } else {
            listOfMessages = data.rows
            
            for (row in data.rows) {
                r = data.rows[row]
                const decryptedMSgText = await decryptWithPrivateKey(privateKey, listOfMessages[row][1])
                console.log('decrypted msg',decryptedMSgText)
                // ele+=" <div class='msg-background' onclick='showMsg('"+decryptedMSgText+"')'>"+  r[2]+"</div> <br>"
                ele+=" <div class='msg-background'>"+  r[2]+"</div> <br>"
                ele+= "<div>"+decryptedMSgText+"</div>"
            }
        }
        msgEle.innerHTML = ele  
}).catch( err => {
    alert('unable to fetch user messages')
    console.log(err)
  })
}

 async function showMsg(msg) {
        alert(msg)
}

// creating new messages
function createMsgsForUser() {
    var arealist = document.getElementById("area-list");
    ele =''
    fetch(prefix+'/createMsg/' + userId, {
        method: 'POST',
        body: JSON.stringify({
            recieverId:'' ,
            message: ''
        })
    }).then(response => response.json())
    .then((data) => {
        alert('msg has been sent')
}).catch( err => {
    alert('unable to create user messages')
    console.log(err)
  })
}

//delete messages for user 
function deleteMsgsForUser() {
    var arealist = document.getElementById("area-list");
    ele =''
    fetch(prefix+'/deleteMsg/'+msgId, {
        method: 'PUT',
    }).then(response => response.json())
    .then((data) => {
}).catch( err => {
    alert('unable to delete user messages')
    console.log(err)
  })
}

// navigate to pages
function navigate(page) {
    if(page == 'createMsg') {
        window.location.assign("createMsg");

    } else if(page == 'readMsg') {
        window.location.assign("userMsgs");
    }
}

//  user user details from facebook api and generating keys
async function getUSerData(req) {
    console.log('getUSerData')
    await fetch('https://graph.facebook.com/' + 
    req.userID+"?fields=id,name,email&access_token="+ req.accessToken ).then(response => response.json())
    .then(async (data) => {
        // console.log('user Data from facebook')
        // console.log(data)
        sessionStorage.setItem('loggedInUSeremail',data.email)
        sessionStorage.setItem('loggedInUSername',data.name)
        await fetch(prefix+'/createUser', {
            method: 'POST',
            body: JSON.stringify({
                emailId: sessionStorage.getItem('loggedInUSeremail')
            })
        }).then(response => response.json())
        .then(async (data) => {
            alert('user logged in')
                    // Generate and display the RSA public key
                    const rsaKeyPair = await generateRSAKeyPair();
                    const publicKey = rsaKeyPair.publicKey;
                    const publicKeyData = await exportPublicKey(publicKey);
                    const privateKey = rsaKeyPair.privateKey;
                    const privateKeyData = await window.crypto.subtle.exportKey("jwk", privateKey);
                    // localStorage.setItem("privateKey", JSON.stringify(privateKeyData));
                    window.name =  JSON.stringify(privateKeyData)

                    savePublicKey(publicKeyData)
        }).catch( err => {
        alert('unable to login user ')
        console.log(err)
        })




}).catch( err => {
    alert('unable get user data from facebook')
    console.log(err)
  })

}

//  user availability is checked  if user is online then user is able to send message
async function checkUserAvailabliity(){
    var messageArea = document.getElementById('message-area');
    var sendBtn = document.getElementById('send-btn');
    var notFound = document.getElementById('userNotFound');  
    var userId =  document.getElementById('recipient').value;
    ele ='' 
    await fetch('/getUser/'+userId, {
        method: 'GET'
    }).then(response => response.json())
    .then((data) => {
        if(data.rows.length == 0) {
            
            messageArea.style.display = 'none'
            sendBtn.style.display = 'none'
            notFound.innerHTML = "<div>User is not available</div>"
            //no user
        } 
        
        else {
            messageArea.style.display = 'none'
            sendBtn.style.display = 'none'
            UserDetails.emailId = data.rows[0][0]
            sessionStorage.setItem('UserDetailsemailId',data.rows[0][0])
            data.rows[0][1].split("|")
            pubKeyobj = {
                e:data.rows[0][1].split("|")[0],
                kty:data.rows[0][1].split("|")[1],
                n:data.rows[0][1].split("|")[2]
            }
            UserDetails.pubKey = pubKeyobj
            sessionStorage.setItem('UserDetailspubKey',JSON.stringify( pubKeyobj))
          

            if(  sessionStorage.getItem('UserDetailspubKey')  == '') {
                alert('user offline')
            } else {
                messageArea.style.display = 'block'
                sendBtn.style.display = 'block'
                notFound.innerHTML = ""
            }
        //    user is online
        }
}).catch( err => {
    alert('user not available')
    console.log(err)
  })
}

// when user sends message it is encrypted
async function sendMsg(){
    const publicKey = await window.crypto.subtle.importKey(
        "jwk",
        JSON.parse(sessionStorage.getItem('UserDetailspubKey')),
        {
            name: "RSA-OAEP",
            hash: { name: "SHA-256" },
        },
        true,
        ["encrypt"]
    );
    const messageForm = document.getElementById('messageForm');
    const sender = sessionStorage.getItem('loggedInUSeremail'); // Replace this with the actual sender's username.
    const recipient = document.getElementById('recipient').value;
    const message = document.getElementById('message').value;
    const encryptMessageText = await encryptWithPublicKey(publicKey, message);

    await fetch('/createMsg', {
        method: 'POST',
        body: JSON.stringify({ message:encryptMessageText , recieverId:recipient, sender:sender }),
    }).then(response => response.json())
    .then((data) => {
        alert('Message sent successfully!');
}).catch( err => {
    alert('user not available')
    console.log(err)
  })
}

// clearing generated public key from db once user logges out
function clearPublicKey(res){
        fetch(prefix+'/clearKey' , {
            method: 'PUT',
            body: JSON.stringify({
                emailID: sessionStorage.getItem('loggedInUSeremail'),
            })
        }).then(response => response.json())
        .then((data) => {
            localStorage.clear();
            sessionStorage.clear();
    }).catch( err => {
        alert('unable to delete user key')
        console.log(err)
      })
    
}


// saving generated public key to db
function savePublicKey(publicKey){
    fetch(prefix+'/generateKey', {
        method: 'PUT',
        body: JSON.stringify({
            emailID: sessionStorage.getItem('loggedInUSeremail'),
            publicKey:JSON.parse(publicKey)
        })
    }).then(response => response.json())
    .then((data) => {
        window.location.assign("createMsg");
}).catch( err => {
    alert('unable to save user key')
    console.log(err)
  })

}