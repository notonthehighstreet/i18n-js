var I18n = require("../../app/assets/javascripts/i18n");

describe("storeTranslations", function(){
  beforeEach(function(){
    I18n.reset();
  });

  it("should add translations", function(){
    I18n.storeTranslations({"en" : {"eggs" : "beans"}});
    expect(I18n.translations).toEqual({"en" : {"eggs" : "beans"}});
  });

  describe("when translation already set", function(){
    beforeEach(function(){
      I18n.storeTranslations({"en" : {"eggs" : "beans", "tea": { "country": "Japan", "colour" : "green"}}});
    });

    it("should merge additional translations", function(){
      I18n.storeTranslations({
        "de" : {
          "lemon" : "cheese"
        },
        "en" : {
          "eggs" : "bacon",
          "tea": {
            "country": 'India'
          }
        }
      });

      expect(I18n.translations).toEqual({
        "de" : { "lemon" : "cheese" },
        "en" : {
          "eggs" : "bacon",
          "tea": {
            "country": 'India',
            "colour" : "green"
          }
        }
      });
    });

    it("should not merge additional translations when they are an array", function(){
      I18n.storeTranslations({
        "de" : {
          "bottles" : ["99","98","97"]
        }
      });
      I18n.storeTranslations({
        "de" : {
          "bottles" : ["0"],
        }
      });

      expect(I18n.translations["de"]["bottles"]).toEqual( ["0"] );
    });

    it("should not merge string objects", function (){
      I18n.storeTranslations({
        "de" : {
          "cake" : new String("chocolate")
        }
      });
      I18n.storeTranslations({
        "de" : {
          "cake" : new String("fairy")
        }
      });
      expect(I18n.translations["de"]["cake"]).toEqual("fairy");
    });
  });
});
