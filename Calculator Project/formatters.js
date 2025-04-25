// Note: We decided not to include displayAllFormats here as it directly interacts with DOM elements for results.
// It's better suited for a UI update module or the calculation result handling.

/**
 * Formats a number for simple display with locale formatting and max 2 decimal places.
 * @param {number} num - The number to format.
 * @returns {string} The formatted number string, or '0'.
 */
function formatSimpleNumber(num) {
    if (typeof num !== 'number' || isNaN(num)) return '0';
    try {
        // Use options for consistency, limiting decimals
        const options = {
            maximumFractionDigits: 2
        };
        return num.toLocaleString('en-US', options);
    } catch (e) {
        // Fallback for very large numbers that might fail toLocaleString in some environments
        return num.toString();
    }
}

/**
 * Formats a number for display in stats, using K/M abbreviations or exponential notation for large numbers.
 * @param {number} num - The number to format.
 * @returns {string} The formatted stat number string, or '0'.
 */
function formatStatNumber(num) {
    if (typeof num !== 'number' || isNaN(num)) return '0';

    const absNum = Math.abs(num);

    // Exponential for very large numbers (>= 1 Billion)
    if (absNum >= 1e9) {
        return num.toExponential(2);
    }
    // Millions (M suffix)
    if (absNum >= 1e6) {
        let shortNum = num / 1e6;
        // More precision for smaller millions (e.g., 1.23M vs 12.3M)
        let formatted = shortNum.toLocaleString('en-US', {
            minimumFractionDigits: absNum < 10e6 ? 2 : 1,
            maximumFractionDigits: absNum < 10e6 ? 2 : 1
        });
        // Avoid trailing .0 (e.g., 10.0M -> 10M)
        formatted = formatted.replace(/\.0$/, '');
        return formatted + 'M';
    }
    // Thousands (K suffix)
    if (absNum >= 1e3) {
        let shortNum = num / 1e3;
        let formatted = shortNum.toLocaleString('en-US', {
            minimumFractionDigits: absNum < 10e3 ? 2 : 1,
            maximumFractionDigits: absNum < 10e3 ? 2 : 1
        });
        formatted = formatted.replace(/\.0$/, '');
        return formatted + 'K';
    }
    // Standard formatting for numbers less than 1000
    if (absNum < 1000) {
        return num.toLocaleString('en-US', { maximumFractionDigits: 2 });
    }
    // Fallback for any edge cases (should ideally not be reached often)
    return num.toLocaleString('en-US');
}

/**
 * Parses a formatted string (potentially with commas or K/M/B/T/Q suffixes) back into a number.
 * @param {string|number} str - The formatted string or number to parse.
 * @returns {number} The parsed number, or 0 if parsing fails.
 */
function parseFormattedNumber(str) {
    if (typeof str !== 'string' && typeof str !== 'number') return 0;
    if (typeof str === 'number') return isNaN(str) ? 0 : str; // Handle if already a number

    str = str.trim().toUpperCase().replace(/,/g, ''); // Clean up input

    // Handle scientific notation directly
    if (str.includes('E')) {
        const num = parseFloat(str);
        return isNaN(num) ? 0 : num;
    }

    const lastChar = str.slice(-1);
    const numPart = parseFloat(str.slice(0, -1));
    const fullNum = parseFloat(str);

    // If it parsed fully as a number AND the last char is not a known suffix, return the full number
    if (!isNaN(fullNum) && !['K', 'M', 'B', 'T', 'Q'].includes(lastChar)) {
        return fullNum;
    }

    // If the number part is invalid when a suffix is present, return 0
    if (isNaN(numPart) && ['K', 'M', 'B', 'T', 'Q'].includes(lastChar)) return 0;

    switch (lastChar) {
        case 'K': return numPart * 1e3;
        case 'M': return numPart * 1e6;
        case 'B': return numPart * 1e9;
        case 'T': return numPart * 1e12;
        case 'Q': return numPart * 1e15;
        default:
            // If no valid suffix, return the full number parsed earlier (or 0 if that was NaN)
            return isNaN(fullNum) ? 0 : fullNum;
    }
}


/**
 * Converts a number into its English word representation.
 * Handles integers and basic fractions. Limited by JavaScript's number precision and scale array length.
 * @param {number} number - The number to convert.
 * @returns {string} The number in words, or an error/fallback string.
 */
