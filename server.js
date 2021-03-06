'use strict'

const express = require('express')
const Slapp = require('slapp')
const ConvoStore = require('slapp-convo-beepboop')
const Context = require('slapp-context-beepboop')

const otherBot = "<@A4Y0WSSTV|royalsbot2>";
const myName = "royalsbot1";

// use `PORT` env var on Beep Boop - default to 3000 locally
var port = process.env.PORT || 3000

var slapp = Slapp({
  // Beep Boop sets the SLACK_VERIFY_TOKEN env var
  verify_token: process.env.SLACK_VERIFY_TOKEN,
  convo_store: ConvoStore(),
  context: Context()
})


var HELP_TEXT = `
I will respond to the following messages:
\`help\` - to see this message.
\`hi\` - to demonstrate a conversation that tracks state.
\`thanks\` - to demonstrate a simple response.
\`<type-any-other-text>\` - to demonstrate a random emoticon response, some of the time :wink:.
\`attachment\` - to see a Slack attachment message.
`

//*********************************************
// Setup different handlers for messages
//*********************************************

// response to the user typing "help"
slapp.message('help', ['mention', 'direct_message'], (msg) => {
  msg.say(HELP_TEXT)
})

// "Conversation" flow that tracks state - kicks off when user says hi, hello or hey
slapp
  .message('^(hi|hello|hey)$', ['bot_message','direct_mention', 'direct_message'], (msg, text) => {
    msg
      .say(otherBot+` ${text}, how are you?`)
      // sends next event from user to this route, passing along state
      .route('how-are-you', { greeting: text })
  })
  .route('how-are-you', (msg, state) => {
    var text = (msg.body.event && msg.body.event.text) || ''

    // user may not have typed text as their next action, ask again and re-route
    if (!text) {
      return msg
        .say({text:otherBot + " Whoops, I'm still waiting to hear how you're doing."})
        .say({text:otherBot + ' How are you?'})
        .route('how-are-you', state)
    }

    // add their response to state
    state.status = text

    msg
      .say({text:otherBot + ` Ok then. What's your favorite color?`,"link_names":"1"})
      .route('color', state)
  })
  .route('color', (msg, state) => {
    var text = (msg.body.event && msg.body.event.text) || ''

    // user may not have typed text as their next action, ask again and re-route
    if (!text) {
      return msg
        .say({text:otherBot + " I'm eagerly awaiting to hear your favorite color.","link_names":"1"})
        .route('color', state)
    }

    // add their response to state
    state.color = text

    msg
      .say({text:otherBot + ' Thanks for sharing.',"link_names":"1"})
      .say({text:otherBot + `Here's what you've told me so far: \`\`\`${JSON.stringify(state)}\`\`\``,"link_names":"1"})
    // At this point, since we don't route anywhere, the "conversation" is over
  })

// Can use a regex as well
slapp.message(/^(thanks|thank you)/i, ['bot_message', 'mention', 'direct_message'], (msg) => {
  // You can provide a list of responses, and a random one will be chosen
  // You can also include slack emoji in your responses
  msg.say([
	  {text:otherBot + " You're welcome :smile:","link_names":"1"},
	  {text:otherBot + ' You bet',"link_names":"1"},
	  {text:otherBot + ' :+1: Of course',"link_names":"1"},
	  {text:otherBot + ' Anytime :sun_with_face: :full_moon_with_face:',"link_names":"1"}
  ])
})

// demonstrate returning an attachment...
slapp.message('attachment', ['bot_message','mention', 'direct_message'], (msg) => {
  msg.say({
    text: 'Check out this amazing attachment! :confetti_ball: ',
    attachments: [{
      text: 'Slapp is a robust open source library that sits on top of the Slack APIs',
      title: 'Slapp Library - Open Source',
      image_url: 'https://storage.googleapis.com/beepboophq/_assets/bot-1.22f6fb.png',
      title_link: 'https://beepboophq.com/',
      color: '#7CD197'
    }],
    "link_names":"1"
  })
})

// Catch-all for any other responses not handled above
slapp.message('/royalsbot1/i', ['bot_message','direct_mention', 'direct_message'], (msg) => {
  // respond only 40% of the time
	msg.say('you called?');
  
})


// Catch-all for any other responses not handled above
slapp.message('.*', ['bot_message','direct_mention', 'direct_message'], (msg) => {
  // respond only 40% of the time
  if (Math.random() < 0.4) {
    msg.say([':wave:', ':pray:', ':raised_hands:'])
  }
})

// attach Slapp to express server
var server = slapp.attachToExpress(express())

// start http server
server.listen(port, (err) => {
  if (err) {
    return console.error(err)
  }

  console.log(`Listening on port ${port}`)
})
