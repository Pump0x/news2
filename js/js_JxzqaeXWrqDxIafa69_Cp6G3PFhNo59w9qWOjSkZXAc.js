(function ($, Drupal, drupalSettings) {
  'use strict';
    // This function is strict.
  Drupal.behaviors.password_encrypt = {
    attach: function (context, settings) {
      var passkey = drupalSettings.password_encrypt.passkey;
      var cipher;
      var pass;
      var cpass;
      var current_pass;

      // Add submit handler to form.beforeSend.
     // Update Drupal.Ajax.prototype.beforeSend only once.
      if (typeof Drupal.Ajax !== 'undefined' && typeof Drupal.Ajax.prototype.beforeSubmitOriginal === 'undefined') {
        Drupal.Ajax.prototype.beforeSubmitOriginal = Drupal.Ajax.prototype.beforeSubmit;
        Drupal.Ajax.prototype.beforeSubmit = function (form_values, element_settings, options) {
          if(form_values.find(item => item.name === 'form_id')) {
            if(form_values.find(item => item.name === 'pass')) {
              var pass_index = form_values.findIndex(index_item => index_item.name === "pass");
              var userpass = $('#edit-pass').val();
              if (userpass !== '') {
                cipher = CryptoJS.AES.encrypt(userpass, passkey).toString();
                form_values[pass_index].value = cipher;
              }
            }
          }
          return this.beforeSubmitOriginal();
        };
      }

      $('form.user-login, form.user-login-form', context).submit(function (event) {
        pass = $('#edit-pass').val();
        if (pass !== '') {
          cipher = CryptoJS.AES.encrypt(pass, passkey).toString();
          $('#edit-pass').val(cipher);
        }
      });

      $('form.user-register-form, form.user-form', context).submit(function (event) {
        current_pass = $('#edit-current-pass').val();
        pass = $('#edit-pass-pass1').val();
        cpass = $('#edit-pass-pass2').val();

        if (pass !== cpass) {
          $('span.error').append("<div>Password doesn't match. Please enter correct password.<div>");
          $('#edit-pass-pass2').addClass('error').focus();
          return FALSE;
        }

        if (current_pass !== '') {
          cipher = CryptoJS.AES.encrypt(current_pass, passkey).toString();
          $('#edit-current-pass').val(cipher);
        }

        if (pass !== '') {
          cipher = CryptoJS.AES.encrypt(pass, passkey).toString();
          $('#edit-pass-pass1').val(cipher);
          $('#edit-pass-pass2').val(cipher);
        }
      });
    }
  };
})(jQuery, Drupal, drupalSettings);
;
/**
 * @file
 * JavaScript to allow AJAX triggered by non-submit element.
 */

(function ($) {
  'use strict';

  const metatag_async_widget = $('details.metatag-async-widget details');
  if (metatag_async_widget.length > 0) {
    metatag_async_widget.on('toggle', function () {
      var triggers = $(this).find('.form-submit');
      if (triggers.length) {
        triggers.trigger('mousedown');
      }
    });
  }

})(jQuery);
;
/**
 * @file
 */
