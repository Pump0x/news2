(function ($, Drupal, drupalSettings) {
  'use strict';

  // Numeric object keys map to YouTube events, reference: https://developers.google.com/youtube/iframe_api_reference#Events's `onStateChange`
  const YOUTUBE_PLAYER_STATE_CLASSES = {
    '-1': 'youtube-player--unstarted',
    '0': 'youtube-player--ended',
    '1': 'youtube-player--playing',
    '2': 'youtube-player--paused',
    '3': 'youtube-player--buffering',
    '5': 'youtube-player--video-cued',
    adPlaying: 'youtube-player--ad-playing',
    adPaused: 'youtube-player--ad-paused',
  };

  // Classes that indicate that YouTube player is playing
  const YOUTUBE_PLAYING_CLASSES = [
    YOUTUBE_PLAYER_STATE_CLASSES[1],
    YOUTUBE_PLAYER_STATE_CLASSES[3], // When player is buffering, it is preparing to play hence indicating video to be playing
    YOUTUBE_PLAYER_STATE_CLASSES.adPlaying,
  ];

  const YOUTUBE_PLAYERS = {};

  Drupal.behaviors.youtubepfp = {
    attach: async function (context, settings) {
      const self = this;

      window.makeAdsRequest = (adsRequest, adsRenderingSettings) => {
        var adsurl = drupalSettings.youtube_pfp;
        var current_page = drupalSettings.page_url;
        adsurl = adsurl.replace("current_url", current_page);
        // Required
        adsRequest.adTagUrl = adsurl;
        // Recommended
        adsRenderingSettings.useStyledNonLinearAds = true;
        // Optional: you can also update other properties of
        // the AdsRequest.
        // Optional: you can also update the adsRenderingSettings
        // object if needed.
        adsRenderingSettings.uiElements = [
          window.google.ima.UiElements.AD_ATTRIBUTION,
          window.google.ima.UiElements.COUNTDOWN];
        console.log("makeAdsRequest is called!" + JSON.stringify(adsRequest));
      }

      // Repeatedly wait for YouTube API to be loaded before moving on
      let isYoutubeApiReady = false;
      while (!isYoutubeApiReady) {
        isYoutubeApiReady = self.isApiReady();
        if (!isYoutubeApiReady) {
          // Wait for 1s before trying again
          await new Promise((res) => {
            setTimeout(res, 1000);
          });
        }
      }

      // Exclude -player and -ad elements as those are added after player is initialised
      $('[id^="yt-pfp-player"]:not([id$="-player"]):not([id$="-ad"])', context).once('youtubepfp').each(function() {
        const currentElement = $(this);
        const playerId = currentElement.attr('id');
        const videoId = currentElement.data('video-id');
        console.log(`Preparing YouTube player ${playerId}`);

        const youtubePlayerOptions = {
          height: '100%',
          width: '100%',
          videoId: videoId,
          playerVars: {
            autoplay: 0,
            mute: 1,
            controls: 1,
            enablejsapi: 1,
            fs: 1,
            origin: window.location.protocol === 'https:' ? window.location.origin : '', // Only add origin on https domain, otherwise YouTube videos may fail
            rel: 0,
            iv_load_policy: 3,
            cc_load_policy: 0
          },
        };

        if (drupalSettings.youtube_pfp && window.makeAdsRequest && YT.createPlayerForPublishers) {
          // PFP-enabled and all necessary methods are present, prepare YouTube player with PFP
          try {
            YT.createPlayerForPublishers(
              playerId,
              window.makeAdsRequest,
              {
                youtubeOptions: youtubePlayerOptions,
              },
              (player, imaManager) => {
                self.onPlayerReady(`${playerId}-player`, player, imaManager);
              },
            );
          } catch (error) {
            console.error("Error preparing YouTube player (with PFP)", { playerId, error });
          }
        } else {
          // Prepare YouTube player without PFP
          new YT.Player(playerId, {
            ...youtubePlayerOptions,
            events: {
              onReady: (e) => {
                self.onPlayerReady(playerId, e.target);
              },
              onError: (error) => {
                console.error("Error preparing YouTube player (without PFP)", { playerId, error });
              }
            },
          });
        }
      });
    },
    isApiReady: function () {
      return window.YT?.loaded;
    },
    pauseVideo: function (playerId) {
      try {
        YOUTUBE_PLAYERS[playerId].imaManager?.getAdsManager()?.pause(); // Always attempt to pause ads as there's no way to detect if ads are currently playing
        YOUTUBE_PLAYERS[playerId].player.pauseVideo();
      } catch (error) {
        console.error("Error pausing YouTube video", { playerId, error });
      }
    },
    onPlayerReady: function (playerId, player, imaManager) {
      console.log(`YouTube player ${playerId} is ready.`);

      const self = Drupal.behaviors.youtubepfp;

      YOUTUBE_PLAYERS[playerId] = {
        player,
        imaManager,
      };

      const youtubeIframe = player.getIframe();

      // Attach behaviour for video docking for new YouTube player
      Drupal.behaviors.videoDocking?.attach(youtubeIframe);

      // Attach behaviour for mixpanel tracking.
      Drupal.behaviors.mixpanelWatch?.attach(youtubeIframe);

      // Track ads playing state changes and reflect as classes on YouTube iframe
      player.addEventListener('onStateChange', self.onPlayerStateChange);

      if (imaManager) {
        // YouTube player has IMA manager, track ads playing state changes and reflect as classes on YouTube iframe
        const imaAdsLoader = imaManager?.getAdsLoader?.();

        if (imaAdsLoader) {
          // Ads manager loaded state, add events to ads manager
          imaAdsLoader.addEventListener(google.ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED, () => {
            const imaAdsManager = imaManager?.getAdsManager?.();
            if (imaAdsManager) {
              // Ads loaded event
              imaAdsManager.addEventListener(google.ima.AdEvent.Type.LOADED, () => {
                $(youtubeIframe)
                  .addClass(YOUTUBE_PLAYER_STATE_CLASSES.adPlaying)
                  .removeClass(YOUTUBE_PLAYER_STATE_CLASSES.adPaused);
              });

              // Ads resumed event
              imaAdsManager.addEventListener(google.ima.AdEvent.Type.RESUMED, () => {
                $(youtubeIframe)
                  .addClass(YOUTUBE_PLAYER_STATE_CLASSES.adPlaying)
                  .removeClass(YOUTUBE_PLAYER_STATE_CLASSES.adPaused);
              });

              // Ads paused event;
              imaAdsManager.addEventListener(google.ima.AdEvent.Type.PAUSED, () => {
                $(youtubeIframe)
                  .addClass(YOUTUBE_PLAYER_STATE_CLASSES.adPaused)
                  .removeClass(YOUTUBE_PLAYER_STATE_CLASSES.adPlaying);
              });

              // Not listening to complete/skipped will be immediately updated with YouTube video's state change
            }
          });
        }
      }
    },
    onPlayerStateChange: ({ data, target }) => {
      const youtubeIframe = target.getIframe();

      // Some YouTube players do not get `onReady` event triggered, hence initialising them here
      const playerId = $(youtubeIframe).attr('id');
      if (!YOUTUBE_PLAYERS[playerId]) {
        YOUTUBE_PLAYERS[playerId] = { player: target };
      }

      const currentPlayerStateClass = YOUTUBE_PLAYER_STATE_CLASSES[data];
      // Video changing state, remove all video state classes and add the corresponding one to reflect state
      $(youtubeIframe)
        .addClass(currentPlayerStateClass)
        .removeClass(Object.values(YOUTUBE_PLAYER_STATE_CLASSES).join(' ').replace(currentPlayerStateClass, '')); // Replace current player state class with empty string to prevent it from being removed
    },
    getIsVideoPlaying: function (videoClasses) { // videoClasses must be a string
      if (!videoClasses) {
        return false;
      }

      return YOUTUBE_PLAYING_CLASSES.some((youtubePlayingClass) => {
        return videoClasses.includes(youtubePlayingClass);
      });
    },
  };
})(jQuery, Drupal, drupalSettings);
;
"use strict";(function(a,b){var c,d=new IntersectionObserver(e=>{e.forEach(e=>{var{target:f}=e;if(e.isIntersecting)b.behaviors.videoDocking.undockCurrentPlayingVideo({isPauseVideo:!1});else{var g=a(f).find("iframe"),h=b.behaviors.youtubepfp.getIsVideoPlaying(a(g).attr("class")),i=b.behaviors.videoDocking.getIsVideoDockable(g);if(h&&i){var j=0>=f.getBoundingClientRect().top;j&&b.behaviors.videoDocking.dockVideo(g)}else d.disconnect(),c=null}})},{threshold:[1]}),e=new MutationObserver(e=>{e.forEach((e)=>{var{target:f,oldValue:g}=e,h=b.behaviors.youtubepfp.getIsVideoPlaying(a(f).attr("class")),i=b.behaviors.youtubepfp.getIsVideoPlaying(g),j=b.behaviors.videoDocking.getIsVideoDockable(f);if(c!==f&&h&&!i&&(c&&b.behaviors.videoDocking.undockCurrentPlayingVideo({isPauseVideoIfDocked:!0}),j)){d.disconnect(),c=null;var k=b.behaviors.videoDocking.getVideoWrapper(f);c=f,d.observe(k)}})});b.behaviors.videoDocking={attach:function attach(b){var c=this;a("iframe[id][src^=\"https://www.youtube.com/embed/\"]").once("videoDocking").each((b,d)=>{e.observe(d,{attributes:!0,attributeFilter:["class"],attributeOldValue:!0}),a(d).closest(".video-docking").find(".video-docking__icon-close").on("click",()=>{c.undockVideo(d),c.removeVideoDocking(d)})}),a("header.header",b).once("videoDocking").each((b,d)=>{var e=new ResizeObserver(()=>{if(767>a(window).width()){var b=a(".navigation-block").hasClass("isscroll")?a(".navigation-block").innerHeight():a(d).innerHeight();c.updateDockedVideoHeight(b)}else c.updateDockedVideoHeight("")});e.observe(d)})},updateDockedVideoHeight:b=>{a(".video-docking").css({top:b})},dockVideo:c=>{var d=b.behaviors.videoDocking,e=d.getVideoWrapper(c);a(e).addClass("is-docking")},undockVideo:function undockVideo(c){var d=1<arguments.length&&void 0!==arguments[1]?arguments[1]:{isPauseVideo:!1},e=b.behaviors.videoDocking,{isPauseVideo:f}=d,g=e.getVideoWrapper(c);if(a(g).removeClass("is-docking"),f){var h=a(c).attr("id");b.behaviors.youtubepfp.pauseVideo(h)}},undockCurrentPlayingVideo:function undockCurrentPlayingVideo(){var a=0<arguments.length&&arguments[0]!==void 0?arguments[0]:{isPauseVideo:!1,isPauseVideoIfDocked:!1},d=b.behaviors.videoDocking,{isPauseVideo:e,isPauseVideoIfDocked:f}=a,g=b.behaviors.videoDocking.getIsVideoDocking(c);d.undockVideo(c,{isPauseVideo:e||f&&g})},removeVideoDocking:b=>{a(b).closest(".video-docking").removeClass("video-docking")},getVideoWrapper:b=>a(b).closest(".hero_video, .here_video")[0],getIsVideoDockable:c=>{var d=b.behaviors.videoDocking;return 0<a(c).closest(".video-docking").length&&!!d.getVideoWrapper(c)},getIsVideoDocking:b=>0<a(b).closest(".is-docking").length}})(jQuery,Drupal,once);;
"use strict";function asyncGeneratorStep(a,b,c,d,e,f,g){try{var h=a[f](g),i=h.value}catch(a){return void c(a)}h.done?b(i):Promise.resolve(i).then(d,e)}function _asyncToGenerator(a){return function(){var b=this,c=arguments;return new Promise(function(d,e){function f(a){asyncGeneratorStep(h,d,e,f,g,"next",a)}function g(a){asyncGeneratorStep(h,d,e,f,g,"throw",a)}var h=a.apply(b,c);f(void 0)})}}(a=>{Drupal.behaviors.brightcoveVideo={attach:function(){var b=_asyncToGenerator(function*(b){for(var c=(b,c)=>{var{isTriggerFullscreenOnAutoplay:e}=c;setTimeout(function(){b.pause(),b.muted(!0),(a("body.page__landing-page").length||a("body.page__video").length)&&-1<window.location.href.indexOf("/watch")&&(!a(".layout-builder-form")||!a(".layout-builder-form").length)||a("div.hero-schedule-block").length?b.play():(a("body.page__landing-page").length||a("body.page__article").length)&&a("video-js.vjs-live").length?b.on("play",function(){b.pip({allowOnMobile:!0,scale:.3,viewable:.3})}):b.play(),e&&d(b)},3e3)},d=b=>{b.on("play",function(){!b.isFullscreen()&&920>a(window).width()&&b.requestFullscreen()})},e=500;!window.videojs&&1e4>e;)yield new Promise(a=>{setTimeout(a,e)}),e*=2;if(window.videojs!=null){var f=a(b).find("video-js");if(!f||!f.length)return;f.each(_asyncToGenerator(function*(){if(!a(this).hasClass("video-streaming-brightcove")){for(var b,e=a(this).attr("id"),f=500;!b&&1e4>f;)yield new Promise(a=>{setTimeout(a,f)}),f*=2,b=videojs.getPlayer(e);if(b){var g=a(this).hasClass("video--portrait")&&a(this).parents().hasClass("block-field-blocknodearticlefield-content"),h=new URLSearchParams(window.location.search),i=h.get("auto-play"),j=null!==i&&"true"===i||(a("body.page__landing-page").length||a("body.page__video").length)&&-1<window.location.href.indexOf("/watch")&&(!a(".layout-builder-form")||!a(".layout-builder-form").length)||a("div.hero-schedule-block").length;j?c(b,{isTriggerFullscreenOnAutoplay:g}):g&&d(b),b.on("play",()=>{Drupal.behaviors.videoDocking.undockCurrentPlayingVideo({isPauseVideoIfDocked:!0})})}}}))}window.addEventListener("pageshow",function(b){b.persisted&&1>a(".brightcove-player").find("video-js").length&&window.location.reload()})});return function attach(){return b.apply(this,arguments)}}()}})(jQuery);;
"use strict";function asyncGeneratorStep(a,b,c,d,e,f,g){try{var h=a[f](g),i=h.value}catch(a){return void c(a)}h.done?b(i):Promise.resolve(i).then(d,e)}function _asyncToGenerator(a){return function(){var b=this,c=arguments;return new Promise(function(d,e){function f(a){asyncGeneratorStep(h,d,e,f,g,"next",a)}function g(a){asyncGeneratorStep(h,d,e,f,g,"throw",a)}var h=a.apply(b,c);f(void 0)})}}((a,b)=>{b.behaviors.videoEmbedIframeYoutube={attach(c){a("iframe[src^=\"https://www.youtube.com/embed/\"]:not([id])",c).once("videoEmbedIframeYoutube").each(function(){var c=_asyncToGenerator(function*(c,d){try{var g=a(d).attr("src");if(!g.includes("enablejsapi=1")){var h=g;h+=g.includes("?")?"&":"?",h+="enablejsapi=1",a(d).attr("src",h)}var e=a(d).attr("src").split("?")[0].split("/").pop(),f="yt-embed-player-".concat(e);f+="-".concat(a("iframe[id^=\"".concat(f)).length),a(d).attr("id",f),console.log("Preparing embed youtube player ".concat(f," to add event listener"));for(var i=!1;!i;)i=b.behaviors.youtubepfp.isApiReady(),i||(yield new Promise(a=>{setTimeout(a,1e3)}));new YT.Player(f,{events:{onStateChange:b.behaviors.youtubepfp.onPlayerStateChange}})}catch(a){console.error("Error preparing embed YouTube player",{error:a})}});return function(){return c.apply(this,arguments)}}())}}})(jQuery,Drupal,once);;
/**
 * @file
 */
