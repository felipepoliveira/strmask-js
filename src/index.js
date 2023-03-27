const WildcardsPatterns = {
    "#" : /\d/,
    "A" : /[a-zA-Z]/,
    "X" : /([a-zA-Z]|\d)/
}

/**
 * 
 * @param {any} placeholder 
 * @returns {string}
 */
function assertValidPlaceholder(placeholder) {
    if (!placeholder || typeof placeholder !== "string" || placeholder.length != 1) {
        throw new Error(`Invalid placeholder. It should be an string with 1 character. "${placeholder}" given`)
    }
    return placeholder;
}

class CharacterPattern {
    /**
     * 
     * @param {RegExp | undefined} regex 
     * @param {string} placeholder
     */
    constructor(regex, placeholder) {
        this.regex = regex;
        this.placeholder = assertValidPlaceholder(placeholder);
    }

    /**
     * Validate if an given value matches with the regex patter associated with this object. If
     * the value is considered valid the value will be returned by this functions, otherwise it will
     * return the placeholder character
     * @param {string} value 
     * @returns 
     */
    validate(value) {
        if (!value || typeof value !== "string" || value.length != 1 || !this.regex.test(value)) {
            return this.placeholder;
        }
        
        return value;
    }
}

/**
 * 
 * @param {string} format
 * @returns {CharacterPattern[]}
 */
function processFormat(format, placeholder = " ") {
    
    assertValidPlaceholder(placeholder);

    // assert if the format is a valid string
    if (!format || typeof format !== "string") {
        throw new Error(`Invalid format given ${format}. It should be an string`);
    }

    const  charactersPatterns = [];
    for (let i = 0; i < format.length; i++) {
        const curChar = format.charAt(i);

        // if the current character is an wildcard of a pattern 
        // add the wildcard regex pattern as the pattern of the character pattern
        // and the given placeholder as the placeholder
        if (WildcardsPatterns[curChar]) {
            charactersPatterns.push(new CharacterPattern(WildcardsPatterns[curChar], placeholder));
        }
        // otherwise, the wildcard of the character pattern will be undefined
        // and the current character will be used as placeholder
        else {
            charactersPatterns.push(new CharacterPattern(undefined, curChar));
        }
    }

    return charactersPatterns;
}

class Mask {

    /**
     * Create an instance of the mask object
     * @param {string} format 
     */
    constructor(format, placeholder = " ") {
        
        // assert that placeholder is an string with 1 character
        this.placeholder = assertValidPlaceholder(placeholder);
        this.charactersPatterns = processFormat(format, placeholder);
    }

    get placeholderMask() {
        let placeholderMask = "";
        this.charactersPatterns.forEach(cp => placeholderMask += cp.placeholder);
        return placeholderMask;
    }

    /**
     * 
     * @param {string} value 
     * @returns 
     */
    mask(value) {
        // ignore with the given input is not an string
        if (!value || typeof value !== "string") {
            return this.placeholderMask;
        }

        let returnedValue = "";
        let curValueCharIndex = 0;

        for (let i = 0; i < this.charactersPatterns.length; i++) {
            const currentCharPattern = this.charactersPatterns[i];

            // skip if the value does not have more characters to be processed
            if (curValueCharIndex >= value.length) {
                returnedValue += currentCharPattern.placeholder;
                continue;
            }

            let curValueChar = value.charAt(curValueCharIndex);

            // if the current character pattern has an regex...
            if (currentCharPattern.regex) {

                // skip all value characters that does not match the current character pattern
                while (curValueCharIndex < value.length && !currentCharPattern.regex.test(curValueChar)) {
                    curValueCharIndex++;
                    curValueChar = value.charAt(curValueCharIndex);
                }
                if (currentCharPattern.regex.test(curValueChar)) {
                    returnedValue += curValueChar;
                    curValueCharIndex++
                }
            }
            else {
                returnedValue += currentCharPattern.placeholder;
            }
        }

        return returnedValue;
    }

    unmask(value) {
        // ignore with the given input is not an string
        if (!value || typeof value !== "string") {
            return "";
        }

        let returnedValue = "";

        for (let i = 0; i < this.charactersPatterns.length; i++) {
            const currentCharPattern = this.charactersPatterns[i];
            const curValueChar = (i < value.length) ? value.charAt(i) : undefined

            if (currentCharPattern.regex && curValueChar && currentCharPattern.regex.test(curValueChar)) {
                returnedValue += curValueChar;
            }
        }

        return returnedValue;
    }

    update(value) {
        return this.mask(this.unmask(value));
    }
}

function maskBuilder(format, placeholder = " ", value = "") {
    return new Mask(format, placeholder, value);
}

module.exports = maskBuilder;