(function ($, Drupal, drupalSettings) {
  'use strict';
  /**
   * Attaches the JS test behavior to generate tag section
   */
  Drupal.behaviors.scheduleTv = {
    attach: function (context, settings) {
      if (!drupalSettings.schedule_program || !drupalSettings.schedule_program.url || !drupalSettings.schedule_program.type) {
        return;
      }
      const GROUPLABELS = {
        'morning': 'Morning 6:00am - 12:00pm',
        'afternoon': 'Afternoon 12:00pm-6:00pm',
        'evening': 'Evening 6:00pm - 12:00am',
        'night': 'Overnight 12:00am - 6:00am'
      };
      let timer;
      let current_timezone = '+8';
      // https://stackoverflow.com/questions/7403486/add-or-subtract-timezone-difference-to-javascript-date
      let userOffset = new Date().getTimezoneOffset() * 60000;
      const intervalMin = 10;
      let country_code = _locationUtility.getCookieByName('country_code');
      let user_selected_country_code = _locationUtility.getCookieByName('user_selected_country_code');
      let timeZone_format = 'SGT';
      country_code = country_code ? country_code.toLowerCase() : '';
      user_selected_country_code = user_selected_country_code ? user_selected_country_code.toLowerCase() : '';
      showProgramSchedule(current_timezone);
      // Click on target based on the current date.
      if ($('.schedule_listing .all-list-schedule__container-col-one').length) {
        let $mainTarget = '';
        let $targets = [];
        let $numberDay = _commonLibrary.getTimeWithTimezone(current_timezone).getDay();
        const { now_date, now_time } = getCurrentDateTime(current_timezone);
        $('.schedule_listing .all-list-schedule__container-col-one .day-nav__item').each(function () {
          $targets.push($(this).data('target'));
        });
        if ($targets.includes(now_date)) {
          $mainTarget = now_date;
        }
        else if ([1].includes($numberDay)) {
          $mainTarget = 'Monday';
        }
        else if ([2].includes($numberDay)) {
          $mainTarget = 'Tuesday';
        }
        else if ([3].includes($numberDay)) {
          $mainTarget = 'Wednesday';
        }
        else if ([4].includes($numberDay)) {
          $mainTarget = 'Thursday';
        }
        else if ([5].includes($numberDay)) {
          $mainTarget = 'Friday';
        }
        else if ([6].includes($numberDay)) {
          $mainTarget = 'Saturday';
        }
        else if ([0].includes($numberDay)) {
          $mainTarget = 'Sunday';
        }

        const scheduleProgram = country_code === 'us' && user_selected_country_code !== 'asia' ? '.block-edition-schedule-program-us' : '.block-edition-schedule-program-asia';
        // Trigger click on the specified element
        $(scheduleProgram + ' .all-list-schedule__container-col-one .day-nav__item[data-target="' + $mainTarget + '"]').trigger('click');
      }
      // Scroll to current show.
      const current_show = $('.all-list-schedule--current');
      if (current_show && current_show.length) {
        if(window.location.hash && window.location.hash.indexOf('#top') == -1) {
          $('html, body').animate({
            scrollTop: current_show.offset().top - 150
          }, 'slow');
        }
      }
      async function showProgramSchedule(current_timezone) {
        clearTimeout(timer);
        let country_code = _locationUtility.getCookieByName('country_code');
        let user_selected_country_code = _locationUtility.getCookieByName('user_selected_country_code');
        country_code = country_code ? country_code.toLowerCase() : '';
        user_selected_country_code = user_selected_country_code ? user_selected_country_code.toLowerCase() : '';
        let program_url = drupalSettings.schedule_program.url;
        let time_zone_string = "Asia/Singapore";
        if (user_selected_country_code && user_selected_country_code !== 'asia' &&  drupalSettings.schedule_program[user_selected_country_code + '-url']) {
          program_url = drupalSettings.schedule_program[user_selected_country_code + '-url'];
        }
        else if (!user_selected_country_code && country_code && country_code !== 'asia' &&  drupalSettings.schedule_program[country_code + '-url'] ) {
          program_url = drupalSettings.schedule_program[country_code + '-url'];
        }
        let response = _commonLibrary.getAjaxApi(program_url);
        if ((!user_selected_country_code && country_code == 'us') || user_selected_country_code == 'us') {
          // changes start
          var programmes = [];
          // Adding one hour for daylight saving
          if (drupalSettings.schedule_program['us-daylight'] ) {
            userOffset = userOffset + 3600000;
          }
          if (response.hasOwnProperty("schedules")) {
            response.schedules.forEach(function (arrayItem) {
              let start_date = new Date(arrayItem.startTime);
              start_date = new Date(start_date.getTime() + userOffset);
              let end_date = new Date(arrayItem.endTime);
              end_date = new Date(end_date.getTime() + userOffset);
              let year = start_date.getFullYear();
              let month = (start_date.getMonth() + 1).toString().padStart(2, "0");
              let day = start_date.getDate().toString().padStart(2, "0");
              let programme = {
                "Sch_date": `${year}${month}${day}`,
                "Start_time": start_date.getHours().toString().padStart(2, "0") + ":" + start_date.getMinutes().toString().padStart(2, "0"),
                "Duration": calculateDuration(start_date, end_date),
                "Type": "NEWS",
                "Title": arrayItem.episodeTitle,
                "Episode": arrayItem.episodeNumber,
                "Desc": arrayItem.longDescription
              };
              programmes.push(programme);
            });
            response = {"TVlistings": [{"channel": "CNAU", "programmes": programmes}]};
            //changes end
          }
          $('.block-edition-schedule-program-us').addClass("show");
          $('.block-edition-schedule-program-asia').removeClass("show");
        } else if (country_code == 'us' && user_selected_country_code !== 'us') {
          $('.block-edition-schedule-program-asia').addClass("show");
          $('.block-edition-schedule-program-us').removeClass("show");
        } else {
          $('.block-edition-schedule-program-asia').addClass("show");
        }
        // Hide default schedule program if edition schedule program is showing
        $('.block-edition-schedule-program-us.show, .block-edition-schedule-program-asia.show')
            .parent()
            .find('section.block-schedule-program')
            .hide();

        const channel = drupalSettings.schedule_program.type;
        let itemsMarkup = {};
        let currentDate = '';
        if (channel === 'radio') {
          if (response.Radiolistings && response.Radiolistings.length && response.Radiolistings[0].data && response.Radiolistings[0].data.length) {
            itemsMarkup = getRadioFormattedPrograms(response.Radiolistings[0].data);
          }
          currentDate = '<div class="current-date">' + getCurrentDate(time_zone_string) + '</div>';
        } else if (channel === 'tv') {
          if (response.TVlistings && response.TVlistings.length && response.TVlistings[0].programmes && response.TVlistings[0].programmes.length) {
            itemsMarkup = getTVFormattedPrograms(response.TVlistings[0].programmes, current_timezone);
          }
        }
        // Build page markup
        let {leftSidebarContent, rightSideMainContent} = buildLayoutMarkup(itemsMarkup);
        let contentHtml= '';
        contentHtml += `
          <div class="all-list-schedule__container">
            <div class="all-list-schedule__container-col-one">
              <div class="dynamic-sticky">
                <div class="dynamic-sticky__content">
                  <div class="day-nav-wrapper">
                    <div class="day-nav">
                      ${currentDate}
                      ${leftSidebarContent}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="all-list-schedule__container-col-two">
             <div class="wrapper time_format_dsc">All times are in  ${timeZone_format}</div>
              ${rightSideMainContent}
            </div>
          </div>`;
        const scheduleWrapper = $(context).find('.schedule_listing');
        scheduleWrapper.html(contentHtml);
        // Change the schedule on date selection
        scheduleWrapper.find('.day-nav__item').click(function() {
          const $self = $(this);
          scheduleWrapper.find('.day-nav__item').removeClass('day-nav__item--active');
          $self.addClass('day-nav__item--active');
          var targetId = $self.attr('data-target');
          scheduleWrapper.find(`[data-group]`).addClass('hidden');
          scheduleWrapper.find(`[data-group=${targetId}]`).removeClass('hidden');
        });
        timer = setTimeout(function() {
          showProgramSchedule();
        }, intervalMin * 60 * 1000);
      }
      function calculateDuration(startDate, endDate) {
        const duration = endDate - startDate;
        const hours = Math.floor(duration/(1000 * 60 * 60));
        const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 *60));
        const formattedHours = hours.toString().padStart(2, "0");
        const formattedMinutes = minutes.toString().padStart(2, "0");
        return formattedHours + formattedMinutes;
      }
      function to12HoursFormat(time) {
        const [hours, minutes] = time.split(':').map(function(item){ return parseInt(item, 10)});
        const AmOrPm = hours >= 12 ? 'pm' : 'am';
        const hours12 = (hours % 12) || 12;
        return `${('0' + hours12).slice(-2)}:${('0' + minutes).slice(-2)}<span>${AmOrPm}</span>`;
      }
      // Get the current date and time in simiar format as schedule json has.
      function getCurrentDateTime(current_timezone) {
        // Get timezone
        var now = _commonLibrary.getTimeWithTimezone(current_timezone);
        var month = now.getMonth() + 1;
        month = month < 10 ? ('0'+month) : month;
        var day = now.getDate() < 10 ? ('0'+now.getDate()) : now.getDate();
        var hours = now.getHours() < 10 ? ('0'+now.getHours()) : now.getHours();
        var mins = now.getMinutes() < 10 ? ('0'+now.getMinutes()) : now.getMinutes();
        var now_date = parseInt('' + now.getFullYear() + month + day);
        var now_time = parseInt('' + hours + mins);
        return { now_date, now_time };
      }
      function getRadioFormattedPrograms(programs_dates) {
        var itemsMarkup = {};
        programs_dates.map(programs_date => {
          itemsMarkup = getFormattedPrograms(programs_date.programmes, itemsMarkup, programs_date.Sch_day);
        });
        return itemsMarkup;
      }
      function getTVFormattedPrograms(programs, current_timezone) {
        let itemsMarkup = {};
        itemsMarkup = getFormattedPrograms(programs, itemsMarkup, '', current_timezone);
        return itemsMarkup;
      }
      function getFormattedPrograms(programs, accumulator, dayKey, current_timezone) {
        const $types = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
        const { now_date, now_time } = getCurrentDateTime(current_timezone);
        let onAir = false;
        let groupTimeInit = null;
        programs.map(p => {
          let day = (dayKey && dayKey.length) ? dayKey : p.Sch_date;
          if (!accumulator[day] || !accumulator[day].length) {
            accumulator[day] = [];
          }
          onAir = false;
          let $compareDate = day;
          let $numberDay = (day === 'Monday') ? [1] : (day === 'Tuesday') ? [2] : (day === 'Wednesday') ? [3] : (day === 'Thursday') ? [4] : (day === 'Friday') ? [5] : (day === 'Saturday') ? [6] : (day === 'Sunday') ? [0] : [];
          let $now = _commonLibrary.getTimeWithTimezone(current_timezone);
          if ($types.includes(day) && $numberDay.includes($now.getDay())) {
            $compareDate = now_date;
          }
          const parsedStartTime = parseInt(p.Start_time.split(':').join(''));
          if ($compareDate == now_date && (parsedStartTime + parseInt(p.Duration)) >= now_time && parsedStartTime <= now_time) {
            onAir = true;
          }
          const groupTime = getGroupTimeForProgram(parsedStartTime);
          if (groupTime !== groupTimeInit) {
            groupTimeInit = groupTime;
            accumulator[day].push(builtRowTpl(p, onAir, groupTime));
          } else {
            accumulator[day].push(builtRowTpl(p, onAir, null));
          }
        });
        return accumulator;
      }
      function getGroupTimeForProgram(parsedStartTime) {
        let groupTime = 'night';
        if (parsedStartTime >= 600 && parsedStartTime < 1200) {
          groupTime = 'morning';
        }
        if (parsedStartTime >= 1200 && parsedStartTime < 1800) {
          groupTime = 'afternoon';
        }
        if (parsedStartTime >= 1800 && parsedStartTime < 2359) {
          groupTime = 'evening';
        }
        if (parsedStartTime >= 0 && parsedStartTime < 600) {
          groupTime = 'night';
        }
        return groupTime;
      }
      function builtRowTpl(p, current, group) {
        const On_air = 'On air';
        let $moreLink = '';
        if (!p.Desc) {
          p.Desc = '';
        }
        if (p.ViewMore) {
          $moreLink = '<p class="paragraph link"><a href="' + p.ViewMore + '" target="_blank">Find out more</a></p>';
        }
        return `
          ${group && group.length ? `
            <div class="all-list-schedule all-list-schedule--group">${GROUPLABELS[group]}</div>
          `: ''}
          <div class="all-list-schedule ${current ? 'all-list-schedule--current' : ''}">
            <div class="all-list-schedule__col-one">
              <div class="all-list-schedule__datetime">
                ${to12HoursFormat(p.Start_time)}
              </div>
              ${current ?
            `<span class="indicator__flag">
                  <b class="indicator__flag-text on-air">${On_air}</b>
                </span>` : ''
        }
            </div>
            <div class="all-list-schedule__col-two">
              <h2 class="h2 all-list-schedule__heading">
              ${current ?
            `<span class="all-list-schedule__play-icon">
                    <?xml version="1.0" encoding="UTF-8"?>
                    <svg viewBox="0 0 80 80" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                        <g id="Article_Master_Desktop" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
                            <g id="Article_Detail_Desktop" transform="translate(-516.000000, -3010.000000)">
                                <g id="Group-60" transform="translate(516.000000, 3010.000000)">
                                    <circle id="Oval" stroke="currentColor" stroke-width="5" cx="40" cy="40" r="37.5"></circle>
                                    <polygon id="Path" fill="currentColor" fill-rule="nonzero" points="29 21 29 59 61 40"></polygon>
                                </g>
                            </g>
                        </g>
                    </svg>
                  </span>` : ''
        }
                ${p.Title}
              </h2>
              <p class="paragraph paragraph--all-list-desc">
                ${p.Desc}
              </p>
              ${$moreLink}
            </div>
          </div>
        `;
      }
      function buildLayoutMarkup(itemsMarkup) {
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
          "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
        ];
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        var leftSidebarContent = '';
        var rightSideMainContent = '';
        for (let p_date in itemsMarkup) {
          const first = (p_date === Object.keys(itemsMarkup)[0]) ? true : false;
          let dateToDisplay = p_date;
          // Check if it's day or date
          const m = p_date.match(/(\d{4})(\d{2})(\d{2})/);
          if (m && m.length) {
            const day_name = days[new Date(`${m[1]}-${m[2]}-${m[3]}`).getDay()];
            dateToDisplay = `${day_name}, ${m[3]} ${monthNames[parseInt(m[2])-1]}`;
          }
          leftSidebarContent += `<div class="day-nav__item ${first ? 'day-nav__item--active' : ''}" data-target="${p_date}">${dateToDisplay}</div>`;
          if (itemsMarkup[p_date] && itemsMarkup[p_date].length) {
            rightSideMainContent += `<div class="wrapper ${!first ? 'hidden' : ''}" data-group="${p_date}">${itemsMarkup[p_date].join('')}</div>`;
          }
        }
        return {leftSidebarContent, rightSideMainContent};
      }
      function getCurrentDate(time_zone_string) {
        let currentDate = new Date();
        let weekday = new Intl.DateTimeFormat('en', {weekday: 'short', timeZone: time_zone_string}).format(currentDate);
        let date = new Intl.DateTimeFormat('en', {day: '2-digit', timeZone: time_zone_string}).format(currentDate);
        let month = new Intl.DateTimeFormat('en', {month: 'short', timeZone: time_zone_string}).format(currentDate);
        return weekday + ', ' + date + ' ' + month;
      }
    }
  }
})(jQuery, Drupal, drupalSettings);
;
(function ($, Drupal, drupalSettings) {
    'use strict';
    /**
     * Attaches the JS test behavior to generate tag section
     */
    Drupal.behaviors.heroRadio = {
      attach: function (context, settings) {
        if (!drupalSettings.heroRadioData || !drupalSettings.heroRadioData.url || !drupalSettings.heroRadioData.live_radio) {
          return;
        }
        let response = _commonLibrary.getAjaxApi(drupalSettings.heroRadioData.url);
        const viewMoreTitle = drupalSettings.heroRadioData.viewMoreTitle;
        const viewMoreLink = drupalSettings.heroRadioData.viewMoreLink;
        let heroRadioData = [];
        // Get singapore timezone
        var now = _commonLibrary.getTimeWithTimezone('+8');
        var month = now.getMonth() + 1;
        month = month < 10 ? ('0' + month) : month;
        var date = now.getDate() < 10 ? ('0' + now.getDate()) : now.getDate();
        var day = now.getDay();
        var hours = now.getHours() < 10 ? ('0' + now.getHours()) : now.getHours();
        var mins = now.getMinutes() < 10 ? ('0' + now.getMinutes()) : now.getMinutes();
        var now_date = Number('' + now.getFullYear() + month + date);
        var now_time = Number('' + hours + mins);
        var current = {}, nextUps = [];
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
          "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
        ];
        const On_air = 'On air';
  
        function to12HoursFormat(time) {
          if (!time || !time.length) {
            return '';
          }
          const [hours, minutes] = time.split(':').map(function(item) { return parseInt(item, 10) });
          const AmOrPm = hours >= 12 ? 'pm' : 'am';
          const hours12 = (hours % 12) || 12;
          return `${('0' + hours12).slice(-2)}:${('0' + minutes).slice(-2)}${AmOrPm}`;
        }
  
        $('#hero-radio--block').once('live_radio').on('click', 'button#listen-now--btn', function () {
          let liveRadio = drupalSettings.heroRadioData.live_radio;
          let params = `scrollbars=no,resizable=no,status=no,location=no,toolbar=no,menubar=no,width=800,height=400,right=0,top=300`;
          open(liveRadio, 'radio', params);
        });

        if(response.Radiolistings[0]) {
          var radioListings = response.Radiolistings[0];
        }
        
        if (day === 0 && radioListings.data[6]) {
          heroRadioData = radioListings.data[6];
        }
        else if (day === 6 && radioListings.data[5]) {
          heroRadioData = radioListings.data[5];
        }
        else if (day === 5 && radioListings.data[4]) {
          heroRadioData = radioListings.data[4];
        }
        else if (day === 4 && radioListings.data[3]) {
          heroRadioData = radioListings.data[3];
        }
        else if (day === 3 && radioListings.data[2]) {
          heroRadioData = radioListings.data[2];
        }
        else if (day === 2 && radioListings.data[1]) {
          heroRadioData = radioListings.data[1];
        }
        else if (day === 1 && radioListings.data[0]) {
          heroRadioData = radioListings.data[0];
        }
  
        heroRadioData.programmes.map(function(p) {
          if (p.Start_time && (Number(p.Start_time.split(':').join('')) + Number(p.Duration)) >= now_time) {
            if (Number(p.Start_time.split(':').join('')) <= now_time) {
              current = p;
            }
            else if(!nextUps.length) {
              nextUps.push(p);
            }
          }
        });
  
        var itemListHtml='';
        if (current && Object.keys(current).length) {
          const Sch_date = now_date.toString();
          const m = Sch_date.match(/(\d{4})(\d{2})(\d{2})/);
          const date = `${m[3]} ${monthNames[parseInt(m[2])-1]} ${m[1]}`;
  
          itemListHtml += `<div class="list-schedule-image__row"><img src="${current.Image}"></div>
          <div class="list-schedule-data__row">
          <div class="list-schedule__row">
            <div class="list-schedule">
              <span class="indicator__flag">
                <b class="indicator__flag-text on-air">${On_air}</b>
              </span>
              <h2 class="h2 list-schedule__heading">
                <a href="${current.ViewMore}">${current.Title}</a>
              </h2>
              <div class="list-schedule__datetime">
                ${date} ${to12HoursFormat(current.Start_time)}
              </div>
              <div class="list-schedule__listen_now">
                 <button aria-label="button" class="button button--follow play" id="listen-now--btn" >
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="18" viewBox="0 0 15 18"> <g color="#fffff"> <g fill="currentcolor"> <g> <g> <path d="M25 11L25 29 40 20z" transform="translate(-139 -685) translate(15 520) translate(99 154)"></path> </g> </g> </g> </g> </svg>
                    Listen now
                  </button>
              </div>
              <p class="paragraph paragraph--desc">
                ${current.Desc}
              </p>
            </div></div>`;
        } else {
          itemListHtml += `<div class="list-schedule-image__row list-schedule-image__row-default"><img src="https://onecms-res.cloudinary.com/image/upload/v1646993709/mediacorp/cna/image/2022/03/11/cna938-logo.png"></div>
          <div class="list-schedule-data__row">
          <div class="list-schedule__row">
            <div class="list-schedule">
              <span class="indicator__flag">
                <b class="indicator__flag-text on-air">${On_air}</b>
              </span>
              <h2 class="h2 list-schedule__heading">Listen to CNA938 live</h2>
              <div class="list-schedule__listen_now">
                 <button aria-label="button" class="button button--follow play" id="listen-now--btn" >
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="18" viewBox="0 0 15 18"> <g color="#fffff"> <g fill="currentcolor"> <g> <g> <path d="M25 11L25 29 40 20z" transform="translate(-139 -685) translate(15 520) translate(99 154)"></path> </g> </g> </g> </g> </svg>
                    Listen now
                  </button>
              </div>
            </div></div>`;
        }
        if (nextUps && nextUps.length) {
            itemListHtml += `<div class="list-schedules__rowone">
            <div class="list-schedules list-schedules--disable">
            <div class="list-schedules__up-next">
                Up Next at ${to12HoursFormat(nextUps[0].Start_time)}
            </div>
            <h2 class="h2 list-schedules__heading">
                ${nextUps[0].Title}
            </h2>
            <p class="paragraph paragraph--view-more link">
                <a href="${viewMoreLink}">${viewMoreTitle}</a>
            </p>
            </div></div></div>`;
        } else {
            itemListHtml += `<p class="paragraph paragraph--view-more link">
            <a href="${viewMoreLink}">${viewMoreTitle}</a>
            </p>`;
        }
  
        var contentHtml= '';
        contentHtml += `<div class="list-schedule__container">
          ${itemListHtml}
        </div>`;
  
        $(context).find('#hero-radio--block').html(contentHtml);
      }
    };
  })(jQuery, Drupal, drupalSettings);
  ;