(function ($, Drupal, drupalSettings, debounce) {
  "use strict";

  $.fn.isInViewport = function() {
    var elementTop = $(this).offset().top;
    var elementBottom = elementTop + $(this).outerHeight();
    var viewportTop = $(window).scrollTop();
    var viewportBottom = viewportTop + $(window).height();
    return elementBottom > viewportTop && elementTop < viewportBottom;
  };

  $.fn.checkArticleInViewport = function() {
    var elementTop = $(this).offset().top;
    var elementBottom = elementTop + $(this).outerHeight(true);
    var viewportTop = $(window).scrollTop();
    var viewportBottom = viewportTop + $(window).height();
    // If top part of article is visible,
    // Calculate if top part is more than 50% of screen.
    if (elementBottom > viewportBottom) {
      return (viewportBottom - elementTop > $(window).height() / 2);
    }
    // If bottom part of article is visible,
    // Calculate if bottom part is more than 50% of screen.
    else if (elementTop < viewportTop) {
      return (elementBottom - viewportTop > $(window).height() / 2);
    }
    return false;
  };
  var load_once = false;
  // Position counter start from 2 for next article.
  let adsPosCounter = 2;
  let adobeAdsPosCounter = 1;
  const adobeAds = drupalSettings.mc_article.adobe_programmatic_ads;
  var loadedNids = [];

  /**
   * Replace LB and SIDE ads ids for next article data.
   *
   * @param nextArticleHtml
   * @param adsPosCounter
   * @returns {*}
   */
  function replaceNextArticleAdsIds(nextArticleHtml, adsPosCounter) {
    nextArticleHtml = _adobeUtility.replaceAdsIds(nextArticleHtml, 'lb1', 1, adsPosCounter, false);
    nextArticleHtml = _adobeUtility.replaceAdsIds(nextArticleHtml, 'side1', 1, adsPosCounter, false);
    nextArticleHtml = _adobeUtility.replaceAdsIds(nextArticleHtml, 'side2', 1, adsPosCounter, false);
    return nextArticleHtml;
  }

  /**
   * Replace next article ads units.
   *
   * @param nextArticle
   * @param categoryName
   * @returns {*}
   */
  function replaceNextArticleAdUnits(nextArticle, categoryName) {
    nextArticle.find('.advertisement__container').once('ad-units').each(function(i, el) {
      let advertisementContainer = $(el);
      let dataJsOptions = advertisementContainer.attr('data-js-options');
      dataJsOptions = dataJsOptions.replace(`read-next`, `${categoryName}`);
      dataJsOptions = dataJsOptions.replace(`listingpage`, `articlepage`);
      dataJsOptions = dataJsOptions.replace(`content`, `NA`);
      dataJsOptions = dataJsOptions.replace(`cna_read-next_related`, `cna_${categoryName}_articlepage`);
      // Update data-js-option after replacement.
      advertisementContainer.attr('data-js-options', dataJsOptions);
    });
  }

  /**
   * Replace Outstream and Sub Article ads ids for next article data.
   *
   * @param nextArticleAds
   * @param adsEntity
   * @param counter
   * @param adobeAdsPosCounter
   * @returns {*}
   */
  function replaceWithinArticleAdsIds(nextArticleAds, adsEntity, counter, adobeAdsPosCounter) {
    nextArticleAds = _adobeUtility.replaceAdsIds(
      nextArticleAds, adsEntity, counter, adobeAdsPosCounter, false);
    return nextArticleAds;
  }

  Drupal.behaviors.readFullArticle = {
    attach: function(context, settings) {
      const currentBrandName = settings.current_brand_name;
      $('.article__read-full-story-button').once('full-article').click(function () {
        $(this).parents('.node--article-content').find('.content').removeClass('trimmed-content');
        $(this).parents('.article__read-full-story-wrapper').hide();
        _adobeUtility.adobeAnalyticsTrack('click', {
          clickname:'Expand to read the full story - ' + currentBrandName,
          path: $(this).closest('.node--article-content').attr("about")
        });
      });
    }
  };

  Drupal.behaviors.updateTitleAndURL = {
    attach: function(context, settings) {
      var $window = $(window);
      var scrollEvent = 'scroll.update_url';
      $('article[data-node-id]').once('update-url').each(function () {
        var $article = $(this);
        $window.on(scrollEvent, debounce(function () {
          if ($article.checkArticleInViewport()) {
            var href = $article.find("section .content-detail__category a").attr('href');
            var name = $article.find("section .content-detail__category a").text();
            if(href !='' && name != '' && href != undefined && name != undefined) {
              $article.attr('categoryName', name);
              $article.attr('categoryUrl', href);
            }
            var url = $article.attr('about');
            var title = $article.attr('data-node-title');
            var nid = $article.attr('data-node-id');
            var categoryName = $article.attr('categoryName');
            var categoryUrl = $article.attr('categoryUrl');
            if (history.state !== nid && loadedNids.length) {
              history.pushState(nid, null, url);
              document.title = title;
              // Track pageview.
              _adobeUtility.adobeAnalyticsTrack('pageview', {
                id: nid,
                type: 'Article',
                path: url,
              });
            }

            var navigationBlock = $('section.navigation-block');
            // Update bookmark attributes.
            var uuid = $article.attr('data-uuid');
            const isBookmarked = $article.find('section.block-content-share-bookmark .bookmark-share-icon .bookmark-link').attr('data-isbookmarked');
            var bookmarkLink = navigationBlock.find('.article-navigation__bookmark .bookmark-link');
            bookmarkLink.attr('data-uuid', uuid);
            bookmarkLink.attr('data-nid', nid);
            bookmarkLink.attr('data-isbookmarked', isBookmarked).toggleClass('active', isBookmarked === 'true');
            // Update bookmark link for anonymous user.
            let bookmarkLinkHref = '/profile/sso/login?redirect_url=' + url + '&bookmark=' + uuid;
            navigationBlock.find('.article-navigation__bookmark .bookmark-link-anonymous').attr('href', bookmarkLinkHref);
            // Replace href of next article.
            let $buttonBookmark = $article.find('.bookmark-share .bookmark-link-anonymous');

            // Re-attach the behaviour to fix url issue after ajax.
            let dataOnce = $buttonBookmark.attr('data-once')?.split(" ");
            $buttonBookmark.attr('href', bookmarkLinkHref).unbind('click');
            // Remove all once.
            $.each(dataOnce, function (index, item) {
              once.remove(item, $buttonBookmark);
            });
            Drupal.attachBehaviors($buttonBookmark[0].parentElement);
            Drupal.ajax.bindAjaxLinks(document.body);

            // Update section navigation block title.
            navigationBlock.find('.article-navigation__heading').html(title);
            if(categoryUrl !='' && categoryName !='' && categoryUrl !=undefined && categoryName !=undefined){
              navigationBlock.find('.article-navigation__category .category').html('<a href="'+categoryUrl+'" class="link">'+categoryName+'</a>');
            }
            // Update section navigation block share options.
            var shareLink = navigationBlock.find('.article-navigation__bookmark .a2a-share-link');
            shareLink.attr('data-a2a-url', window.location.href);
            shareLink.attr('data-a2a-title', title);
            // Update article share popup options.
            var sharePopup = navigationBlock.find('.trigger-popup.trigger-popup--share');
            sharePopup.attr('data-category', categoryName);
            sharePopup.attr('data-category_url', categoryUrl);
            sharePopup.attr('data-link', window.location.href);
            sharePopup.attr('data-heading', title);
            sharePopup.attr('data-link_absolute', window.location.href);

            // Show/Hide FAST button if article has FAST url
            const fastButtonWrapper = $('.fast-button__wrapper');
            if (fastButtonWrapper.length) {
              const fastUrl = $article.attr('data-fast-url');
              if (fastUrl) {
                $(fastButtonWrapper).find('a').attr('href', fastUrl);
                $(fastButtonWrapper).removeClass('hidden');
              } else {
                $(fastButtonWrapper).addClass('hidden');
              }
            }
          }
        }, 100));
        if ($article.isInViewport()) {
          $window.trigger(scrollEvent);
        }
      });
    }
  };

  Drupal.behaviors.loadNextArticle = {
    attach: function (context, settings) {
      let nid = settings.article.nid;
      const isAdvertorialContent = settings.article.isAdvertorialContent;
      let article = $('article[data-node-id="' + nid + '"]');
      let articleContainer = article.parent();
      let $window = $(window);
      // The ajax URL to fetch related content.
      let url = "/read-next/related/article/" + nid;
      // Next article offset.
      let offset = 0;
      // FallBack identifier default TRUE.
      let fallBack = 1;
      let scrollEvent = 'scroll.next_article';
      // Loader markup.
      let loaderMarkup = '<div class="read-next__loader hidden"><div class="read-next__loader-icon"></div>Fetching more news</div>';
      if (!loadedNids.includes(settings.article.newNid)) {
        articleContainer.once('infinite-scroll').each(function() {
          let isLoadNeeded = function () {
            return articleContainer.isInViewport() && (window.innerHeight + window.pageYOffset > articleContainer.offset().top + articleContainer.innerHeight()) && !article.attr('data-is-back-to-fast');
          };
          articleContainer.append(loaderMarkup);
          $window.on(scrollEvent, debounce(function () {
            if (isLoadNeeded() && !article.hasClass('no-more-related-data') && !isAdvertorialContent) {
              articleContainer.find('.read-next__loader').show();
              $.ajax({
                url: url,
                type: "GET",
                data: {
                  offset: offset,
                  fallBack: fallBack,
                },
                success: function(response) {
                  // Remove previous loader.
                  articleContainer.find('.read-next__loader').remove();
                  if (response.data) {
                    // Read next article ads.
                    let nextArticleHtml = response.data;
                    nextArticleHtml = replaceNextArticleAdsIds(nextArticleHtml, adsPosCounter);
                    // Add loader markup to show on next load.
                    nextArticleHtml += loaderMarkup;
                    // Ads position counter increment.
                    adsPosCounter++;
                    adobeAdsPosCounter++;
                    // Update incremented value for offset to fetch next article.
                    offset = response.offset;
                    // Update filterBy value to avoid unnecessary fallback to category.
                    fallBack = response.fallBack;
                    // The NID for the next article.
                    let nextArticleNid = response.currentNid;
                    if (!loadedNids.includes(nextArticleNid)) {
                      loadedNids.push(nextArticleNid);
                      // Add next article to main article.
                      articleContainer.once(`article_add_${nextArticleNid}`).append(nextArticleHtml);
                      // Next article wrapper.
                      let nextArticle = $('article[data-node-id="' + nextArticleNid + '"]');
                      // Next article category.
                      let categoryName = response.categoryName;
                      replaceNextArticleAdUnits(nextArticle, categoryName);
                      // The url for next article.
                      let nextArticleUrl = nextArticle.attr('about');
                      nextArticle.find('.content').addClass('trimmed-content');
                      nextArticle.find('.article__read-full-story-wrapper').show();

                      // Add in fast url to next article
                      nextArticle.attr('data-fast-url', response.fast_url);

                      // Reattaching behaviour.
                      let nextArticleData = {};
                      if(settings && settings.mc_cia_widget){
                        for (const widgetUuid in settings.mc_cia_widget) {
                          const ciaWidget = settings.mc_cia_widget[widgetUuid];
                          const newArticleUrl = window.location.origin + nextArticleUrl;
                          nextArticleData = {
                             [widgetUuid]: {...ciaWidget, content_id: nextArticleNid, url: newArticleUrl}
                           };
                        }
                      }

                      settings = Object.assign(settings, {article: {nid: nid, newNid: nextArticleNid}, mc_cia_widget: nextArticleData});
                      Drupal.attachBehaviors(nextArticle[0], settings);
                      // Omnymedia event analytics track.
                      //_adobeUtility.adobeAudioTrack(nextArticleNid, nextArticleUrl, nextArticle[0]);
                      // Track Mediaelement audio players;.
                      _adobeUtility.adobeMediaPlayerTrack(nextArticleNid, nextArticleUrl, nextArticle[0]);
                      // Media event analytics track.
                      _adobeUtility.adobeBrightcoveVideoTrackDelayed(nextArticleNid, nextArticleUrl, nextArticle[0]);
                    }
                  }
                  else {
                    article.addClass('no-more-related-data');
                    console.log('No more related stories found!');
                  }
                },
                error: function(xhr) {
                  console.log(xhr);
                }
              });
              // $window.off(scrollEvent);
            }
          }, 100));
          if (isLoadNeeded()) {
            $window.trigger(scrollEvent);
          }
        });
      }
    }
  };

  Drupal.behaviors.adobeArticleProgramaticAds = {
    attach: function (context, settings) {

      let outstreamAd = adobeAds['ad_display:outstream_article'];
      let outstream2Ad = adobeAds['ad_display:outstream2_article'];
      let subAd = adobeAds['ad_display:sub_article'];
      let sub2Ad = adobeAds['ad_display:sub2_article'];

      var nid = settings.article.newNid || settings.article.nid;
      var article = $('article[data-node-id="' + nid + '"]');

      // Paragraph content of current article.
      var paraContent = article.find('section.block-field-blocknodearticlefield-content');

      // Index to use for paragraph count.
      var outstreamParaIndex = 1;
      //Injecting Outstream ad type second after 2nd para.
      var targetOutstreamAdPara = paraContent.once('outstream1').find('.text .text-long p:eq(' + outstreamParaIndex + ')');
      if (targetOutstreamAdPara.length) {
        outstreamAd = replaceWithinArticleAdsIds(
          outstreamAd, 'outstream1', 1, adobeAdsPosCounter);
        $(outstreamAd).insertAfter(targetOutstreamAdPara);
      }

      //Injecting Sub ad type second after 7th para.
      var sub1ParaIndex = outstreamParaIndex += 5;
      var targetSub1AdPara =  paraContent.once('sub1').find('.text .text-long p:eq(' + sub1ParaIndex + ')');
      if (targetSub1AdPara.length) {
        subAd = replaceWithinArticleAdsIds(
          subAd, 'imu1', 1, adobeAdsPosCounter);
        $(subAd).insertAfter(targetSub1AdPara);
      }

      // Index to use for paragraph count.
      var outstream2ParaIndex = sub1ParaIndex += 5;
      //Injecting Outstream ad type second after 12th para.
      var targetOutstream2AdPara = paraContent.once('outstream2').find('.text .text-long p:eq(' + outstream2ParaIndex + ')');
      if (targetOutstream2AdPara.length) {
        outstream2Ad = replaceWithinArticleAdsIds(
          outstream2Ad, 'outstream2', 1, adobeAdsPosCounter);
        $(outstream2Ad).insertAfter(targetOutstream2AdPara);
      }

      //Injecting Sub ad type second after 17th para.
      var sub2ParaIndex = outstream2ParaIndex += 5;
      var targetSub2AdPara =  paraContent.once('sub2').find('.text .text-long p:eq(' + sub2ParaIndex + ')');
      if (targetSub2AdPara.length) {
        sub2Ad = replaceWithinArticleAdsIds(
          sub2Ad, 'imu2', 1, adobeAdsPosCounter);
        $(sub2Ad).insertAfter(targetSub2AdPara);
      }

      setTimeout(function(){
        var containers = adEntity.adContainers;
        adEntity.restrictAdsToScope(containers);
      }, 300);
    },
  };


})(jQuery, Drupal, drupalSettings, Drupal.debounce);
;
(function ($, Drupal, drupalSettings) {
  Drupal.behaviors.AlgoliaSearchModal = {
    attach: function (context, settings) {
      var searchMenu = $('nav li span.search-menu-link');
      var allSectionMenu = $('nav#main-nav span.all-section-menu');
      var searchModel = $('#algolia-search-modal');
      var applicationId = drupalSettings.mc_algolia_creds.applicationId;
      var apiKey = drupalSettings.mc_algolia_creds.apiKey;
      var searchIndex = drupalSettings.mc_algolia_creds.searchQsIndex;
      var searchActualIndex = drupalSettings.mc_algolia_creds.searchIndex;

      var initialised = false;

      searchModel.click(function() {
        if ((!$(event.target).closest('.algolia-search-modal__center').length) && (!$(event.target).closest('.algolia-search-modal__right').length)) {
          algoliaSearchModal.hide();
          $("#algolia-search-input").val('');
          $('html').removeClass('algolia-search-modal-active');
        }
      });

      if (allSectionMenu.length > 0) {
        var menuModal = $('.all-section-menu-modal-wrapper');
        allSectionMenu.once('onClick').click(function () {
          menuModal.addClass('modal--open');
          if (!initialised) {
            algoliaSearchWidget.autocompleteSearch(applicationId, apiKey, searchIndex, searchActualIndex);
            initialised = true;
          }
        });
      }

      if (searchMenu.length > 0) {
        var algoliaSearchModal = $('#algolia-search-modal');
        var recentSearch = $('#recent-search');
        searchMenu.once('search-overlay').click(function () {
          algoliaSearchModal.show();
          if (!initialised) {
            algoliaSearchWidget.autocompleteSearch(applicationId, apiKey, searchIndex, searchActualIndex);
            initialised = true;
          }
          $('html').addClass('algolia-search-modal-active');
        });
        // Close popup.
        algoliaSearchModal.find('span.close').once('onClick').click(function () {
          algoliaSearchModal.hide();
          $("#algolia-search-input").val('');
          $('html').removeClass('algolia-search-modal-active');
        });
        // Make recent search items searchable.
        recentSearch.on('click', '.recent-link', function () {
          algoliaSearchWidget.searchRedirect(searchActualIndex, $(this).text());
        });
        $(document).keyup(function(e) {
          if (e.key === "Escape") {
            algoliaSearchModal.hide();
            $("#algolia-search-input").val('');
            $('html').removeClass('algolia-search-modal-active');
          }
        });
      }
    }
  };
})(jQuery, Drupal, drupalSettings);
;
/*!
 * jQuery Form Plugin
 * version: 4.3.0
 * Requires jQuery v1.7.2 or later
 * Project repository: https://github.com/jquery-form/form

 * Copyright 2017 Kevin Morris
 * Copyright 2006 M. Alsup

 * Dual licensed under the LGPL-2.1+ or MIT licenses
 * https://github.com/jquery-form/form#license

 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 2.1 of the License, or (at your option) any later version.
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 */
!function(r){"function"==typeof define&&define.amd?define(["jquery"],r):"object"==typeof module&&module.exports?module.exports=function(e,t){return void 0===t&&(t="undefined"!=typeof window?require("jquery"):require("jquery")(e)),r(t),t}:r(jQuery)}(function(q){"use strict";var m=/\r?\n/g,S={};S.fileapi=void 0!==q('<input type="file">').get(0).files,S.formdata=void 0!==window.FormData;var _=!!q.fn.prop;function o(e){var t=e.data;e.isDefaultPrevented()||(e.preventDefault(),q(e.target).closest("form").ajaxSubmit(t))}function i(e){var t=e.target,r=q(t);if(!r.is("[type=submit],[type=image]")){var a=r.closest("[type=submit]");if(0===a.length)return;t=a[0]}var n,o=t.form;"image"===(o.clk=t).type&&(void 0!==e.offsetX?(o.clk_x=e.offsetX,o.clk_y=e.offsetY):"function"==typeof q.fn.offset?(n=r.offset(),o.clk_x=e.pageX-n.left,o.clk_y=e.pageY-n.top):(o.clk_x=e.pageX-t.offsetLeft,o.clk_y=e.pageY-t.offsetTop)),setTimeout(function(){o.clk=o.clk_x=o.clk_y=null},100)}function N(){var e;q.fn.ajaxSubmit.debug&&(e="[jquery.form] "+Array.prototype.join.call(arguments,""),window.console&&window.console.log?window.console.log(e):window.opera&&window.opera.postError&&window.opera.postError(e))}q.fn.attr2=function(){if(!_)return this.attr.apply(this,arguments);var e=this.prop.apply(this,arguments);return e&&e.jquery||"string"==typeof e?e:this.attr.apply(this,arguments)},q.fn.ajaxSubmit=function(M,e,t,r){if(!this.length)return N("ajaxSubmit: skipping submit process - no element selected"),this;var O,a,n,o,X=this;"function"==typeof M?M={success:M}:"string"==typeof M||!1===M&&0<arguments.length?(M={url:M,data:e,dataType:t},"function"==typeof r&&(M.success=r)):void 0===M&&(M={}),O=M.method||M.type||this.attr2("method"),n=(n=(n="string"==typeof(a=M.url||this.attr2("action"))?q.trim(a):"")||window.location.href||"")&&(n.match(/^([^#]+)/)||[])[1],o=/(MSIE|Trident)/.test(navigator.userAgent||"")&&/^https/i.test(window.location.href||"")?"javascript:false":"about:blank",M=q.extend(!0,{url:n,success:q.ajaxSettings.success,type:O||q.ajaxSettings.type,iframeSrc:o},M);var i={};if(this.trigger("form-pre-serialize",[this,M,i]),i.veto)return N("ajaxSubmit: submit vetoed via form-pre-serialize trigger"),this;if(M.beforeSerialize&&!1===M.beforeSerialize(this,M))return N("ajaxSubmit: submit aborted via beforeSerialize callback"),this;var s=M.traditional;void 0===s&&(s=q.ajaxSettings.traditional);var u,c,C=[],l=this.formToArray(M.semantic,C,M.filtering);if(M.data&&(c=q.isFunction(M.data)?M.data(l):M.data,M.extraData=c,u=q.param(c,s)),M.beforeSubmit&&!1===M.beforeSubmit(l,this,M))return N("ajaxSubmit: submit aborted via beforeSubmit callback"),this;if(this.trigger("form-submit-validate",[l,this,M,i]),i.veto)return N("ajaxSubmit: submit vetoed via form-submit-validate trigger"),this;var f=q.param(l,s);u&&(f=f?f+"&"+u:u),"GET"===M.type.toUpperCase()?(M.url+=(0<=M.url.indexOf("?")?"&":"?")+f,M.data=null):M.data=f;var d,m,p,h=[];M.resetForm&&h.push(function(){X.resetForm()}),M.clearForm&&h.push(function(){X.clearForm(M.includeHidden)}),!M.dataType&&M.target?(d=M.success||function(){},h.push(function(e,t,r){var a=arguments,n=M.replaceTarget?"replaceWith":"html";q(M.target)[n](e).each(function(){d.apply(this,a)})})):M.success&&(q.isArray(M.success)?q.merge(h,M.success):h.push(M.success)),M.success=function(e,t,r){for(var a=M.context||this,n=0,o=h.length;n<o;n++)h[n].apply(a,[e,t,r||X,X])},M.error&&(m=M.error,M.error=function(e,t,r){var a=M.context||this;m.apply(a,[e,t,r,X])}),M.complete&&(p=M.complete,M.complete=function(e,t){var r=M.context||this;p.apply(r,[e,t,X])});var v=0<q("input[type=file]:enabled",this).filter(function(){return""!==q(this).val()}).length,g="multipart/form-data",x=X.attr("enctype")===g||X.attr("encoding")===g,y=S.fileapi&&S.formdata;N("fileAPI :"+y);var b,T=(v||x)&&!y;!1!==M.iframe&&(M.iframe||T)?M.closeKeepAlive?q.get(M.closeKeepAlive,function(){b=w(l)}):b=w(l):b=(v||x)&&y?function(e){for(var r=new FormData,t=0;t<e.length;t++)r.append(e[t].name,e[t].value);if(M.extraData){var a=function(e){var t,r,a=q.param(e,M.traditional).split("&"),n=a.length,o=[];for(t=0;t<n;t++)a[t]=a[t].replace(/\+/g," "),r=a[t].split("="),o.push([decodeURIComponent(r[0]),decodeURIComponent(r[1])]);return o}(M.extraData);for(t=0;t<a.length;t++)a[t]&&r.append(a[t][0],a[t][1])}M.data=null;var n=q.extend(!0,{},q.ajaxSettings,M,{contentType:!1,processData:!1,cache:!1,type:O||"POST"});M.uploadProgress&&(n.xhr=function(){var e=q.ajaxSettings.xhr();return e.upload&&e.upload.addEventListener("progress",function(e){var t=0,r=e.loaded||e.position,a=e.total;e.lengthComputable&&(t=Math.ceil(r/a*100)),M.uploadProgress(e,r,a,t)},!1),e});n.data=null;var o=n.beforeSend;return n.beforeSend=function(e,t){M.formData?t.data=M.formData:t.data=r,o&&o.call(this,e,t)},q.ajax(n)}(l):q.ajax(M),X.removeData("jqxhr").data("jqxhr",b);for(var j=0;j<C.length;j++)C[j]=null;return this.trigger("form-submit-notify",[this,M]),this;function w(e){var t,r,l,f,o,d,m,p,a,n,h,v,i=X[0],g=q.Deferred();if(g.abort=function(e){p.abort(e)},e)for(r=0;r<C.length;r++)t=q(C[r]),_?t.prop("disabled",!1):t.removeAttr("disabled");(l=q.extend(!0,{},q.ajaxSettings,M)).context=l.context||l,o="jqFormIO"+(new Date).getTime();var s=i.ownerDocument,u=X.closest("body");if(l.iframeTarget?(n=(d=q(l.iframeTarget,s)).attr2("name"))?o=n:d.attr2("name",o):(d=q('<iframe name="'+o+'" src="'+l.iframeSrc+'" />',s)).css({position:"absolute",top:"-1000px",left:"-1000px"}),m=d[0],p={aborted:0,responseText:null,responseXML:null,status:0,statusText:"n/a",getAllResponseHeaders:function(){},getResponseHeader:function(){},setRequestHeader:function(){},abort:function(e){var t="timeout"===e?"timeout":"aborted";N("aborting upload... "+t),this.aborted=1;try{m.contentWindow.document.execCommand&&m.contentWindow.document.execCommand("Stop")}catch(e){}d.attr("src",l.iframeSrc),p.error=t,l.error&&l.error.call(l.context,p,t,e),f&&q.event.trigger("ajaxError",[p,l,t]),l.complete&&l.complete.call(l.context,p,t)}},(f=l.global)&&0==q.active++&&q.event.trigger("ajaxStart"),f&&q.event.trigger("ajaxSend",[p,l]),l.beforeSend&&!1===l.beforeSend.call(l.context,p,l))return l.global&&q.active--,g.reject(),g;if(p.aborted)return g.reject(),g;(a=i.clk)&&(n=a.name)&&!a.disabled&&(l.extraData=l.extraData||{},l.extraData[n]=a.value,"image"===a.type&&(l.extraData[n+".x"]=i.clk_x,l.extraData[n+".y"]=i.clk_y));var x=1,y=2;function b(t){var r=null;try{t.contentWindow&&(r=t.contentWindow.document)}catch(e){N("cannot get iframe.contentWindow document: "+e)}if(r)return r;try{r=t.contentDocument?t.contentDocument:t.document}catch(e){N("cannot get iframe.contentDocument: "+e),r=t.document}return r}var c=q("meta[name=csrf-token]").attr("content"),T=q("meta[name=csrf-param]").attr("content");function j(){var e=X.attr2("target"),t=X.attr2("action"),r=X.attr("enctype")||X.attr("encoding")||"multipart/form-data";i.setAttribute("target",o),O&&!/post/i.test(O)||i.setAttribute("method","POST"),t!==l.url&&i.setAttribute("action",l.url),l.skipEncodingOverride||O&&!/post/i.test(O)||X.attr({encoding:"multipart/form-data",enctype:"multipart/form-data"}),l.timeout&&(v=setTimeout(function(){h=!0,A(x)},l.timeout));var a=[];try{if(l.extraData)for(var n in l.extraData)l.extraData.hasOwnProperty(n)&&(q.isPlainObject(l.extraData[n])&&l.extraData[n].hasOwnProperty("name")&&l.extraData[n].hasOwnProperty("value")?a.push(q('<input type="hidden" name="'+l.extraData[n].name+'">',s).val(l.extraData[n].value).appendTo(i)[0]):a.push(q('<input type="hidden" name="'+n+'">',s).val(l.extraData[n]).appendTo(i)[0]));l.iframeTarget||d.appendTo(u),m.attachEvent?m.attachEvent("onload",A):m.addEventListener("load",A,!1),setTimeout(function e(){try{var t=b(m).readyState;N("state = "+t),t&&"uninitialized"===t.toLowerCase()&&setTimeout(e,50)}catch(e){N("Server abort: ",e," (",e.name,")"),A(y),v&&clearTimeout(v),v=void 0}},15);try{i.submit()}catch(e){document.createElement("form").submit.apply(i)}}finally{i.setAttribute("action",t),i.setAttribute("enctype",r),e?i.setAttribute("target",e):X.removeAttr("target"),q(a).remove()}}T&&c&&(l.extraData=l.extraData||{},l.extraData[T]=c),l.forceSync?j():setTimeout(j,10);var w,S,k,D=50;function A(e){if(!p.aborted&&!k){if((S=b(m))||(N("cannot access response document"),e=y),e===x&&p)return p.abort("timeout"),void g.reject(p,"timeout");if(e===y&&p)return p.abort("server abort"),void g.reject(p,"error","server abort");if(S&&S.location.href!==l.iframeSrc||h){m.detachEvent?m.detachEvent("onload",A):m.removeEventListener("load",A,!1);var t,r="success";try{if(h)throw"timeout";var a="xml"===l.dataType||S.XMLDocument||q.isXMLDoc(S);if(N("isXml="+a),!a&&window.opera&&(null===S.body||!S.body.innerHTML)&&--D)return N("requeing onLoad callback, DOM not available"),void setTimeout(A,250);var n=S.body?S.body:S.documentElement;p.responseText=n?n.innerHTML:null,p.responseXML=S.XMLDocument?S.XMLDocument:S,a&&(l.dataType="xml"),p.getResponseHeader=function(e){return{"content-type":l.dataType}[e.toLowerCase()]},n&&(p.status=Number(n.getAttribute("status"))||p.status,p.statusText=n.getAttribute("statusText")||p.statusText);var o,i,s,u=(l.dataType||"").toLowerCase(),c=/(json|script|text)/.test(u);c||l.textarea?(o=S.getElementsByTagName("textarea")[0])?(p.responseText=o.value,p.status=Number(o.getAttribute("status"))||p.status,p.statusText=o.getAttribute("statusText")||p.statusText):c&&(i=S.getElementsByTagName("pre")[0],s=S.getElementsByTagName("body")[0],i?p.responseText=i.textContent?i.textContent:i.innerText:s&&(p.responseText=s.textContent?s.textContent:s.innerText)):"xml"===u&&!p.responseXML&&p.responseText&&(p.responseXML=F(p.responseText));try{w=E(p,u,l)}catch(e){r="parsererror",p.error=t=e||r}}catch(e){N("error caught: ",e),r="error",p.error=t=e||r}p.aborted&&(N("upload aborted"),r=null),p.status&&(r=200<=p.status&&p.status<300||304===p.status?"success":"error"),"success"===r?(l.success&&l.success.call(l.context,w,"success",p),g.resolve(p.responseText,"success",p),f&&q.event.trigger("ajaxSuccess",[p,l])):r&&(void 0===t&&(t=p.statusText),l.error&&l.error.call(l.context,p,r,t),g.reject(p,"error",t),f&&q.event.trigger("ajaxError",[p,l,t])),f&&q.event.trigger("ajaxComplete",[p,l]),f&&!--q.active&&q.event.trigger("ajaxStop"),l.complete&&l.complete.call(l.context,p,r),k=!0,l.timeout&&clearTimeout(v),setTimeout(function(){l.iframeTarget?d.attr("src",l.iframeSrc):d.remove(),p.responseXML=null},100)}}}var F=q.parseXML||function(e,t){return window.ActiveXObject?((t=new ActiveXObject("Microsoft.XMLDOM")).async="false",t.loadXML(e)):t=(new DOMParser).parseFromString(e,"text/xml"),t&&t.documentElement&&"parsererror"!==t.documentElement.nodeName?t:null},L=q.parseJSON||function(e){return window.eval("("+e+")")},E=function(e,t,r){var a=e.getResponseHeader("content-type")||"",n=("xml"===t||!t)&&0<=a.indexOf("xml"),o=n?e.responseXML:e.responseText;return n&&"parsererror"===o.documentElement.nodeName&&q.error&&q.error("parsererror"),r&&r.dataFilter&&(o=r.dataFilter(o,t)),"string"==typeof o&&(("json"===t||!t)&&0<=a.indexOf("json")?o=L(o):("script"===t||!t)&&0<=a.indexOf("javascript")&&q.globalEval(o)),o};return g}},q.fn.ajaxForm=function(e,t,r,a){if(("string"==typeof e||!1===e&&0<arguments.length)&&(e={url:e,data:t,dataType:r},"function"==typeof a&&(e.success=a)),(e=e||{}).delegation=e.delegation&&q.isFunction(q.fn.on),e.delegation||0!==this.length)return e.delegation?(q(document).off("submit.form-plugin",this.selector,o).off("click.form-plugin",this.selector,i).on("submit.form-plugin",this.selector,e,o).on("click.form-plugin",this.selector,e,i),this):(e.beforeFormUnbind&&e.beforeFormUnbind(this,e),this.ajaxFormUnbind().on("submit.form-plugin",e,o).on("click.form-plugin",e,i));var n={s:this.selector,c:this.context};return!q.isReady&&n.s?(N("DOM not ready, queuing ajaxForm"),q(function(){q(n.s,n.c).ajaxForm(e)})):N("terminating; zero elements found by selector"+(q.isReady?"":" (DOM not ready)")),this},q.fn.ajaxFormUnbind=function(){return this.off("submit.form-plugin click.form-plugin")},q.fn.formToArray=function(e,t,r){var a=[];if(0===this.length)return a;var n,o,i,s,u,c,l,f,d,m,p=this[0],h=this.attr("id"),v=(v=e||void 0===p.elements?p.getElementsByTagName("*"):p.elements)&&q.makeArray(v);if(h&&(e||/(Edge|Trident)\//.test(navigator.userAgent))&&(n=q(':input[form="'+h+'"]').get()).length&&(v=(v||[]).concat(n)),!v||!v.length)return a;for(q.isFunction(r)&&(v=q.map(v,r)),o=0,c=v.length;o<c;o++)if((m=(u=v[o]).name)&&!u.disabled)if(e&&p.clk&&"image"===u.type)p.clk===u&&(a.push({name:m,value:q(u).val(),type:u.type}),a.push({name:m+".x",value:p.clk_x},{name:m+".y",value:p.clk_y}));else if((s=q.fieldValue(u,!0))&&s.constructor===Array)for(t&&t.push(u),i=0,l=s.length;i<l;i++)a.push({name:m,value:s[i]});else if(S.fileapi&&"file"===u.type){t&&t.push(u);var g=u.files;if(g.length)for(i=0;i<g.length;i++)a.push({name:m,value:g[i],type:u.type});else a.push({name:m,value:"",type:u.type})}else null!=s&&(t&&t.push(u),a.push({name:m,value:s,type:u.type,required:u.required}));return e||!p.clk||(m=(d=(f=q(p.clk))[0]).name)&&!d.disabled&&"image"===d.type&&(a.push({name:m,value:f.val()}),a.push({name:m+".x",value:p.clk_x},{name:m+".y",value:p.clk_y})),a},q.fn.formSerialize=function(e){return q.param(this.formToArray(e))},q.fn.fieldSerialize=function(n){var o=[];return this.each(function(){var e=this.name;if(e){var t=q.fieldValue(this,n);if(t&&t.constructor===Array)for(var r=0,a=t.length;r<a;r++)o.push({name:e,value:t[r]});else null!=t&&o.push({name:this.name,value:t})}}),q.param(o)},q.fn.fieldValue=function(e){for(var t=[],r=0,a=this.length;r<a;r++){var n=this[r],o=q.fieldValue(n,e);null==o||o.constructor===Array&&!o.length||(o.constructor===Array?q.merge(t,o):t.push(o))}return t},q.fieldValue=function(e,t){var r=e.name,a=e.type,n=e.tagName.toLowerCase();if(void 0===t&&(t=!0),t&&(!r||e.disabled||"reset"===a||"button"===a||("checkbox"===a||"radio"===a)&&!e.checked||("submit"===a||"image"===a)&&e.form&&e.form.clk!==e||"select"===n&&-1===e.selectedIndex))return null;if("select"!==n)return q(e).val().replace(m,"\r\n");var o=e.selectedIndex;if(o<0)return null;for(var i=[],s=e.options,u="select-one"===a,c=u?o+1:s.length,l=u?o:0;l<c;l++){var f=s[l];if(f.selected&&!f.disabled){var d=(d=f.value)||(f.attributes&&f.attributes.value&&!f.attributes.value.specified?f.text:f.value);if(u)return d;i.push(d)}}return i},q.fn.clearForm=function(e){return this.each(function(){q("input,select,textarea",this).clearFields(e)})},q.fn.clearFields=q.fn.clearInputs=function(r){var a=/^(?:color|date|datetime|email|month|number|password|range|search|tel|text|time|url|week)$/i;return this.each(function(){var e=this.type,t=this.tagName.toLowerCase();a.test(e)||"textarea"===t?this.value="":"checkbox"===e||"radio"===e?this.checked=!1:"select"===t?this.selectedIndex=-1:"file"===e?/MSIE/.test(navigator.userAgent)?q(this).replaceWith(q(this).clone(!0)):q(this).val(""):r&&(!0===r&&/hidden/.test(e)||"string"==typeof r&&q(this).is(r))&&(this.value="")})},q.fn.resetForm=function(){return this.each(function(){var t=q(this),e=this.tagName.toLowerCase();switch(e){case"input":this.checked=this.defaultChecked;case"textarea":return this.value=this.defaultValue,!0;case"option":case"optgroup":var r=t.parents("select");return r.length&&r[0].multiple?"option"===e?this.selected=this.defaultSelected:t.find("option").resetForm():r.resetForm(),!0;case"select":return t.find("option").each(function(e){if(this.selected=this.defaultSelected,this.defaultSelected&&!t[0].multiple)return t[0].selectedIndex=e,!1}),!0;case"label":var a=q(t.attr("for")),n=t.find("input,select,textarea");return a[0]&&n.unshift(a[0]),n.resetForm(),!0;case"form":return"function"!=typeof this.reset&&("object"!=typeof this.reset||this.reset.nodeType)||this.reset(),!0;default:return t.find("form,input,label,select,textarea").resetForm(),!0}})},q.fn.enable=function(e){return void 0===e&&(e=!0),this.each(function(){this.disabled=!e})},q.fn.selected=function(r){return void 0===r&&(r=!0),this.each(function(){var e,t=this.type;"checkbox"===t||"radio"===t?this.checked=r:"option"===this.tagName.toLowerCase()&&(e=q(this).parent("select"),r&&e[0]&&"select-one"===e[0].type&&e.find("option").selected(!1),this.selected=r)})},q.fn.ajaxSubmit.debug=!1});

;
/**
* DO NOT EDIT THIS FILE.
* See the following change record for more information,
* https://www.drupal.org/node/2815083
* @preserve
**/

(function ($, Drupal, drupalSettings) {
  Drupal.Views = {};

  Drupal.Views.parseQueryString = function (query) {
    var args = {};
    var pos = query.indexOf('?');

    if (pos !== -1) {
      query = query.substring(pos + 1);
    }

    var pair;
    var pairs = query.split('&');

    for (var i = 0; i < pairs.length; i++) {
      pair = pairs[i].split('=');

      if (pair[0] !== 'q' && pair[1]) {
        args[decodeURIComponent(pair[0].replace(/\+/g, ' '))] = decodeURIComponent(pair[1].replace(/\+/g, ' '));
      }
    }

    return args;
  };

  Drupal.Views.parseViewArgs = function (href, viewPath) {
    var returnObj = {};
    var path = Drupal.Views.getPath(href);
    var viewHref = Drupal.url(viewPath).substring(drupalSettings.path.baseUrl.length);

    if (viewHref && path.substring(0, viewHref.length + 1) === "".concat(viewHref, "/")) {
      returnObj.view_args = decodeURIComponent(path.substring(viewHref.length + 1, path.length));
      returnObj.view_path = path;
    }

    return returnObj;
  };

  Drupal.Views.pathPortion = function (href) {
    var protocol = window.location.protocol;

    if (href.substring(0, protocol.length) === protocol) {
      href = href.substring(href.indexOf('/', protocol.length + 2));
    }

    return href;
  };

  Drupal.Views.getPath = function (href) {
    href = Drupal.Views.pathPortion(href);
    href = href.substring(drupalSettings.path.baseUrl.length, href.length);

    if (href.substring(0, 3) === '?q=') {
      href = href.substring(3, href.length);
    }

    var chars = ['#', '?', '&'];

    for (var i = 0; i < chars.length; i++) {
      if (href.indexOf(chars[i]) > -1) {
        href = href.substr(0, href.indexOf(chars[i]));
      }
    }

    return href;
  };
})(jQuery, Drupal, drupalSettings);;
/**
* DO NOT EDIT THIS FILE.
* See the following change record for more information,
* https://www.drupal.org/node/2815083
* @preserve
**/

(function ($, Drupal, drupalSettings) {
  Drupal.behaviors.ViewsAjaxView = {};

  Drupal.behaviors.ViewsAjaxView.attach = function (context, settings) {
    if (settings && settings.views && settings.views.ajaxViews) {
      var ajaxViews = settings.views.ajaxViews;
      Object.keys(ajaxViews || {}).forEach(function (i) {
        Drupal.views.instances[i] = new Drupal.views.ajaxView(ajaxViews[i]);
      });
    }
  };

  Drupal.behaviors.ViewsAjaxView.detach = function (context, settings, trigger) {
    if (trigger === 'unload') {
      if (settings && settings.views && settings.views.ajaxViews) {
        var ajaxViews = settings.views.ajaxViews;
        Object.keys(ajaxViews || {}).forEach(function (i) {
          var selector = ".js-view-dom-id-".concat(ajaxViews[i].view_dom_id);

          if ($(selector, context).length) {
            delete Drupal.views.instances[i];
            delete settings.views.ajaxViews[i];
          }
        });
      }
    }
  };

  Drupal.views = {};
  Drupal.views.instances = {};

  Drupal.views.ajaxView = function (settings) {
    var selector = ".js-view-dom-id-".concat(settings.view_dom_id);
    this.$view = $(selector);
    var ajaxPath = drupalSettings.views.ajax_path;

    if (ajaxPath.constructor.toString().indexOf('Array') !== -1) {
      ajaxPath = ajaxPath[0];
    }

    var queryString = window.location.search || '';

    if (queryString !== '') {
      queryString = queryString.slice(1).replace(/q=[^&]+&?|&?render=[^&]+/, '');

      if (queryString !== '') {
        queryString = (/\?/.test(ajaxPath) ? '&' : '?') + queryString;
      }
    }

    this.element_settings = {
      url: ajaxPath + queryString,
      submit: settings,
      setClick: true,
      event: 'click',
      selector: selector,
      progress: {
        type: 'fullscreen'
      }
    };
    this.settings = settings;
    this.$exposed_form = $("form#views-exposed-form-".concat(settings.view_name.replace(/_/g, '-'), "-").concat(settings.view_display_id.replace(/_/g, '-')));
    once('exposed-form', this.$exposed_form).forEach($.proxy(this.attachExposedFormAjax, this));
    once('ajax-pager', this.$view.filter($.proxy(this.filterNestedViews, this))).forEach($.proxy(this.attachPagerAjax, this));
    var selfSettings = $.extend({}, this.element_settings, {
      event: 'RefreshView',
      base: this.selector,
      element: this.$view.get(0)
    });
    this.refreshViewAjax = Drupal.ajax(selfSettings);
  };

  Drupal.views.ajaxView.prototype.attachExposedFormAjax = function () {
    var that = this;
    this.exposedFormAjax = [];
    $('input[type=submit], button[type=submit], input[type=image]', this.$exposed_form).not('[data-drupal-selector=edit-reset]').each(function (index) {
      var selfSettings = $.extend({}, that.element_settings, {
        base: $(this).attr('id'),
        element: this
      });
      that.exposedFormAjax[index] = Drupal.ajax(selfSettings);
    });
  };

  Drupal.views.ajaxView.prototype.filterNestedViews = function () {
    return !this.$view.parents('.view').length;
  };

  Drupal.views.ajaxView.prototype.attachPagerAjax = function () {
    this.$view.find('ul.js-pager__items > li > a, th.views-field a, .attachment .views-summary a').once('ajax_processed').each($.proxy(this.attachPagerLinkAjax, this));
  };

  Drupal.views.ajaxView.prototype.attachPagerLinkAjax = function (id, link) {
    var $link = $(link);
    var viewData = {};
    var href = $link.attr('href');
    $.extend(viewData, this.settings, Drupal.Views.parseQueryString(href), Drupal.Views.parseViewArgs(href, this.settings.view_base_path));
    var selfSettings = $.extend({}, this.element_settings, {
      submit: viewData,
      base: false,
      element: link
    });
    this.pagerAjax = Drupal.ajax(selfSettings);
  };

  Drupal.AjaxCommands.prototype.viewsScrollTop = function (ajax, response) {
    var offset = $(response.selector).offset();
    var scrollTarget = response.selector;

    while ($(scrollTarget).scrollTop() === 0 && $(scrollTarget).parent()) {
      scrollTarget = $(scrollTarget).parent();
    }

    if (offset.top - 10 < $(scrollTarget).scrollTop()) {
      $(scrollTarget).animate({
        scrollTop: offset.top - 10
      }, 500);
    }
  };
})(jQuery, Drupal, drupalSettings);
;
(function ($, Drupal, drupalSettings) {
  Drupal.behaviors.AlgoliaAutocompleteSearch = {
    attach: function (context, settings) {
      let filters = {};
      var searchIndex = drupalSettings.mc_algolia_creds.searchQsIndex;
      var searchActualIndex = drupalSettings.mc_algolia_creds.searchIndex;
      var applicationId = drupalSettings.mc_algolia_creds.applicationId;
      var apiKey = drupalSettings.mc_algolia_creds.apiKey;
      var all_video_page = $("#all-video-search-view-page");
      var all_vod_page = $("#all-vod-search-view-page");
      var all_podcast_page = $("#all-podcast-search-view-page");
      var all_programs_page = $("#all-programs-search-view-page");
      var all_cna938_page = $("#all-cna938-search-view-page");
      if (all_video_page && all_video_page.length) {
        all_video_page.find(".all-video--search #algolia-search-input").attr('placeholder', "Search for shows and episodes");
        filters = {type: ['video']};
        algoliaSearchWidget.autocompleteSearch(applicationId, apiKey, searchIndex, searchActualIndex, '/watch/search', filters);
      }
      if (all_vod_page && all_vod_page.length) {
        all_vod_page.find(".all-video--search #algolia-search-input").attr('placeholder', "Search for shows and episodes");
        filters = {term_vid: ['watch_program']};
        algoliaSearchWidget.autocompleteSearch(applicationId, apiKey, searchIndex, searchActualIndex, '/watch/search', filters);
      }
      if (all_podcast_page && all_podcast_page.length) {
        all_podcast_page.find(".all-podcast #algolia-search-input").attr('placeholder', "Search for podcasts and episodes");
        filters = {type: ['audio']};
        algoliaSearchWidget.autocompleteSearch(applicationId, apiKey, searchIndex, searchActualIndex, '/listen/search', filters);
      }
      if (all_programs_page && all_programs_page.length) {
        all_programs_page.find(".all-podcast-program #algolia-search-input").attr('placeholder', "Search for podcasts and episodes");
        filters = {term_vid: ['omnystudio_programs'], exclude_radio_station: ['cna938']};
        algoliaSearchWidget.autocompleteSearch(applicationId, apiKey, searchIndex, searchActualIndex, '/listen/programmes/search', filters);
      }
      if (all_cna938_page && all_cna938_page.length) {
        all_cna938_page.find(".all-podcast-program #algolia-search-input").attr('placeholder', "Search for podcasts and episodes");
        filters = {term_vid: ['omnystudio_programs'], radio_station: ['cna938']};
        algoliaSearchWidget.autocompleteSearch(applicationId, apiKey, searchIndex, searchActualIndex, '/listen/cna938/search', filters);
      }

      $(".block-algolia-autocomplete-search-box #algolia-search-input").keyup(function(event) {
        if (event.keyCode === 13 && event.target.value.trim()) {
          if ($(this).parents('.all-video--vod').length) {
            filters = {term_vid: ['watch_program']};
            algoliaSearchWidget.searchRedirect(searchActualIndex, event.target.value, '/watch/search', filters);
          }
          else if ($(this).parents('.all-video--video').length) {
            filters = {type: ['video']};
            algoliaSearchWidget.searchRedirect(searchActualIndex, event.target.value, '/watch/search', filters);
          }
          else if ($(this).parents('.all-podcast').length) {
            filters = {type: ['audio']};
            algoliaSearchWidget.searchRedirect(searchActualIndex, event.target.value, '/listen/search', filters);
          }
          else if ($(this).parents('.all-podcast-program').length && $('body#all-cna938-search-view-page').length) {
            filters = {term_vid: ['omnystudio_programs'], radio_station: ['cna938']};
            algoliaSearchWidget.searchRedirect(searchActualIndex, event.target.value, '/listen/cna938/search', filters);
          }
          else if ($(this).parents('.all-podcast-program').length) {
            filters = {term_vid: ['omnystudio_programs']};
            algoliaSearchWidget.searchRedirect(searchActualIndex, event.target.value, '/listen/programmes/search', filters);
          }
          else {
            algoliaSearchWidget.searchRedirect(searchActualIndex, event.target.value);
          }
        }
      });
      $('button#algolia-autocomplete-submit').once('onClick').click(function (e) {
        var queryParam = $(this).parent().closest('div').find("#algolia-search-input").val();
        algoliaSearchWidget.searchRedirect(searchActualIndex, queryParam);
      });
      $('button#algolia-autocomplete-reset').once('onClick').click(function () {
        $(this).parent().closest('div').find("#algolia-search-input").val('');
      });
    }
  };
})(jQuery, Drupal, drupalSettings);

/**
 * Define namespace with common method to use for MeConnect login workflow.
 * @type {{isAuthenticate: (function(): boolean)}}
 */
window.algoliaSearchWidget = {
  autocompleteSearch: function(applicationId, apiKey, searchIndex, searchActualIndex, redirect_url, filters) {
    const algoliaScripts = [
      'https://cdn.jsdelivr.net/npm/algoliasearch@3/dist/algoliasearchLite.min.js',
      'https://cdn.jsdelivr.net/autocomplete.js/0/autocomplete.min.js'
    ];
    let filesloaded = 0;

    for (let i = 0; i < algoliaScripts.length; i++) {
      var script = document.createElement('script');
      script.src = algoliaScripts[i];
      script.onload = function () {
          filesloaded++;
          finishLoad();
      };
      document.body.appendChild(script);
    }

    function finishLoad() {
      if (filesloaded === algoliaScripts.length) {
        const searchClient = algoliasearch(
          applicationId,
          apiKey // search only API key, not admin API key
        );

        const dataSource = searchClient.initIndex(searchIndex);
        autocomplete('.block-algolia-autocomplete-search-box #algolia-search-input', { minLength: 3 }, [
          {
            source: autocomplete.sources.hits(dataSource, { hitsPerPage: 10 }),
            displayKey: 'query',
            templates: {
              suggestion({ _highlightResult }) {
                return `<span>${_highlightResult ? _highlightResult.query.value : ''}</span>`;
              },
            },
            empty: `
            <div class="content-list content-list--no-result">
            <span>Sorry, we can't find any results for <b>'{{query}}'</b>. </span>
            <span>Please try again by refining your keyword(s).</span>
            </div>`,
          }
        ]).on('autocomplete:selected', function(event, suggestion, dataset) {
          algoliaSearchWidget.searchRedirect(searchActualIndex, event.target.value, redirect_url, filters);
        });
      }
    }
  },
  searchRedirect: function(searchActualIndex, query, redirect_url, filters) {
    var params = '';
    if (filters && filters.type && filters.type.length) {
      filters.type.map((type, index) => {
        params += '&'+encodeURIComponent(`type[${index}]`) + `=${type}`
      });
    }
    if (filters && filters.categories && filters.categories.length) {
      filters.categories.map((category, index) => {
        params += '&'+encodeURIComponent(`categories[${index}]`) + `=${category}`
      });
    }
    if (filters && filters.term_vid && filters.term_vid.length) {
      filters.term_vid.map((term_vid, index) => {
        params += '&'+encodeURIComponent(`term_vid[${index}]`) + `=${term_vid}`
      });
    }
    if (filters && filters.radio_station && filters.radio_station.length) {
      filters.radio_station.map((radioStation, index) => {
        params += '&'+encodeURIComponent(`radio_station[${index}]`) + `=${radioStation}`
      });
    }
    if (!redirect_url) {
      redirect_url = '/search'
    }
    if (query) {
      Drupal.behaviors.AlgoliaRecentSearch.updateLocalstorage(query);
      if (params) {
        window.location.href = `${redirect_url}?q=${encodeURIComponent(query)}${params}`;
      }
      else {
        window.location.href = `${redirect_url}?q=${encodeURIComponent(query)}`;
      }
    }
  },
};
;
(function ($, Drupal, drupalSettings) {
  "use strict";
  Drupal.behaviors.AlgoliaRecentSearch = {
    attach: function (context, settings) {
      const self = this;
      let input = $(".ais-SearchBox-input");
      let submit = $('.ais-SearchBox-submit');
      let inputSearch = $('#algolia-search-input');
      let clear = $('.clear-button');
      let headline = $(".recent-headline");
      let recentData = $('.recent-data');
      let recentSearch = $("#recent-search");
      let clearBtn = `Clear`;
      let searchTerms = localStorage.getItem('recent_search_items') ? JSON.parse(localStorage.getItem('recent_search_items')) : [];

      updateMarkupList(searchTerms);
      submit.click(function () {
        if (input.val().trim()) {
          submitHandler(input.val());
        }
      });

      inputSearch.keypress(function( event ) {
        let code = event.keyCode || event.which;
        if (code == 13 && event.target.value.trim()) {
          submitHandler(event.target.value);
        }
      });

      clear.click(function () {
        localStorage.removeItem('recent_search_items');
        updateMarkupList([]);
      });

      function submitHandler(value) {
        if (!value.trim()) { return };
        var terms = self.updateLocalstorage(value);
        updateMarkupList(terms);
      }

      function validateSearchInput(value) {
        if(value != null || value != '') {
          return value.replace(/<(|\/|[^>\/bi]|\/[^>bi]|[^\/>][^>]+|\/[^>][^>]+)>/g, '');
        }
      }

      function updateMarkupList(searchTerms) {
        let html = `<div class="recent-search-tag">`;
        if (searchTerms && searchTerms.length) {
          searchTerms.reverse();
          $.each(searchTerms, function( index, value ) {
            html += `<a class="recent-link"><span>` + validateSearchInput(value) + `</span></a>`;
          });
          html += `</div>`;
          recentSearch.html(html);
          clear.html(clearBtn);
          recentData.removeClass('hidden');
        } else {
          recentSearch.html('');
          recentData.addClass('hidden');
          clear.html('');
        }
      }
    },

    updateLocalstorage: function (newTerm) {
      const LENGTH_STORAGE = 5;
      let existingTerms = localStorage.getItem('recent_search_items') ? JSON.parse(localStorage.getItem('recent_search_items')) : [];
      if (existingTerms.includes(newTerm)) {
        existingTerms.splice($.inArray(newTerm, existingTerms), 1);
      }

      existingTerms.push(newTerm);
      // Removing element after defined count.
      if (existingTerms && existingTerms.length > LENGTH_STORAGE) {
        existingTerms.shift();
      }
      localStorage.setItem('recent_search_items', JSON.stringify(existingTerms));
      return existingTerms;
    }
  };
})(jQuery, Drupal, drupalSettings);
;
(function ($, Drupal, drupalSettings) {
  Drupal.behaviors.AllSectionMenuModal = {
    attach: function (context, settings) {
      var allSectionMenu = $('nav#main-nav span.all-section-menu');
      allSectionMenu.parent().addClass('is-hide-link');
      if (allSectionMenu.length > 0) {
        var menuModal = $('.all-section-menu-modal-wrapper');
        // Close popup.
        menuModal.find('span.close').once('onClick').click(function () {
          menuModal.removeClass('modal--open');
          $("#all-section-algolia-search-input").val('');
        });
        $(document).keyup(function(e) {
          if (e.key === "Escape") {
            menuModal.removeClass('modal--open');
            $("#all-section-algolia-search-input").val('');
          }
        });
      }
    }
  };
})(jQuery, Drupal, drupalSettings);
;
"use strict";(function(a){Drupal.behaviors.stickyHeader={attach:function attach(){a(window).scroll(function(){90<a(this).scrollTop()?(a(".header").addClass("header--sticky"),a(".main").addClass("main--gutter"),a(".header > .header__inner").removeClass("header__inner--scale")):(a(".header").removeClass("header--sticky"),a(".main").removeClass("main--gutter"),a(".header > .header__inner").addClass("header__inner--scale"))})}}})(jQuery);;
"use strict";(function(){Drupal.behaviors.editionSwitcherTooltip={attach:function attach(){if(window.innerWidth<=920){function d(){a.style.display="block"}function e(){a.style.display="none"}var a=document.querySelector("#block-editionmenu .edition-switcher-tooltip"),b=a.querySelector("#block-editionmenu .edition-switcher-tooltip__close");b.addEventListener("click",e);var c=localStorage.getItem("editionSwitcherFirstVisit");c||(setTimeout(function(){d(),localStorage.setItem("editionSwitcherFirstVisit","true"),setTimeout(function(){e()},7e3)},3e3),document.body.addEventListener("click",function(b){a.contains(b.target)||e()}))}}}})(jQuery);;
($ => {
  Drupal.behaviors.editionMenu = {
    attach() {
      var activeEditionText = document.querySelector('ul.edition-menu-dropdown li.edition-menu-dropdown__item a.is-active').innerText;
      var editionLocations = document.querySelectorAll('.edition-block__location');

      editionLocations.forEach(function(locationElement) {
        locationElement.innerText = activeEditionText;
      });

      // edition switcher on click and outside click
      $('body').click(function(event) {
        if (!$('.edition-block__dropdown').is(event.target) && $('.edition-block__dropdown').has(event.target).length === 0) {
          $('.edition-block__dropdown').removeClass("show");
          $('.edition-block').removeClass("active");
        }
      });

      $(".edition-block__button").once('edition-menu').click(function(event) {
        event.stopPropagation();
        $(this).next('.edition-block__dropdown').toggleClass("show");
        $(this).parent('.edition-block').toggleClass("active");
      });

      // to show edition switcher on mobile web
      // if user is in homepage / editions landing pages
      if (drupalSettings.mc_location) {
        const config = drupalSettings.mc_location.config;
        const urls = {
          local: config.local_url || '/',
          international: config.international_url,
          us: config.united_states_url,
        };

        const pathname = window.location.pathname;
        if (drupalSettings.path.isFront || pathname === urls.local || pathname === urls.international || pathname === urls.us) {
          $('header.header').addClass("show-editionmenu-mobile");
        }
      }
    },
  };
})(jQuery);
;
"use strict";Drupal.behaviors.hamburgerMenu={attach(){var a=$("#toggle-expand"),b=$("#toggle-expand-close"),c=$("#hamburger-nav"),d=$(document.body);c&&(a.on("click",b=>{a.addClass("toggle-expand--open"),c.addClass("hamburger-nav--open"),d.addClass("body-overlay"),b.preventDefault()}),b.on("click",b=>{a.removeClass("toggle-expand--open"),c.removeClass("hamburger-nav--open"),d.removeClass("body-overlay"),b.preventDefault()}))}};;
(function ($, Drupal, drupalSettings) {
  'use strict';
  $(document).ready(function () {
    // Send the login status CIAM.
    if (ssoMeConnect.getCookie('sso-ciam-event') || ssoMeConnect.getCookie('sso-ciam-action')) {
      let data = {
        'eventname': ssoMeConnect.getCookie('sso-ciam-event'),
        'actionname': ssoMeConnect.getCookie('sso-ciam-action'),
        'auth0id': ssoMeConnect.getCookie('sso_user_id')
      };
      _adobeUtility.adobeAnalyticsTrack('customTracking', data);
      // Delete once tracking invoked.
      ssoMeConnect.deleteCookie('sso-ciam-event');
      ssoMeConnect.deleteCookie('sso-ciam-action');
    }
    // Add param to bookmark links in click.
    $(document).on('click', 'a.sign-in-link, a.cia-feedback-anonymous, a.bookmark-link-anonymous, a.btn-bookmark-link-anonymous, a.followtopic', function (e) {
      e.preventDefault();
      var element = $(this);
      auth0.addActionParam(element, 'href', 'login');
      window.location.href= element.attr('href');
    });
  });

  // Window functions related to mc_auth.
  window.auth0 = {
    refreshToken: function () {
      if (typeof drupalSettings.mc_auth !== 'undefined' && drupalSettings.mc_auth === 1) {
        var token = localStorage.getItem('sso_token');
        var refreshToken = Cookies.get('sso_refresh_token');
        if (token && refreshToken) {
          // Check expiry period with threshhold time.
          var threshold = drupalSettings.profileMenuBlock.expiryThreshold ? drupalSettings.profileMenuBlock.expiryThreshold : 15;
          var decodedToken = auth0.decodeJWT(token);
          var currentTime = Math.floor(Date.now() / 1000); // Current time in Unix timestamp (seconds)
          var expiryTime = decodedToken.exp; // Expiry time from the JWT token (in seconds)
          var expiryThreshold = threshold * 60;
          if (expiryTime - currentTime < expiryThreshold) {
            auth0.refreshAjax();
          }
        } else {
          if (refreshToken || token) {
            // Cutoff logic falls here.
            auth0.refreshAjax();
          }
        }
      }
    },
    refreshAjax: function () {
      $.ajax({
        url: '/profile/sso/refresh-token?refreshtime=' + Date.now(),
        type: 'GET',
        success: function (data) {
          if (data.refresh_token) {
            localStorage.setItem("sso_token", data.access_token);
            console.log('Token refreshed successfully');
          }
        },
        error: function () {
          console.log('Error: Unable to contact the server to refresh the token');
        }
      });
    },
    decodeJWT: function (token) {
      var base64Url = token.split('.')[1];  // Get the payload part
      var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');  // URL-safe base64 decode
      var jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2); // Decode each character
      }).join(''));
      return JSON.parse(jsonPayload); // Parse the JSON payload
    },
    addActionParam: function (element, attribute, action) {
      if (element.hasClass('btn-bookmark-link-anonymous') || element.hasClass('bookmark-link-anonymous')) {
        action = 'bookmark';
      }
      if (element.hasClass('followtopic')) {
        action = 'followtopic';
      }
      var href = element.attr(attribute);
      var url = auth0.addAnalytics(href, action);
      element.attr(attribute, url.toString());
      // Mark this element as processed.
      element.attr('data-processed', 'true');
    },
    addAnalytics: function(href, action) {
      let defaultPageName = '';
      if (typeof drupalSettings.brand_value !== 'undefined' && drupalSettings.brand_value !== null) {
        if (drupalSettings.brand_value === 'lifestyle' || drupalSettings.brand_value === 'luxury') {
          defaultPageName = 'sg:cna'+ drupalSettings.brand_value + ':online';
        }
        else {
          defaultPageName = 'sg:'+ drupalSettings.brand_value + ':online';
        }
      }
      else {
        defaultPageName = 'sg:cna:online';
      }
      if (href && href.indexOf('/profile/sso/login') !== -1) {
        defaultPageName = window.siteSectionforAnalytics || defaultPageName;
        var url = new URL(href, window.location.href);
        url.searchParams.set('time', Date.now());
        url.searchParams.set('ext-an-referrer-source', defaultPageName + '--web app--' + action);
        if (typeof window.pageURLforAnalytics !== 'undefined') {
          url.searchParams.set('ext-an-referrer-pageurl', pageURLforAnalytics);
        }
        return url;
      }
      return href;
    }
  };

})(jQuery, Drupal, drupalSettings);
;
(function ($, Drupal, drupalSettings) {
  'use strict';
  Drupal.behaviors.profile_menu_block = {
    attach: function (context, settings) {
      // Clear the user session if he has logged out.
      if (window.auth0 && !window.hasRefreshed) {
        window.hasRefreshed = true;
        ssoMeConnect.isAuthenticate();
        auth0.refreshToken();
      }
      var profile_menu = $('#profile-menu-nav');
      if (profile_menu.length > 0) {
        if (!ssoMeConnect.isAuthenticate()) {
          profile_menu.find('a.sign-in-link').parent().show();
          var loginUrl = drupalSettings.profileMenuBlock.loginUrl;
          if (loginUrl) {
            profile_menu.find('a.sign-in-link').attr('href', loginUrl);
          }
        }
        else {
          profile_menu.find('a.logged-in-user').parent().show();
          var user_name = decodeURIComponent(ssoMeConnect.getlocalStorage('user_info_username')).toString();
          if ((user_name !== 'false') || (user_name !== 'null')) {
            profile_menu.find('a.logged-in-user .inline-menu__link-text').text(user_name.replace('+', ' '));
          }

          var avatar = ssoMeConnect.getCookie('sso_avatar');
          if (avatar !== undefined) {
            var img = $('<img />', {
              id: 'user-avatar',
              class: 'user-avatar',
              src: avatar,
              alt: user_name,
              width: 35,
              height: 35
            });
            $('.user-avatar').remove();
            img.prependTo(profile_menu.find('a.logged-in-user .inline-menu__link-icon'));
            var defaultAvatar = profile_menu.find('a.logged-in-user .inline-menu__link-icon svg');
            if (defaultAvatar !== undefined) {
              defaultAvatar.remove();
            }
          }
          // Referral url to logout link.
          var logoutUrl = drupalSettings.profileMenuBlock.logoutUrl;
          if (logoutUrl) {
            profile_menu.find('a.logout-link').attr('href', logoutUrl);
          }
        }
      }
    }
  };
})(jQuery, Drupal, drupalSettings);
;
(function ($, Drupal) {
  Drupal.behaviors.mixpanel_meconnect_auth = {
    attach: function (context, settings) {

      const meconnect_user_login_status_cookie = Cookies.get('meconnect_user_login_status_cookie');
      if (meconnect_user_login_status_cookie === 'success') {
        const sso_id = Cookies.get('ssoid');
        const prefix_sso_id = `${settings.mc_mixpanel.id_prefix}-${sso_id}`;
        mixpanelConfig.register({
          'me_id': sso_id,
          '$braze_external_id': sso_id,
          'unique_userid': prefix_sso_id,
          'sso_id': sso_id,
          'logged_in': true,
        });
        if (typeof sso_id !== 'undefined') {
          mixpanelConfig.identify(prefix_sso_id);
        }
        mixpanelConfig.alias(sso_id);

        let sso_login_type = Cookies.get('sso_source');
        sso_login_type = (sso_login_type === 'mediacorpidp' || sso_login_type === 'mediacorp') ? 'Email' : sso_login_type.charAt(0).toUpperCase() + sso_login_type.slice(1);
        ;
        const login_type = sso_login_type ? sso_login_type : '';
        mixpanelConfig.trackEvent('login_successful', {
          'login_type': login_type
        });

        const mixpanel_helper = Drupal.behaviors.mixpanel_helper;
        mixpanelConfig.people.set({
          'me_id': sso_id,
          '$braze_external_id': sso_id,
          'cna_login_type': login_type,
          'unique_userid': prefix_sso_id,
          'sso_id': sso_id,
          'cna_logged_in': true,
          'cna_last_login_date': mixpanel_helper.getIsoFormatCurrentDate(),
        });
        mixpanelConfig.people.union({
          'mediacorp_products_touchpoint': 'cna',
          'cna_platforms_touchpoint': mixpanel_helper.getPlatformTouchpoint(),
        });
        ssoMeConnect.deleteCookie('meconnect_user_login_status_cookie');
      }

      if (meconnect_user_login_status_cookie === 'failed') {
        mixpanelConfig.trackEvent('login_fail', {
          'login_fail': 'login failed'
        });
        ssoMeConnect.deleteCookie('meconnect_user_login_status_cookie');
      }

      if (meconnect_user_login_status_cookie === 'logout') {
        mixpanelConfig.register({
          'logged_in': false,
        });
        mixpanelConfig.trackEvent('logout_successful', {
          'logout': true
        });
        mixpanelConfig.people.set({
          'cna_logged_in': false,
        });
        ssoMeConnect.deleteCookie('meconnect_user_login_status_cookie');
      }
    }
  }
})(jQuery, Drupal);
;
(function ($, Drupal) {
  Drupal.behaviors.mixpanelRegistration = {
    attach: function (context, settings) {

      const meconnect_user_register_status_cookie = Cookies.get('meconnect_user_register_status_cookie');
      if (meconnect_user_register_status_cookie=== 'success') {
        const register_type = 'Email';
        const sso_id = Cookies.get('ssoid');
        const prefix_sso_id = `${settings.mc_mixpanel.id_prefix}-${sso_id}`;
        const edmEnabled = Cookies.get('meconnect_user_register_enabled_edm_mediacorp_cookie') ? true : false;
        const edmEnabledPartner = Cookies.get('meconnect_user_register_enabled_edm_mediacorp_partners_cookie') ? true : false;
        mixpanelConfig.register({
          'me_id': sso_id,
          '$braze_external_id': sso_id,
          'unique_userid': prefix_sso_id,
          'sso_id': sso_id,
          'logged_in': true,
        });
        if (typeof sso_id !== 'undefined') {
          mixpanelConfig.identify(prefix_sso_id);
        }
        mixpanelConfig.alias(sso_id);
        mixpanelConfig.trackEvent('registration_complete', {
          'registration_type': register_type,
          'enabled_edm_mediacorp': edmEnabled,
          'enabled_edm_mediacorp_partners': edmEnabledPartner,
        });
        const currentDate = new Date();
        const isoDate = currentDate.toISOString();
        mixpanelConfig.people.set({
          'me_id': sso_id,
          '$braze_external_id': sso_id,
          'cna_registration_type': register_type,
          'unique_userid': prefix_sso_id,
          'sso_id': sso_id,
          'cna_logged_in': true,
          'cna_registration_date': isoDate,
          'enabled_edm_mediacorp': edmEnabled,
          'enabled_edm_mediacorp_partners': edmEnabledPartner,
        });
        mixpanelConfig.people.union({
          'mediacorp_products_touchpoint': 'cna',
          'cna_platforms_touchpoint': Drupal.behaviors.mixpanel_helper.getPlatformTouchpoint(),
        });
        ssoMeConnect.deleteCookie('meconnect_user_register_status_cookie');
      }
      else if (meconnect_user_register_status_cookie === 'failed') {
        mixpanelConfig.trackEvent('registration_fail', {
          'error_message': 'registration failed'
        });
        ssoMeConnect.deleteCookie('meconnect_user_login_status_cookie');
      }
      $('html', context).once('me-connect-register').each(function () {
        const pageLoadProperties = Drupal.behaviors.mixpanel_helper.getPageLoadProperties(settings);
        pageLoadProperties.registration_page_view = true
        mixpanelConfig.trackEvent('page_loads', pageLoadProperties);
      });
    }
  }
})(jQuery, Drupal);
;
'use strict';

(function ($, Drupal) {
  Drupal.behaviors.breaking_news = {
    attach: async function (context, settings) {
      var timer;
      showBreakingNews();

      /**
       * Polling function to keep breaking news components up to date on page.
       */
      async function showBreakingNews() {
        var breaking_news_components = $('.breaking-news-component', context);
        breaking_news_components.each(async function() {
          clearTimeout(timer);
          let uuid = $(this).attr('data');
          var response = await fetchBreakingNews(uuid);
          var isVisible = breakingNewsProcessor(response);
          if (isVisible) {
            // Insert updated headline in element and remove hidden class.
            insertComponentToPage(response);
            // Hide Newsletter homepageBanner if breaking news available.
            $('.block--type-subscription-cta-block[widget-type="homepage banner"] .subscription-block-identifier').addClass('hidden');
            Drupal.behaviors.newspick.removeHasBannerClass();
          } else {
            $('.breaking-news-' + uuid).addClass('hidden');
            //check subscriptionPageBanner, if breaking news and subscription cta both are in disable state
            Drupal.behaviors.newspick?.updateSubscriptionBanner();
          }

          timer = setTimeout(function() {
            const is_drupal_user = $('.toolbar-fixed') && $('.toolbar-fixed').length;
            if (!is_drupal_user) {
              showBreakingNews();
            }
          }, 60000);
        });
      }

      /**
       * API call to get breaking news item for given UUID.
       */
      async function fetchBreakingNews(uuid) {
        // Fetching data of the api.
        return await $.ajax({
          url: Drupal.url('jsonapi/block_content/breaking_news/' + uuid + '?include=field_link_story'),
          type: 'GET',
          headers: {
            'Cache-Control': 'no-cache',
            'Vary': '*',
          },
          dataType: 'json',
          success: function (response) {
            return response;
          },
          error: function (XMLHttpRequest, textStatus, errorThrown) {
            console.log('Request Broken', errorThrown);
            return false;
          }
        });
      }

      /**
       * Check if current time fits into scheduled time window.
       */
      function breakingNewsProcessor(response) {
        if (!response) {
          return false;
        }
        var show = false;
        var schedule_from, schedule_to;
        var data = response.data.attributes;
        let is_disabled = data.field_disable_breaking_news;
        if (is_disabled) {
          return show;
        }
        // If current time is in scheduled window.
        if (data.field_schedule_date) {
          schedule_from = new Date(data.field_schedule_date.value).getTime();
          schedule_to = new Date(data.field_schedule_date.end_value).getTime();
          const current_time = Date.now();
          if(schedule_from <= current_time && schedule_to >= current_time) {
            show = true;
          }
        }

        if (show) {
          show = false;
          const country_code = _locationUtility.getCookieByName('country_code')?.toLowerCase();
          if (data.field_edition === country_code) {
            show = true;
          }
          else if (data.field_edition === 'asia' && country_code === 'international') {
            show = true;
          }
          else if (!data.field_edition && country_code === 'international') {
            show = true;
          }
        }

        return show;
      }

      /**
       * Update the breaking news on the page.
       */
      function insertComponentToPage(response) {
        var uuid = response.data.id;
        let changed = new Date(response.data.attributes.changed).getTime() ;
        var closeTime = Cookies.get(uuid);
        var childContent;
        var title = response.data.attributes.field_label;
        // If it was closed earlier and changed time is from before that then do nothing.
        if (closeTime && closeTime >= changed) return;
        // Get the headline and show the text or link depending on what's present.
        var text = response.data.attributes.field_headline;
        if(response.included && response.included.length && response.included[0] && response.included[0].attributes) {
          var path = '';
          if (response.included[0].attributes.path_alias) {
            path = response.included[0].attributes.path_alias.alias;
          }
          else {
            path = response.included[0].attributes.path.alias;
          }
          childContent = `<div class="breaking-news-content"><h2 class="sticky-card__block-title">${title}</h2><div class = "sticky-card__content"><a class="sticky-card__link" href=${path}><p class="sticky-card__description">${text}<i class= "sticky-card__arrow-right"></i></p></a></div></div>`;
        } else {
          childContent = `<div class="breaking-news-content"><h2 class="sticky-card__block-title">${title}</h2><div class = "sticky-card__content"><p class="sticky-card__description">${text}</p></div></div>`;
        }
        // Remove existing content from this element and insert headline.
        var br_news_elem = $('.breaking-news-' + uuid);
        br_news_elem.find('.breaking-news-content').remove();
        br_news_elem.append(childContent).removeClass('hidden');
      }

       // Set cookie on clicking close icon.
       $('i.sticky-card__close', context).once('close_breaking_news').click(function() {
         var uuid = $(this).parent().attr('data');
         var close_time = Date.now();
         Cookies.set(uuid, close_time);
         $('.breaking-news-' + uuid).addClass('hidden');
       });
    }
  };
})(jQuery, Drupal);
;
