// I18n.js
// =======
//
// This small library provides the Rails I18n API on the Javascript.
// You don't actually have to use Rails (or even Ruby) to use I18n.js.
// Just make sure you export all translations in an object like this:
//
//     I18n.translations.en = {
//       hello: "Hello World"
//     };
//
// See tests for specific formatting like numbers and dates.
//
;(function(I18n){
  "use strict";

  var that = I18n;

  // Just cache the Array#slice function.
  var slice = Array.prototype.slice;

  // Apply number padding.
  var padding = function(number) {
    return ("0" + number.toString()).substr(-2);
  };

  // Set default days/months translations.
  var DAYS_AND_MONTHS = {
      day_names: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    , abbr_day_names: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    , month_names: [null, "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
    , abbr_month_names: [null, "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  };

  // Set default number format.
  var NUMBER_FORMAT = {
      precision: 3
    , separator: "."
    , delimiter: ","
    , strip_insignificant_zeros: false
  };

  // Set default currency format.
  var CURRENCY_FORMAT = {
      unit: "$"
    , precision: 2
    , format: "%u%n"
    , delimiter: ","
    , separator: "."
  };

  // Set default percentage format.
  var PERCENTAGE_FORMAT = {
      precision: 3
    , separator: "."
    , delimiter: ""
    , format: "%n%"
  };

  // Set default size units.
  var SIZE_UNITS = [null, "kb", "mb", "gb", "tb"];

  // Set meridian.
  var MERIDIAN = ["AM", "PM"];

  I18n.reset = function() {
    // Set default locale. This locale will be used when fallback is enabled and
    // the translation doesn't exist in a particular locale.
    that.defaultLocale = "en";

    // Set the current locale to `en`.
    that.locale = "en";

    // Set the translation key separator.
    that.defaultSeparator = ".";

    // Set the placeholder format. Accepts `{{placeholder}}` and `%{placeholder}`.
    that.placeholder = /(?:\{\{|%\{)(.*?)(?:\}\}?)/gm;

    // Set fallbacks for each locale
    that.fallbacks = {};

    // Set the default translation object.
    that.translations = {};
  };

  // Hold pluralization rules.
  I18n.pluralization = {};

  // Return the pluralizer for a specific locale.
  // If no specify locale is found, then I18n's default will be used.
  I18n.pluralization.get = function(locale) {
    return this[locale] || this[I18n.locale] || this["default"];
  };

  // The default pluralizer rule.
  // It detects the `zero`, `one`, and `other` scopes.
  I18n.pluralization["default"] = function(count) {
    switch (count) {
      case 0: return ["zero", "other"];
      case 1: return ["one"];
      default: return ["other"];
    }
  };

  // Reset all default attributes. This is specially useful
  // while running tests.
  I18n.reset();

  // Return current locale. If no locale has been set, then
  // the current locale will be the default locale.
  I18n.currentLocale = function() {
    return that.locale || that.defaultLocale;
  };

  // Check if value is different than undefined and null;
  I18n.isSet = function(value) {
    return value !== undefined && value !== null;
  };

  var merge = function(a,b){
    var result = {};
    a = a || {};
    b = b || {};

    for(var key1 in a){
      if(a.hasOwnProperty(key1)){
        result[key1] = a[key1];
      }
    }

    for(var key2 in b){
      if(b.hasOwnProperty(key2)){
        result[key2] = b[key2];
      }
    }

    return result;
  };

  var unique = function(array){
    var uniq = [];
    for(var i=0; i < array.length; i++){
      var element = array[i];
      if(uniq.indexOf(element) < 0){ uniq.push(element); }
    }
    return uniq;
  };

  var localeLookup = function(scope, locale) {
    var scopes       = scope.split(that.defaultSeparator);
    var translations = that.translations[locale];
    if(translations === undefined || translations === null){ return; }

    while (scopes.length) {
      translations = translations[scopes.shift()];

      if (translations === undefined || translations === null) {
        break;
      }
    }

    if (translations !== undefined && translations !== null) {
      return translations;
    }
  };

  // Find and process the translation using the provided scope and options.
  // This is used internally by some functions and should not be used as an
  // public API.

  I18n.lookup = function(scope, options) {
    options = that.prepareOptions(options);

    var localeRequired     = options.locale || that.locale;
    var fallbacksForLocale = that.fallbacks[localeRequired] || [that.defaultLocale];
    var localesAvailable   = unique([localeRequired].concat(fallbacksForLocale));

    var recurseFallbacks = function(scope, fallbacks, value){
        if(fallbacks.length === 0){ return value; }

        var currentLocale = fallbacks.shift();
        var result = localeLookup(scope, currentLocale);

        if (typeof result == "object"){
          var merged = merge(result, value);
          return recurseFallbacks(scope, fallbacks, merged);
        } else if (result === undefined || result === null){
          return recurseFallbacks(scope, fallbacks, value);
        } else {
          return result;
        }
    };

    var result = recurseFallbacks(scope, localesAvailable);

    if (result === undefined || result === null ) {
      if (that.isSet(options.defaultValue)) {
        return options.defaultValue;
      }
    }

    return result;
  };

  // Merge serveral hash options, checking if value is set before
  // overwriting any value. The precedence is from left to right.
  //
  //     I18n.prepareOptions({name: "John Doe"}, {name: "Mary Doe", role: "user"});
  //     #=> {name: "John Doe", role: "user"}
  //
  I18n.prepareOptions = function() {
    var args = slice.call(arguments)
      , options = {}
      , subject
    ;

    while (args.length) {
      subject = args.shift();

      if (typeof(subject) != "object") {
        continue;
      }

      for (var attr in subject) {
        if (!subject.hasOwnProperty(attr)) {
          continue;
        }

        if (that.isSet(options[attr])) {
          continue;
        }

        options[attr] = subject[attr];
      }
    }

    return options;
  };

  // Translate the given scope with the provided options.
  I18n.translate = function(scope, options) {
    options = that.prepareOptions(options);
    var translation = that.lookup(scope, options);

    if (translation === undefined || translation === null) {
      return that.missingTranslation(scope);
    }

    if (typeof(translation) === "string") {
      translation = that.interpolate(translation, options);
    } else if (translation instanceof Object && that.isSet(options.count)) {
      translation = that.pluralize(options.count, translation, options);
    }

    return translation;
  };

  // This function interpolates the all variables in the given message.
  I18n.interpolate = function(message, options) {
    options = that.prepareOptions(options);
    var matches = message.match(that.placeholder)
      , placeholder
      , value
      , name
      , regex
    ;

    if (!matches) {
      return message;
    }

    while (matches.length) {
      placeholder = matches.shift();
      name = placeholder.replace(that.placeholder, "$1");
      value = options[name];

      if (!that.isSet(options[name])) {
        value = "[missing " + placeholder + " value]";
      }

      regex = new RegExp(placeholder.replace(/\{/gm, "\\{").replace(/\}/gm, "\\}"));
      message = message.replace(regex, value);
    }

    return message;
  };

  // Pluralize the given scope using the `count` value.
  // The pluralized translation may have other placeholders,
  // which will be retrieved from `options`.
  I18n.pluralize = function(count, scope, options) {
    options = that.prepareOptions(options);
    var translations, pluralizer, keys, key, message;

    if (scope instanceof Object) {
      translations = scope;
    } else {
      translations = that.lookup(scope, options);
    }

    if (!translations) {
      return that.missingTranslation(scope);
    }

    pluralizer = that.pluralization.get(options.locale);
    keys = pluralizer(Math.abs(count));

    while (keys.length) {
      key = keys.shift();

      if (that.isSet(translations[key])) {
        message = translations[key];
        break;
      }
    }

    options.count = String(count);
    return that.interpolate(message, options);
  };

  // Return a missing translation message for the given parameters.
  I18n.missingTranslation = function(scope) {
    var message = '[missing "';

    message += that.currentLocale() + ".";
    message += slice.call(arguments).join(".");
    message += '" translation]';

    return message;
  };

  // Format number using localization rules.
  // The options will be retrieved from the `number.format` scope.
  // If this isn't present, then the following options will be used:
  //
  // - `precision`: `3`
  // - `separator`: `"."`
  // - `delimiter`: `","`
  // - `strip_insignificant_zeros`: `false`
  //
  // You can also override these options by providing the `options` argument.
  //
  I18n.toNumber = function(number, options) {
    options = that.prepareOptions(
        options
      , that.lookup("number.format")
      , NUMBER_FORMAT
    );

    var negative = number < 0
      , string = Math.abs(number).toFixed(options.precision).toString()
      , parts = string.split(".")
      , precision
      , buffer = []
      , formattedNumber
    ;

    number = parts[0];
    precision = parts[1];

    while (number.length > 0) {
      buffer.unshift(number.substr(Math.max(0, number.length - 3), 3));
      number = number.substr(0, number.length -3);
    }

    formattedNumber = buffer.join(options.delimiter);

    if (options.strip_insignificant_zeros && precision) {
      precision = precision.replace(/0+$/, "");
    }

    if (options.precision > 0 && precision) {
      formattedNumber += options.separator + precision;
    }

    if (negative) {
      formattedNumber = "-" + formattedNumber;
    }

    return formattedNumber;
  };

  // Format currency with localization rules.
  // The options will be retrieved from the `number.currency.format` and
  // `number.format` scopes, in that order.
  //
  // Any missing option will be retrieved from the `I18n.toNumber` defaults and
  // the following options:
  //
  // - `unit`: `"$"`
  // - `precision`: `2`
  // - `format`: `"%u%n"`
  // - `delimiter`: `","`
  // - `separator`: `"."`
  //
  // You can also override these options by providing the `options` argument.
  //
  I18n.toCurrency = function(number, options) {
    options = that.prepareOptions(
        options
      , that.lookup("number.currency.format")
      , that.lookup("number.format")
      , CURRENCY_FORMAT
    );

    options.negative_format = options.negative_format || "-" + options.format;

    if (number < 0 ){
      options.format = options.negative_format;
      number = Math.abs(number);
    }

    number = that.toNumber(number, options);
    number = options.format
      .replace("%u", options.unit)
      .replace("%n", number)
    ;

    return number;
  };

  // Localize several values.
  // You can provide the following scopes: `currency`, `number`, or `percentage`.
  // If you provide a scope that matches the `/^(date|time)/` regular expression
  // then the `value` will be converted by using the `I18n.toTime` function.
  //
  // It will default to the value's `toString` function.
  //
  I18n.localize = function(scope, value) {
    switch (scope) {
      case "currency":
        return that.toCurrency(value);
      case "number":
        scope = that.lookup("number.format");
        return that.toNumber(value, scope);
      case "percentage":
        return that.toPercentage(value);
      default:
        if (scope.match(/^(date|time)/)) {
          return that.toTime(scope, value);
        } else {
          return value.toString();
        }
    }
  };

  // Parse a given `date` string into a JavaScript Date object.
  // This function is time zone aware.
  //
  // The following string formats are recognized:
  //
  //    yyyy-mm-dd
  //    yyyy-mm-dd[ T]hh:mm::ss
  //    yyyy-mm-dd[ T]hh:mm::ss
  //    yyyy-mm-dd[ T]hh:mm::ssZ
  //    yyyy-mm-dd[ T]hh:mm::ss+0000
  //
  I18n.parseDate = function(date) {
    var matches, convertedDate;

    // we have a date, so just return it.
    if (typeof(date) == "object") {
      return date;
    };

    matches = date.toString().match(/(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}):(\d{2}))?(Z|\+0000)?/);

    if (matches) {
      for (var i = 1; i <= 6; i++) {
        matches[i] = parseInt(matches[i], 10) || 0;
      }

      // month starts on 0
      matches[2] -= 1;

      if (matches[7]) {
        convertedDate = new Date(Date.UTC(matches[1], matches[2], matches[3], matches[4], matches[5], matches[6]));
      } else {
        convertedDate = new Date(matches[1], matches[2], matches[3], matches[4], matches[5], matches[6]);
      }
    } else if (typeof(date) == "number") {
      // UNIX timestamp
      convertedDate = new Date();
      convertedDate.setTime(date);
    } else if (date.match(/\d+ \d+:\d+:\d+ [+-]\d+ \d+/)) {
      // a valid javascript format with timezone info
      convertedDate = new Date();
      convertedDate.setTime(Date.parse(date))
    } else {
      // an arbitrary javascript string
      convertedDate = new Date();
      convertedDate.setTime(Date.parse(date));
    }

    return convertedDate;
  };

  // Formats time according to the directives in the given format string.
  // The directives begins with a percent (%) character. Any text not listed as a
  // directive will be passed through to the output string.
  //
  // The accepted formats are:
  //
  //     %a  - The abbreviated weekday name (Sun)
  //     %A  - The full weekday name (Sunday)
  //     %b  - The abbreviated month name (Jan)
  //     %B  - The full month name (January)
  //     %c  - The preferred local date and time representation
  //     %d  - Day of the month (01..31)
  //     %-d - Day of the month (1..31)
  //     %H  - Hour of the day, 24-hour clock (00..23)
  //     %-H - Hour of the day, 24-hour clock (0..23)
  //     %I  - Hour of the day, 12-hour clock (01..12)
  //     %-I - Hour of the day, 12-hour clock (1..12)
  //     %m  - Month of the year (01..12)
  //     %-m - Month of the year (1..12)
  //     %M  - Minute of the hour (00..59)
  //     %-M - Minute of the hour (0..59)
  //     %p  - Meridian indicator (AM  or  PM)
  //     %S  - Second of the minute (00..60)
  //     %-S - Second of the minute (0..60)
  //     %w  - Day of the week (Sunday is 0, 0..6)
  //     %y  - Year without a century (00..99)
  //     %-y - Year without a century (0..99)
  //     %Y  - Year with century
  //     %z  - Timezone offset (+0545)
  //
  I18n.strftime = function(date, format) {
    var options = that.lookup("date");

    if (!options) {
      options = DAYS_AND_MONTHS;
    }

    if (!options.meridian) {
      options.meridian = MERIDIAN;
    }

    var weekDay = date.getDay()
      , day = date.getDate()
      , year = date.getFullYear()
      , month = date.getMonth() + 1
      , hour = date.getHours()
      , hour12 = hour
      , meridian = hour > 11 ? 1 : 0
      , secs = date.getSeconds()
      , mins = date.getMinutes()
      , offset = date.getTimezoneOffset()
      , absOffsetHours = Math.floor(Math.abs(offset / 60))
      , absOffsetMinutes = Math.abs(offset) - (absOffsetHours * 60)
      , timezoneoffset = (offset > 0 ? "-" : "+") + (absOffsetHours.toString().length < 2 ? "0" + absOffsetHours : absOffsetHours) + (absOffsetMinutes.toString().length < 2 ? "0" + absOffsetMinutes : absOffsetMinutes)
    ;

    if (hour12 > 12) {
      hour12 = hour12 - 12;
    } else if (hour12 === 0) {
      hour12 = 12;
    }

    format = format.replace("%a", options.abbr_day_names[weekDay]);
    format = format.replace("%A", options.day_names[weekDay]);
    format = format.replace("%b", options.abbr_month_names[month]);
    format = format.replace("%B", options.month_names[month]);
    format = format.replace("%d", padding(day));
    format = format.replace("%e", day);
    format = format.replace("%-d", day);
    format = format.replace("%H", padding(hour));
    format = format.replace("%-H", hour);
    format = format.replace("%I", padding(hour12));
    format = format.replace("%-I", hour12);
    format = format.replace("%m", padding(month));
    format = format.replace("%-m", month);
    format = format.replace("%M", padding(mins));
    format = format.replace("%-M", mins);
    format = format.replace("%p", options.meridian[meridian]);
    format = format.replace("%S", padding(secs));
    format = format.replace("%-S", secs);
    format = format.replace("%w", weekDay);
    format = format.replace("%y", padding(year));
    format = format.replace("%-y", padding(year).replace(/^0+/, ""));
    format = format.replace("%Y", year);
    format = format.replace("%z", timezoneoffset);

    return format;
  };

  // Convert the given dateString into a formatted date.
  I18n.toTime = function(scope, dateString) {
    var date = that.parseDate(dateString)
      , format = that.lookup(scope)
    ;

    if (date.toString().match(/invalid/i)) {
      return date.toString();
    }

    if (!format) {
      return date.toString();
    }

    return that.strftime(date, format);
  };

  // Convert a number into a formatted percentage value.
  I18n.toPercentage = function(number, options) {
    options = that.prepareOptions(
        options
      , that.lookup("number.percentage.format")
      , that.lookup("number.format")
      , PERCENTAGE_FORMAT
    );

    number = that.toNumber(number, options);
    return options.format.replace("%n", number);
  };

  // Convert a number into a readable size representation.
  I18n.toHumanSize = function(number, options) {
    var kb = 1024
      , size = number
      , iterations = 0
      , unit
      , precision
    ;

    while (size >= kb && iterations < 4) {
      size = size / kb;
      iterations += 1;
    }

    if (iterations === 0) {
      unit = that.t("number.human.storage_units.units.byte", {count: size});
      precision = 0;
    } else {
      unit = that.t("number.human.storage_units.units." + SIZE_UNITS[iterations]);
      precision = (size - Math.floor(size) === 0) ? 0 : 1;
    }

    options = that.prepareOptions(
        options
      , {precision: precision, format: "%n%u", delimiter: ""}
    );

    number = that.toNumber(size, options);
    number = options.format
      .replace("%u", unit)
      .replace("%n", number)
    ;

    return number;
  };

  // Set aliases, so we can save some typing.
  I18n.t = I18n.translate;
  I18n.l = I18n.localize;
  I18n.p = I18n.pluralize;
})(typeof(exports) === "undefined" ? (this.I18n = {}) : exports);
