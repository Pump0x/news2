"use strict";(function(a){Drupal.behaviors.popup={attach:function attach(b){function c(a){var{category:b,category_url:c,link:d,heading:e,link_absolute:f}=a,g=encodeURIComponent(e);return"<div class=\"share-link\">\n          <div class=\"share-link__content\">\n            <p class=\"list-object__category category\">\n            ".concat(c&&b?"<a class=\"link link--\" href=\"".concat(c,"\">\n                ").concat(b,"\n              </a>"):"".concat(b?b:""),"\n            </p>\n            <h5 class=\"h5 list-object__heading\">\n              ").concat(d&&e?"<a class=\"h5__link list-object__heading-link\" href=\"".concat(d,"\">\n                  ").concat(e,"\n                </a>"):"".concat(e?e:""),"\n            </h5>\n          </div>\n          <h6 class=\"h6 h6--share-heading\">\n            Share via\n          </h6>\n          <div class=\"share-link__items\">\n            <div class=\"a2a-share-link a2a_kit\" data-a2a-url=\"").concat(f,"\" data-a2a-title=\"").concat(e,"\" style=\"line-height: 16px;\">\n              <a class=\"link\" target=\"_blank\" rel=\"nofollow noopener\" href=\"https://api.whatsapp.com/send?text=").concat(g," ").concat(f,"\">\n                <svg class=\"link__icon\">\n                  <use xlink:href=\"/profiles/custom/mediacorp/themes/mc_core_theme/dist/icons.svg#icon-social-filled-whatsapp\"></use>\n                </svg>\n                <span class=\"link__text a2a_label\">\n                WhatsApp\n                </span>\n              </a>\n              <a class=\"link\" target=\"_blank\" rel=\"nofollow noopener\" href=\"https://telegram.me/share/url?url=").concat(f,"&text=").concat(g,"\">\n                <svg class=\"link__icon\">\n                  <use xlink:href=\"/profiles/custom/mediacorp/themes/mc_core_theme/dist/icons.svg#icon-social-filled-telegram\"></use>\n                </svg>\n                <span class=\"link__text a2a_label\">\n                Telegram\n                </span>\n              </a>\n              <a class=\"link\" target=\"_blank\" rel=\"nofollow noopener\" href=\"https://www.facebook.com/sharer/sharer.php?u=").concat(f,"&t=").concat(g,"\">\n                <svg class=\"link__icon\">\n                  <use xlink:href=\"/profiles/custom/mediacorp/themes/mc_core_theme/dist/icons.svg#icon-social-filled-facebook\"></use>\n                </svg>\n                <span class=\"link__text a2a_label\">\n                Facebook\n                </span>\n              </a>\n              <a class=\"link\" target=\"_blank\" rel=\"nofollow noopener\" href=\"https://twitter.com/intent/tweet?text=").concat(g," ").concat(f,"\">\n                <svg class=\"link__icon\">\n                  <use xlink:href=\"/profiles/custom/mediacorp/themes/mc_core_theme/dist/icons.svg#icon-social-filled-twitter\"></use>\n                </svg>\n                <span class=\"link__text a2a_label\">\n                Twitter\n                </span>\n              </a>\n              <a class=\"link\" target=\"_blank\" rel=\"nofollow noopener\" href=\"mailto:?subject=").concat(g,"&body=").concat(f,"\">\n                <svg class=\"link__icon\">\n                  <use xlink:href=\"/profiles/custom/mediacorp/themes/mc_core_theme/dist/icons.svg#icon-social-filled-mail\"></use>\n                </svg>\n                <span class=\"link__text a2a_label\">\n                Email\n                </span>\n              </a>\n              <a class=\"link\" target=\"_blank\" rel=\"nofollow noopener\" href=\"https://www.linkedin.com/shareArticle?url=").concat(f,"&title=").concat(g,"\">\n                <svg class=\"link__icon\">\n                  <use xlink:href=\"/profiles/custom/mediacorp/themes/mc_core_theme/dist/icons.svg#icon-social-filled-linked-in\"></use>\n                </svg>\n                <span class=\"link__text a2a_label\">\n                LinkedIn\n                </span>\n              </a>\n            </div>\n          </div>\n          ").concat(f?"\n            <div class=\"copy-link\">\n            <button class=\"copy-link__btn\" data-clipboard-text=\"".concat(f,"\">\n              <svg class=\"copy-link__icon\">\n                <use xlink:href=\"/profiles/custom/mediacorp/themes/mc_core_theme/dist/icons.svg#icon-link\"></use>\n              </svg>\n              <span class=\"copy-link__text\">\n              Copy Link\n              </span>\n            </button>\n            <input class=\"copy-link__input\" readonly=\"readonly\" type=\"text\" value=\"").concat(f,"\">\n          </div>\n          "):"","\n        </div>")}a(".trigger-popup").once("popup").click(function(d){function e(a){for(var b,d=a+"=",e=decodeURIComponent(document.cookie),f=e.split(";"),g=0;g<f.length;g++){for(b=f[g];" "==b.charAt(0);)b=b.substring(1);if(0==b.indexOf(d))return b.substring(d.length,b.length)}return""}function f(a){var b=window.location.pathname,c=e("ssoid"),d="mediacorpidp"===e("sso_source")?"mediacorp":e("sso_source"),f=g?"Free":"NA",h={clickname:a,path:b,loginstatus:g,ssoid:c,loginsource:d,noadflag:!1,usertype:f};_adobeUtility.adobeAnalyticsTrack("myfeedclick",h)}d.preventDefault();var g=!1;"undefined"!=typeof ssoMeConnect&&(g=!!ssoMeConnect.isAuthenticate());var h=a(this).parents(".js-popup-content"),i=a(".js-popup");if(a(this).hasClass("trigger-popup--share")){var j={category:a(this).attr("data-category"),category_url:a(this).attr("data-category_url"),link:a(this).attr("data-link"),heading:a(this).attr("data-heading"),link_absolute:a(this).attr("data-link_absolute")};i.find(".popup__content").html(c(j))}else{var k=h.find(".popup-content");if(i.find(".popup__content").html(k.html()),a(this).hasClass("trigger-popup--search")){i.addClass("js-popup-search");var l=a(this).parents(".search-result.media-object");if(0<l.length){var m="<div class=\"search-result-popup\" data-origin=\"".concat(l.data("origin"),"\" data-item-link=\"").concat(l.data("item-link"),"\" data-origin-id=\"").concat(l.data("origin-id"),"\"></div>");i.find(".popup__content").wrapInner(m)}}}a(this).children("button").hasClass("btn-disabled")||(f("Discard Preferences | Manage Feed"),i.addClass("is-open-popup"),a("body").addClass("is-popup"),a2a&&a2a.init("page"),Drupal.behaviors.copyLinkToClipboard.attach(b))}),a(".popup__close, .popup__overlay").click(function(){var b=a(window).scrollTop(),c=a(this).parents(".js-popup");c.find(".popup__content").html(""),c.removeClass("is-open-popup"),a("body").removeClass("is-popup"),a(window).scrollTop(b)}),a(".bookmark-link-anonymous").on("click",function(){a(document.body).addClass("is-popup")}),a(document.body).on("dialogclose",".ui-dialog",function(){a(document.body).removeClass("is-popup")}),function(){var a=window.navigator.userAgent,b=a.indexOf("MSIE "),c=a.indexOf("Trident/");return 0<b||0<c}()&&(a(".popup-notice").parents("div.popup").addClass("is-open-popup popup-notice-container"),a("body").addClass("is-popup")),a(".popup-notice-container .popup__close").on("click",function(){a(this).parents("div.popup").removeClass("is-open-popup popup-notice-container"),a("body").removeClass("is-popup")})}}})(jQuery);;
"use strict";function ownKeys(a,b){var c=Object.keys(a);if(Object.getOwnPropertySymbols){var d=Object.getOwnPropertySymbols(a);b&&(d=d.filter(function(b){return Object.getOwnPropertyDescriptor(a,b).enumerable})),c.push.apply(c,d)}return c}function _objectSpread(a){for(var b,c=1;c<arguments.length;c++)b=null==arguments[c]?{}:arguments[c],c%2?ownKeys(Object(b),!0).forEach(function(c){_defineProperty(a,c,b[c])}):Object.getOwnPropertyDescriptors?Object.defineProperties(a,Object.getOwnPropertyDescriptors(b)):ownKeys(Object(b)).forEach(function(c){Object.defineProperty(a,c,Object.getOwnPropertyDescriptor(b,c))});return a}function _defineProperty(a,b,c){return b in a?Object.defineProperty(a,b,{value:c,enumerable:!0,configurable:!0,writable:!0}):a[b]=c,a}(function(a,b){b.behaviors.fastTooltip={attach:function attach(b){var c=this;a(".fast-tooltip",b).once("fastTooltip").each((b,d)=>{a(".fast-tooltip__close-button",d).on("click",b=>{c.closeFastTooltip(a(b.currentTarget).closest(".fast-tooltip"))})})},closeFastTooltip:function closeFastTooltip(b){a(b).addClass("hidden")},showFastTooltip:function showFastTooltip(b,c){var d=2<arguments.length&&arguments[2]!==void 0?arguments[2]:{},{isShow:e}=d,f=this.getFastTooltipLocalStorageValue(c);if(e||!f){var g=this.getFastTooltipFastOnBoarding();a(b).removeClass("hidden"),localStorage.setItem("fastOnboarding",JSON.stringify(_objectSpread(_objectSpread({},g),{},{[c]:!0})))}},getFastTooltipLocalStorageValue:function getFastTooltipLocalStorageValue(a){var b=this.getFastTooltipFastOnBoarding();return b[a]},getFastTooltipFastOnBoarding:function getFastTooltipFastOnBoarding(){return JSON.parse(localStorage.getItem("fastOnboarding"))||{}}}})(jQuery,Drupal);;
(function ($, Drupal) {
  let hasOnboarded = false;
  let clickCategoryClick = false;
  Drupal.behaviors.mixpanelFast = {
    attach: function (context, settings) {
      $('html', context).once('mixpanelFast').each(function () {
        const urlPath = window.location.pathname;
        const fastStartRead = Date.now();
        const visitedArticles = [];
        const mixpanel_helper = Drupal.behaviors.mixpanel_helper;
        const site_domain = mixpanel_helper.getSiteDomain();
        // Use current site domain if empty.
        const cookie_domain = (settings.mc_mixpanel.cookie_domain) || `.${site_domain}`;
        // Storing time when user started reading fast.
        Cookies.set("fastStartRead", fastStartRead, {
          domain: cookie_domain,
          path: "/",
        });
        if (urlPath.startsWith('/fast')) {
          $('.fast-card .fast-card__full-story-link').click(function() {
            mixpanelConfig.trackEvent('fast_fullstory_open', {
              'open': true
            });
          });
          // fast exit on browser close.
          $(window).on('beforeunload', function() {
            Drupal.behaviors.mixpanelFast.fastExitEvent(visitedArticles, cookie_domain);
          });
          // fast exit event on browsef back
          $(window).on('popstate', function(event) {
            Drupal.behaviors.mixpanelFast.fastExitEvent(visitedArticles, cookie_domain);
          });
          const titleObserver = new MutationObserver(function () {
            Drupal.behaviors.mixpanelFast.executeFastReadEvent();
            const currentCardNid = window.location.pathname.split('/')[2];
            if (!visitedArticles.includes(currentCardNid) && !isNaN(currentCardNid)) {
              visitedArticles.push(currentCardNid);
            }
            const lastArticleCardNid = $('.fast-card[data-nid]').last().attr('data-nid');
            //Trigger mixpanel fast_end event.
            if (currentCardNid === lastArticleCardNid) {
              mixpanelConfig.trackEvent("fast_end", { "fast_end": "true" });
            }
            // fast_category_click event.
            $(".fast-menu-item").click(function () {
              clickCategoryClick = true;
            });
          });
          titleObserver.observe(document.querySelector('title'), { childList: true });
          // fast_expand event.
          $(".fast-card__divider-button-label--expand").click(function () {
            mixpanelConfig.trackEvent("fast_expand", { "expand": "true" });
          });
          // fast_collapse event.
          $(".fast-card__divider-button-label--collapse").click(function () {
            mixpanelConfig.trackEvent("fast_collapse", { "collapse": "true" });
          });
          // fast_category_click event.
          $(".fast-menu-item").click(function () {
            // Get category for mWeb.
            let category = $(this).find(".fast-category-button__title").text().trim().toLowerCase();
            //Get category for Desktop
            if (!category) {
              category = $(this).text().trim().toLowerCase();
            }
            mixpanelConfig.trackEvent("fast_category_click", { "categories": category });
          });
          // fast_icon_click event.
          $(".fast-card__share-button, .fast-card__menu-button").click(function () {
            let icon_type = 'fast icon';
            if ($(this).closest("div.fast-card__share-button").length > 0) {
              icon_type = 'share';
            }
            else if($(this).closest(".fast-card__menu-button").length > 0) {
              icon_type = 'category';
            }
            mixpanelConfig.trackEvent("fast_icon_click", { "icon_type": icon_type });
          });
        }
        else {
          // As click event was not working for subsequent button we have used document selector.
          $(document).on("click",".fast-button__wrapper .fast-button:not(.fast-button--back)",function() {
            const entry = $('body').hasClass('page__landing-page') ? 'home page' : 'article page';
            const fastOnboarding = JSON.parse(localStorage.getItem('fastOnboarding')) || {};
            const onBoarding = fastOnboarding.onboardingCard;
            mixpanelConfig.trackEvent('fast_launch', {
              'entry': entry,
              'onboarding_screen': !onBoarding
            });
          });
          // As we are cloning fast button for back button we are using document
          $(document).on("click",".fast-button__wrapper .fast-button--back",function() {
            mixpanelConfig.trackEvent('fast_fullstory_close', {
              'close': true
            });
          });
        }
      });
    },
    // Function to execute fast read event.
    executeFastReadEvent: function () {
      const urlParams = new URLSearchParams(window.location.search);
      const inid = urlParams.get('inid');
      const currentCardNid = window.location.pathname.split('/')[2];
      const currentCard = $(`.fast-card[data-nid="${currentCardNid}"]`);
      const categoryUuid = $(currentCard).attr('data-category-uuid');
      const isPreviousCardOnboarding = $(currentCard).prev().is('.fast-onboarding-card:not(.hidden)');
      const currentCardCollapsed = $(currentCard).hasClass('collapsed');
      let categoryText = '';
      let navigation_type = 'Swipe up';
      const category = $(`.fast-menu-items .fast-menu-item[data-uuid=${categoryUuid}]`);
      if (category.length) {
        categoryText = category.text().trim();
      }
      if (clickCategoryClick) {
        navigation_type = 'categories';
        clickCategoryClick = false;
      }
      else if (isPreviousCardOnboarding && !hasOnboarded) {
        navigation_type = 'Begin swipeup';
        hasOnboarded = true;
      } else if (inid) {
        navigation_type = inid.indexOf('up') !== -1 ? 'Swipe up' : 'Swipe down';
      }
      if (currentCard.length > 0) {
        mixpanelConfig.trackEvent('fast_read', {
          'fast_category': categoryText,
          'navigation_type': navigation_type,
          'card_expand_shown': currentCardCollapsed,
          'card_type': $(currentCard).attr('data-type')
        });
      }
    },
    fastExitEvent: function (visitedArticles, cookie_domain) {
      // Get time when user started surfing fast.
      const fastStartRead = Cookies.get("fastStartRead");
      // removing cookie.
      Cookies.remove("fastStartRead", {
        domain: cookie_domain,
        path: "/"
      });
      // Get time when user exit from fast.
      const fastEndRead = Date.now();
      // Calculate total time spent.
      const timeSpent = Drupal.behaviors.mixpanelFast.formatMilliseconds((fastEndRead - fastStartRead));
      const fastCount = visitedArticles.length;
      mixpanelConfig.trackEvent("fast_exit", { "fast_count": fastCount, "time_spent": timeSpent});
    },
    formatMilliseconds: function (milliseconds) {
      const totalSeconds = Math.floor(milliseconds / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      let result = [];
      if (hours > 0) {
        result.push(`${hours} hour${hours > 1 ? 's' : ''}`);
      }
      if (minutes > 0) {
        result.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);
      }
      if (seconds > 0 || result.length === 0) {
        result.push(`${seconds} second${seconds > 1 ? 's' : ''}`);
      }
      return result.join(', ').replace(/,([^,]*)$/, ' and$1');
    },
  }
})(jQuery, Drupal);;
"use strict";(function(a,b,c){'use strict';b.behaviors.fastButton={attach:function attach(d){var f=history.length,g=this,h=!b.behaviors.fastTooltip.getFastTooltipLocalStorageValue("fastBackButton"),i=g.getIsBackToFast();a("main",d).once("fastButton").each(function(){var e=a(".fast-button__wrapper");if(e.length){var f=()=>window.innerWidth-document.querySelector("html").clientWidth,j=window.location.hostname,k=!j.toLowerCase().includes("cnalifestyle")&&!j.toLowerCase().includes("cnaluxury"),l=c=>{setTimeout(()=>{a(c).removeClass("hidden"),k&&(i?b.behaviors.fastTooltip.showFastTooltip(a(c).find(".fast-button__tooltip-fast-back-button .fast-tooltip"),"fastBackButton",{isShow:h}):b.behaviors.fastTooltip.showFastTooltip(a(c).find(".fast-button__tooltip-fast-home-button .fast-tooltip"),"fastHomeButton"))},0)},m=()=>{b.behaviors.fastTooltip.closeFastTooltip(".fast-button__tooltip-fast-home-button .fast-tooltip")},n=function(b){var c=1<arguments.length&&void 0!==arguments[1]?arguments[1]:{},{resizeObserverHandler:d,intersectionObserverHandler:f}=c;if(a(b).addClass("fast-button__wrapper--floating"),f&&f(),document.querySelector(".footer")){var g=new IntersectionObserver((c)=>{var[d]=c;d.isIntersecting?(a(b).parent().css("position","relative"),a(b).addClass("fast-button__wrapper--sticky"),a(b).removeClass("fast-button__wrapper--floating")):(a(b).parent().css("position",""),a(b).removeClass("fast-button__wrapper--sticky"),a(b).addClass("fast-button__wrapper--floating")),f&&f()},{threshold:.01,rootMargin:"-15px"});g.observe(document.querySelector(".footer"))}if(d){var h=new ResizeObserver(d);h.observe(a("body")[0])}};if(a("body").hasClass("page__landing-page")){var o=!1,p="",q=!1;if(g.hasEditions()){var r=c.mc_location.config,s={local:r.local_url||"/",international:r.international_url,us:r.united_states_url},t={local:r.local_code||"SG",us:"US"},u=_locationUtility.getCookieByName("country_code");s.international&&!u&&(u=_locationUtility.getLocationApi());var y=window.location.pathname;y===s.local?(o=!0,p="sg"):y===s.us?(o=!0,p="us"):y===s.international&&(o=!0,p="asia"),u!==t.local&&y===s.local&&(s.international||s.us)&&(q=!0)}else c.path.isFront&&(o=!0);if(o&&!q){var z=e.find("a");if(p){var A=new URLSearchParams;A.set("edition",p);var B=z.attr("href");z.attr("href","".concat(B,"?").concat(A))}a(z,d).on("click",()=>{m()});var C=()=>{var a=e.hasClass("fast-button__wrapper--sticky")?0:window.innerWidth-e.parent()[0].getBoundingClientRect().right-f();e.css("right",a)};n(e,{resizeObserverHandler:C,intersectionObserverHandler:C}),l(e)}else a(e).remove()}else if(a("body").hasClass("page__article")){var D=a("article > .fast-button__wrapper");if(i){var v=a(D).clone(!0).appendTo(a(D).closest("main"))[0],w=a("article")[0],x=a(w).attr("data-fast-url");a(v).find("a").attr("href",x),l(v);var E=a(v).find(".fast-button");a(E).addClass("fast-button--back");var F=()=>{var b=a("article section.block-hero-emphasis")[0],c=a(v).parent()[0],d=window.innerWidth-b.getBoundingClientRect().right,e=window.innerWidth-c.getBoundingClientRect().right,g=d;g-=a(v).hasClass("fast-button__wrapper--sticky")?e:f(),a(v).css("right",g)};n(v,{resizeObserverHandler:F,intersectionObserverHandler:F})}}}}),a(".fast-button--back",d).once("fastButtonBack").each(function(c,e){if(i){a(".fast-tooltip__close-button",a(e).parent()).on("click",()=>{b.behaviors.fastTooltip.closeFastTooltip(a(".fast-button__tooltip-fast-back-button .fast-tooltip"))});var g=a("article")[0];a(g).attr("data-is-back-to-fast",!0),a(e,d).on("click",a=>{if(!(a.ctrlKey||a.shiftKey)){a.preventDefault();var b=history.length,c=b-f;1==c-b?window.history.back():window.history.go(-(c+1))}}),b.behaviors.fastTooltip.showFastTooltip(a(e).parent().find(".fast-button__tooltip-fast-back-button .fast-tooltip"),"fastBackButton",{isShow:h})}else{var j=new URLSearchParams(window.location.search);"true"===j.get("fast")&&(j.delete("fast"),window.history.replaceState({},"","".concat(window.location.pathname).concat(j.size?"?".concat(j):"")))}})},hasEditions:()=>{var a,b,d,e,f,g,h,i,j=[null===(a=c.mc_location)||void 0===a||null===(b=a.config)||void 0===b?void 0:b.local_url,null===(d=c.mc_location)||void 0===d||null===(e=d.config)||void 0===e?void 0:e.international_url,null===(f=c.mc_location)||void 0===f||null===(g=f.config)||void 0===g?void 0:g.united_states_url,null===(h=c.mc_location)||void 0===h||null===(i=h.config)||void 0===i?void 0:i.indonesia_url].filter(Boolean);return 1<j.length},getIsBackToFast:()=>{var a=new URLSearchParams(window.location.search);return"true"===a.get("fast")&&window.document.referrer},getFastUrl:b=>{var c=a(b).closest("article");return a(c).attr("data-fast-url")}}})(jQuery,Drupal,drupalSettings);;
/**
 * @file
 * Initially builds the base for the adEntity object, including settings.
 */

