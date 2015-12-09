# tennu-respond

A plugin for the [tennu](https://github.com/Tennu/tennu) irc framework.

Maintains trigger words that will fire pre-determined responses. Can be set to only respond occasionally. Compatible with [tennu-admin-cooldown](https://github.com/LordWingZero/tennu-admin-cooldown).

# PRE-ALPHA
Id say this plugin is only 20% done. Its not yet on NPM.

## Examples
// [TODO:Ownix] Imgur images of usage

### Usage
- ```!respond add [-c=<%>] <trigger>[<trigger>/<trigger>]/<response>```
    - -c ( Alias: -chance ) === a double between 0.0 and 1.0
- ```!respond list [-p=<#>]```
    - -p ( Alias: -page ) === a page of results. Defaults to 1.
- ```!respond search [-p=<PAGENUMBER>] <trigger/response>```
    - -p ( Alias: -page ) === a page of results. Defaults to 1.
- ```!respond edit trigger <ID> <new text>```
- ```!respond edit response <ID> <new text>```
- ```!respond del trigger <ID>```
- ```!respond del response <ID>```

### Configuration

- **resultsPerPage** : when you list, it will show 8 results. To see next page: !listrespond -p 2

```` Javascript
"respond": {
    "defaultTriggerChance": .3,
    "resultsPerPage": 6
}
````

### Requires
- [tennu-admin](https://github.com/Tennu/tennu-admin)
- [tennu-dblogger](https://github.com/LordWingZero/tennu-dblogger)
  - [tennu-dbcore](https://github.com/LordWingZero/tennu-dbcore)


### Installing Into Tennu

See Downloadable Plugins [here](https://tennu.github.io/plugins/).

### Todo:

- Tests