function convertNumberToWords(number) {
    // Arrays for number parts
    const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    // Add more scales if needed, but this covers a vast range
    const scales = [ '', 'Thousand', 'Million', 'Billion', 'Trillion', 'Quadrillion', 'Quintillion', 'Sextillion', 'Septillion', 'Octillion', 'Nonillion', 'Decillion', /* ... add many more if truly needed ... */ 'Centillion' ];

    if (typeof number !== 'number' || !isFinite(number)) {
        return 'Invalid Number';
    }
    if (number === 0) {
        return 'Zero';
    }

    // Check if number is too large for word conversion (beyond Centillion or limits)
    const MAX_SAFE_INTEGER_FOR_WORDS = BigInt("9".repeat((scales.length) * 3)); // Rough estimate based on scales array length
    let numForCheck;
    try {
        // Use Math.trunc to handle potential floating point inaccuracies before BigInt conversion
        numForCheck = number < 0 ? BigInt(Math.abs(Math.trunc(number))) : BigInt(Math.trunc(number));
    } catch (e) {
         console.error("Error converting number to BigInt for size check:", number, e);
         // Fallback for numbers too large for BigInt or other errors
         return number.toExponential(2) + " (Extremely large)";
    }

    if (numForCheck > MAX_SAFE_INTEGER_FOR_WORDS) {
        console.warn("Number too large for full word conversion, returning scientific.");
        return number.toExponential(2) + " (Too large for words)";
    }


    let isNegative = number < 0;
    if (isNegative) number = -number;

    // Separate integer and fractional parts carefully
    let integerPart;
    let fractionalPart = 0;
    try {
        // Use toLocaleString to avoid scientific notation issues for moderately large numbers before splitting
        const numStr = number.toLocaleString('en-US', { useGrouping: false, maximumFractionDigits: 20 });
        const parts = numStr.split('.');
        integerPart = BigInt(parts[0]);
        if (parts.length > 1) {
            // Ensure fractional part is handled correctly
            fractionalPart = parseFloat('0.' + parts[1]);
        }
    } catch(e) {
        console.error("Error processing number for words:", number, e);
        return "Number too large or invalid format"; // Handle cases where BigInt conversion fails
    }


    let words = isNegative ? 'Negative ' : '';

    // Helper function to convert a 3-digit chunk
    function convertHundreds(num) {
        let word = '';
        const h = Math.floor(num / 100);
        const r = num % 100;

        if (h > 0) {
            word += units[h] + ' Hundred';
        }

        if (r > 0) {
            if (word !== '') word += ' '; // Add space if hundred part exists

            if (r < 20) {
                word += units[r]; // Numbers 1-19
            } else {
                const t = Math.floor(r / 10);
                const o = r % 10;
                word += tens[t]; // Twenty, Thirty, etc.
                if (o > 0) {
                    word += '-' + units[o]; // Add unit (e.g., Twenty-One)
                }
            }
        }
        return word;
    }

    // Process the integer part
    if (integerPart === 0n) {
         if (fractionalPart === 0) words += 'Zero'; // Only add Zero if there's no fraction
         // If there IS a fractional part, we'll add " Point ..." later, so don't add "Zero" here.
    } else {
        let scaleIndex = 0;
        let tempWords = [];
        let currentInt = integerPart;

        while (currentInt > 0n) {
            if (scaleIndex >= scales.length) {
                // This should be caught by the earlier size check, but as a safeguard:
                console.error("Number exceeds defined scales during conversion:", number);
                return number.toExponential(2) + " (Too large for words)";
            }
            const chunk = Number(currentInt % 1000n); // Convert chunk to standard number for convertHundreds
            if (chunk !== 0) {
                const chunkWords = convertHundreds(chunk);
                // Add scale name (Thousand, Million, etc.) except for the first chunk (units)
                tempWords.push(chunkWords + (scaleIndex > 0 ? ' ' + scales[scaleIndex] : ''));
            }
            currentInt /= 1000n; // Move to the next chunk
            scaleIndex++;
        }
        words += tempWords.reverse().filter(w => w.trim()).join(', '); // Join chunks correctly
    }

    // Process the fractional part
    if (fractionalPart > 1e-9) { // Use a small tolerance for floating point issues
        words += ' Point';
        // Convert fractional part to string, take digits after '.', remove trailing zeros
        let fractionalStr = fractionalPart.toFixed(6).substring(2).replace(/0+$/, '');

        if (fractionalStr.length > 0) {
            for (const digit of fractionalStr) {
                words += ' ' + (units[parseInt(digit)] || 'Zero'); // Add word for each digit
            }
        } else {
            // If fractional part was effectively zero after rounding/trimming, remove " Point"
             words = words.replace(/ Point$/, '');
        }
    }

    return words.trim(); // Trim any leading/trailing spaces
}


// Export the formatting functions
export {
    formatSimpleNumber,
    formatStatNumber,
    parseFormattedNumber,
    convertNumberToWords
};