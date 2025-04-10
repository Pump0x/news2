/**
 * @file
 * Contains \Drupal\mc_texttospeech\js file.
 */
(function($) {
  const playIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" class="play-icon" width="32" height="32" viewBox="0 0 32 32" fill="none">
      <path fill-rule="evenodd" clip-rule="evenodd" d="M16 29.397C23.399 29.397 29.397 23.399 29.397 16C29.397 8.60105 23.399 2.60301 16 2.60301C8.60105 2.60301 2.60301 8.60105 2.60301 16C2.60301 23.399 8.60105 29.397 16 29.397ZM16 32C24.8366 32 32 24.8366 32 16C32 7.16344 24.8366 0 16 0C7.16344 0 0 7.16344 0 16C0 24.8366 7.16344 32 16 32Z" fill="#333333"/>
      <path d="M11.5876 23.4029V8.59635L23.2213 15.9996L11.5876 23.4029Z" fill="#333333"/>
    </svg>
  `;
  const pauseIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" class="pause-icon" width="32" height="32" viewBox="0 0 32 32" fill="none">
      <path fill-rule="evenodd" clip-rule="evenodd" d="M16 29.397C23.399 29.397 29.397 23.399 29.397 16C29.397 8.60105 23.399 2.60301 16 2.60301C8.60105 2.60301 2.60301 8.60105 2.60301 16C2.60301 23.399 8.60105 29.397 16 29.397ZM16 32C24.8366 32 32 24.8366 32 16C32 7.16344 24.8366 0 16 0C7.16344 0 0 7.16344 0 16C0 24.8366 7.16344 32 16 32Z" fill="#333333"/>
      <path d="M17.6898 22.5072V9.49219H21.4363V22.5072H17.6898ZM10.5641 22.5072V9.49219H14.3106V22.5072H10.5641Z" fill="#333333"/>
    </svg>
  `;
  const pauseLabel = `
    <span class="pause-label">
      Continue listening
    </span>
  `;
  const playbackTimeDurationLabel = `
    <div class="playback-time-duration">
      <span class="playback-time-duration-label"></span>
    </div>
  `;

  const updatePlayerStyle = (playerElement, playbackState) => {
    // Styles that are set directly on the element by BeyondWords will be overridden here
    playerElement.querySelector('.main').style.setProperty('background', 'var(--tts-player-background-color)', 'important');
    if (playbackState === 'stopped') {
      playerElement.querySelector('.player-title').style.setProperty('font-size', 'var(--tts-player-title-font-size-s)', 'important');
      playerElement.querySelector('.player-title').style.setProperty('color', 'var(--tts-player-text-color)', 'important');
      playerElement.querySelector('.duration-in-mins').style.setProperty('font-size', 'var(--tts-player-duration-font-size-s)', 'important');
      playerElement.querySelector('.duration-in-mins').style.setProperty('color', 'var(--tts-player-text-color)', 'important');
      playerElement.querySelector('.duration-in-mins').style.setProperty('padding-top', 'var(--tts-player-duration-padding-top-s)', 'important');
    } else {
      playerElement.querySelector('.playback-time').style.setProperty('font-size', 'var(--tts-player-playback-time-font-size-s)', 'important');
      playerElement.querySelector('.playback-time').style.setProperty('color', 'var(--tts-player-text-color)', 'important');
      playerElement.querySelector('.playback-rate-button').style.setProperty('height', 'var(--tts-player-playback-rate-height-s)', 'important');
      playerElement.querySelector('.playback-rate-button').style.setProperty('width', 'var(--tts-player-playback-rate-width-s)', 'important');
      playerElement.querySelector('.playback-rate-button > span').style.setProperty('font-size', 'var(--tts-player-playback-rate-font-size-s)', 'important');
      playerElement.querySelector('.playback-rate-button > span').style.setProperty('color', 'var(--tts-player-text-color)', 'important');

      if (!playerElement.querySelector('.pause-label')) {
        $(playerElement.querySelector('.time-indicator')).append(pauseLabel);
      }
      if (!playerElement.querySelector('.playback-time-duration')) {
        $(playerElement.querySelector('.controls')).append(playbackTimeDurationLabel);
      }
      $(playerElement.querySelector('.playback-time-duration-label')).text(playerElement.querySelector('.playback-time').textContent.trim());
    }
  };

  Drupal.behaviors.mcTextToSpeechAudioPlayer = {
    attach: function(context, drupalSettings) {
      const beyondWordsSdk = window.BeyondWords;
      if (!beyondWordsSdk) {
        console.error("BeyondWords SDK not properly initialised.");
        return;
      }

      // Only target BeyondWords players that have not been initialised (i.e. without .bwp)
      $(".mc-text-to-speech-wrapper > .beyondwords-player:not(.bwp)", context).once('mcTextToSpeechAudioPlayer').each(function(_, bwPlayerNode) {
        const entityId = $(bwPlayerNode).attr('data-id');
        const podcastId = $(bwPlayerNode).attr('data-podcast-id');
        $(`#beyondwords-player-${entityId}`).each(function () {
          const initParams = {
            projectId: drupalSettings.mc_texttospeech.projectId,
            contentId: podcastId,
            target: `#beyondwords-player-${entityId}`,
            playerTitle: 'Listen',
            playbackRates: [0.75, 0.9, 1, 1.25, 1.5, 2],
            playerStyle: 'standard',
          };
          $(bwPlayerNode).addClass(initParams.playerStyle);

          let player;

          // Set up default settings for player node once player UI is visible
          // Using MutationObserver instead of `MediaLoaded` event as player UI might show before media is considered to be loaded
          // This will minimise showing of any unintended loading UI, allowing loading UI to be close to final UI
          const observer = new MutationObserver(() => {
            const isPlayerReady = $(bwPlayerNode.querySelector('.player-title')).is(":visible");
            if (isPlayerReady) {
              if (!$(bwPlayerNode).hasClass('media-loaded')) {
                $(bwPlayerNode).addClass('media-loading');
              }
              updatePlayerStyle(player.target, player.playbackState);
              $(bwPlayerNode).addClass('initialised');

              // Add custom play/pause icon
              const bwPlayPauseButton = bwPlayerNode.querySelector('.play-pause-button');
              $(bwPlayPauseButton).append(playIcon);
              $(bwPlayPauseButton).append(pauseIcon);

              $(bwPlayerNode).on('mouseover', '.playback-rate-button', () => {
                bwPlayerNode.querySelector('.playback-rate-button > span').style.setProperty('color', 'var(--tts-player-playback-rate-color-hover)', 'important');
              });
              $(bwPlayerNode).on('mouseout', '.playback-rate-button', () => {
                bwPlayerNode.querySelector('.playback-rate-button > span').style.setProperty('color', 'var(--tts-player-text-color)', 'important');
              });
              observer.disconnect();
            }
          });
          observer.observe(bwPlayerNode, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['style'],
          });

          player = new beyondWordsSdk.Player(initParams);

          // Hide New Feature Wizard Function
          function hideWizard() {
            const newFeatureWizard = document.querySelector('div.new-feature-wizard');
            if (newFeatureWizard) {
              newFeatureWizard.style.display = 'none';
            }
          }

          player.addEventListener('ContentAvailable', () => {
            // Update classes to indicate that media is done loading
            $(bwPlayerNode).removeClass('media-loading');
            $(bwPlayerNode).addClass('media-loaded');
          });

          player.addEventListener('PlaybackPlaying', () => {
            player.playerTitle = '';
            updatePlayerStyle(bwPlayerNode, player.playbackState);

            // Hide New Feature Wizard on Playing
            hideWizard();
          });

          player.addEventListener('PlaybackPaused', () => {
            player.playerTitle = 'Continue listening';
            updatePlayerStyle(bwPlayerNode, player.playbackState);
          });

          player.addEventListener('PlaybackEnded', () => {
            player.playerTitle = 'Listen';

            updatePlayerStyle(bwPlayerNode, player.playbackState);
          });
        });
      });

    }
  };
})(jQuery);
;
"use strict";(function(){Drupal.behaviors.newFeatureWizard={attach:function attach(){var a=document.querySelector(".new-feature-wizard"),b=a.querySelector(".new-feature-wizard__close");b.addEventListener("click",function(){a.style.display="none"});var c=localStorage.getItem("wizardFirstVisit");c||(a.style.display="inline-block",localStorage.setItem("wizardFirstVisit","true"))}}})(jQuery);;
(function ($, Drupal) {
  Drupal.behaviors.mixpanelTts = {
    attach: function (context, settings) {
      $('.mc-text-to-speech-wrapper', context).once('mixpanelTts').each(function () {
        const players = BeyondWords.Player.instances();
        $(players).each(function(i, player) {
          player.addEventListener("PressedPlay", () => {
            const playerElement = $(`[data-podcast-id=${player.contentId}]`);
            if (playerElement.length > 0) {
              const article = $(playerElement).parents(".node--article-content");
              const paraCount = $(article).find("p").length;
              const sectionTitle = $(article)
                .find(".content-detail__category a.link")
                .text()
                .replace("\n", "")
                .trim();
              const duration = Drupal.behaviors.mixpanelTts.secondsToMinutes(player.duration);
              mixpanelConfig.trackEvent('tts_play', {
                'article_section': sectionTitle,
                'para_count': paraCount,
                'duration': duration
              });
            }
          });
        });
      });
    },
    secondsToMinutes: function (seconds) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = Math.floor(seconds % 60);
      return `${minutes}.${remainingSeconds}`;
    },
  }
})(jQuery, Drupal);
;
