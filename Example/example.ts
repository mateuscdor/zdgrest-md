import makeWASocket, { useSingleFileAuthState, AnyMessageContent, delay } from '@adiwajshing/baileys-md'

const { state, saveState } = useSingleFileAuthState('./auth_info_multi.json')
const express = require('express');
const http = require('http');
const app = express();
const port = process.env.PORT || 8000;
const server = http.createServer(app);
const { body, validationResult } = require('express-validator');

app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true
})

const sendMessageWTyping = async(msg: AnyMessageContent, jid: string) => {
    await sock.presenceSubscribe(jid)
    await delay(500)

    await sock.sendPresenceUpdate('composing', jid)
    await delay(2000)

    await sock.sendPresenceUpdate('paused', jid)

    await sock.sendMessage(jid, msg)
}

sock.ev.on('connection.update', (update) => {
    const { connection } = update
    if(connection === 'close') {
        console.log('closed connection')
    } else if(connection === 'open') {
        console.log('opened connection')
    }
})

sock.ev.on('messages.upsert', async m => {
    //console.log(JSON.stringify(m, undefined, 2))
    const msg = m.messages[0]
    const body = m.messages[0].message.conversation
    if(!msg.key.fromMe && m.type === 'notify' && body === 'Olá') {
        console.log('Enviando mensagem para: ', m.messages[0].key.remoteJid)
        sendMessageWTyping({ text: 'Oie, tudo bem?' }, msg.key.remoteJid)
    } 
    if(!msg.key.fromMe && m.type === 'notify' && body === 'Bom dia') {
        console.log('Enviando mensagem para: ', m.messages[0].key.remoteJid)
        console.log( m.messages[0].message.conversation)
        sendMessageWTyping({ text: 'Olá, bom dia!' }, msg.key.remoteJid)
    }
    if(!msg.key.fromMe && m.type === 'notify' && body === 'Boa tarde') {
        console.log('Enviando mensagem para: ', m.messages[0].key.remoteJid)
        console.log( m.messages[0].message.conversation)
        sendMessageWTyping({ text: 'Olá, boa tarde!' }, msg.key.remoteJid)
    }      
})

sock.ev.on('messages.update', m => console.log(m))
sock.ev.on('presence.update', m => console.log(m))
sock.ev.on('chats.update', m => console.log(m))
sock.ev.on('contacts.update', m => console.log(m))

sock.ev.on ('creds.update', saveState)

// APP
// POST
// SendText
app.post('/send-message', [
        body('number').notEmpty(),
        body('message').notEmpty(),
      ], async (req, res) => {

      const errors = validationResult(req).formatWith(({
      msg
      }) => {
      return msg;
      });

      if (!errors.isEmpty()) {
      return res.status(422).json({
      status: false,
      message: errors.mapped()
      });
      }

      const number = req.body.number;
      const numberDDI = number.substr(0, 2);
      const numberDDD = number.substr(2, 2);
      const numberUser = number.substr(-8, 8);
      const message = { text: req.body.message };

      if (numberDDD <= 30) {
      const numberZDG = numberDDI + numberDDD + "9" + numberUser + "@s.whatsapp.net";
      await sendMessageWTyping(message, numberZDG).then(response => {
      res.status(200).json({
        status: true,
        message: 'Mensagem enviada',
        response: response
      });
      }).catch(err => {
      res.status(500).json({
        status: false,
        message: 'Mensagem não enviada',
        response: err.text
      });
      });
      }
      else {
      const numberZDG = numberDDI + numberDDD + numberUser + "@s.whatsapp.net";
      await sendMessageWTyping(message, numberZDG).then(response => {
      res.status(200).json({
        status: true,
        message: 'Mensagem enviada',
        response: response
      });
      }).catch(err => {
      res.status(500).json({
        status: false,
        message: 'Mensagem não enviada',
        response: err.text
      });
      });
      }
    })

server.listen(port, function() {
    console.log('App running on *: ' + port);
  });

