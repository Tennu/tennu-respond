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

### Requires
- [tennu-dblogger](https://github.com/LordWingZero/tennu-dblogger)
  - [tennu-dbcore](https://github.com/LordWingZero/tennu-dbcore)


### Installing Into Tennu

See Downloadable Plugins [here](https://tennu.github.io/plugins/).

### Tests:

- ```npm test```