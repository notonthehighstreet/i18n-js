var I18n = require("../../app/assets/javascripts/i18n")
  , Translations = require("./translations")
;

describe("Fallbacks", function(){
  beforeEach(function(){
    I18n.locale = "primary";
    I18n.fallbacks = {"primary" : ['secondary', 'tertiary'] };
  });

  it('should support locale fallbacks', function(){
    I18n.translations['secondary'] = {eggs: "beans"};
    expect(I18n.t('eggs')).toEqual('beans');
  });

  it("should use the first fallback for translation", function(){
    I18n.translations['secondary'] = {eggs: "are tasty"};
    I18n.translations['tertiary'] = {eggs: "are repugnant"};
    expect(I18n.t('eggs')).toEqual('are tasty');
  });

  it("should merge unfound translations with subsequent fallback lookups", function(){
    I18n.translations['secondary'] = { eggs : {"colour" : "white" }};
    I18n.translations['tertiary']  = { eggs: {coolness: 11, "colour" : "blackness" }};
    expect(I18n.t('eggs')).toEqual({coolness: 11, "colour" : "white"});
  });
});
