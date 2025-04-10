/**
 * @file
 * JS for video form.
 */

(function ($) {
  Drupal.behaviors.brightcoveChosen = {
    attach: function () {
      let submitButtons = $('input[type="submit"]');
      let isFileField = false;

      $('input[type="file"]').mousedown(function () {
        isFileField = true;
      });

      // Disable buttons while the uploading is running.
      $(document).ajaxStart(function (event) {
        if (isFileField) {
          submitButtons.prop('disabled', true);
        }
      });

      // Enable buttons after the upload is finished.
      $(document).ajaxStop(function () {
        if (isFileField) {
          submitButtons.prop('disabled', false);
          isFileField = false;
        }
      });
    }
  }
})(jQuery);
;
(function ($, Drupal, document) {

  /**
   *
   * Define namespace with common method to use for Adaobe analytics workflow.
   * @type {{isAuthenticate: (function(id, url, type): boolean)}}
   */

  window._adobeUtility = {
    adobeAnalyticsTrack: function(event, data, isOmitDefaultParams) {
      // Somehow _satellite is undefined when signed in as CMS user, hence wrapping it around try/catch so it does not affect any working flows
      try {
        data = isOmitDefaultParams ? data : this.buildParam(event, data);
        console.log(`track ${event}`, data);
        _satellite.track(event, data);
      } catch (e) {
        console.error(e);
      }
    },
    buildParam: function (event, data) {
      const loginsource = {
        mediacorp: 'Mediacorp',
        mediacorpidp: 'Mediacorp',
        google: 'Google',
        facebook: 'Facebook',
        apple: 'Apple'
      };
      let defaultParams = {
        'ssoid': 'NA',
        'noadflag': false,
        'loginstatus': false,
        'loginsource': 'NA',
        'usertype': 'NA',
      };

    if (typeof ssoMeConnect !== 'undefined') {
      if (ssoMeConnect.isAuthenticate()) {
        defaultParams = Object.assign(defaultParams, {
          'ssoid': ssoMeConnect.getCookie('ssoid'),
          'loginstatus': true,
          'loginsource': ssoMeConnect.getCookie('sso_source') ? loginsource[ssoMeConnect.getCookie('sso_source')] : 'Mediacorp',
          'usertype': 'Free'
        });
      }
    }
      return $.extend({}, defaultParams, data);
    },
    // adobeAudioTrack: function (nid, url, parent = document) {
    //   if (window.playerjs !== undefined) {
    //     $('iframe[identity="omny"]', parent).once('audio-track').each(function () {
    //       let player;
    //       let playerMediaId = $(this).attr('media-id');
    //       player = new playerjs.Player(this);
    //       player.on('ready', function () {
    //           _adobeUtility.adobeAnalyticsTrack('omniload', {
    //             content_id: nid ? nid : 'NA',
    //             id: playerMediaId,
    //             type: 'Audio',
    //             path: url,
    //             obj: player,
    //             player: 'PC'
    //           });
    //         }
    //       );
    //     });
    //   }
    // },
    adobeMediaPlayerTrack: function(nid, url, parent = document) {
      if (window.MediaElementPlayer != undefined) {
        $('#audio-player-mediaelement', parent).once('radio-track').each(function () {
          if ($(this).find("audio") && $(this).find("audio")[0] && $(this).find("audio")[0].player) {
            let player = $(this).find("audio")[0].player;
            let playerMediaId = $(this).find("audio").attr('media-id');
            _adobeUtility.adobeAnalyticsTrack('omniload', {
              content_id: nid ? nid : 'NA',
              id: playerMediaId,
              type: 'Audio',
              path: url,
              obj: player,
              player: 'PC'
            });
          }
        });
      }
    },
    adobeBrightcoveVideoTrack: function(nid, url, parent = document) {
      // Video media event analytics track.
      _adobeUtility.trackVideo(nid, url, parent);
    },
    adobeBrightcoveVideoTrackDelayed: function(nid, url, parent = document) {
      // Video media event analytics track.
      setTimeout(function(){
        _adobeUtility.trackVideo(nid, url, parent);
      }, 3000);
    },
    trackVideo: function(nid, url, parent) {
      if (window.videojs !== undefined) {
        // let players = videojs.getPlayers();
        // if (!players || !Object.keys(players).length) {
        //   return;
        // }
        let videoEle = $(parent).find('.brightcove-player video-js');
        videoEle.each(function () {
          // Handle multiple load, when video is in carousel.
          if ($(this).parents('.slick-cloned').length) {
            return;
          }
          const videoMediaId = $(this).attr('media-id');
          const id = $(this).attr('id');
          if (id && id.length) {
            const player = window.videojs.getPlayer(id);
            player.on("play", function() {console.log(id, 'playing')});
            player.on("pause", function() {console.log(id, 'paused')});
            player.on("ended", function() {console.log(id, 'ended')});
            player.on("seeking",function() {console.log(id, 'seeking')});
            player.on("seeked", function() {console.log(id, 'seekid')});
            player.on("dispose", function() {console.log(id, 'destroy')});
            if(videoMediaId && player) {
              _adobeUtility.adobeAnalyticsTrack('omniload', {
                content_id: nid ? nid : 'NA',
                id: videoMediaId,
                type: 'Video',
                path: url,
                obj: player,
                player: 'BC6'
              });
            }
          }
        });
      }
    },
    /**
     * Replace the ids for ads to avoid repeated ads markup.
     *
     * @param adsHtml
     * @param adEntity
     * @param pSource
     * @param pDest
     * @param parseData
     * @returns {*}
     */
    replaceAdsIds: function (adsHtml, adEntity, pSource, pDest, parseData= true) {
      if (typeof adsHtml !== 'undefined' && adsHtml) {
        adsHtml = adsHtml.replace(`ad-desktop-${adEntity}-${pSource}`, `ad-desktop-${adEntity}-${pDest}`);
        adsHtml = adsHtml.replace(`ad-mobile-${adEntity}-${pSource}`, `ad-mobile-${adEntity}-${pDest}`);
        adsHtml = adsHtml.replace(`ad-tablet-${adEntity}-${pSource}`, `ad-tablet-${adEntity}-${pDest}`);
        adsHtml = adsHtml.replace(`ad-mobile_android-${adEntity}-${pSource}`, `ad-mobile_android-${adEntity}-${pDest}`);
        adsHtml = adsHtml.replace(`ad-mobile_ios-${adEntity}-${pSource}`, `ad-mobile_ios-${adEntity}-${pDest}`);
        adsHtml = adsHtml.replace(`ad-tablet_android-${adEntity}-${pSource}`, `ad-tablet_android-${adEntity}-${pDest}`);
        adsHtml = adsHtml.replace(`ad-tablet_ios-${adEntity}-${pSource}`, `ad-tablet_ios-${adEntity}-${pDest}`);
        return parseData ? $.parseHTML(adsHtml) : adsHtml;
      }
      return false;
    }
  };
})(jQuery, Drupal, window.document);
;
/**
 * @file
 */
