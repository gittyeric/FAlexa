# FAlexa

Create your own verbal commands that map to custom Javascript functions! Inspired by Alexa Skills, FAlexa (pronounced F-Alexa) gives you a simple, order-based syntax to safely call your Javascript or Typescript functions by flexible verbal command.  You don't have to give up your voice to Amazon or Google to get the benefits of modern voice recognition, since modern browsers now have it built in!  Falexa should work just fine in Chrome and in Firefox with some tweaking.

## Demo
Get a quick flavor of how FAlexa works by trying it out [here](https://letsmakeit.com/diy-voice-assistant/) (Chrome only!)

## Quick Example: Define a spoken multiply command

```

// 'Import' Falexa functions we'll be using
var {
    falexa, 
    createCmd,
    Require, Var, // directives
    Any, Numeric, // filters
} = Falexa;

// Make the command's run function speak aloud the product of 2 numbers
var runFunc = (paramMap) => ({
    outputMessage: `${paramMap.arg1 * paramMap.arg2}`,
});

// Create the syntax that the sentence must match to, an array of directives with filters
var matchSyntax = [
    Require(Any(['multiply'])), // First word must sound like 'multiply'
    Var('arg1', Numeric()),     // Next phrase must be numeric like 'twenty one'
    Require(Any(['and', 'with', 'times'])), // Require 1 of these words
    Var('arg2', Numeric()),
];

// Create the actual command
var multiplyCmd = createCmd(matchSyntax, runFunc);

// Create browser Falexa instance with default mic & voice
var multiplierBot = falexa( [multiplyCmd] );

// In some mouse or keyboard event handler, start falexa and the microphone!
multiplierBot.listen();
```

## Frontend Installation

Grab [dist/falexa.browser.min.js](https://github.com/gittyeric/FAlexa/blob/master/dist/falexa.browser.min.js) and add it to your HTML:

<script src="path/to/falexa.browser.min.js"></script>

This adds "Falexa" to Javascript globally; now you can run the example above!

## NPM Installation

```
npm install falexa
```

You can now import everything you need for the example above:
```
import {
    falexa, 
    createCmd,
    Require, Var, // directives
    Any, Numeric, // filters
} from 'falexa';
```

## Installation for Development and Modification

Make sure you have Git and Node.js version 8 (or above?) installed with npm as well, and Chrome browser for testing.
Run the following command line:

```
git clone https://github.com/gittyeric/FAlexa.git
npm install
npm run build
```

If you'd like to contribute, commit your work on a new branch and run the following:

```
npm run deploy-dry
```

If all tests pass, send a Pull Request in GitHub!

## How Verbal Command Matching works

An input sentence is passed into the interpretter, and each word is matched from left-to-right to the syntax you define in your command.  This syntax is a list of "directives" correlating to your function's parameter list, and "filters", which narrow down words in the input sentence for each directive. Each directive and it's filter will consume input words from left to right, leaving the remaining words for the next syntax directive to consume.  If non-stopwords are left over, or there aren't enough words to match all your syntax, your command will not be matched.  If all filtered directive values are valid and the command is the only match, the "command.runFunc" will be called with a parameter map passed in.  This parameter map will contain all the filter matches in Var or Option directives of your syntax.

## Fuzzy matching

Most filters do fuzzy matching, where phonetically similar words are considered as possible interpretations.  Fuzzy matches or multiple exact matches will trigger a verbal prompt before actually running.  Stopwords in the input sentence like 'the' or 'and' will be ignored, but only as necessary to force syntax matching.

### Directives

Your command's syntax is order-based and composed of "Directives", which typically map to a parameter in your Javascript function.  Each directive has one or more filters to refine matching.  There are 4 types:


<b>Var(name, filter)</b>: The filter must match, and the filtered result will be saved with variable name "name" which will show up in your custom function parameter list.


<b>Option(name, defaultValue, filter)</b>: Like a Var Directive, but can be skipped if the filter doesn't match to the remaining words, in which case defaultValue will be used instead without consuming input words.


<b>Require(filter)</b>: Like a Var Directive, but ignore the filtered value after consuming one or more words.


<b>Ignore(filter)</b>: Like Option, but ignore the filtered value.  Used to consume optional words that might exist, usually to keep them from showing up in the next directive.

### Filters

Filters are a chain of 1 or more functions that take all possible interpretations from the function before it, and filter them by some criteria.  Most functions reduce the number of matched, filtered words that will be used as the value for the chain's parent directive.  Some functions like Exact however, simply filter out fuzzy interpretations from previously run filters up the chain.  Filters are run like functions, from inner-most to outer-most, so that Any will run first and give it's results to Exact in the example: Exact(Any(['save', 'safe']))

### Phrase or Word Filters

<b>Phrase</b>(wordCount, filter = passThruFilter): Match a phrase of specific word length


<b>Word</b>(filter = passThruFilter): Match next 1 word from remaining words


<b>StopPhrase</b>(stopwords, includeStopword = false, filter = passThruFilter): Match a phrase by stopword. The match will exclude the stopword by default.


<b>Sentence</b>(filter: Filter = passThruFilter): Match all remaining words to the end of input, should only be used for last directive


### String & Numeric filters


<b>Any</b>(whitelist: string[], filter: Filter = passThruFilter): Match any phrases or words and pass them along


<b>GetAny</b>(whitelistGenerator: () => string[], filter: Filter = passThruFilter): Same as Any but dynamically generate the whitelist


<b>None</b>(blacklist: string[], filter: Filter = passThruFilter): Only match phrases or words that are NOT in the blacklist. All blacklist entries must have the same word count!
For multi-word length lists, use multiple Nones.


<b>GetNone</b>(blacklistGenerator: () => string[], filter: Filter = passThruFilter): Same as None but dynamically generate the blacklist


<b>Numeric</b>(min: number = Number.MIN_VALUE, max: number = Number.MAX_VALUE, filter: Filter = passThruFilter): Match any number including decimals like 3.14
Also match a spoken numeric phrase, like "one thousand and fourty two point five"
It will appear as a Number type in your command's runFunc

### Boolean Filters

<b>Or</b>(filters: Filter[]): Give back interpretations that match any of the filters.
Assume the minimum penalty across each words / VarType duplicate interpretation


<b>And</b>(filters: Filter[]): Give back only the interpretations that match words across all filters, and assume the worst penalty over all the filtered outputs across each interpretation


<b>Exact</b>(filter: Filter): Remove fuzzy matches returned by the parent filter passed in

### Custom Filters

Creating your own filter is pretty easy, check out how it's done in [syntax.ts](https://github.com/gittyeric/FAlexa/blob/master/src/phonetic/syntax.ts)!