(function (window, document) {

  var settingsElement = document.getElementById('ad-entity-settings');

  if (!(typeof window.adEntity === 'object')) {
    window.adEntity = {settings: {}, helpers: {}, queue: []};
  }
  else {
    window.adEntity.settings = {};
    window.adEntity.helpers = window.adEntity.helpers || {};
    window.adEntity.queue = window.adEntity.queue || [];
  }

  if (settingsElement !== null) {
    window.adEntity.settings = JSON.parse(settingsElement.textContent);
  }

  window.adEntity.usePersonalization = function () {
    var settings = window.adEntity.settings;
    if (!settings.hasOwnProperty('p13n') || (settings.p13n !== true)) {
      return false;
    }
    if (!settings.hasOwnProperty('consent')) {
      return false;
    }
    if (settings.consent.method === 'disabled') {
      return true;
    }
    if (settings.consent.method === 'unbiased') {
      return null;
    }
    return false;
  };

}(window, window.document));
;
/**
 * @file
 * Consent awareness for Advertising entities.
 */

(function (adEntity, document) {

  adEntity.helpers.getCookie = function (name) {
    var nameEQ = name + '=';
    var ca = document.cookie.split(';');
    var i;
    var c;
    for (i = 0; i < ca.length; i++) {
      c = ca[i];
      while (c.charAt(0) === ' ') {
        c = c.substring(1, c.length);
      }
      if (c.indexOf(nameEQ) === 0) {
        return c.substring(nameEQ.length, c.length);
      }
    }
    return null;
  };

  adEntity.usePersonalization = function () {
    var settings = adEntity.settings;
    var consent;
    var cookie;
    var current_value;
    var matched = false;
    var length;
    var i;
    if (!settings.hasOwnProperty('p13n') || (settings.p13n !== true)) {
      return false;
    }
    if (!settings.hasOwnProperty('consent')) {
      return false;
    }
    consent = settings.consent;
    if (typeof consent.method !== 'string') {
      return false;
    }
    if (consent.method === 'disabled') {
      return true;
    }
    if (consent.method === 'unbiased') {
      return null;
    }
    if (!(typeof consent.cookie === 'object')) {
      return false;
    }
    cookie = consent.cookie;
    if (!cookie.hasOwnProperty('name') || !cookie.hasOwnProperty('operator') || !cookie.hasOwnProperty('value')) {
      return false;
    }
    if (typeof cookie.value === 'string') {
      cookie.value = [cookie.value];
    }
    length = cookie.value.length;

    current_value = adEntity.helpers.getCookie(cookie.name);
    if (typeof current_value !== 'string') {
      matched = false;
    }
    else if (cookie.operator === 'e') {
      matched = true;
    }
    else {
      for (i = 0; i < length; i++) {
        switch (cookie.operator) {
          case '==':
            /* eslint eqeqeq: [0, "always"] */
            if (current_value == cookie.value[i]) {
              matched = true;
            }
            break;
          case '>':
            if (current_value > cookie.value[i]) {
              matched = true;
            }
            break;
          case '<':
            if (current_value < cookie.value[i]) {
              matched = true;
            }
            break;
          case 'c':
            if (!(current_value.indexOf(cookie.value[i]) < 0)) {
              matched = true;
            }
            break;
        }
        if (matched) {
          break;
        }
      }
    }
    switch (consent.method) {
      case 'opt_in':
        return matched;
      case 'opt_out':
        return !matched;
      default:
        return false;
    }
  };

}(window.adEntity, window.document));
;
/**
 * @file
 * Provides various helper functions for ad_entity components.
 */

