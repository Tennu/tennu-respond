# tennu-respond

A plugin for the [tennu](https://github.com/Tennu/tennu) irc framework.

Maintains trigger words that will fire pre-determined responses. Can be set to only respond occasionally. Compatible with [tennu-admin-cooldown](https://github.com/LordWingZero/tennu-admin-cooldown).

### Usage
- ```"{{!}}respond add [-c=.3] <trigger>[/<trigger>/<trigger>]/<response>"```
- ```"{{!}}respond addtriggers <Response_ID> [-c=.3] <text>"```
- ```"{{!}}respond edit <type> <type_ID> [-c=.3] <new_text>"```
- ```"{{!}}respond remove <type> <type_ID>"```
- ```"{{!}}respond list"```

### Configuration
- defaultChance: when ```-c``` is omitted, the default chance will be used.

```Javascript
"respond":{
    "defaultChance": .3
}
```

### Special features
In the response you can use something called 'intent modifiers' and instead of the bot simply saying something to the channel, you can have the bot act, notice, and say as many times as you want in a single response.

So: ```!respond add -c=1 my trigger/my response%act%claps hands```

will result in the bot replying 'my response' and immediately after replying with an '/me claps hands'

You can start to see how useful this is. A single response can then turn into a multi-line response with all sorts of actions.

There are more to come, but currently here are the modifiers.

- %say%
- %act%
- %notice%
- %rainbow%
- %private%: Sends a PM to the user who triggered the trigger
- %nick%: bot output will swap this for a username.


### Requires
- [tennu-dblogger](https://github.com/LordWingZero/tennu-dblogger)
  - [tennu-dbcore](https://github.com/LordWingZero/tennu-dbcore)


### Installing Into Tennu

See Downloadable Plugins [here](https://tennu.github.io/plugins/).

### Tests:

- ```npm test```