(function ($, Drupal, drupalSettings) {

  'use strict';

  /**
   * Analytics should only trigger once, so not using behaviours here.
   */
  if(drupalSettings.mc_adobe_advertisement_provider !== undefined) {
    let nid = drupalSettings.mc_adobe_advertisement_provider.id;
    let url = drupalSettings.path.isFront ? '/' : drupalSettings.mc_adobe_advertisement_provider.url;
    let type = drupalSettings.mc_adobe_advertisement_provider.type;
    // @todo Move these hardcoded type values to mc global configuration.
    const types = {
      article: 'Article',
      audio: 'Audio',
      video: 'Video',
      author: 'Author',
      standard: 'Standard',
      minute: 'Minute',
      poem: 'Poem',
      word: 'Word',
    };

    // Page view event analytics.
    let urlPath = $(location).attr('pathname');
    if (!urlPath.match(/^\/search$/) && !urlPath.match(new RegExp('^/fast(/.*)?$'))) {
      // Search result comes via Algolia js so need to send on widnow.load
      // FAST page has its own pageview tracker
      _adobeUtility.adobeAnalyticsTrack('pageview', { id:nid, type:types[type], path: url, searchresultcount: 'NA', searchterm:'NA'});
    }
    $(document).ready(function() {
      // Media Video event analytics track.
      _adobeUtility.adobeBrightcoveVideoTrack(nid, url);
      // Track Mediaelement audio players;.
      _adobeUtility.adobeMediaPlayerTrack(nid, url);
    });
    // Omnymedia event analytics track.
    //_adobeUtility.adobeAudioTrack(nid, url);
  }
  //Destroy player when navigating away from page.
  Drupal.behaviors.destroybcplayer = {
    attach: function (context, settings) {
      window.onbeforeunload = function() {
        $('.video-js').each(function() {
          videojs.getPlayer(this.id).ready(function () {
            let myPlayer = this;
            myPlayer.dispose();
            console.log(this.id + " disposed");
          });
        });
      };
    }
  };
})(jQuery, Drupal, drupalSettings);
;
(function (f, b) { if (!b.__SV) { var e, g, i, h; window.mixpanel = b; b._i = []; b.init = function (e, f, c) { function g(a, d) { var b = d.split("."); 2 == b.length && ((a = a[b[0]]), (d = b[1])); a[d] = function () { a.push([d].concat(Array.prototype.slice.call(arguments, 0))); }; } var a = b; "undefined" !== typeof c ? (a = b[c] = []) : (c = "mixpanel"); a.people = a.people || []; a.toString = function (a) { var d = "mixpanel"; "mixpanel" !== c && (d += "." + c); a || (d += " (stub)"); return d; }; a.people.toString = function () { return a.toString(1) + ".people (stub)"; }; i = "disable time_event track track_pageview track_links track_forms track_with_groups add_group set_group remove_group register register_once alias unregister identify name_tag set_config reset opt_in_tracking opt_out_tracking has_opted_in_tracking has_opted_out_tracking clear_opt_in_out_tracking start_batch_senders people.set people.set_once people.unset people.increment people.append people.union people.track_charge people.clear_charges people.delete_user people.remove".split( " "); for (h = 0; h < i.length; h++) g(a, i[h]); var j = "set set_once union unset remove delete".split(" "); a.get_group = function () { function b(c) { d[c] = function () { call2_args = arguments; call2 = [c].concat(Array.prototype.slice.call(call2_args, 0)); a.push([e, call2]); }; } for ( var d = {}, e = ["get_group"].concat( Array.prototype.slice.call(arguments, 0)), c = 0; c < j.length; c++) b(j[c]); return d; }; b._i.push([e, f, c]); }; b.__SV = 1.2; e = f.createElement("script"); e.type = "text/javascript"; e.async = !0; e.src = "undefined" !== typeof MIXPANEL_CUSTOM_LIB_URL ? MIXPANEL_CUSTOM_LIB_URL : "file:" === f.location.protocol && "//cdn.mxpnl.com/libs/mixpanel-2-latest.min.js".match(/^\/\//) ? "https://cdn.mxpnl.com/libs/mixpanel-2-latest.min.js" : "//cdn.mxpnl.com/libs/mixpanel-2-latest.min.js"; g = f.getElementsByTagName("script")[0]; g.parentNode.insertBefore(e, g); } })(document, window.mixpanel || []);
;
(function ($, Drupal, drupalSettings) {

  // Loading Mixpanel JSON file.
  let mixpanelConfigJson;
  const fetchMixpanelConfigJsonPromise = new Promise((fetchMixpanelConfigJsonPromiseRes) => {
    if (!mixpanelConfigJson) {
      const domain = window.location.origin; // Get current domain (e.g., https://admin.channelnewsasia.com)
      const jsonUrl = `${domain}/static/mixpanel.json`;

      $.getJSON(jsonUrl)
        .then(function (data) {
          fetchMixpanelConfigJsonPromiseRes(data);
        })
        .fail(function (jqXHR, textStatus, errorThrown) {
          console.error('Error fetching Mixpanel JSON config:', textStatus, errorThrown);
          fetchMixpanelConfigJsonPromiseRes();
        });
    }
  });
  const fetchMixpanelConfig = async () => {
    const fetchedMixpanelConfigJson = await fetchMixpanelConfigJsonPromise;
    if (fetchedMixpanelConfigJson) {
      mixpanelConfigJson = fetchedMixpanelConfigJson;
    }
  };

  window.mixpanelConfig = {
    init: (token, additional_args) => {
      mixpanel.init(token, additional_args);
    },
    alias: (me_id) => {
      setTimeout(() => {
        mixpanel.alias(mixpanel.get_distinct_id(), me_id);
      }, 2000);
    },
    register: (args) => {
      mixpanel.register(args);
    },
    identify: (args) => {
      if (args) {
        mixpanel.identify(args);
      }
      else {
        setTimeout(() => {
          mixpanel.identify(mixpanel.get_distinct_id());
        }, 2000);
      }
    },
    getProperty: (args) => {
      return mixpanel.get_property(args);
    },
    people: {
      set: (args) => {
        mixpanel.people.set(args);
      },
      union: (args) => {
        mixpanel.people.union(args);
      }
    },
    // Function to track events with filtered arguments.
    trackEvent: async (eventName, args) => {
      // Ensure that fetchMixpanelConfig has completed
      await fetchMixpanelConfig();
      if (!mixpanelConfigJson) {
        console.error('Mixpanel: Global JSON configuration is not loaded');
        return;
      }
      // Check if the event is defined in the configuration.
      const isTrackEvent = Object.keys(mixpanelConfigJson.events).includes(eventName);
      if (isTrackEvent) {
        const filteredArgs = Object.entries(args).reduce((reducedArgsObj, [argKey, argValue]) => {
          if (argValue !== '' && argValue !== null && argValue !== undefined && mixpanelConfigJson.events[eventName].setEventProps.includes(argKey)) {
            reducedArgsObj[argKey] = (typeof argValue === 'string') ? argValue.toLowerCase() : argValue;
          }
          return reducedArgsObj;
        }, {}); // Filter away items that are null/undefined to prevent it from being passed to Mixpanel

        // Track the event with filtered arguments.
        mixpanel.track(eventName, filteredArgs);
      } else {
        console.error('Mixpanel: ' + eventName + ' does not exist in global JSON');
      }

    },
  }

  Drupal.behaviors.mixpanel_helper = {
    // Function to get the section title.
    getSectionTitle: function (link) {
      let parentSection =  $(link).closest('[data-title]');
      let sectionTitle = '';
      if (parentSection.length) {
        // First, check for 'data-title' attribute.
        sectionTitle = parentSection.attr('data-title');
        // If 'data-title' is not found, search for h2 or h3 tags.
        if (!sectionTitle) {
          sectionTitle = parentSection.find('h2, h3').first().text();
        }
      }
      // If no section title is found, use the link text as the fallback.
      if (!sectionTitle) {
        sectionTitle = link.text();
      }
      // Clean up the section title by trimming spaces and removing newlines.
      return sectionTitle.replace('\n', '').trim();
    },
    getPlatformTouchpoint: () => {
      const userAgent = navigator.userAgent;

      if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
        return 'Mobile Web';
      }
      else {
        return 'Desktop';
      }
    },
    getSiteDomain: () => {
      const hostname = window.location.hostname;
      const parts = hostname.split('.');

      if (parts.length > 2) {
        return parts.slice(-2).join('.');
      }
      return hostname;
    },
    getEntrySource: () => {
      const entrySource = document.referrer;
      const urlParams = new URLSearchParams(window.location.search);
      // Get the current domain.
      let currentDomain = window.location.hostname;
      const parts = currentDomain.split(".");

      if (parts.length > 2) {
        currentDomain = parts.slice(-2).join(".");
      }
      // If referrer comes from the current domain then return NULL.
      if (entrySource.includes(currentDomain)) {
        return;
      }
      // Check for 'cid' in the URL query params.
      let cid = urlParams.get("cid");
      if (cid) {
        cid = cid.toLowerCase();
        if (cid === "wacna" || cid.includes("wacna")) {
          return "whatsapp";
        }
        return cid;
      }
      // Check for 'utm_medium' in the URL query params for Twitter.
      const utmMedium = urlParams.get("utm_medium");
      if (utmMedium) {
        return utmMedium.toLowerCase();
      }
      // List of social media platforms.
      const socialMediaSources = [
        "facebook.com",
        "linkedin.com",
        "instagram.com",
        "pinterest.com",
        "tiktok.com",
        "youtube.com",
      ];
      // List of search engines
      const searchEngines = ["google.com", "bing.com", "yahoo.com"];

      // Check if the referrer matches any social media domain
      const matchingSocialMediaSource = socialMediaSources.find(
        (socialMediaSource) => {
          return entrySource.includes(socialMediaSource);
        }
      );
      if (matchingSocialMediaSource) {
        return matchingSocialMediaSource.split(".")[0];
      }
      // Check if the referrer matches any search engine domain
      const matchingsearchEngines = searchEngines.find((searchEngines) => {
        return entrySource.includes(searchEngines);
      });
      if (matchingsearchEngines) {
        return matchingsearchEngines.split(".")[0];
      }
      // Extract domain name from referrer URL and return only the core domain.
      try {
        const referrerDomain = new URL(entrySource).hostname;
        const coreDomain = referrerDomain.replace("www.", "").split(".")[0]; // Get core part of the domain
        return coreDomain;
      } catch (e) {
        return; // Fallback to full referrer if URL parsing fails
      }
    },
    getCurrentEdition: () => {
      const country_code = Cookies.get('country_code');
      if (country_code === 'SG') {
        return 'singapore';
      }
      else if (country_code === 'ID') {
        return 'indonesia';
      }
      else if (country_code === 'US') {
        return 'us/uk';
      }
      else {
        return 'asia';
      }
    },
    getCurrentCnaProduct: () => {
      const current_theme = drupalSettings.mc_mixpanel.active_theme_name;
      if (current_theme === 'mc_cna_theme') {
        return 'cna';
      }
      else if (current_theme === 'mc_cnalifestyle_theme') {
        return 'lifestyle';
      }
      else if (current_theme === 'mc_cnaluxury_theme') {
        return 'luxury';
      }
      else if (current_theme === 'mc_today_theme') {
        return 'today';
      }
    },
    getLinkClickProperties: (link) => {
      if ($(link).closest("section.block-field-blocknodearticlefield-content").length > 0) {
        return { sectionTitle: 'inarticle link' };
      }
      else if ($(link).closest("nav#main-nav.main-nav").length > 0) {
        return { sectionTitle: 'top menu', menuType: 'top menu' };
      }
      else if ($(link).closest("div#all-section-menu-modal.modal.all-section-menu-modal-wrapper").length > 0) {
        return { sectionTitle: 'all sections', menuType: 'all sections' };
      }
      else if ($(link).closest("div#hamburger-nav.hamburger-nav.hamburger-nav--open, div#hamburger-main-nav.hamburger-main-nav.hamburger-main-nav--open").length > 0) {
        return { sectionTitle: 'mobile ham menu', menuType: 'mobile ham menu' };
      }
      else if ($(link).closest(".logo-link").length > 0) {
        return { sectionTitle: `${drupalSettings.mc_mixpanel.site_name} icon` };
      }
      else {
        return { sectionTitle: Drupal.behaviors.mixpanel_helper.getSectionTitle(link)};
      }
    },
    getPageLoadProperties: (settings) => {
      const self = Drupal.behaviors.mixpanel_helper;
      const pageType = settings.mc_mixpanel.page_type;
      const siteName = settings.mc_mixpanel.site_name;
      const pageTitle = pageType === "homepage" ? `${siteName} homepage` : $("title").text();
      const pageUrl = window.location.href;
      const entrySource = self.getEntrySource();
      const navigationType = Cookies.get("navigationType");
      return {
        page_url: pageUrl,
        entry_source: entrySource,
        trigger_action: navigationType,
        page_name: pageTitle,
        page_type: pageType,
      };
    },
    getIsoFormatCurrentDate: () => {
      const currentDate = new Date();
      return currentDate.toISOString();
    }
  }

  Drupal.behaviors.mixpanel_config = {
    attach: function (context, settings) {

      $('html', context).once('mixpanel-init').each(function () {
        const mixpanel_helper = Drupal.behaviors.mixpanel_helper;

        // Initialize mixpanel.
        mixpanelConfig.init(settings.mc_mixpanel.project_token, {
          debug: true,
          persistence: "localStorage",
        });

        const adobe_id = _satellite.getVisitorId().getMarketingCloudVisitorID();
        const sso_id = Cookies.get('ssoid');
        const me_id = sso_id ?? Cookies.get('UID');

        // Register mixpanel super-properties.
        mixpanelConfig.register({
          'mediacorp_product': 'cna',
          'me_id': me_id,
          '$braze_external_id': me_id,
          'adobe_id': adobe_id,
          'logged_in': ssoMeConnect.isAuthenticate(),
          'cna_entry_source': mixpanel_helper.getEntrySource(),
          'cna_product': mixpanel_helper.getCurrentCnaProduct(),
          'edition': mixpanel_helper.getCurrentEdition(),
          'device_type': mixpanel_helper.getPlatformTouchpoint(),
          'source_platform': mixpanel_helper.getPlatformTouchpoint(),
        });

        // Check if user is logged in, then identify the user with prefix-me_id,
        // as me_id is sso_id for logged-in users.
        if (ssoMeConnect.isAuthenticate()) {
          const prefix_sso_id = `${settings.mc_mixpanel.id_prefix}-${me_id}`;
          if (typeof sso_id !== 'undefined') {
            mixpanelConfig.identify(prefix_sso_id);
          }
          mixpanelConfig.alias(me_id);
        }

        mixpanelConfig.people.set({
          'me_id': me_id,
          '$braze_external_id': me_id,
          'adobe_id': adobe_id,
          'cna_edition': mixpanel_helper.getCurrentEdition()
        });
        mixpanelConfig.people.union({
          'mediacorp_products_touchpoint': 'cna',
          'cna_platforms_touchpoint': mixpanel_helper.getPlatformTouchpoint(),
        });

        if (!ssoMeConnect.isAuthenticate()) {
          mixpanelConfig.alias(me_id);
          mixpanelConfig.identify();
        }

        // Track CNA launch event.
        if (context === document) {
          const entrySource = document.referrer;
          const exclude_domains = settings.mc_mixpanel.exclude_domains;
          if (entrySource === '' || (!entrySource.includes(mixpanel_helper.getSiteDomain()) && !exclude_domains.includes(entrySource))) {
            mixpanelConfig.trackEvent('cna_launch', {
              "cna_launch": drupalSettings.mc_mixpanel.page_type
            });
            mixpanelConfig.people.union({
              'mediacorp_products_touchpoint': 'cna',
            });
          }
        }

      });

    }
  }
})(jQuery, Drupal, drupalSettings);
;
(function ($, Drupal, drupalSettings) {

  // Track navigation type.
  Drupal.behaviors.mixpanelCommon = {
    attach: function (context, settings) {
      const mixpanel_helper = Drupal.behaviors.mixpanel_helper;
      const site_domain = mixpanel_helper.getSiteDomain();
      // Use current site domain if empty.
      const cookie_domain = (settings.mc_mixpanel.cookie_domain) || `.${site_domain}`;
      // Default to 1 minute if empty.
      const cookie_expire = (settings.mc_mixpanel.cookie_expire) || 1;
      // Attach the click event to links.
      $('a', context).once('link_click').click(function () {
        // Get the clicked link element.
        const pageUrl = window.location.href;
        const pageType = settings.mc_mixpanel.page_type;
        const link = $(this);
        const linkClickProperties = mixpanel_helper.getLinkClickProperties(link);
        let sectionTitle = linkClickProperties?.sectionTitle ?? '';
        const menuType = linkClickProperties?.menuType ?? '';

        // Set the navigationType cookie with the section title.
        Cookies.set("navigationType", sectionTitle, {
          expires: cookie_expire / 1440, // convert minutes to days
          domain: cookie_domain,
          path: "/",
        });
        // Set the prePageType cookie.
        Cookies.set("prePageType", pageType, {
          expires: cookie_expire / 1440, // convert minutes to days
          domain: cookie_domain,
          path: "/",
        });
        // Track content_click event.
        if (menuType !== "") {
          sectionTitle = link.text().trim().toLowerCase();
        }
        const contentClickProp = {
          content_section: sectionTitle,
          page_type: pageType,
          menu_type: menuType,
          page_url: pageUrl,
        };
        // Send content_click properties to mixpanel.
        mixpanelConfig.trackEvent("content_click", contentClickProp);
      });
    }
  }
})(jQuery, Drupal, drupalSettings);
;
(function ($, Drupal, drupalSettings) {
  Drupal.behaviors.articleRead = {
    attach: function (context, settings) {
      // aticle_read on page load.
      $('article:first-child', context).once('article_read').each(
        (articleIndex, article) => {
          Drupal.behaviors.articleRead.trackArticleRead(article, "");
        }
      );
      // aticle_read when user clicks on read full article.
      $('.article__read-full-story-button', context).once('article_read').click(function () {
        const article = $(this).parents(".node--article-content");
        Drupal.behaviors.articleRead.trackArticleRead(
          article,
          "expand to read"
        );
      });
    },
    // Function to track read_article event.
    trackArticleRead: function (article, read_more) {
      const nodeId = $(article).attr("data-node-id");
      if (nodeId) {
        const articleURL = window.location.href;
        const sectionTitle = $(article)
          .find(".content-detail__category a.link")
          .text()
          .replace("\n", "")
          .trim();
        const authorList = $(article)
          .find(".h6--author-name")
          .map((authorNameIndex, authorName) => {
            return authorName.innerText;
          })
          .get()
          .filter(Boolean);
        const paraCount = $(article).find("p").length;

        const isfastEnabled = !!$(article).attr("data-fast-url");
        const isTtsEnabled = !!$(article).find(".mc-text-to-speech-wrapper")
          .length;
        const entrySource = Drupal.behaviors.mixpanel_helper.getEntrySource();
        let navigationType = read_more;
        if (!read_more) {
          navigationType = Cookies.get("navigationType");
        }
        const previous_page_type = Cookies.get("prePageType");
        const articleReadProperties = {
          page_url: articleURL,
          article_id: nodeId,
          section_title: sectionTitle,
          author_name: authorList,
          para_count: paraCount,
          entry_source: entrySource,
          trigger_action: navigationType,
          fast: isfastEnabled,
          tts: isTtsEnabled,
          previous_page_type: previous_page_type,
        };
        mixpanelConfig.trackEvent("article_read", articleReadProperties);
      }
    },
  };
})(jQuery, Drupal, drupalSettings);
;
(function ($, Drupal, drupalSettings) {
  Drupal.behaviors.mcBookmarkEvent = {
    attach: function (context, settings) {

      // Track bookmark event.
      $('.bookmark-link, .bookmark-link-anonymous, .quick-link', context).once('bookmark-event-mixpanel').on('click bookmark_subscribe bookmark_unsubscribe', function (event) {
        // Early return for quick link event other then bookmark_subscribe.
        if(event.target.matches('.quick-link') && event.type !== 'bookmark_subscribe') {
          return;
        }
        let section_title = '';
        let author_name = '';

        // If click event from content details page.
        if($(this).closest('.block-mc-content-share-bookmark').length) {
          section_title = $(this).closest('article')
            .find('.block-mc-content-detail .content-detail__category a')
            .text();
          author_name = $(this).closest('article').find('.author-card__author-name h6').text();
        }

        // If click event from sticky header.
        if($(this).closest('.article-navigation').length) {
          section_title = $(this).closest('.article-navigation')
            .find('.list-object__category a').text();
          if(history.state !== null) {
            author_name = $('article[data-node-id="' + history.state + '"]')
              .find('.author-card__author-name h6').text();
          } else {
            author_name = $(context).find('.author-card__author-name h6').text();
          }
        }

        // If click event from landing page components.
        if($(this).closest('.js-popup-content').length) {
          let $dataElem = $(this).closest('.js-popup-content').find('.quick-link');
          if($dataElem.length) {
            section_title = $dataElem.attr('data-category');
            author_name = $dataElem.attr('data-author');
            // Set cookie for anonymous tracking.
            Cookies.set("bookmark-link-anonymous-uuid",  $dataElem.attr('data-uuid'));
          }
        }

        let login_status = false;
        if($(this).attr('data-isloggedin') !== undefined) {
          login_status = $(this).attr('data-isloggedin');
        }

        let articleBookmarkProperties = {
          login_status: login_status,
          section_title: section_title.trim(),
          author_name: author_name.trim()
        };

        let event_name = 'bookmark_click';
        if(event.type === 'bookmark_subscribe' || event.type === 'bookmark_unsubscribe') {
          event_name = 'bookmark_success';
        }

        // Anonymous user has to login before bookmark.
        // So, add data in cookie to use it later.
        if($(this).closest('.bookmark-link-anonymous').length) {
          Cookies.set("bookmark-link-anonymous-tracking", "subscribe");
        }

        mixpanelConfig.trackEvent(event_name, articleBookmarkProperties);
      });

      // Check cookie set by anonymous user after login.
      if(Cookies.get("bookmark-link-anonymous-tracking")) {
        if(window.location.search.indexOf('login=success') !== -1){
          $('article .bookmark-link').trigger('bookmark_subscribe');
          Cookies.remove("bookmark-link-anonymous-tracking");
          if (Cookies.get("bookmark-link-anonymous-uuid")) {
            $(`.quick-link[data-uuid="${Cookies.get("bookmark-link-anonymous-uuid")}"]`)
              .trigger('bookmark_subscribe');
            Cookies.remove("bookmark-link-anonymous-uuid");
          }
        }
      }
    }
  };
})(jQuery, Drupal, drupalSettings);
;
(function ($, Drupal, drupalSettings) {
  Drupal.behaviors.mcShareEvent = {
    attach: function (context, settings) {

      // Track bookmark event.
      $('.a2a-share-link, .popup__dialog-wrapper--share-link', context).once('mcShareEvent').on('click',  function (event) {
        if (event.target && $(event.target).parent()?.hasClass('link__icon')) {
          const shareMedium = $(event.target).closest('a.link')
            .find('span')
            .text();

          let sectionTitle = '';
          let authorName = '';
          // If click event from content details page.
          if($(this).closest('.block-mc-content-share-bookmark').length) {
            sectionTitle = $(context)
              .find('.block-mc-content-detail .content-detail__category a')
              .text();
            authorName = $(context).find('.author-card__author-name h6').first().text();
          }

          // If click event from sticky header.
          if($(this).closest('.article-navigation').length) {
            sectionTitle = $(this).closest('.article-navigation')
              .find('.list-object__category a').text();
            if(history.state !== null) {
              authorName = $('article[data-node-id="' + history.state + '"]')
                .find('.author-card__author-name h6').first().text();
            } else {
              authorName = $(context).find('.author-card__author-name h6').first().text();
            }
          }

          // If click event from landing page popup.
          if($(this).hasClass('popup__dialog-wrapper--share-link')) {
            sectionTitle = $(this).find('.list-object__category a').text();
            let title = $(this).find('.list-object__heading a').text().trim();
            authorName = $(document).find(`.js-popup-content div.quick-link--list-object[data-heading="${title}"]`)
              .attr('data-author');
          }

          mixpanelConfig.trackEvent('share_article', {
            share_medium: shareMedium.trim(),
            section_title: sectionTitle.trim(),
            author_name: authorName.trim()
          });
        }
      });

    }
  };
})(jQuery, Drupal, drupalSettings);
;
//layout configration block -- media edit block box height issue
jQuery(document).ajaxComplete(function(){
  jQuery(".ui-dialog .ui-dialog-buttonpane.ui-widget-content.ui-helper-clearfix").siblings(".ui-front.ui-dialog-content.ui-widget-content").addClass("edit-ui-widget");

  /* Account deletion modal*/
  if (jQuery(".account-deletion-modal").length && !jQuery(".deletion-ok-btn").length) {
    jQuery(".account-deletion-modal").parent().parent('.ui-dialog').addClass("deletion-modal-main");
    $( ".account-deletion-modal" ).append(" <button class='button button--follow button--linked deletion-ok-btn' onclick='removeDeleteModal()' >OK</button>" );
  }
});

function removeDeleteModal () {
  $( ".deletion-modal-main" ).empty();
  const isReadyGrecaptcha = () => typeof window !== 'undefined' && typeof window.grecaptcha !== 'undefined';
  if (isReadyGrecaptcha()) {
    grecaptcha.reset();
  }
};
"use strict";(function(a){Drupal.behaviors.text={attach:function attach(b){a(b).find(".text-long .align-left").wrap("<div class=\"align-left\"></div>"),a(b).find(".text-long .align-center").wrap("<div class=\"align-center\"></div>"),a(b).find(".text-long .align-right").wrap("<div class=\"align-right\"></div>")}}})(jQuery);;
/**
 * @file
 * Parse inline JSON and initialize the breakpointSettings global object.
 */

(function (drupalSettings, window) {

  'use strict';

  /**
   * Variable generated by Breakpoint settings.
   *
   * @global
   *
   * @type {object}
   */
  window.themeBreakpoints = {};

  if (typeof drupalSettings['theme_breakpoints'] !== 'undefined') {

    window.themeBreakpoints = new function () {
      this.Breakpoints = JSON.parse(drupalSettings['theme_breakpoints']);
      this.currentBreakpoint = false;

      this.getCurrentBreakpoint = function () {
        return this.currentBreakpoint;
      };

      var triggerBreakpointChange = function () {
        // This is deprecated but needed for IE compatibility.
        var breakpoint_changed_event = document.createEvent('CustomEvent');
        breakpoint_changed_event.initCustomEvent('themeBreakpoint:changed', true, true, this.currentBreakpoint);
        window.dispatchEvent(breakpoint_changed_event);
      }.bind(this);

      this.breakpointChangeHandler = function () {
        var mqls = this.mediaQueryListeners;
        var breakpointCandidate = false;
        for (var i = 0; i < mqls.length; i++) {
          if (mqls[i].matches) {
            breakpointCandidate = this.Breakpoints[i];
          }
        }
        if (breakpointCandidate && breakpointCandidate !== this.currentBreakpoint) {
          this.currentBreakpoint = breakpointCandidate;
          triggerBreakpointChange();
        }
      }.bind(this);

      this.mediaQueryListeners = function () {
        var breakpoints = this.Breakpoints;
        if (!Array.isArray(breakpoints) || breakpoints.length === 0) {
          return [];
        }
        var currentBreakpoint = false;
        var mqls = [];
        for (var i = 0; i < breakpoints.length; i++) {
          if (breakpoints[i].mediaQuery === '') {
            breakpoints[i].mediaQuery = '(min-width: 0em)';
          }
          var mql = window.matchMedia(breakpoints[i].mediaQuery);
          mql.addListener(this.breakpointChangeHandler);
          mqls.push(mql);
          if (mql.matches) {
            currentBreakpoint = breakpoints[i];
          }
        }

        this.currentBreakpoint = currentBreakpoint;

        return mqls;
      }.call(this);
    }();
  }

})(drupalSettings, window);
;
/*
CryptoJS v3.1.2
code.google.com/p/crypto-js
(c) 2009-2013 by Jeff Mott. All rights reserved.
code.google.com/p/crypto-js/wiki/License
*/
var CryptoJS=CryptoJS||function(u,p){var d={},l=d.lib={},s=function(){},t=l.Base={extend:function(a){s.prototype=this;var c=new s;a&&c.mixIn(a);c.hasOwnProperty("init")||(c.init=function(){c.$super.init.apply(this,arguments)});c.init.prototype=c;c.$super=this;return c},create:function(){var a=this.extend();a.init.apply(a,arguments);return a},init:function(){},mixIn:function(a){for(var c in a)a.hasOwnProperty(c)&&(this[c]=a[c]);a.hasOwnProperty("toString")&&(this.toString=a.toString)},clone:function(){return this.init.prototype.extend(this)}},
  r=l.WordArray=t.extend({init:function(a,c){a=this.words=a||[];this.sigBytes=c!=p?c:4*a.length},toString:function(a){return(a||v).stringify(this)},concat:function(a){var c=this.words,e=a.words,j=this.sigBytes;a=a.sigBytes;this.clamp();if(j%4)for(var k=0;k<a;k++)c[j+k>>>2]|=(e[k>>>2]>>>24-8*(k%4)&255)<<24-8*((j+k)%4);else if(65535<e.length)for(k=0;k<a;k+=4)c[j+k>>>2]=e[k>>>2];else c.push.apply(c,e);this.sigBytes+=a;return this},clamp:function(){var a=this.words,c=this.sigBytes;a[c>>>2]&=4294967295<<
      32-8*(c%4);a.length=u.ceil(c/4)},clone:function(){var a=t.clone.call(this);a.words=this.words.slice(0);return a},random:function(a){for(var c=[],e=0;e<a;e+=4)c.push(4294967296*u.random()|0);return new r.init(c,a)}}),w=d.enc={},v=w.Hex={stringify:function(a){var c=a.words;a=a.sigBytes;for(var e=[],j=0;j<a;j++){var k=c[j>>>2]>>>24-8*(j%4)&255;e.push((k>>>4).toString(16));e.push((k&15).toString(16))}return e.join("")},parse:function(a){for(var c=a.length,e=[],j=0;j<c;j+=2)e[j>>>3]|=parseInt(a.substr(j,
      2),16)<<24-4*(j%8);return new r.init(e,c/2)}},b=w.Latin1={stringify:function(a){var c=a.words;a=a.sigBytes;for(var e=[],j=0;j<a;j++)e.push(String.fromCharCode(c[j>>>2]>>>24-8*(j%4)&255));return e.join("")},parse:function(a){for(var c=a.length,e=[],j=0;j<c;j++)e[j>>>2]|=(a.charCodeAt(j)&255)<<24-8*(j%4);return new r.init(e,c)}},x=w.Utf8={stringify:function(a){try{return decodeURIComponent(escape(b.stringify(a)))}catch(c){throw Error("Malformed UTF-8 data");}},parse:function(a){return b.parse(unescape(encodeURIComponent(a)))}},
  q=l.BufferedBlockAlgorithm=t.extend({reset:function(){this._data=new r.init;this._nDataBytes=0},_append:function(a){"string"==typeof a&&(a=x.parse(a));this._data.concat(a);this._nDataBytes+=a.sigBytes},_process:function(a){var c=this._data,e=c.words,j=c.sigBytes,k=this.blockSize,b=j/(4*k),b=a?u.ceil(b):u.max((b|0)-this._minBufferSize,0);a=b*k;j=u.min(4*a,j);if(a){for(var q=0;q<a;q+=k)this._doProcessBlock(e,q);q=e.splice(0,a);c.sigBytes-=j}return new r.init(q,j)},clone:function(){var a=t.clone.call(this);
      a._data=this._data.clone();return a},_minBufferSize:0});l.Hasher=q.extend({cfg:t.extend(),init:function(a){this.cfg=this.cfg.extend(a);this.reset()},reset:function(){q.reset.call(this);this._doReset()},update:function(a){this._append(a);this._process();return this},finalize:function(a){a&&this._append(a);return this._doFinalize()},blockSize:16,_createHelper:function(a){return function(b,e){return(new a.init(e)).finalize(b)}},_createHmacHelper:function(a){return function(b,e){return(new n.HMAC.init(a,
    e)).finalize(b)}}});var n=d.algo={};return d}(Math);
(function(){var u=CryptoJS,p=u.lib.WordArray;u.enc.Base64={stringify:function(d){var l=d.words,p=d.sigBytes,t=this._map;d.clamp();d=[];for(var r=0;r<p;r+=3)for(var w=(l[r>>>2]>>>24-8*(r%4)&255)<<16|(l[r+1>>>2]>>>24-8*((r+1)%4)&255)<<8|l[r+2>>>2]>>>24-8*((r+2)%4)&255,v=0;4>v&&r+0.75*v<p;v++)d.push(t.charAt(w>>>6*(3-v)&63));if(l=t.charAt(64))for(;d.length%4;)d.push(l);return d.join("")},parse:function(d){var l=d.length,s=this._map,t=s.charAt(64);t&&(t=d.indexOf(t),-1!=t&&(l=t));for(var t=[],r=0,w=0;w<
  l;w++)if(w%4){var v=s.indexOf(d.charAt(w-1))<<2*(w%4),b=s.indexOf(d.charAt(w))>>>6-2*(w%4);t[r>>>2]|=(v|b)<<24-8*(r%4);r++}return p.create(t,r)},_map:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/="}})();
(function(u){function p(b,n,a,c,e,j,k){b=b+(n&a|~n&c)+e+k;return(b<<j|b>>>32-j)+n}function d(b,n,a,c,e,j,k){b=b+(n&c|a&~c)+e+k;return(b<<j|b>>>32-j)+n}function l(b,n,a,c,e,j,k){b=b+(n^a^c)+e+k;return(b<<j|b>>>32-j)+n}function s(b,n,a,c,e,j,k){b=b+(a^(n|~c))+e+k;return(b<<j|b>>>32-j)+n}for(var t=CryptoJS,r=t.lib,w=r.WordArray,v=r.Hasher,r=t.algo,b=[],x=0;64>x;x++)b[x]=4294967296*u.abs(u.sin(x+1))|0;r=r.MD5=v.extend({_doReset:function(){this._hash=new w.init([1732584193,4023233417,2562383102,271733878])},
  _doProcessBlock:function(q,n){for(var a=0;16>a;a++){var c=n+a,e=q[c];q[c]=(e<<8|e>>>24)&16711935|(e<<24|e>>>8)&4278255360}var a=this._hash.words,c=q[n+0],e=q[n+1],j=q[n+2],k=q[n+3],z=q[n+4],r=q[n+5],t=q[n+6],w=q[n+7],v=q[n+8],A=q[n+9],B=q[n+10],C=q[n+11],u=q[n+12],D=q[n+13],E=q[n+14],x=q[n+15],f=a[0],m=a[1],g=a[2],h=a[3],f=p(f,m,g,h,c,7,b[0]),h=p(h,f,m,g,e,12,b[1]),g=p(g,h,f,m,j,17,b[2]),m=p(m,g,h,f,k,22,b[3]),f=p(f,m,g,h,z,7,b[4]),h=p(h,f,m,g,r,12,b[5]),g=p(g,h,f,m,t,17,b[6]),m=p(m,g,h,f,w,22,b[7]),
    f=p(f,m,g,h,v,7,b[8]),h=p(h,f,m,g,A,12,b[9]),g=p(g,h,f,m,B,17,b[10]),m=p(m,g,h,f,C,22,b[11]),f=p(f,m,g,h,u,7,b[12]),h=p(h,f,m,g,D,12,b[13]),g=p(g,h,f,m,E,17,b[14]),m=p(m,g,h,f,x,22,b[15]),f=d(f,m,g,h,e,5,b[16]),h=d(h,f,m,g,t,9,b[17]),g=d(g,h,f,m,C,14,b[18]),m=d(m,g,h,f,c,20,b[19]),f=d(f,m,g,h,r,5,b[20]),h=d(h,f,m,g,B,9,b[21]),g=d(g,h,f,m,x,14,b[22]),m=d(m,g,h,f,z,20,b[23]),f=d(f,m,g,h,A,5,b[24]),h=d(h,f,m,g,E,9,b[25]),g=d(g,h,f,m,k,14,b[26]),m=d(m,g,h,f,v,20,b[27]),f=d(f,m,g,h,D,5,b[28]),h=d(h,f,
      m,g,j,9,b[29]),g=d(g,h,f,m,w,14,b[30]),m=d(m,g,h,f,u,20,b[31]),f=l(f,m,g,h,r,4,b[32]),h=l(h,f,m,g,v,11,b[33]),g=l(g,h,f,m,C,16,b[34]),m=l(m,g,h,f,E,23,b[35]),f=l(f,m,g,h,e,4,b[36]),h=l(h,f,m,g,z,11,b[37]),g=l(g,h,f,m,w,16,b[38]),m=l(m,g,h,f,B,23,b[39]),f=l(f,m,g,h,D,4,b[40]),h=l(h,f,m,g,c,11,b[41]),g=l(g,h,f,m,k,16,b[42]),m=l(m,g,h,f,t,23,b[43]),f=l(f,m,g,h,A,4,b[44]),h=l(h,f,m,g,u,11,b[45]),g=l(g,h,f,m,x,16,b[46]),m=l(m,g,h,f,j,23,b[47]),f=s(f,m,g,h,c,6,b[48]),h=s(h,f,m,g,w,10,b[49]),g=s(g,h,f,m,
      E,15,b[50]),m=s(m,g,h,f,r,21,b[51]),f=s(f,m,g,h,u,6,b[52]),h=s(h,f,m,g,k,10,b[53]),g=s(g,h,f,m,B,15,b[54]),m=s(m,g,h,f,e,21,b[55]),f=s(f,m,g,h,v,6,b[56]),h=s(h,f,m,g,x,10,b[57]),g=s(g,h,f,m,t,15,b[58]),m=s(m,g,h,f,D,21,b[59]),f=s(f,m,g,h,z,6,b[60]),h=s(h,f,m,g,C,10,b[61]),g=s(g,h,f,m,j,15,b[62]),m=s(m,g,h,f,A,21,b[63]);a[0]=a[0]+f|0;a[1]=a[1]+m|0;a[2]=a[2]+g|0;a[3]=a[3]+h|0},_doFinalize:function(){var b=this._data,n=b.words,a=8*this._nDataBytes,c=8*b.sigBytes;n[c>>>5]|=128<<24-c%32;var e=u.floor(a/
    4294967296);n[(c+64>>>9<<4)+15]=(e<<8|e>>>24)&16711935|(e<<24|e>>>8)&4278255360;n[(c+64>>>9<<4)+14]=(a<<8|a>>>24)&16711935|(a<<24|a>>>8)&4278255360;b.sigBytes=4*(n.length+1);this._process();b=this._hash;n=b.words;for(a=0;4>a;a++)c=n[a],n[a]=(c<<8|c>>>24)&16711935|(c<<24|c>>>8)&4278255360;return b},clone:function(){var b=v.clone.call(this);b._hash=this._hash.clone();return b}});t.MD5=v._createHelper(r);t.HmacMD5=v._createHmacHelper(r)})(Math);
(function(){var u=CryptoJS,p=u.lib,d=p.Base,l=p.WordArray,p=u.algo,s=p.EvpKDF=d.extend({cfg:d.extend({keySize:4,hasher:p.MD5,iterations:1}),init:function(d){this.cfg=this.cfg.extend(d)},compute:function(d,r){for(var p=this.cfg,s=p.hasher.create(),b=l.create(),u=b.words,q=p.keySize,p=p.iterations;u.length<q;){n&&s.update(n);var n=s.update(d).finalize(r);s.reset();for(var a=1;a<p;a++)n=s.finalize(n),s.reset();b.concat(n)}b.sigBytes=4*q;return b}});u.EvpKDF=function(d,l,p){return s.create(p).compute(d,
  l)}})();
CryptoJS.lib.Cipher||function(u){var p=CryptoJS,d=p.lib,l=d.Base,s=d.WordArray,t=d.BufferedBlockAlgorithm,r=p.enc.Base64,w=p.algo.EvpKDF,v=d.Cipher=t.extend({cfg:l.extend(),createEncryptor:function(e,a){return this.create(this._ENC_XFORM_MODE,e,a)},createDecryptor:function(e,a){return this.create(this._DEC_XFORM_MODE,e,a)},init:function(e,a,b){this.cfg=this.cfg.extend(b);this._xformMode=e;this._key=a;this.reset()},reset:function(){t.reset.call(this);this._doReset()},process:function(e){this._append(e);return this._process()},
  finalize:function(e){e&&this._append(e);return this._doFinalize()},keySize:4,ivSize:4,_ENC_XFORM_MODE:1,_DEC_XFORM_MODE:2,_createHelper:function(e){return{encrypt:function(b,k,d){return("string"==typeof k?c:a).encrypt(e,b,k,d)},decrypt:function(b,k,d){return("string"==typeof k?c:a).decrypt(e,b,k,d)}}}});d.StreamCipher=v.extend({_doFinalize:function(){return this._process(!0)},blockSize:1});var b=p.mode={},x=function(e,a,b){var c=this._iv;c?this._iv=u:c=this._prevBlock;for(var d=0;d<b;d++)e[a+d]^=
  c[d]},q=(d.BlockCipherMode=l.extend({createEncryptor:function(e,a){return this.Encryptor.create(e,a)},createDecryptor:function(e,a){return this.Decryptor.create(e,a)},init:function(e,a){this._cipher=e;this._iv=a}})).extend();q.Encryptor=q.extend({processBlock:function(e,a){var b=this._cipher,c=b.blockSize;x.call(this,e,a,c);b.encryptBlock(e,a);this._prevBlock=e.slice(a,a+c)}});q.Decryptor=q.extend({processBlock:function(e,a){var b=this._cipher,c=b.blockSize,d=e.slice(a,a+c);b.decryptBlock(e,a);x.call(this,
    e,a,c);this._prevBlock=d}});b=b.CBC=q;q=(p.pad={}).Pkcs7={pad:function(a,b){for(var c=4*b,c=c-a.sigBytes%c,d=c<<24|c<<16|c<<8|c,l=[],n=0;n<c;n+=4)l.push(d);c=s.create(l,c);a.concat(c)},unpad:function(a){a.sigBytes-=a.words[a.sigBytes-1>>>2]&255}};d.BlockCipher=v.extend({cfg:v.cfg.extend({mode:b,padding:q}),reset:function(){v.reset.call(this);var a=this.cfg,b=a.iv,a=a.mode;if(this._xformMode==this._ENC_XFORM_MODE)var c=a.createEncryptor;else c=a.createDecryptor,this._minBufferSize=1;this._mode=c.call(a,
    this,b&&b.words)},_doProcessBlock:function(a,b){this._mode.processBlock(a,b)},_doFinalize:function(){var a=this.cfg.padding;if(this._xformMode==this._ENC_XFORM_MODE){a.pad(this._data,this.blockSize);var b=this._process(!0)}else b=this._process(!0),a.unpad(b);return b},blockSize:4});var n=d.CipherParams=l.extend({init:function(a){this.mixIn(a)},toString:function(a){return(a||this.formatter).stringify(this)}}),b=(p.format={}).OpenSSL={stringify:function(a){var b=a.ciphertext;a=a.salt;return(a?s.create([1398893684,
    1701076831]).concat(a).concat(b):b).toString(r)},parse:function(a){a=r.parse(a);var b=a.words;if(1398893684==b[0]&&1701076831==b[1]){var c=s.create(b.slice(2,4));b.splice(0,4);a.sigBytes-=16}return n.create({ciphertext:a,salt:c})}},a=d.SerializableCipher=l.extend({cfg:l.extend({format:b}),encrypt:function(a,b,c,d){d=this.cfg.extend(d);var l=a.createEncryptor(c,d);b=l.finalize(b);l=l.cfg;return n.create({ciphertext:b,key:c,iv:l.iv,algorithm:a,mode:l.mode,padding:l.padding,blockSize:a.blockSize,formatter:d.format})},
  decrypt:function(a,b,c,d){d=this.cfg.extend(d);b=this._parse(b,d.format);return a.createDecryptor(c,d).finalize(b.ciphertext)},_parse:function(a,b){return"string"==typeof a?b.parse(a,this):a}}),p=(p.kdf={}).OpenSSL={execute:function(a,b,c,d){d||(d=s.random(8));a=w.create({keySize:b+c}).compute(a,d);c=s.create(a.words.slice(b),4*c);a.sigBytes=4*b;return n.create({key:a,iv:c,salt:d})}},c=d.PasswordBasedCipher=a.extend({cfg:a.cfg.extend({kdf:p}),encrypt:function(b,c,d,l){l=this.cfg.extend(l);d=l.kdf.execute(d,
    b.keySize,b.ivSize);l.iv=d.iv;b=a.encrypt.call(this,b,c,d.key,l);b.mixIn(d);return b},decrypt:function(b,c,d,l){l=this.cfg.extend(l);c=this._parse(c,l.format);d=l.kdf.execute(d,b.keySize,b.ivSize,c.salt);l.iv=d.iv;return a.decrypt.call(this,b,c,d.key,l)}})}();
(function(){for(var u=CryptoJS,p=u.lib.BlockCipher,d=u.algo,l=[],s=[],t=[],r=[],w=[],v=[],b=[],x=[],q=[],n=[],a=[],c=0;256>c;c++)a[c]=128>c?c<<1:c<<1^283;for(var e=0,j=0,c=0;256>c;c++){var k=j^j<<1^j<<2^j<<3^j<<4,k=k>>>8^k&255^99;l[e]=k;s[k]=e;var z=a[e],F=a[z],G=a[F],y=257*a[k]^16843008*k;t[e]=y<<24|y>>>8;r[e]=y<<16|y>>>16;w[e]=y<<8|y>>>24;v[e]=y;y=16843009*G^65537*F^257*z^16843008*e;b[k]=y<<24|y>>>8;x[k]=y<<16|y>>>16;q[k]=y<<8|y>>>24;n[k]=y;e?(e=z^a[a[a[G^z]]],j^=a[a[j]]):e=j=1}var H=[0,1,2,4,8,
  16,32,64,128,27,54],d=d.AES=p.extend({_doReset:function(){for(var a=this._key,c=a.words,d=a.sigBytes/4,a=4*((this._nRounds=d+6)+1),e=this._keySchedule=[],j=0;j<a;j++)if(j<d)e[j]=c[j];else{var k=e[j-1];j%d?6<d&&4==j%d&&(k=l[k>>>24]<<24|l[k>>>16&255]<<16|l[k>>>8&255]<<8|l[k&255]):(k=k<<8|k>>>24,k=l[k>>>24]<<24|l[k>>>16&255]<<16|l[k>>>8&255]<<8|l[k&255],k^=H[j/d|0]<<24);e[j]=e[j-d]^k}c=this._invKeySchedule=[];for(d=0;d<a;d++)j=a-d,k=d%4?e[j]:e[j-4],c[d]=4>d||4>=j?k:b[l[k>>>24]]^x[l[k>>>16&255]]^q[l[k>>>
  8&255]]^n[l[k&255]]},encryptBlock:function(a,b){this._doCryptBlock(a,b,this._keySchedule,t,r,w,v,l)},decryptBlock:function(a,c){var d=a[c+1];a[c+1]=a[c+3];a[c+3]=d;this._doCryptBlock(a,c,this._invKeySchedule,b,x,q,n,s);d=a[c+1];a[c+1]=a[c+3];a[c+3]=d},_doCryptBlock:function(a,b,c,d,e,j,l,f){for(var m=this._nRounds,g=a[b]^c[0],h=a[b+1]^c[1],k=a[b+2]^c[2],n=a[b+3]^c[3],p=4,r=1;r<m;r++)var q=d[g>>>24]^e[h>>>16&255]^j[k>>>8&255]^l[n&255]^c[p++],s=d[h>>>24]^e[k>>>16&255]^j[n>>>8&255]^l[g&255]^c[p++],t=
    d[k>>>24]^e[n>>>16&255]^j[g>>>8&255]^l[h&255]^c[p++],n=d[n>>>24]^e[g>>>16&255]^j[h>>>8&255]^l[k&255]^c[p++],g=q,h=s,k=t;q=(f[g>>>24]<<24|f[h>>>16&255]<<16|f[k>>>8&255]<<8|f[n&255])^c[p++];s=(f[h>>>24]<<24|f[k>>>16&255]<<16|f[n>>>8&255]<<8|f[g&255])^c[p++];t=(f[k>>>24]<<24|f[n>>>16&255]<<16|f[g>>>8&255]<<8|f[h&255])^c[p++];n=(f[n>>>24]<<24|f[g>>>16&255]<<16|f[h>>>8&255]<<8|f[k&255])^c[p++];a[b]=q;a[b+1]=s;a[b+2]=t;a[b+3]=n},keySize:8});u.AES=p._createHelper(d)})();
;
/**
* @file
*/

(function ($, Drupal) {
    let allSectionMenu = document.querySelector('.all-section-menu');
    let menuSpotlightImg = document.querySelectorAll('.hamburger-menu .spotlight img');

    if(allSectionMenu && menuSpotlightImg) {
        allSectionMenu.addEventListener('click', function (event) {
            menuSpotlightImg.forEach(function(el){
                let dataOnDemandSrc = el.dataset.ondemandsrc;
                el.setAttribute('src', dataOnDemandSrc);
            });
        }, false);
    }
})(jQuery, Drupal);
;
/**
* DO NOT EDIT THIS FILE.
* See the following change record for more information,
* https://www.drupal.org/node/2815083
* @preserve
**/

Drupal.debounce = function (func, wait, immediate) {
  var timeout;
  var result;
  return function () {
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    var context = this;

    var later = function later() {
      timeout = null;

      if (!immediate) {
        result = func.apply(context, args);
      }
    };

    var callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);

    if (callNow) {
      result = func.apply(context, args);
    }

    return result;
  };
};;
(function ($, Drupal) {
    'use strict';
    Drupal.behaviors.scrollToActiveLink = {
        attach: function (context, settings) {
            $('html', context).once('scrollToActiveLink').each(function () {
                const headerSecondary = document.querySelector('.header__secondary');
                let activeLink = document.querySelector('.main-menu__item--active');

                if (!activeLink) {
                    $('.main-menu__item a').each(function () {
                        const linkHref = this.getAttribute('href');
                        if (window.location.href === linkHref || window.location.pathname === linkHref) {
                            $(this).addClass('is-active').parent().addClass('main-menu__item--active');
                            $(this).addClass('main-menu__link--active');
                            activeLink = document.querySelector('.main-menu__item--active');
                        }
                    });
                }

                if (headerSecondary && activeLink) {
                    headerSecondary.scrollLeft = activeLink.offsetLeft;
                }
            });
        }
    };
})(jQuery, Drupal);
;
(function ($, Drupal, debounce) {
    'use strict';
    var position = $(window).scrollTop(); 
    // should start at 0
      $(window).scroll( debounce(function () {
        var scroll = $(window).scrollTop();
        var header_height = $('.header').height();
        var article_heading = $('.article-detail-title-block').height();
        var video_heading = $('.block-video-heading').height();
        var add_height = $('.block-ad-entity').height();
        if ($('body').hasClass('page__article')){
          var total_height = $('.article-detail-title-block').offset().top + article_heading - 110;
        } else {
          var total_height = video_heading ? (video_heading + 110) : 110;
        }
    
        if(scroll > position) {
          if(scroll > total_height) {
            if ($('article[data-is-back-to-fast]').length > 0) {
              $('body').addClass('show-fast-button-on-navigation')
            }
            $('.header__branding, .header__primary, .header__secondary, section.navigation-block, .logo__image, .header__header-bar').addClass("isscroll");
          }
        } else {
          $('body').removeClass('show-fast-button-on-navigation')
          $('.header__branding, .header__primary, .header__secondary, section.navigation-block, .logo__image, .header__header-bar').removeClass("isscroll");
        }
        position = scroll;
      }, 100));

      // Scroll navigation to active link
      function scrollToActiveLink() {
        const activeLink = document.querySelector('.main-menu__item--active');
        const activeAnchor = $('a', activeLink);
        const activeLinkHref = $(activeAnchor).attr('href');

        if (activeLinkHref !== window.location.href || activeLinkHref !== window.location.pathname) {
          $(activeLink).removeClass('main-menu__item--active');
          $(activeAnchor).removeClass('main-menu__link--active');
        }

        Drupal.behaviors.scrollToActiveLink.attach();
      }
      scrollToActiveLink();
    
      $.fn.readmore = function (settings) {
  
        var opts =  $.extend({}, $.fn.readmore.defaults, settings);
    
        this.each(function () {
          $(this).data("opts", opts);
          if ($(this).text().length > opts.substr_len) {
            abridge($(this));
            linkage($(this));
          }
        });
    
        function linkage(elem) {
          elem.append(elem.data("opts").more_link);
          elem.children(".more").click( function () {
            $(this).hide();
            $(this).siblings("span:not(.hidden)").hide().siblings("span.hidden").fadeIn({queue: false, duration: 250});;
          });
        }
    
        function abridge(elem) {
          var opts = elem.data("opts");
          var txt = elem.text();
          var len = opts.substr_len;
          var dots = "<span>" + opts.ellipses + "</span>";
          var charAtLen = txt.substr(len, 1);
          while (len < txt.length && !/\s/.test(charAtLen)) {
              len++;
              charAtLen = txt.substr(len, 1);
          }
          var shown = txt.substring(0, len) + dots;
          var hidden = '<span class="hidden" style="display:none;">' + txt.substring(len, txt.length) + '</span>';
          elem.html(shown + hidden);
        }
        
        return this;
      };
    
      $.fn.readmore.defaults = {
        substr_len: 500,
        ellipses: '&#8230;',
        more_link: '<a class="more">see&nbsp;more</a>'
      };

      $('.figure__caption').readmore({ substr_len: 240 });
  })(jQuery, Drupal, Drupal.debounce);
  ;
/**
* @file
*/

(function ($, Drupal) {
  Drupal.behaviors.articleTable = {
    attach: function () {
      // Iterate each table
      $('body.page__article .block-field-blocknodearticlefield-content table').each(function(i) {
        if ($(this).parent().is(".text-long")) {
          $(this).wrap("<div></div>").wrap("<div></div>");
        }
        
        // for table identifier, unique each table
        $(this).parent().addClass("article-table-responsive-"+i); 

        // add same class to all tables, for styling
        $(this).parent().parent().addClass("article-table-responsive-container"); 
        $(this).parent().addClass("article-table-responsive");

        var element = document.querySelector('.article-table-responsive-'+i);
        // determine if there is overflow
        if(element.offsetWidth < element.scrollWidth) {
          // insert arrows after the table for navigation
          $("<span class='btn-hidden left-arrow left-arrow-"+i+" id='btn-slide-left'></span>").insertAfter('.article-table-responsive-'+i);
          $("<span class='right-arrow right-arrow-"+i+"' id='btn-slide-right'></span>").insertAfter('.article-table-responsive-'+i);

          // append two <div>s for fade effect
          $("<div class='gradient-hidden table-gradient-overlap-left table-gradient-overlap-left-"+i+"' id='table-gradient-overlap-left-id'></div>").insertAfter('.article-table-responsive-'+i);
          $("<div class='table-gradient-overlap-right table-gradient-overlap-right-"+i+"' id='table-gradient-overlap-right-id'></div>").insertAfter('.article-table-responsive-'+i);

          // Declare variables for container, max scroll left, left and right buttons
          var container = $('.article-table-responsive-'+i)[0];
          var maxScrollLeft = container.scrollWidth - container.clientWidth;
          var btnSlideLeft = $(".left-arrow-"+i);
          var btnSlideRight = $(".right-arrow-"+i);
          var tableGradientOverlapLeft = $(".table-gradient-overlap-left-"+i);
          var tableGradientOverlapRight = $(".table-gradient-overlap-right-"+i);

          // Right Arrow Click
          $( ".right-arrow-"+i ).each(function() {
            $(this).on('click', function() {
              sideScroll(container, 'right', 25, 100, 10);

              // If scrolled to right and there is more to scroll
              if(container.scrollLeft >= 0) {
                btnSlideLeft.removeClass("btn-hidden");
                tableGradientOverlapLeft.removeClass("gradient-hidden");
              }
              // If scrolled to right and max is reached
              if(container.scrollLeft > maxScrollLeft-50) {
                btnSlideRight.addClass("btn-hidden");
                tableGradientOverlapRight.addClass("gradient-hidden");
              }
            });
          });

          // Left Arrow Click
          $( ".left-arrow-"+i ).each(function() {
            $(this).on('click', function() {
              sideScroll(container, 'left', 25, 50, 10);

              if(container.scrollLeft < 23){
                btnSlideLeft.addClass("btn-hidden");
                tableGradientOverlapLeft.addClass("gradient-hidden");
              }
              if(container.scrollLeft < maxScrollLeft-1) {
                btnSlideRight.removeClass("btn-hidden");
                tableGradientOverlapRight.removeClass("gradient-hidden");
              }
            });
          });

          // Scroll Function on click
          function sideScroll(element, direction, speed, distance, step) {
            var scrollAmount = 0;
            var slideTimer = setInterval(function () {
              if (direction == 'left') {
                element.scrollLeft -= step * 2;
              } else {
                element.scrollLeft += step * 1;
              }
              scrollAmount += step;
              if (scrollAmount >= distance) {
                window.clearInterval(slideTimer);
              }
            }, speed);
          }

          element.onscroll = ()=>{
            if(container.scrollLeft >= 0) {
              btnSlideLeft.removeClass("btn-hidden");
              tableGradientOverlapLeft.removeClass("gradient-hidden");
            }
            if(container.scrollLeft > maxScrollLeft-1) {
              btnSlideRight.addClass("btn-hidden");
              tableGradientOverlapRight.addClass("gradient-hidden");
            }
            if(container.scrollLeft < 23){
              btnSlideLeft.addClass("btn-hidden");
              tableGradientOverlapLeft.addClass("gradient-hidden");
            }
            if(container.scrollLeft < maxScrollLeft-1) {
              btnSlideRight.removeClass("btn-hidden");
              tableGradientOverlapRight.removeClass("gradient-hidden");
            }
          }
        }
      });
    }
  }
})(jQuery, Drupal);
;