(function (adEntity, window) {

  /**
   * Triggers a custom event at the given target.
   *
   * @param {EventTarget} target
   *   The event target.
   * @param {string} type
   *   Is a DOMString containing the name of the event.
   * @param {boolean} canBubble
   *   Indicating whether the event bubbles up through the DOM or not.
   * @param {boolean} cancelable
   *   Indicating whether the event is cancelable.
   * @param {(object|number|string|boolean)} detail
   *   The data passed in when initializing the event.
   */
  adEntity.helpers.trigger = function (target, type, canBubble, cancelable, detail) {
    // This is deprecated but needed for IE compatibility.
    var event = window.document.createEvent('CustomEvent');
    if (typeof detail === 'undefined') {
      detail = null;
    }
    event.initCustomEvent(type, canBubble, cancelable, detail);
    target.dispatchEvent(event);
  };

  /**
   * Whether the given object is empty or not.
   *
   * @param {object} obj
   *   The object to check.
   *
   * @return {boolean}
   *   Returns true if the object is empty, false otherwise.
   */
  adEntity.helpers.isEmptyObject = function (obj) {
    var k;
    for (k in obj) {
      if (obj.hasOwnProperty(k)) {
        return false;
      }
    }
    return true;
  };

  /**
   * Adds a class name to the given DOM element.
   *
   * @param {Element} el
   *   The DOM element.
   * @param {string} className
   *   The class name to add.
   */
  adEntity.helpers.addClass = function (el, className) {
    if (el.classList) {
      el.classList.add(className);
    }
    else {
      el.className += ' ' + className;
    }
  };

  /**
   * Removes a class name to the given DOM element.
   *
   * @param {Element} el
   *   The DOM element.
   * @param {string} className
   *   The class name to remove.
   */
  adEntity.helpers.removeClass = function (el, className) {
    if (el.classList) {
      el.classList.remove(className);
    }
    else {
      el.className = el.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
    }
  };

  /**
   * Checks whether the element has the given class name.
   *
   * @param {Element} el
   *   The DOM element to check for.
   * @param {string} className
   *   The class name to check.
   *
   * @return {boolean}
   *   Returns true in case the element has the class name, false otherwise.
   */
  adEntity.helpers.hasClass = function (el, className) {
    if (el.classList) {
      return el.classList.contains(className);
    }
    else {
      return new RegExp('(^| )' + className + '( |$)', 'gi').test(el.className);
    }
  };

  /**
   * Get or set arbitrary metadata to the given source and target.
   *
   * This method replaces the usage of jQuery's .data()
   * function inside all ad_entity components. Note that this
   * function is not converting data attributes to camel case.
   *
   * @param {object} source
   *   The source object to get metadata for. This is usually a DOM element.
   * @param {object} target
   *   The target object where to store the retrieved metadata.
   * @param {string} key
   *   (Optional) A string naming the piece of data to get or set.
   * @param {(object|number|string|boolean|function)} value
   *   (Optional) The new data value; this can be any Javascript type except undefined.
   *
   * @return {(object|number|string|boolean|function|undefined)}
   *   Returns the value if the key is given, or the whole metadata object if not.
   */
  adEntity.helpers.metadata = function (source, target, key, value) {
    var metadata;
    var length;
    var i;
    var attribute;
    var attribute_value;

    // Initialize metadata at first time access.
    if (typeof target.__ad_entity_metadata === 'undefined') {
      metadata = {};
      if ((typeof source.attributes === 'object') && (typeof source.getAttribute === 'function')) {
        length = source.attributes.length;
        for (i = 0; i < length; i++) {
          attribute = source.attributes[i];
          try {
            attribute_value = JSON.parse(attribute.value);
          }
          catch (e) {
            attribute_value = attribute.value;
          }
          metadata[attribute.name] = attribute_value;
        }
      }
      target.__ad_entity_metadata = metadata;
    }

    metadata = target.__ad_entity_metadata;
    if (typeof key === 'undefined') {
      return metadata;
    }

    if (typeof value !== 'undefined') {
      metadata[key] = value;
    }

    if (metadata.hasOwnProperty(key)) {
      return metadata[key];
    }
  };

}(window.adEntity, window));
;
/**
 * @file
 * Initial JS for viewing Advertising entities.
 */

