import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Pusher from 'pusher'

//pusher config
const pusher = new Pusher({
    appId: "1189702",
    key: "afbd21c4a109a44da4cc",
    secret: "f2833aaaebfcfed444f3",
    cluster: "ap2",
    useTLS: true
  });

dotenv.config()
const mongoPw = process.env.MONGO_PW

const CONN_URL = `mongodb+srv://jugal09:${mongoPw}@cluster0.85adv.mongodb.net/enigma-chat?retryWrites=true&w=majority`

mongoose.connect(CONN_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})

mongoose.connection.once('open',async function(){
    const msgCollection = mongoose.connection.collection('chatmessages')
    const changeStream = msgCollection.watch()
    await changeStream.on('change',async function(change){
        console.log(change)
        if(change.operationType === 'insert'){
            const msgDetails = change.fullDocument
            pusher.trigger('messages','inserted', {
                chatRoomId: msgDetails.chatRoomId,
                postedByUser: msgDetails.postedByUser,
                message: msgDetails.message.messageText,
                createdAt: msgDetails.createdAt,
            })
        } else {
            console.log('error triggering pusher')
        }
    })
})

mongoose.connection.on('connected', () => {
    console.log('Database connected!')
})

mongoose.connection.on('reconnected', () => {
    console.log('Database has reconnected!')
})

mongoose.connection.on('error', error => {
    console.log('Databse has an error', error)
    mongoose.disconnect()
})

mongoose.connection.on('disconnected', () => {
    console.log('Database has disconnected!')
})