(function (ad_entity, Drupal, window) {

  // At this point, the global adEntity object is fully
  // initialized and available as Drupal component.
  Drupal.ad_entity = ad_entity;

  ad_entity.adContainers = ad_entity.adContainers || {};
  ad_entity.context = ad_entity.context || {};
  ad_entity.viewHandlers = ad_entity.viewHandlers || {};

  /**
   * Collects all not yet initialized Advertising containers from the given context.
   *
   * @param {object} context
   *   The part of the DOM being processed.
   * @param {object} settings
   *   The Drupal settings.
   *
   * @return {object}
   *   The newly added containers (newcomers).
   */
  ad_entity.collectAdContainers = function (context, settings) {
    var newcomers = {};
    var collected = ad_entity.adContainers;
    var queues = [ad_entity.queue];
    var queue;
    var length;
    var el;
    var i;
    var container;
    var event_detail;
    ad_entity.queue = [];
    if (!ad_entity.settings.inline) {
      queues.push(context.querySelectorAll('.ad-entity-container'));
    }
    while (queues.length > 0) {
      queue = queues.shift();
      length = queue.length;
      for (i = 0; i < length; i++) {
        el = queue[i];
        if (typeof el.id !== 'string' || !(el.id.length > 0)) {
          continue;
        }
        if (collected.hasOwnProperty(el.id)) {
          continue;
        }
        container = {
          el: el,
          data: function (key, value) {
            return ad_entity.helpers.metadata(this.el, this, key, value);
          }
        };
        collected[el.id] = container;
        newcomers[el.id] = container;
      }
    }
    event_detail = {
      collected: collected,
      newcomers: newcomers,
      context: context,
      settings: settings
    };
    ad_entity.helpers.trigger(window, 'adEntity:collected', false, true, event_detail);
    return newcomers;
  };

  /**
   * Restricts the given list of Advertising containers
   * to the scope of the current breakpoint.
   *
   * @param {object} containers
   *   The list of Advertising containers to restrict.
   *
   * @return {object}
   *   The containers which are in the scope of the current breakpoint.
   */
  ad_entity.restrictAdsToScope = function (containers) {
    var helpers = ad_entity.helpers;
    var scope = ['any'];
    var in_scope;
    var breakpoint;
    var container;
    var container_id;
    var variant;
    var variant_length;
    var el;
    var i;

    if (typeof window.themeBreakpoints === 'object') {
      if (typeof window.themeBreakpoints.getCurrentBreakpoint === 'function') {
        breakpoint = window.themeBreakpoints.getCurrentBreakpoint();
        if (breakpoint) {
          scope.push(breakpoint.name);
        }
      }
    }

    in_scope = {};
    for (container_id in containers) {
      if (containers.hasOwnProperty(container_id)) {
        container = containers[container_id];
        el = container.el;
        variant = container.data('data-ad-entity-variant');
        variant_length = variant.length;
        for (i = 0; i < variant_length; i++) {
          if (!(scope.indexOf(variant[i]) < 0)) {
            in_scope[container_id] = container;
            if (container.data('inScope') !== true) {
              helpers.addClass(el, 'in-scope');
              helpers.removeClass(el, 'out-of-scope');
              el.style.display = null;
              container.data('inScope', true);
            }
            break;
          }
        }
        if (!in_scope.hasOwnProperty(container_id) && (container.data('inScope') !== false)) {
          helpers.removeClass(el, 'in-scope');
          helpers.addClass(el, 'out-of-scope');
          el.style.display = 'none';
          container.data('inScope', false);
        }
      }
    }

    return in_scope;
  };

  /**
   * Correlates the Advertising containers with their view handlers.
   *
   * @param {object} containers
   *   The list of Advertising containers to correlate.
   *
   * @return {object}
   *   The correlation.
   */
  ad_entity.correlate = function (containers) {
    var view_handlers = ad_entity.viewHandlers;
    var view_handler;
    var correlation = {};
    var handler_id = '';
    var container;
    var container_id;

    for (container_id in containers) {
      if (containers.hasOwnProperty(container_id)) {
        container = containers[container_id];
        handler_id = container.data('data-ad-entity-view');

        if (view_handlers.hasOwnProperty(handler_id)) {
          view_handler = view_handlers[handler_id];
          correlation[handler_id] = correlation[handler_id] || {handler: view_handler, containers: {}};
          correlation[handler_id].containers[container_id] = container;
        }
      }
    }
    return correlation;
  };

  /**
   * Applies scope restriction and proper initialization
   * on given Advertisement containers.
   *
   * @param {object} containers
   *   The list of Advertising containers to restrict and initialize.
   * @param {object} context
   *   The DOM context.
   * @param {object} settings
   *   The Drupal settings.
   */
  ad_entity.restrictAndInitialize = function (containers, context, settings) {
    var view_handlers = ad_entity.viewHandlers;
    var helpers = ad_entity.helpers;
    var to_initialize = ad_entity.restrictAdsToScope(containers);
    var container;
    var container_id;
    var initialized;
    var disabled;
    var correlation;
    var handler_id;

    for (container_id in to_initialize) {
      if (to_initialize.hasOwnProperty(container_id)) {
        container = to_initialize[container_id];
        initialized = container.data('initialized');
        if (typeof initialized !== 'boolean') {
          initialized = !helpers.hasClass(container.el, 'not-initialized');
          container.data('initialized', initialized);
        }
        // Prevent re-initialization of already initialized Advertisement.
        if (initialized === true) {
          delete to_initialize[container_id];
        }
        else {
          // Do not initialize disabled containers.
          // As per documentation since beta status,
          // the primary flag for disabling initialization
          // is the class name.
          disabled = helpers.hasClass(container.el, 'initialization-disabled');
          container.data('disabled', disabled);
          if (disabled) {
            delete to_initialize[container_id];
          }
        }
      }
    }

    // Let the view handlers initialize their ads.
    correlation = ad_entity.correlate(to_initialize);
    for (handler_id in view_handlers) {
      if (view_handlers.hasOwnProperty(handler_id)) {
        if (correlation.hasOwnProperty(handler_id)) {
          correlation[handler_id].handler.initialize(correlation[handler_id].containers, context, settings);
        }
      }
    }
  };

  /**
   * Drupal behavior for viewing Advertising entities.
   */
  Drupal.behaviors.adEntityView = {
    attach: function (context, settings) {
      var containers = ad_entity.collectAdContainers(context, settings);
      var isEmptyObject = ad_entity.helpers.isEmptyObject;

      // No need to proceed in case no new containers have been found.
      if (isEmptyObject(containers)) {
        return;
      }

      // Apply Advertising contexts, if available.
      if (!(isEmptyObject(ad_entity.context))) {
        ad_entity.context.addFrom(context);
        ad_entity.context.applyOn(containers);
      }

      // Apply initial scope restriction and initialization on given Advertisement.
      ad_entity.restrictAndInitialize(containers, context, settings);

      // When responsive behavior is enabled,
      // re-apply scope restriction with initialization on breakpoint changes.
      if (ad_entity.hasOwnProperty('settings') && ad_entity.settings.hasOwnProperty('responsive')) {
        if (ad_entity.settings.responsive === true) {
          window.addEventListener('themeBreakpoint:changed', function () {
            ad_entity.restrictAndInitialize(containers, context, settings);
          });
        }
      }
    },
    detach: function (context, settings) {
      var containers = {};
      var collected = ad_entity.adContainers;
      var correlation;
      var handler_id;

      // Remove the detached container from the collection,
      // but keep them in mind for other view handlers to act on.
      var container_items = context.querySelectorAll('.ad-entity-container');
      var length = container_items.length;
      var i;
      var el;

      for (i = 0; i < length; i++) {
        el = container_items[i];
        if (typeof el.id !== 'string' || !(el.id.length > 0)) {
          continue;
        }
        if (!collected.hasOwnProperty(el.id)) {
          continue;
        }

        containers[el.id] = collected[el.id];
        delete collected[el.id];
      }

      // Let the view handlers act on detachment of their ads.
      correlation = ad_entity.correlate(containers);
      for (handler_id in ad_entity.viewHandlers) {
        if (ad_entity.viewHandlers.hasOwnProperty(handler_id)) {
          if (correlation.hasOwnProperty(handler_id)) {
            correlation[handler_id].handler.detach(correlation[handler_id].containers, context, settings);
          }
        }
      }
    }
  };

}(window.adEntity, Drupal, window));
;
/**
 * @file
 * Tasks to run right after View handler building is complete.
 */

(function (ad_entity, behavior, document, settings) {

  // Run attachment on first page load,
  // without waiting for other Drupal behaviors.
  if (!(ad_entity.helpers.isEmptyObject(ad_entity.viewHandlers))) {
    behavior.attach(document, settings);
  }

}(Drupal.ad_entity, Drupal.behaviors.adEntityView, window.document, drupalSettings));
;
